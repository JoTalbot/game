var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var MAX = 64, KEY_MAX = 64;
  function ensure(world) {
    if (!world || typeof world !== "object") return null;
    if (!world.knowledge || typeof world.knowledge !== "object" || Array.isArray(world.knowledge)) world.knowledge = { discoveries: [], laws: [], interactions: [] };
    var k = world.knowledge;
    if (!Array.isArray(k.discoveries)) k.discoveries = [];
    if (!Array.isArray(k.laws)) k.laws = [];
    if (!Array.isArray(k.interactions)) k.interactions = [];
    k.discoveries = k.discoveries.filter(function (x) { return x && typeof x === "object"; }).slice(0, MAX);
    k.laws = k.laws.filter(function (x) { return x != null; }).slice(0, MAX);
    k.interactions = k.interactions.filter(function (x) { return x != null; }).slice(0, MAX);
    return k;
  }
  function discover(world, key, evidence) {
    var k = ensure(world), id = String(key == null ? "" : key).slice(0, KEY_MAX);
    if (!id) return null;
    var existing = k.discoveries.find(function (x) { return x.id === id; });
    if (existing) return existing;
    var e = Number(evidence);
    if (!Number.isFinite(e)) e = 0;
    e = Math.max(0, Math.min(1, e));
    var item = { id: id, evidence: e };
    k.discoveries.unshift(item);
    if (k.discoveries.length > MAX) k.discoveries.length = MAX;
    return item;
  }
  G.V13Knowledge = { ensure: ensure, discover: discover, constants: { maxDiscoveries: MAX } };
})(IGRA);
