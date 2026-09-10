"use strict";
var assert = require("assert");
var fs = require("fs"), vm = require("vm");
var ctx = { console: console, Math: Math };
vm.createContext(ctx);
["v9-world.js","v10-personality.js","v11-social.js","v12-lineage.js","v13-knowledge.js","v14-director2.js","v15-finale.js","v16-presentation.js","v17-adaptive-audio.js","v18-experiments.js","v19-simulation.js","v20-hardening.js","v21-playtest.js","v22-optimization.js","v23-rc2-gate.js","v24-limited-release.js","v25-production.js"].forEach(function (f) { vm.runInContext(fs.readFileSync("web/js/" + f, "utf8"), ctx, { filename: f }); });
var G = ctx.IGRA;
assert(G && G.V9World, "V9 world loaded");

var actions = [
  { type: "care", region: "r0", amount: 0.1 },
  { type: "visit", region: "r1", amount: 0.1 },
  { type: "harm", region: "r2", amount: 0.1 },
  { type: "care", region: "r3", amount: 0.1 }
];
var w1 = G.V9World.create(777);
var w2 = G.V9World.create(777);
actions.forEach(function (a) { w1.apply(a); w2.apply(a); });
assert.strictEqual(JSON.stringify(w1.snapshot()), JSON.stringify(w2.snapshot()), "same seed and actions replay deterministically");

// Load the actual persistence module in a bridge-shaped test context.
var ctx2 = { console: console, Math: Math };
vm.createContext(ctx2);
vm.runInContext(fs.readFileSync("web/js/v9-world.js", "utf8"), ctx2);
ctx2.IGRA.V9V25Bridge = {
  ensure: function (game) {
    game.world.v9v25 = game.world.v9v25 || { seed: 777, world: ctx2.IGRA.V9World.create(777), replay: [] };
    return game.world.v9v25;
  }
};
vm.runInContext(fs.readFileSync("web/js/v9-v25-persistence.js", "utf8"), ctx2);
var P = ctx2.IGRA.V9V25Persistence;
assert(P && P.currentSchema === 2, "actual persistence module loads at schema 2");

var legacy = {
  schema: 1,
  seed: 777,
  clock: 4,
  lastAction: actions[3],
  lastRegion: "r3",
  stepCount: 4,
  eventCount: w1.history.length,
  world: w1.snapshot()
};
var migrated = P.migrate(legacy);
assert.strictEqual(migrated.schema, 2, "legacy integration state migrates to schema 2");
assert(Array.isArray(migrated.replay), "migration creates replay array");
var game = { world: { seed: 777 } };
assert(P.restore(game, migrated), "actual persistence restore succeeds");
assert.strictEqual(JSON.stringify(game.world.v9v25.world.snapshot()), JSON.stringify(w1.snapshot()), "world snapshot survives actual restore exactly");
assert.strictEqual(P.deterministic(777, actions).equal, true, "actual persistence deterministic helper passes");
console.log("V9-V25 persistence/replay probe: PASS");
