#!/usr/bin/env node
"use strict";

// Pure policy helper used by the RC1 deterministic contract.
// Keep these boundaries synchronized with gameplay touch cancellation.
var HOLD_LIMIT = 126;
var GRACE_LIMIT = 140;

function classify(slip) {
  if (!Number.isFinite(slip) || slip < 0) throw new Error("invalid slip");
  return slip <= GRACE_LIMIT ? "hold" : "slip";
}

if (require.main === module) {
  var cases = [
    [80, "hold"],
    [126, "hold"],
    [127, "hold"],
    [140, "hold"],
    [141, "slip"]
  ];
  cases.forEach(function (c) {
    if (classify(c[0]) !== c[1]) throw new Error("touch policy mismatch at " + c[0]);
  });
  console.log("touch-policy: PASS");
}

module.exports = { HOLD_LIMIT: HOLD_LIMIT, GRACE_LIMIT: GRACE_LIMIT, classify: classify };
