/* =========================================================================
   minigame.js — "Packet Router" — a tiny, dependency-free canvas game.
   Loaded lazily by main.js only after the secret trigger fires, and fully
   self-contained under window.DRMinigame so it cannot touch the main site.

   Gameplay: packets spawn on the left and must reach the sink on the right.
   Click a node to toggle its outgoing link; keep queues from overflowing.
   (Kept intentionally small — this is a networks-flavored easter egg.)
   ========================================================================= */
(function () {
  "use strict";
  if (window.DRMinigame) return;

  var host, canvas, ctx, raf, running = false;
  var W = 640, H = 400;

  var state;

  function reset() {
    state = {
      score: 0,
      dropped: 0,
      packets: [],
      spawnTimer: 0,
      spawnEvery: 55,
      // three lanes; the "sink" is on the right. Player presses 1/2/3 to open a lane.
      openLane: 1,
      lanes: [90, 200, 310],
      over: false
    };
  }

  function spawn() {
    var lane = Math.floor(Math.random() * 3);
    state.packets.push({ x: 40, y: state.lanes[lane], lane: lane, speed: 1.6 + Math.random() * 1.2 });
  }

  function update() {
    if (state.over) return;
    state.spawnTimer++;
    if (state.spawnTimer >= state.spawnEvery) {
      state.spawnTimer = 0;
      state.spawnEvery = Math.max(22, state.spawnEvery - 0.4);
      spawn();
    }
    for (var i = state.packets.length - 1; i >= 0; i--) {
      var p = state.packets[i];
      p.x += p.speed;
      // gate at x=430: packet passes only if its lane is the open lane
      if (p.x >= 430 && p.x - p.speed < 430) {
        if (p.lane !== state.openLane) {
          state.dropped++;
          state.packets.splice(i, 1);
          if (state.dropped >= 8) state.over = true;
          continue;
        }
      }
      if (p.x > W - 30) {
        state.score++;
        state.packets.splice(i, 1);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // bg
    ctx.fillStyle = "#0d1117"; ctx.fillRect(0, 0, W, H);

    // lanes
    for (var l = 0; l < 3; l++) {
      ctx.strokeStyle = l === state.openLane ? "#2563eb" : "#26303c";
      ctx.lineWidth = l === state.openLane ? 3 : 1;
      ctx.beginPath(); ctx.moveTo(40, state.lanes[l]); ctx.lineTo(W - 30, state.lanes[l]); ctx.stroke();
    }
    // gate
    ctx.strokeStyle = "#6ea8fe"; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(430, 40); ctx.lineTo(430, H - 40); ctx.stroke(); ctx.setLineDash([]);
    // sink
    ctx.fillStyle = "#1c2740"; ctx.fillRect(W - 30, 40, 20, H - 80);

    // packets
    for (var i = 0; i < state.packets.length; i++) {
      var p = state.packets[i];
      ctx.fillStyle = p.lane === state.openLane ? "#6ea8fe" : "#e6edf3";
      ctx.fillRect(p.x - 7, p.y - 7, 14, 14);
    }

    // hud
    ctx.fillStyle = "#e6edf3"; ctx.font = "14px ui-monospace, monospace";
    ctx.fillText("routed: " + state.score, 16, 24);
    ctx.fillText("dropped: " + state.dropped + " / 8", 16, 44);
    ctx.fillText("open lane: press 1 / 2 / 3", W - 220, 24);

    if (state.over) {
      ctx.fillStyle = "rgba(3,7,18,.8)"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#e6edf3"; ctx.textAlign = "center";
      ctx.font = "26px ui-monospace, monospace";
      ctx.fillText("queue overflow", W / 2, H / 2 - 12);
      ctx.font = "15px ui-monospace, monospace";
      ctx.fillText("routed " + state.score + " packets — press R to retry", W / 2, H / 2 + 18);
      ctx.textAlign = "left";
    }
  }

  function loop() {
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  function onKey(e) {
    if (e.key === "1") state.openLane = 0;
    else if (e.key === "2") state.openLane = 1;
    else if (e.key === "3") state.openLane = 2;
    else if ((e.key === "r" || e.key === "R") && state.over) reset();
    else if (e.key === "Escape") close();
  }

  function open() {
    host = document.getElementById("minigame-host");
    if (!host) return;
    reset();

    host.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.style.cssText = "background:#0d1117;border:1px solid #26303c;border-radius:14px;padding:14px;box-shadow:0 20px 60px rgba(0,0,0,.5);max-width:92vw;";

    var bar = document.createElement("div");
    bar.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;color:#e6edf3;font-family:ui-monospace,monospace;font-size:13px;";
    bar.innerHTML = "<span>Packet Router — route packets past the gate</span>";
    var closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.setAttribute("aria-label", "Close minigame");
    closeBtn.style.cssText = "background:none;border:1px solid #26303c;color:#e6edf3;border-radius:8px;width:28px;height:28px;cursor:pointer;";
    closeBtn.addEventListener("click", close);
    bar.appendChild(closeBtn);

    canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    canvas.style.cssText = "display:block;max-width:100%;border-radius:8px;";

    wrap.appendChild(bar);
    wrap.appendChild(canvas);
    host.appendChild(wrap);
    host.hidden = false;
    host.setAttribute("aria-hidden", "false");

    ctx = canvas.getContext("2d");
    document.addEventListener("keydown", onKey);
    // clicking backdrop (not the wrap) closes
    host.addEventListener("mousedown", function (e) { if (e.target === host) close(); });

    running = true;
    loop();
  }

  function close() {
    if (raf) cancelAnimationFrame(raf);
    running = false;
    document.removeEventListener("keydown", onKey);
    if (host) {
      host.hidden = true;
      host.setAttribute("aria-hidden", "true");
      host.innerHTML = "";
    }
  }

  window.DRMinigame = { open: open, close: close };
})();
