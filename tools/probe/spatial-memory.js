"use strict";
var fs = require("fs"), vm = require("vm"), path = require("path"), H = require("./harness");
var ROOT = path.resolve(__dirname, "..", "..");
var G = H.boot();
vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", "js", "spatial-memory.js"), "utf8"), { filename: "spatial-memory.js" });
var pass = 0, fail = 0;
function ok(c, s, d) { if (c) { pass++; console.log("  ✓ " + s + (d ? "  (" + d + ")" : "")); } else { fail++; console.log("  ✗ " + s + (d ? "  (" + d + ")" : "")); } }
function clean() {
  G.Save.set("igra.spatial-memory.v1", JSON.stringify({ version: 1, visits: 0, returns: 0, places: [], last: null }));
  G.SpatialMemory.resetCache();
}
console.log("\n— V3-014: пространственная память");
clean();
var game = H.makeWorld(G, 14014);
var node = game.world.nodes[0];
node.state = "alive"; node.roots = 0.8; node.care = 1;
game.player.x = node.x; game.player.y = node.y;
G.SpatialMemory.remember(game, "chosen");
var p = G.SpatialMemory.profile();
ok(p.places.length === 1, "значимое место получает пространственный отпечаток");
ok(Math.abs(p.places[0].x) <= 1 && Math.abs(p.places[0].y) <= 1, "координаты нормализованы относительно берега");
var first = { x: p.places[0].x, y: p.places[0].y };
game.player.x = first.x * game.world.bounds; game.player.y = first.y * game.world.bounds;
G.SpatialMemory.remember(game, "returned");
p = G.SpatialMemory.profile();
ok(p.places.length === 1 && p.returns >= 1 && p.places[0].visits >= 2, "возвращение узнаёт то же место, а не создаёт дубль");
var restored = H.makeWorld(G, 14015);
G.SpatialMemory.restore(restored);
var remembered = restored.world.nodes.filter(function (n) { return n && n.spatialMemory; });
ok(remembered.length === 1, "пространственный след возвращается на новом берегу");
ok(remembered[0] && remembered[0].spatialVisits >= 2 && remembered[0].memoryOf === node.kind, "след несёт историю посещений и породу места");
for (var i = 0; i < 30; i++) {
  game.player.x = (i * 137) % 1200 - 600;
  game.player.y = (i * 191) % 1200 - 600;
  var near = game.world.spawnNode(game.player.x, game.player.y, "still");
  near.state = "alive"; near.roots = 0.9; near.care = 1;
  G.SpatialMemory.remember(game, "passed");
}
p = G.SpatialMemory.profile();
ok(p.places.length <= 16, "пространственная память имеет жёсткий потолок", p.places.length + "/16");
G.SpatialMemory.resetCache();
ok(G.SpatialMemory.profile().places.length === p.places.length, "пространственный паспорт переживает перезагрузку");
console.log("Итого: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
