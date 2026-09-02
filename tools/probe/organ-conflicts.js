"use strict";
var fs = require("fs"), vm = require("vm"), path = require("path"), H = require("./harness");
var ROOT = path.resolve(__dirname, "..", "..");
var G = H.boot();
vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", "js", "organ-conflicts.js"), "utf8"), { filename: "organ-conflicts.js" });
var pass = 0, fail = 0;
function ok(c, s) { if (c) { pass++; console.log("  ✓ " + s); } else { fail++; console.log("  ✗ " + s); } }
function clean() {
  G.Save.set("igra.organ-conflicts.v1", JSON.stringify({ version: 1, seen: [], total: 0 }));
  G.OrganConflicts.resetCache();
}

console.log("\n— V3-011: конфликты между органами");
clean();
var game = H.makeWorld(G, 8111);
var p = game.player;
game.world.blooms = [{ id: "bloom-1", x: p.x + 40, y: p.y + 40, care: 0.8, roots: 0.2 }];
game.world.cracks = [{ id: "crack-1", x: p.x + 60, y: p.y + 40, dead: false, law: { id: "invert" } }];
G.OrganConflicts.observe(1, game);
var bloom = game.world.blooms[0];
var first = G.OrganConflicts.profile();
ok(bloom.conflict === "scar" && bloom.care < 0.8, "сад и трещина реально меняют друг друга");
ok(first.total === 1 && first.seen.length === 1, "конфликт фиксируется один раз");
G.OrganConflicts.observe(1, game);
ok(G.OrganConflicts.profile().total === 1, "повторный кадр не превращает конфликт в фарм");
G.OrganConflicts.resetCache();
ok(G.OrganConflicts.profile().total === 1, "след конфликта переживает перезагрузку");

clean();
game = H.makeWorld(G, 8112);
p = game.player;
game.world.beings = [
  { id: "a", x: p.x + 20, y: p.y + 20, dead: false, bond: 0.9, fear: 0, debt: 0, temper: "shy", memory: [] },
  { id: "b", x: p.x + 80, y: p.y + 20, dead: false, bond: 0.7, fear: 0, debt: 0, temper: "curious", memory: [] }
];
game.world.cracks = [{ id: "law-1", x: p.x + 30, y: p.y + 30, dead: false, law: { id: "woundsSing" } }];
G.OrganConflicts.observe(1, game);
var a = game.world.beings[0], b = game.world.beings[1];
ok(a.fear > 0 && a.debt > 0 && a.memory.length === 1, "связанный спутник получает след встречи с законом");
ok(a.memory[0].id === "woundsSing", "память спутника хранит конкретный закон");
ok(b.memory.length === 1 && b.memory[0].with === "shy", "два разных существа запоминают столкновение характеров");
ok(G.OrganConflicts.profile().total === 2, "два разных конфликта остаются разными следами");

console.log("\nИтого: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
