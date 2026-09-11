"use strict";
var assert = require("assert");
var fs = require("fs"), vm = require("vm");
var ctx = { console: console, Math: Math };
vm.createContext(ctx);
["v9-world.js","v10-personality.js","v11-social.js","v12-lineage.js","v13-knowledge.js","v14-director2.js","v15-finale.js","v16-presentation.js","v17-adaptive-audio.js","v18-experiments.js","v19-simulation.js","v20-hardening.js","v21-playtest.js","v22-optimization.js","v23-rc2-gate.js","v24-limited-release.js","v25-production.js"].forEach(function (f) { vm.runInContext(fs.readFileSync("web/js/" + f, "utf8"), ctx, { filename: f }); });
var G = ctx.IGRA;
assert(G && G.V9World, "V9 world loaded");
assert(G.V19Simulation && G.V19Simulation.snapshot && G.V19Simulation.restore, "V19 deep simulation API loaded");
var actions = [
  { type: "care", region: "r0", amount: 0.1 },
  { type: "visit", region: "r1", amount: 0.1 },
  { type: "harm", region: "r2", amount: 0.1 },
  { type: "care", region: "r3", amount: 0.1 }
];
var w1 = G.V9World.create(777), w2 = G.V9World.create(777);
actions.forEach(function (a) { w1.apply(a); w2.apply(a); });
var s1 = G.V19Simulation.ensure(w1), s2 = G.V19Simulation.ensure(w2);
G.V19Simulation.tick(w1, 0.25);
G.V19Simulation.tick(w2, 0.25);
assert.strictEqual(JSON.stringify(G.V19Simulation.snapshot(w1)), JSON.stringify(G.V19Simulation.snapshot(w2)), "deep simulation is deterministic");
assert(s1.tick > 0 && s1.tick <= s1.budget, "simulation tick respects budget");
assert(Array.isArray(s1.migration) && s1.migration.length <= 32, "migration history is bounded");
assert(Array.isArray(s1.memory) && s1.memory.length <= 64, "simulation memory is bounded");
assert(Array.isArray(s1.causalEvents) && s1.causalEvents.length <= 48, "causal history is bounded");
var snap = G.V19Simulation.snapshot(w1);
var restoredWorld = G.V9World.create(777);
G.V19Simulation.restore(restoredWorld, snap);
assert.strictEqual(JSON.stringify(G.V19Simulation.snapshot(restoredWorld)), JSON.stringify(snap), "deep simulation snapshot restores exactly");
var ctx2 = { console: console, Math: Math };
vm.createContext(ctx2);
vm.runInContext(fs.readFileSync("web/js/v9-world.js", "utf8"), ctx2);
ctx2.IGRA.V9V25Bridge = { ensure: function (game) { game.world.v9v25 = game.world.v9v25 || { seed: 777, world: ctx2.IGRA.V9World.create(777), replay: [] }; return game.world.v9v25; } };
vm.runInContext(fs.readFileSync("web/js/v20-hardening.js", "utf8"), ctx2);
vm.runInContext(fs.readFileSync("web/js/v19-simulation.js", "utf8"), ctx2);
vm.runInContext(fs.readFileSync("web/js/v9-v25-persistence.js", "utf8"), ctx2);
var P = ctx2.IGRA.V9V25Persistence;
assert(P && P.currentSchema === 3, "actual persistence module loads at schema 3");
var legacy = { schema: 1, seed: 777, clock: 4, lastAction: actions[3], lastRegion: "r3", stepCount: 4, eventCount: w1.history.length, world: w1.snapshot() };
var migrated = P.migrate(legacy);
assert.strictEqual(migrated.schema, 3, "legacy integration state migrates to schema 3");
assert(Array.isArray(migrated.replay), "migration creates replay array");
var old = Object.assign({}, migrated, { schema: 2 });
assert.strictEqual(P.migrate(old).schema, 3, "schema 2 migrates to schema 3");
var game = { world: { seed: 777 } };
assert(P.restore(game, migrated), "actual persistence restore succeeds");
assert.strictEqual(JSON.stringify(game.world.v9v25.world.snapshot()), JSON.stringify(w1.snapshot()), "world snapshot survives actual restore exactly");
assert.strictEqual(P.deterministic(777, actions).equal, true, "actual persistence deterministic helper passes");
console.log("V9-V25 persistence/replay probe: PASS");
