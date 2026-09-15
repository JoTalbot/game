var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var MAX = 8;
  function finite(v, fallback) { return Number.isFinite(Number(v)) ? Number(v) : fallback; }
  function clean(v, fallback) { var s = String(v == null ? "" : v); return s.length ? s.slice(0, 32) : fallback; }
  function ensure(world) {
    if (!world || typeof world !== "object") return null;
    if (!world.lineageV12 || typeof world.lineageV12 !== "object") world.lineageV12 = { generation: 0, ancestors: [], traits: {}, memories: [] };
    var s = world.lineageV12;
    s.generation = Math.min(999, Math.max(0, Math.floor(finite(s.generation, 0))));
    if (!Array.isArray(s.ancestors)) s.ancestors = [];
    if (!s.traits || typeof s.traits !== "object" || Array.isArray(s.traits)) s.traits = {};
    if (!Array.isArray(s.memories)) s.memories = [];
    s.ancestors = s.ancestors.filter(function (v) { return v && typeof v === "object"; }).slice(0, MAX);
    s.memories = s.memories.filter(function (v) { return v && typeof v === "object"; }).slice(-MAX);
    return s;
  }
  function inherit(world, parent) {
    var s = ensure(world), p = parent || {};
    if (!s) return null;
    s.generation = Math.min(999, s.generation + 1);
    s.ancestors.unshift({ generation: s.generation - 1, id: clean(p.id, "unknown"), kind: clean(p.kind, "unknown") });
    if (s.ancestors.length > MAX) s.ancestors.length = MAX;
    var traits = p.personality || p.traits || {};
    Object.keys(traits).slice(0, 16).forEach(function (k) {
      var value = finite(traits[k], 0);
      s.traits[clean(k, "unknown")] = Number((value * 0.85).toFixed(6));
    });
    if (p.memory && typeof p.memory === "object") {
      s.memories.unshift({ generation: s.generation - 1, value: clean(p.memory.id || p.memory.type || p.memory.value, "memory") });
      if (s.memories.length > MAX) s.memories.length = MAX;
    }
    return s;
  }
  G.V12Lineage = { ensure: ensure, inherit: inherit, constants: { maxAncestors: MAX, maxMemories: MAX } };
})(IGRA);
