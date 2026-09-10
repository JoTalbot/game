var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var MAX = 64;
  function ensure(world) { if (!world.knowledge) world.knowledge = { discoveries: [], laws: [], interactions: [] }; return world.knowledge; }
  function discover(world, key, evidence) { var k = ensure(world), id = String(key); if (!k.discoveries.some(function (x) { return x.id === id; })) k.discoveries.unshift({ id: id, evidence: Math.max(0, Math.min(1, Number(evidence) || 0)) }); if (k.discoveries.length > MAX) k.discoveries.length = MAX; return k.discoveries[0]; }
  G.V13Knowledge = { ensure: ensure, discover: discover };
})(IGRA);
