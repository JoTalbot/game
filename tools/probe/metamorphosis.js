"use strict";
var fs = require("fs"), vm = require("vm"), path = require("path"), H = require("./harness");
var ROOT = path.resolve(__dirname, "..", "..");
var G = H.boot();
vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", "js", "metamorphosis.js"), "utf8"), { filename: "metamorphosis.js" });
var pass = 0, fail = 0;
function ok(c, s) { if (c) { pass++; console.log("  ✓ " + s); } else { fail++; console.log("  ✗ " + s); } }
function clean() {
  G.Save.set("igra.metamorphosis.v1", JSON.stringify({ version: 1, lives: 0, mutations: [], last: "", depth: 0 }));
  G.Metamorphosis.resetCache();
}

console.log("\n— V3-012: более глубокая метаморфоза");
clean();
var game = H.makeWorld(G, 9121);
game.world.meta = 1;
game.dna.get = function (k) { return k === "curiosity" ? 0.82 : (k === "harmony" ? 0.46 : 0.08); };
G.Metamorphosis.observe(game, game.dna);
var p = G.Metamorphosis.profile();
ok(p.lives === 1 && p.depth === 0 && p.mutations.length === 1, "первая кожа записывает собственный отпечаток");
var n = game.world.spawnNode(game.player.x + 20, game.player.y + 20, "spark");
G.Metamorphosis._wrapped = false;
G.Metamorphosis.install();
game.world.crystallize(n, { explore: 1, hit: 0, still: 0, soft: 0, wild: 0, rhythm: 0 }, game.dna);
ok(n.metamorphosis === true && n.metamorphosisLife === 1, "новая кожа получает физический наследуемый акцент");

clean();
game = H.makeWorld(G, 9122);
game.world.meta = 2;
game.dna.get = function (k) { return k === "harmony" ? 0.78 : (k === "empathy" ? 0.55 : 0.08); };
G.Metamorphosis.observe(game, game.dna);
p = G.Metamorphosis.profile();
ok(p.lives === 2 && p.depth === 1 && p.mutations[0].kinds.length >= 2, "вторая жизнь наследует второй слой природы");
var n2 = game.world.spawnNode(game.player.x + 40, game.player.y + 20, "spark");
game.world.crystallize(n2, { explore: 0, hit: 0, still: 0, soft: 0, wild: 0, rhythm: 1 }, game.dna);
ok(n2.metamorphosis === true && n2.metamorphosisTrait === "harmony", "наследование не заменяет породу, а меняет её глубину");

G.Metamorphosis.observe(game, game.dna);
ok(G.Metamorphosis.profile().mutations.length === 1, "повторный кадр не создаёт вторую мутацию");
G.Metamorphosis.resetCache();
ok(G.Metamorphosis.profile().lives === 2, "отпечаток метаморфозы переживает перезагрузку");

console.log("\nИтого: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
