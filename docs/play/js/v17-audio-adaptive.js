var IGRA = IGRA || {};
(function (G) {
  "use strict";
  function ensure(world) { if (!world.audioV17) world.audioV17 = { intensity: 0, motif: "silence", enabled: true }; return world.audioV17; }
  function update(world, tension, relation, weather) { var a = ensure(world); a.intensity = Math.max(0, Math.min(1, ((Number(tension) || 0) + (Number(relation) || 0) + (Number(weather) || 0)) / 3)); a.motif = a.intensity < 0.18 ? "silence" : a.intensity < 0.55 ? "world" : "tension"; return a; }
  G.V17Audio = { ensure: ensure, update: update };
})(IGRA);
