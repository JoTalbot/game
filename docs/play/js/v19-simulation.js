var IGRA = IGRA || {};
(function (G) {
  "use strict";
  function ensure(world) { if (!world.simulationV19) world.simulationV19 = { tick: 0, budget: 8, accumulator: 0 }; return world.simulationV19; }
  function tick(world, dt) { var s = ensure(world), step = Math.max(0, Math.min(0.25, Number(dt) || 0)); s.accumulator += step; var n = 0; while (s.accumulator >= 0.05 && n < s.budget) { s.accumulator -= 0.05; s.tick++; n++; } return n; }
  G.V19Simulation = { ensure: ensure, tick: tick };
})(IGRA);
