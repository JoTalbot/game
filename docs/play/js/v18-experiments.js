var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var MAX = 32, TEXT_MAX = 96;
  function text(v) { return String(v == null ? "" : v).slice(0, TEXT_MAX); }
  function ensure(world) {
    if (!world || typeof world !== "object") return null;
    if (!world.experiments || typeof world.experiments !== "object" || Array.isArray(world.experiments)) world.experiments = { records: [] };
    if (!Array.isArray(world.experiments.records)) world.experiments.records = [];
    world.experiments.records = world.experiments.records.filter(function (x) { return x && typeof x === "object"; }).slice(-MAX);
    return world.experiments;
  }
  function record(world, hypothesis, action, outcome) {
    var e = ensure(world), r;
    if (!e) return null;
    r = { id: "x" + ((e.records.length + 1) >>> 0), hypothesis: text(hypothesis), action: text(action), outcome: text(outcome) };
    e.records.push(r);
    if (e.records.length > MAX) e.records.shift();
    return r;
  }
  G.V18Experiments = { ensure: ensure, record: record, maxRecords: MAX };
})(IGRA);
