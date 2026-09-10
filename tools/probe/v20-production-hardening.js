"use strict";
var assert = require("assert"), fs = require("fs"), vm = require("vm");
var ctx = { console: console, Math: Math };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync("web/js/v20-hardening.js", "utf8"), ctx, { filename: "v20-hardening.js" });
var G = ctx.IGRA;
var w = {};
assert(G.V20Hardening);
var h = G.V20Hardening.ensure(w);
assert.strictEqual(h.schema, 3);

var raw = {
  score: 7,
  v9v25: {
    schema: 999,
    seed: "bad",
    clock: -4,
    stepCount: "9.8",
    eventCount: -2,
    lastRegion: null,
    replay: [
      null,
      { tick: -1, type: null, region: null, amount: "x" }
    ],
    world: {
      history: [null, { id: "h" }],
      regions: [null, { id: "r" }]
    }
  }
};

var s = G.V20Hardening.sanitizeSave(raw);
assert.strictEqual(s.ok, true);
assert.strictEqual(s.data.score, 7);
assert.strictEqual(s.data.v9v25.schema, 3);
assert.strictEqual(s.data.v9v25.clock, 0);
assert.strictEqual(s.data.v9v25.stepCount, 9);
assert.strictEqual(s.data.v9v25.eventCount, 0);
assert.strictEqual(s.data.v9v25.replay.length, 1);
assert.strictEqual(s.data.v9v25.replay[0].tick, 0);
assert.strictEqual(s.data.v9v25.replay[0].type, "");
assert.strictEqual(s.data.v9v25.world.history.length, 1);
assert.strictEqual(s.data.v9v25.world.regions.length, 1);
assert.strictEqual(G.V20Hardening.sanitizeSave(null).ok, false);
assert.strictEqual(G.V20Hardening.sanitizeSave({ v9v25: [] }).ok, false);

G.V20Hardening.markCorrupt(w);
G.V20Hardening.recover(w, "fuzz");
G.V20Hardening.lifecycle(w, "background");
G.V20Hardening.lifecycle(w, "foreground");
G.V20Hardening.budget(w, 20, 12, 192);
assert.strictEqual(h.corruptions, 1);
assert.strictEqual(h.recoveries, 1);
assert.strictEqual(h.lifecycle.background, 1);
assert.strictEqual(h.lifecycle.foreground, 1);
assert.strictEqual(h.budgets.simulation, 12);
console.log("V20 production hardening/sanitization probe: PASS");
