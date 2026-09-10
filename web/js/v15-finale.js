var IGRA = IGRA || {};
(function (G) {
  "use strict";
  function evaluate(world) {
    var w = world || {}, score = 0;
    score += Math.max(-1, Math.min(1, Number(w.meta) || 0)) * 0.2;
    score += Math.min(1, Number(w.saved) || 0) * 0.2;
    score -= Math.min(1, Number(w.killed) || 0) * 0.15;
    score += Math.min(1, Number(w.discovered) || 0) * 0.15;
    if (w.lineageV12) score += Math.min(1, Number(w.lineageV12.generation) || 0) / 20;
    return Math.max(-1, Math.min(1, score));
  }
  function route(world) { var s = evaluate(world); return s > 0.45 ? "garden" : s < -0.25 ? "ash" : "shore"; }
  G.V15Finale = { evaluate: evaluate, route: route };
})(IGRA);
