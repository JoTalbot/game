"use strict";
var assert = require("assert"), fs = require("fs"), vm = require("vm");
var ctx = { console: console, Math: Math };
vm.createContext(ctx);
["v9-world.js","v10-personality.js","v10-myth.js","v11-social.js","v12-lineage.js","v13-knowledge.js","v14-director2.js","v15-finale.js","v16-presentation.js","v17-adaptive-audio.js","v18-experiments.js","v19-simulation.js","v20-hardening.js","v21-playtest.js","v22-optimization.js","v23-rc2-gate.js","v24-limited-release.js","v25-production.js"].forEach(function (f) { vm.runInContext(fs.readFileSync("web/js/" + f, "utf8"), ctx, { filename: f }); });
var G = ctx.IGRA;
assert(G && G.V9World, "V9 world loaded");
assert(G.V10Myth, "V10 myth loaded");
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
var snap = G.V19Simulation.snapshot(w1), restoredWorld = G.V9World.create(777);
G.V19Simulation.restore(restoredWorld, snap);
assert.strictEqual(JSON.stringify(G.V19Simulation.snapshot(restoredWorld)), JSON.stringify(snap), "deep simulation snapshot restores exactly");
var ctx2 = { console: console, Math: Math };
vm.createContext(ctx2);
["v9-world.js","v10-myth.js","v19-simulation.js","v20-hardening.js"].forEach(function (f) { vm.runInContext(fs.readFileSync("web/js/" + f, "utf8"), ctx2, { filename: f }); });
ctx2.IGRA.V9V25Bridge = { ensure: function (game) { game.world.v9v25 = game.world.v9v25 || { seed: 777, world: ctx2.IGRA.V9World.create(777), replay: [] }; return game.world.v9v25; } };
vm.runInContext(fs.readFileSync("web/js/v9-v25-persistence.js", "utf8"), ctx2, { filename: "v9-v25-persistence.js" });
var P = ctx2.IGRA.V9V25Persistence;
assert(P && P.currentSchema === 5, "actual persistence module loads at schema 5");
var game = { world: { seed: 777 } };
ctx2.IGRA.V9V25Bridge.ensure(game);
game.world.simulationV19 = ctx2.IGRA.V19Simulation.ensure(game.world);
ctx2.IGRA.V19Simulation.tick(game.world, 0.25);
ctx2.IGRA.V10Myth.absorb(game.world, "release", { dominant: "empathy" }, "r1");
var packed = P.pack(game);
assert(packed && packed.simulationV19 && packed.simulationV19.tick > 0, "deep simulation state is packed");
assert(packed && packed.mythV10 && packed.mythV10.generation === 1, "V10 myth state is packed");
var legacy = { schema: 1, seed: 777, clock: 4, lastAction: actions[3], lastRegion: "r3", stepCount: 4, eventCount: w1.history.length, world: w1.snapshot() };
var migrated = P.migrate(legacy);
assert.strictEqual(migrated.schema, 5, "legacy integration state migrates to schema 5");
assert(Array.isArray(migrated.replay), "migration creates replay array");
assert.strictEqual(migrated.mythV10, null, "pre-V10 saves migrate without invented generational history");
var old = Object.assign({}, migrated, { schema: 2 });
assert.strictEqual(P.migrate(old).schema, 5, "schema 2 migrates to schema 5");
var restored = { world: { seed: 777 } };
ctx2.IGRA.V9V25Bridge.ensure(restored);
assert(P.restore(restored, packed), "actual persistence restore succeeds");
assert.strictEqual(JSON.stringify(restored.world.v9v25.world.snapshot()), JSON.stringify(game.world.v9v25.world.snapshot()), "world snapshot survives actual restore exactly");
assert.strictEqual(JSON.stringify(ctx2.IGRA.V19Simulation.snapshot(restored.world)), JSON.stringify(packed.simulationV19), "V19 simulation snapshot survives actual restore exactly");
assert.strictEqual(JSON.stringify(ctx2.IGRA.V10Myth.snapshot(restored.world)), JSON.stringify(packed.mythV10), "V10 myth snapshot survives actual restore exactly");
assert.strictEqual(P.deterministic(777, actions).equal, true, "actual persistence deterministic helper passes");

// Runtime bridge and persistence intentionally have separate ownership:
// bridge.ensure creates bounded integration state, while persistence.record
// creates/updates the replay stream. Test that contract explicitly.
vm.runInContext(fs.readFileSync("web/js/v9-v25-bridge.js", "utf8"), ctx2, { filename: "v9-v25-bridge.js" });
var live = { w: 427, state: "play", player: { x: 10, y: 20 },
  dna: { dominant: function () { return "empathy"; }, taps: 0, gazes: 0, pulses: 0 },
  world: { seed: 5150, beings: [], history: [] }, gazeTarget: null };
ctx2.IGRA.V9V25Bridge.step(live, 0.1);
assert(live.world.v9v25, "bridge attaches bounded state to live world");
assert.strictEqual(live.world.v9v25.lastAction.type, "idle", "idle runtime remains explicit idle state");
assert(!Array.isArray(live.world.v9v25.replay), "bridge does not own the persistence replay array");

live.__v9v25Action = { type: "care", amount: 0.1 };
ctx2.IGRA.V9V25Bridge.step(live, 0.1);
assert.strictEqual(live.world.v9v25.metrics.actions, 1, "real runtime action is counted once");
assert.strictEqual(live.world.v9v25.lastAction.type, "care", "runtime action preserves type");
assert(Array.isArray(live.world.v9v25.replay) && live.world.v9v25.replay.length === 1, "persistence.record creates replay entry");
assert.strictEqual(live.world.v9v25.replay[0].type, "care", "runtime replay preserves action type");
ctx2.IGRA.V9V25Bridge.step(live, 0.1);
assert.strictEqual(live.world.v9v25.replay.length, 1, "idle frame does not duplicate runtime action");
var livePacked = ctx2.IGRA.V9V25Persistence.pack(live);
assert(livePacked && livePacked.replay.length === 1, "live replay survives actual pack");
assert(livePacked && livePacked.mythV10, "live V10 myth survives actual pack");

console.log("V9-V25 persistence/replay probe: PASS");
