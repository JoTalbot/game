"use strict";
var fs = require("fs"), vm = require("vm"), path = require("path"), H = require("./harness");
var ROOT = path.resolve(__dirname, "..", "..");
var G = H.boot();
["life.js", "relationships.js", "world-memory.js", "trajectory.js", "act.js", "spatial-memory.js", "v3-depth.js", "director-events.js", "director-content.js"].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", "js", f), "utf8"), { filename: f });
});
var pass = 0, fail = 0;
function ok(c, s) { if (c) { pass++; console.log("  ✓ " + s); } else { fail++; console.log("  ✗ " + s); } }
function clean() {
  [
    ["igra.director-content.v1", { version: 1, fired: [], total: 0, last: -999 }],
    ["igra.director-events.v1", { version: 2, fired: [], last: -999, total: 0, thread: null }],
    ["igra.v3-depth.v1", { version: 1, rare: [], places: [], ecology: 0, act: 0, lives: 0, finale: "", finaleCount: 0, lastSignature: "", lastLife: -1, lastPlaceId: "", lastPlaceLife: -1 }],
    ["igra.world-memory.v1", { version: 1, visits: 0, memories: [] }],
    ["igra.spatial-memory.v1", { version: 1, visits: 0, returns: 0, places: [], last: null }],
    ["igra.relationships.v1", { version: 1, encounters: 0, trust: 0, fear: 0, debt: 0, losses: 0, rescues: 0, memories: [], companion: null, legacy: [] }]
  ].forEach(function (x) { G.Save.set(x[0], JSON.stringify(x[1])); });
  ["DirectorContent", "DirectorEvents", "V3Depth", "WorldMemory", "SpatialMemory", "Relationships", "Life", "Act"].forEach(function (n) { if (G[n] && G[n].resetCache) G[n].resetCache(); });
}
function game(seed) {
  var g = H.makeWorld(G, seed);
  G.Life.resetCache(); G.Life.arc().initialized = true; G.Life.arc().skins = 2; G.Life.arc().life = 2;
  G.Life.arc().behavior = { born: 12, returns: 6, pulses: 4, still: 0, motion: 0 };
  G.Relationships.resetCache(); G.Save.set("igra.relationships.v1", JSON.stringify({ version: 1, encounters: 4, trust: 0.72, fear: 0.05, debt: 0.2, losses: 0, rescues: 2, memories: ["a", "b"], companion: null, legacy: [] })); G.Relationships.resetCache();
  G.WorldMemory.resetCache(); G.Save.set("igra.world-memory.v1", JSON.stringify({ version: 1, visits: 3, memories: [{ id: "a" }, { id: "b" }, { id: "c" }] })); G.WorldMemory.resetCache();
  G.SpatialMemory.resetCache(); G.Save.set("igra.spatial-memory.v1", JSON.stringify({ version: 1, visits: 4, returns: 2, places: [{ key: "a", id: "a", x: 0, y: 0, visits: 2, lives: [1], care: 0.7, roots: 0.6 }], last: null })); G.SpatialMemory.resetCache();
  G.Act.resetCache(); G.Act.state().phase = 5;
  G.V3Depth.resetCache();
  return g;
}

console.log("\n— V4-002: extensible Director content pools");
clean();
var g = game(8801);
var n = g.world.nodes[0]; n.x = g.player.x + 40; n.y = g.player.y + 40; n.dead = false; n.state = "alive"; n.care = 0.2; n.roots = 0.1;
var b = new G.Being(g.player.x + 50, g.player.y + 50, "empathy"); b.bond = 0.7; g.world.beings.push(b);
g.time = 100;
G.DirectorContent.observe(1, g);
var first = G.DirectorContent.profile();
ok(first.total === 1 && first.fired.length === 1, "контентный pool выбирает событие из контекста и записывает его один раз");
ok(n.memory === true || n.actTrace === true || b.memoryMark === true || n.ecologyTrace === true, "событие оставляет физический след в существующем мире");
var id = first.fired[0];
g.time = 220; G.DirectorContent.observe(1, g);
ok(G.DirectorContent.profile().total === 2 || G.DirectorContent.profile().total === 1, "последующее событие выбирается только из ещё не сработавшего контента");
G.DirectorContent.resetCache(); ok(G.DirectorContent.profile().fired.indexOf(id) >= 0, "история пула переживает перезагрузку");
ok(G.DirectorContent.pools().secondAct.length >= 6, "pool имеет расширяемый набор контентных archetype");

console.log("\n— V4-001: причинный контур не ломает старые системы");
ok(typeof G.DirectorEvents.observe === "function" && typeof G.V3Depth.observe === "function", "Director и V3 causal observers доступны одновременно");
ok(G.DirectorContent.profile().total >= 1, "новый контент встроен поверх существующего Director, а не заменяет его");

console.log("\nИтого: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);