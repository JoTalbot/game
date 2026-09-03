#!/usr/bin/env node
const fs = require("fs"), vm = require("vm"), path = require("path"), H = require("./harness");
const ROOT = path.resolve(__dirname, "../..");
const html = fs.readFileSync(path.join(ROOT, "web/index.html"), "utf8");
const files = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m => m[1]).filter(Boolean);
global.location = global.location || { search: "", href: "https://igra.local/", protocol: "https:" };
global.requestAnimationFrame = global.requestAnimationFrame || function () { return 1; };
global.cancelAnimationFrame = global.cancelAnimationFrame || function () {};
const G = H.boot();
const ok = (v, label) => { if (!v) throw new Error(label); console.log(`✓ ${label}`); };
for (const src of files) vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", src), "utf8"), { filename: src });
ok(!!G.ReleaseSystems, "ReleaseSystems loaded");
ok(files.includes("js/release-systems.js"), "release module is in browser shell");
ok(!!G.V4History, "V4 history/routes layer is in browser shell");

G.Save.clear();
G.ReleaseSystems.reset();
if (G.V4History && G.V4History.resetCache) G.V4History.resetCache();
const s = G.ReleaseSystems.state();
ok(s.places.length === 8, "8 historical places seeded");
ok(s.beings.length === 6, "6 recurring identities seeded");
ok(s.laws.length === 0, "laws start emergent, not hard-coded UI");

function scenario(name, values, behavior) {
  G.Save.set("igra.life.v1", JSON.stringify({ version: 1, born: true, skins: 3, behavior }));
  if (G.Life && G.Life.resetCache) G.Life.resetCache();
  if (G.Trajectory && G.Trajectory.resetCache) G.Trajectory.resetCache();
  if (G.Relationships && G.Relationships.resetCache) G.Relationships.resetCache();
  if (G.WorldMemory && G.WorldMemory.resetCache) G.WorldMemory.resetCache();
  const game = H.makeWorld(G, name === "steward" ? 8101 : name === "seeking" ? 8102 : 8103);
  Object.keys(values).forEach(k => { game.dna.values[k] = values[k]; });
  const p = G.Trajectory.build(game);
  ok(!!p && !!p.path, `${name}: canonical trajectory is produced from real gameplay signals`);
  console.log(`  ${name} path=${p.path} dominant=${p.dominant} secondary=${p.secondary}`);
  return { game, profile: p };
}

const scenarios = [
  scenario("steward", { harmony: 0.92, contemplation: 0.25, empathy: 0.20, curiosity: 0.10, aggression: 0.05, chaos: 0.05 }, { born: 1, returns: 1, pulses: 1, still: 12, motion: 1 }),
  scenario("seeking", { curiosity: 0.92, chaos: 0.18, contemplation: 0.15, empathy: 0.10, harmony: 0.05, aggression: 0.05 }, { born: 1, returns: 10, pulses: 2, still: 1, motion: 18 }),
  scenario("thorn", { aggression: 0.92, chaos: 0.20, curiosity: 0.10, contemplation: 0.10, empathy: 0.05, harmony: 0.05 }, { born: 1, returns: 2, pulses: 2, still: 1, motion: 3 })
];
const paths = scenarios.map(x => x.profile.path);
ok(new Set(paths).size === 3, `three real control scenarios produce three distinct trajectories: ${paths.join(" | ")}`);

for (const x of scenarios) {
  const st = G.ReleaseSystems.state();
  st.act = 2; st.actTurns = 89;
  G.ReleaseSystems.observe(1, x.game);
}
let p = G.ReleaseSystems.profile();
console.log(`  recorded trajectories=${JSON.stringify(p.trajectories)}`);
ok(p.trajectories.length >= 3, "ReleaseSystems records three trajectories without seeded trajectory counters");
ok(paths.every(pathName => p.trajectories.includes(pathName)), "recorded trajectory keys match canonical Trajectory.profile paths");

