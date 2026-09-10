var IGRA = IGRA || {};
(function (G) {
  "use strict";
  function ensure(world) { if (!world.directorV14) world.directorV14 = { phase: "silence", tension: 0, lastEvent: "", repeat: 0, silence: 1 }; return world.directorV14; }
  function score(world, candidate) { var d = ensure(world), c = candidate || {}; var rarity = Number(c.rarity) || 0.5; var novelty = c.id === d.lastEvent ? 0 : 1; return (1 - d.tension) * (Number(c.setup) || 0.5) + d.tension * (Number(c.consequence) || 0.5) + rarity * 0.2 + novelty * 0.3; }
  function choose(world, candidates) { var best = null, scoreBest = -1; (candidates || []).forEach(function (c) { var s = score(world, c); if (s > scoreBest) { scoreBest = s; best = c; } }); if (best) { var d = ensure(world); d.lastEvent = best.id || "event"; d.repeat = 0; d.tension = Math.max(0, Math.min(1, Number(best.tension) || d.tension)); } return best; }
  G.V14Director2 = { ensure: ensure, score: score, choose: choose };
})(IGRA);
