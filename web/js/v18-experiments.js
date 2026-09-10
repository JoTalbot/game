var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var MAX = 32;
  function ensure(world) { if (!world.experiments) world.experiments = { records: [] }; return world.experiments; }
  function record(world, hypothesis, action, outcome) { var e = ensure(world), r = { id: "x" + ((e.records.length + 1) >>> 0), hypothesis: String(hypothesis || ""), action: String(action || ""), outcome: String(outcome || "") }; e.records.push(r); if (e.records.length > MAX) e.records.shift(); return r; }
  G.V18Experiments = { ensure: ensure, record: record };
})(IGRA);
