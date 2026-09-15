var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var MAX = 32;
  function num(v, fallback) { var n = Number(v); return Number.isFinite(n) ? n : fallback; }
  function clamp(v) { return Math.max(0, Math.min(1, num(v, 0))); }
  function ensure(world) {
    if (!world || typeof world !== "object") return null;
    if (!world.directorV14 || typeof world.directorV14 !== "object" || Array.isArray(world.directorV14)) world.directorV14 = { phase: "silence", tension: 0, lastEvent: "", repeat: 0, silence: 1 };
    var d = world.directorV14;
    d.phase = typeof d.phase === "string" && d.phase ? d.phase.slice(0, 24) : "silence";
    d.tension = clamp(d.tension);
    d.lastEvent = String(d.lastEvent == null ? "" : d.lastEvent).slice(0, 64);
    d.repeat = Math.max(0, Math.min(MAX, Math.floor(num(d.repeat, 0))));
    d.silence = clamp(d.silence);
    return d;
  }
  function score(world, candidate) {
    var d = ensure(world), c = candidate || {};
    if (!d) return -1;
    var rarity = clamp(c.rarity == null ? 0.5 : c.rarity);
    var setup = clamp(c.setup == null ? 0.5 : c.setup);
    var consequence = clamp(c.consequence == null ? 0.5 : c.consequence);
    var novelty = String(c.id || "") === d.lastEvent ? 0 : 1;
    return (1 - d.tension) * setup + d.tension * consequence + rarity * 0.2 + novelty * 0.3;
  }
  function choose(world, candidates) {
    var d = ensure(world), best = null, scoreBest = -1;
    (Array.isArray(candidates) ? candidates : []).forEach(function (c) {
      var s = score(world, c);
      if (s > scoreBest) { scoreBest = s; best = c; }
    });
    if (best) { d.lastEvent = String(best.id || "event").slice(0, 64); d.repeat = 0; d.tension = clamp(best.tension == null ? d.tension : best.tension); }
    return best;
  }
  G.V14Director2 = { ensure: ensure, score: score, choose: choose, constants: { maxRepeat: MAX } };
})(IGRA);