const game = scenarios[1].game;
G.Save.set("igra.life.v1", JSON.stringify({ version: 1, born: true, skins: 3, behavior: { born: 1, returns: 10, pulses: 2, still: 1, motion: 18 } }));
if (G.Life && G.Life.resetCache) G.Life.resetCache();
game.dna.age = Math.max(Number(game.dna.age) || 0, 240);
game.state = "play"; game.time = 2400; game.player = { x: 0, y: 0 };
game.world.meta = 3; game.world.discovered = 100; game.world.lost = 0; game.world.bounds = 2200;
for (let i = 0; i < 1000; i++) {
  game.time = 2400 + i;
  // Exercise contrasting route traces from changing gameplay signals, not
  // from pre-seeded route counters. This keeps the RC probe aligned with the
  // product contract: routes are derived from the active game state.
  if (i % 180 === 60) {
    game.dna.values.harmony = 0.92;
    game.dna.values.contemplation = 0.25;
    game.dna.values.curiosity = 0.10;
    game.dna.values.aggression = 0.05;
  } else if (i % 180 === 120) {
    game.dna.values.harmony = 0.05;
    game.dna.values.contemplation = 0.10;
    game.dna.values.curiosity = 0.92;
    game.dna.values.chaos = 0.20;
    game.dna.values.aggression = 0.05;
  } else if (i % 180 === 0) {
    game.dna.values.harmony = 0.05;
    game.dna.values.contemplation = 0.10;
    game.dna.values.curiosity = 0.10;
    game.dna.values.aggression = 0.92;
    game.dna.values.chaos = 0.20;
  }
  G.ReleaseSystems.observe(1, game);
  // The RC probe exercises ReleaseSystems directly rather than the full
  // Director/engine loop, so invoke the companion V4 history observer too.
  // This mirrors the browser path without changing product behavior.
  if (G.V4History && G.V4History.observe) G.V4History.observe(game);
}
p = G.ReleaseSystems.profile();
ok(p.act >= 3, "third act reached");
ok(p.places.length === 8, "place history remains bounded");
ok(p.beings.length === 6, "being history remains bounded");
ok(p.events.length <= 32 && p.causes.length <= 96, "causal/event history is bounded");
ok(p.rare.length >= 3, "rare personal events emerge from life signals");
const h = G.V4History.profile();
const historicalPlaces = Object.keys(h.visits).filter(k => h.visits[k] > 0);
ok(historicalPlaces.length >= 3, "at least three places accumulate return history");
ok(h.returnCount >= 3, "place returns accumulate across observations");
ok(h.consequences.length >= 2, "second-act consequences are recorded");
ok(Object.keys(h.routeCounts).length >= 2, "contrasting route traces remain distinguishable");
G.ReleaseSystems.recordAction("harm", "player", "scar", { severity: 2 }, game);
G.ReleaseSystems.recordAction("care", "player", "root", { severity: 2 }, game);
p = G.ReleaseSystems.profile();
ok(p.causes.some(c => c.type === "harm") && p.causes.some(c => c.type === "care"), "actions carry provenance");
ok(p.events.some(e => e.causeId), "events reference causeId");
G.ReleaseSystems.chooseFinale("release", game);
G.ReleaseSystems.chooseFinale("become", game);
p = G.ReleaseSystems.profile();
ok(new Set(p.finals.map(f => f.choice)).size >= 2, "release and become produce distinct final traces");
ok(p.nextLife.generation >= 2, "next-life generation persists");
ok(p.nextLife.inherited.length >= 3, "next life inherits causal state");
G.ReleaseSystems.migrate({ version: 0, world: { discovered: 2 }, dna: { age: 100 } });
p = G.ReleaseSystems.profile();
ok(p.body.habits.length > 0, "legacy save migration envelope works");
const valid = G.ReleaseSystems.validate();
ok(valid.bounded && valid.serializable && valid.causal, "state validates and serializes");
ok(valid.places && valid.beings && valid.acts && valid.rare, "RC quantitative content gate is satisfied");
ok(valid.ready, "release systems reach the quantitative RC-ready state");
console.log("RELEASE CANDIDATE GATE READY");
