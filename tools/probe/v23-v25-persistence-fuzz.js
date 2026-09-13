#!/usr/bin/env node
"use strict";
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

function boot() {
  const ctx = { console: console, Math: Math };
  vm.createContext(ctx);
  ["v9-world.js", "v19-simulation.js", "v20-hardening.js", "v9-v25-bridge.js", "v9-v25-persistence.js"]
    .forEach((f) => vm.runInContext(fs.readFileSync("web/js/" + f, "utf8"), ctx, { filename: f }));
  return ctx.IGRA;
}

const G = boot();
assert(G && G.V9World && G.V9V25Persistence, "persistence stack loaded");
const P = G.V9V25Persistence;

function game(seed) {
  const w = G.V9World.create(seed);
  const g = { world: w };
  G.V9V25Bridge.ensure(g);
  return g;
}

const g = game(424242);
const actions = [];
for (let i = 0; i < 220; i++) {
  const action = {
    type: ["care", "visit", "harm", "gaze"][i % 4],
    region: "r" + (i % 6),
    amount: (i % 11) / 10
  };
  actions.push(action);
  P.record(g, action);
}
assert(g.world.v9v25.replay.length <= P.maxReplay, "replay remains bounded after long action stream");
assert(g.world.v9v25.replay.length === P.maxReplay, "replay keeps the newest bounded window");

const packed = P.pack(g);
assert(packed && packed.schema === P.currentSchema, "packed save has current schema");
assert(packed.replay.length <= P.maxReplay, "packed replay remains bounded");

const malformed = [
  null, undefined, [], "save", 42, true,
  { schema: -99 },
  { schema: 999 },
  { schema: 1, replay: "bad", clock: "nan", stepCount: {}, eventCount: [] },
  { schema: 3, simulationV19: [] },
  { schema: 3, simulationV19: { tick: "bad", migration: "bad", memory: {}, causalEvents: null } }
];
for (const raw of malformed) {
  let migrated;
  assert.doesNotThrow(() => { migrated = P.migrate(raw); }, "migration must tolerate malformed input");
  if (migrated !== null) {
    assert(migrated.schema <= P.currentSchema, "migration never accepts a future schema");
  }
}

const future = { schema: P.currentSchema + 1, seed: 1 };
assert.strictEqual(P.migrate(future), null, "future schema is rejected");

const deterministicA = P.deterministic(424242, actions.slice(0, 40));
const deterministicB = P.deterministic(424242, actions.slice(0, 40));
assert(deterministicA && deterministicA.equal, "deterministic helper passes");
assert.strictEqual(deterministicA.snapshot, deterministicB.snapshot, "same seed and actions produce identical snapshot");

const restored = game(424242);
assert.doesNotThrow(() => P.restore(restored, packed), "valid packed save restores without throwing");
assert.strictEqual(
  JSON.stringify(G.V19Simulation.snapshot(restored.world)),
  JSON.stringify(packed.simulationV19),
  "restored deep simulation remains exact"
);

const corrupted = JSON.parse(JSON.stringify(packed));
corrupted.simulationV19 = {
  tick: "NaN",
  budget: 999999,
  accumulator: -999,
  cursor: "bad",
  migration: new Array(500).fill({ bad: true }),
  memory: new Array(500).fill({ bad: true }),
  causalEvents: new Array(500).fill({ bad: true })
};
const recovered = game(424242);
assert.doesNotThrow(() => P.restore(recovered, corrupted), "corrupted simulation save is handled safely");
const rs = G.V19Simulation.ensure(recovered.world);
assert(rs.budget >= 1 && rs.budget <= 8, "corrupt simulation budget is clamped");
assert(rs.migration.length <= 32 && rs.memory.length <= 64 && rs.causalEvents.length <= 48, "corrupt simulation arrays remain bounded");

console.log("V23-V25 persistence fuzz/replay probe: PASS");
