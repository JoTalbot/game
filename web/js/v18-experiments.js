var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var MAX = 32;
  function ensure(world) {
    if (!world.experiments || typeof world.experiments !== "object" || Array.isArray(world.experiments)) world.experiments = { records: [] };
    if (!Array.isArray(world.experiments.records)) world.experiments.records = [];
    if (world.experiments.records.length > MAX) world.experiments.records = world.experiments.records.slice(-MAX);
    return world.experiments;
  }
  function record(world, hypothesis, action, outcome) {
    var e = ensure(world), r = { id: "x" + ((e.records.length + 1) >>> 0), hypothesis: String(hypothesis || ""), action: String(action || ""), outcome: String(outcome || "") };
    e.records.push(r);
    if (e.records.length > MAX) e.records.shift();
    return r;
  }
  G.V18Experiments = { ensure: ensure, record: record, maxRecords: MAX };
})(IGRA);
