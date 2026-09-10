var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var MAX = 96;
  function ensure(world) { if (!world.social) world.social = { relationships: [], reputation: 0, communities: [] }; return world.social; }
  function relation(world, a, b) {
    var s = ensure(world), id = String(a) < String(b) ? String(a) + ":" + String(b) : String(b) + ":" + String(a);
    for (var i = 0; i < s.relationships.length; i++) if (s.relationships[i].id === id) return s.relationships[i];
    var r = { id: id, a: String(a), b: String(b), trust: 0.5, affinity: 0, conflict: 0, history: 0 };
    s.relationships.push(r); if (s.relationships.length > MAX) s.relationships.shift(); return r;
  }
  function record(world, a, b, kind, amount) {
    var r = relation(world, a, b), d = Math.max(-0.2, Math.min(0.2, amount == null ? 0.05 : amount));
    if (kind === "trust") r.trust = Math.max(0, Math.min(1, r.trust + d));
    if (kind === "bond") r.affinity = Math.max(-1, Math.min(1, r.affinity + d));
    if (kind === "conflict") r.conflict = Math.max(0, Math.min(1, r.conflict + Math.abs(d)));
    r.history = Math.min(1, r.history + 0.02);
    return r;
  }
  G.V11Social = { ensure: ensure, relation: relation, record: record };
})(IGRA);
