var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var IDS = {
    "mute-btn": "mute",
    "lang-btn": "language",
    "sky-btn": "sky",
    "sigil-btn": "sigil",
    "btn-continue": "continue",
    "btn-born": "born",
    "btn-release": "release",
    "btn-become": "become",
    "sigil-close": "close sigil",
    "btn-report": "report",
    "btn-share": "share sigil",
    "btn-forget": "forget",
    "report-copy": "copy report",
    "report-close": "close report"
  };

  function reduced() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function applyMotion() {
    var on = reduced();
    document.documentElement.setAttribute("data-reduced-motion", on ? "true" : "false");
    var style = document.getElementById("igra-a11y-motion");
    if (!style) {
      style = document.createElement("style");
      style.id = "igra-a11y-motion";
      document.head.appendChild(style);
    }
    style.textContent = on
      ? "*,:before,:after{scroll-behavior:auto!important;animation-duration:0.001ms!important;animation-iteration-count:1!important;transition-duration:0.001ms!important;}"
      : "";
  }

  function labelButtons() {
    Object.keys(IDS).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.setAttribute("aria-label", IDS[id]);
    });
  }

  function liveRegions() {
    ["veil", "hint", "law", "fate-line", "report-text", "sigil-sub", "sigil-verses", "sigil-season"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute("aria-live", "polite");
    });
  }

  function init() {
    labelButtons();
    liveRegions();
    applyMotion();
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.addEventListener) mq.addEventListener("change", applyMotion);
      else if (mq.addListener) mq.addListener(applyMotion);
    }
  }

  G.Accessibility = {
    version: 1,
    reducedMotion: reduced,
    applyMotion: applyMotion,
    init: init
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(IGRA);
