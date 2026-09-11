const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync("web/js/v9-world.js", "utf8"), ctx);
vm.runInContext(fs.readFileSync("web/js/v19-simulation.js", "utf8"), ctx);

const G = ctx.IGRA;
assert(G && G.V9World && G.V19Simulation, "V19 modules load");

function plain(value) { return JSON.parse(JSON.stringify(value)); }

function run(seed) {
  const world = G.V9World.create(seed);
  const s = G.V19Simulation.ensure(world);
  s.budget = 3;
  world.apply({ type: "care", region: "r0", amount: 0.2 });
  const before = plain(G.V19Simulation.snapshot(world));
  const processed = G.V19Simulation.tick(world, 0.25);
  const after = plain(G.V19Simulation.snapshot(world));
  return { world, before, after, processed };
}

const a = run(42);
assert.strictEqual(a.processed, 3, "simulation respects per-tick budget");
assert.strictEqual(a.after.tick, 3, "simulation advances bounded ticks");
assert(a.after.cursor >= 0 && a.after.cursor < 6, "region cursor remains bounded");
assert(a.after.migration.length <= 32, "migration history bounded");
assert(a.after.memory.length <= 64, "simulation memory bounded");
assert(a.after.causalEvents.length <= 48, "causal history bounded");
assert.notStrictEqual(JSON.stringify(a.before), JSON.stringify(a.after), "deep simulation mutates live state");

const b = run(42);
assert.strictEqual(JSON.stringify(a.after), JSON.stringify(b.after), "same seed is deterministic");

const restored = G.V9World.create(99);
G.V19Simulation.restore(restored, a.after);
assert.strictEqual(JSON.stringify(plain(G.V19Simulation.snapshot(restored))), JSON.stringify(a.after), "simulation snapshot restores exactly");

const huge = { tick: 999, budget: 999, accumulator: 99, cursor: 999, migration: new Array(100).fill({}), memory: new Array(100).fill({}), causalEvents: new Array(100).fill({}), historyCursor: 999, lastRegion: "r999" };
const bounded = G.V19Simulation.restore(restored, huge);
assert.strictEqual(bounded.budget, 8, "restore clamps budget");
assert(bounded.accumulator <= 0.25, "restore clamps accumulator");
assert(bounded.migration.length <= 32 && bounded.memory.length <= 64 && bounded.causalEvents.length <= 48, "restore compacts bounded arrays");

console.log("V19 deep simulation probe: PASS");
