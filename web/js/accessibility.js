var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var IDS = [
    "mute-btn", "lang-btn", "sky-btn", "sigil-btn", "btn-continue", "btn-born",
    "btn-release", "btn-become", "sigil-close", "btn-report", "btn-share",
    "btn-forget", "report-copy", "report-close"
  ];

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
    IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (!canSet(el)) return;
      var label = el.textContent || "";
      if (id === "lang-btn") {
        label = G.Lang && G.Lang.id === "en" ? "change language" : "сменить язык";
      }
      el.setAttribute("aria-label", label.trim());
    });
  }

  function watchLanguageButton() {
    var btn = document.getElementById("lang-btn");
    if (!btn || btn.__igraA11yLangWatch) return;
    btn.__igraA11yLangWatch = true;
    btn.addEventListener("click", function () {
      setTimeout(labelButtons, 0);
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
    watchLanguageButton();
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
