var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var LABEL_KEYS = {
    "mute-btn": "mute",
    "lang-btn": "language",
    "sky-btn": "sky",
    "sigil-btn": "sigil",
    "btn-continue": "cont",
    "btn-born": "born",
    "btn-release": "release",
    "btn-become": "become",
    "sigil-close": "back",
    "btn-report": "tell",
    "btn-share": "share",
    "btn-forget": "forget",
    "report-copy": "copy",
    "report-close": "back"
  };

  function canSet(el) {
    return !!(el && typeof el.setAttribute === "function");
  }

  function reduced() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function applyMotion() {
    var on = reduced();
    var root = document.documentElement;
    if (canSet(root)) root.setAttribute("data-reduced-motion", on ? "true" : "false");
    var style = document.getElementById("igra-a11y-motion");
    if (!style && document.createElement) {
      style = document.createElement("style");
      style.id = "igra-a11y-motion";
      if (document.head && document.head.appendChild) document.head.appendChild(style);
    }
    if (style) style.textContent = on
      ? "*,:before,:after{scroll-behavior:auto!important;animation-duration:0.001ms!important;animation-iteration-count:1!important;transition-duration:0.001ms!important;}"
      : "";
  }

  function labelButtons() {
    Object.keys(LABEL_KEYS).forEach(function (id) {
      var el = document.getElementById(id);
      if (!canSet(el)) return;
      var key = LABEL_KEYS[id];
      var label = G.Lang && G.Lang.t ? G.Lang.t(key) : "";
      if (!label || label === key) {
        label = el.textContent || key;
      }
      el.setAttribute("aria-label", label);
    });
  }

  function liveRegions() {
    ["veil", "hint", "law", "fate-line", "report-text", "sigil-sub", "sigil-verses", "sigil-season"].forEach(function (id) {
      var el = document.getElementById(id);
      if (canSet(el)) el.setAttribute("aria-live", "polite");
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
    version: 2,
    reducedMotion: reduced,
    applyMotion: applyMotion,
    refreshLabels: labelButtons,
    init: init
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(IGRA);
