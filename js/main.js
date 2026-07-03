/* =========================================================================
   main.js — site behavior (nav, theme, footer year) + easter-egg trigger.
   The minigame itself lives in js/minigame.js and is loaded lazily so it
   can never interfere with the main site if it fails to parse.
   ========================================================================= */
(function () {
  "use strict";

  /* ---- footer year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---- mobile nav toggle ---- */
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- theme toggle (persisted) ---- */
  var THEME_KEY = "dr-theme";
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem(THEME_KEY); } catch (e) {}
  if (stored) {
    root.setAttribute("data-theme", stored);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.setAttribute("data-theme", "dark");
  }
  var themeBtn = document.querySelector(".theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  /* =======================================================================
     EASTER EGG
     Two independent triggers, neither discoverable via obvious UI:
       1. Konami code:  ↑ ↑ ↓ ↓ ← → ← → B A
       2. Typing the secret word "packet" anywhere on the page.
     A console hint points curious source-readers toward the secret.
     ======================================================================= */
  var launched = false;

  function launchMinigame() {
    if (launched) return;
    launched = true;
    var s = document.createElement("script");
    s.src = "js/minigame.js";
    s.defer = true;
    s.onload = function () {
      if (window.DRMinigame && typeof window.DRMinigame.open === "function") {
        window.DRMinigame.open();
      }
    };
    s.onerror = function () { launched = false; }; // allow retry; never break the page
    document.body.appendChild(s);
  }

  // Konami sequence
  var konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
  var kPos = 0;
  // Secret word buffer
  var SECRET = "packet";
  var buffer = "";

  document.addEventListener("keydown", function (e) {
    // Konami
    kPos = (e.keyCode === konami[kPos]) ? kPos + 1 : (e.keyCode === konami[0] ? 1 : 0);
    if (kPos === konami.length) { kPos = 0; launchMinigame(); return; }

    // Secret word (ignore when typing in a field)
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (e.key && e.key.length === 1) {
      buffer = (buffer + e.key.toLowerCase()).slice(-SECRET.length);
      if (buffer === SECRET) launchMinigame();
    }
  });

  // Console hint (discoverable only by opening dev tools / reading source)
  try {
    console.log(
      "%cpsst — there's a packet to route.",
      "color:#2563eb;font-weight:700;font-size:13px"
    );
    console.log("%cTry the Konami code, or just type the magic word.", "color:#888");
  } catch (e) {}
})();
