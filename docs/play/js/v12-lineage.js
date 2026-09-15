var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var MAX = 8;
  function ensure(world) { if (!world.lineageV12) world.lineageV12 = { generation: 0, ancestors: [], traits: {}, memories: [] }; return world.lineageV12; }
  function inherit(world, parent) {
    var s = ensure(world), p = parent || {};
    s.generation = Math.min(999, (s.generation || 0) + 1);
    s.ancestors.unshift({ generation: s.generation - 1, id: p.id || "unknown", kind: p.kind || "unknown" });
    if (s.ancestors.length > MAX) s.ancestors.length = MAX;
    var traits = p.personality || p.traits || {};
    Object.keys(traits).slice(0, 16).forEach(function (k) { s.traits[k] = (Number(traits[k]) || 0) * 0.85; });
    return s;
  }
  G.V12Lineage = { ensure: ensure, inherit: inherit };
})(IGRA);
