const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const ctx = { console };
vm.createContext(ctx);
["web/js/v9-world.js", "web/js/v10-myth.js", "web/js/v19-simulation.js"].forEach((file) => vm.runInContext(fs.readFileSync(file, "utf8"), ctx));

const G = ctx.IGRA;
assert(G && G.V9World && G.V10Myth && G.V19Simulation, "V11 long-session modules load");
function plain(v) { return JSON.parse(JSON.stringify(v)); }

function run(seed) {
  const world = G.V9World.create(seed);
  G.V10Myth.ensure(world);
  const sim = G.V19Simulation.ensure(world);
  sim.budget = 8;
  for (let i = 0; i < 10000; i++) {
    const region = `r${i % 6}`;
    const type = i % 3 === 0 ? "care" : (i % 3 === 1 ? "harm" : "visit");
    world.apply({ type, region, amount: type === "visit" ? 1 : 0.05 });
    G.V19Simulation.tick(world, 1 / 60);
    if (i % 97 === 0) G.V10Myth.touch(world, region, type, type === "visit" ? 0.08 : 0.05);
  }
  return { world: plain(world.snapshot()), myth: plain(G.V10Myth.snapshot(world)), sim: plain(G.V19Simulation.snapshot(world)) };
}

const a = run(2026);
const b = run(2026);
assert.strictEqual(JSON.stringify(a), JSON.stringify(b), "10k-step session remains deterministic");
assert(a.world.events.length <= 48, "world events remain bounded after long session");
assert(a.world.history.length <= 96, "world history remains bounded after long session");
assert(a.myth.lives.length <= 3, "myth lives remain bounded");
assert(a.myth.memories.length <= 24, "myth memories remain bounded");
assert(Object.keys(a.myth.signals).length <= 12, "myth signals remain bounded");
assert(a.myth.relationships.length <= 8, "myth relationships remain bounded");
assert(a.sim.migration.length <= 32, "simulation migration history remains bounded");
assert(a.sim.memory.length <= 64, "simulation memory remains bounded");
assert(a.sim.causalEvents.length <= 48, "simulation causal history remains bounded");

const restoredWorld = G.V9World.create(99);
G.V19Simulation.restore(restoredWorld, a.sim);
assert.strictEqual(JSON.stringify(plain(G.V19Simulation.snapshot(restoredWorld))), JSON.stringify(a.sim), "simulation restores exactly after long session");
console.log("V11 long-session probe: PASS");
