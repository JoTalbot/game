"use strict";
var fs = require("fs"), vm = require("vm"), path = require("path"), H = require("./harness");
var ROOT = path.resolve(__dirname, "..", "..");
var G = H.boot();
["life.js", "relationships.js", "world-memory.js", "trajectory.js", "act.js"].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", "js", f), "utf8"), { filename: f });
});
var pass = 0, fail = 0;
function ok(c, s) { if (c) { pass++; console.log("  ✓ " + s); } else { fail++; console.log("  ✗ " + s); } }
function step(game) { G.Act.observe(1, game); }
console.log("\n— V3-006: первый акт 30–90 минут");
G.Save.set("igra.act.v1", JSON.stringify({ version: 1, phase: 0, turns: 0, seen: [], last: "", complete: false }));
G.Life.resetCache(); G.Relationships.resetCache(); G.WorldMemory.resetCache(); G.Trajectory.resetCache(); G.Act.resetCache();
var game = H.makeWorld(G, 6601);
game.dna.age = 55; G.Life.arc().initialized = true; G.Life.arc().behavior = { born: 0, returns: 0, pulses: 0, still: 0, motion: 0 };
step(game); ok(G.Act.profile().phase === 1, "акт начинается из естественного взросления");
var before = G.Act.profile().turns; step(game); ok(G.Act.profile().turns > before, "акт наблюдает длительность без таймера-квеста");
game.world.beings[0].bond = 0.7; step(game); ok(G.Act.profile().phase >= 2, "связь переводит акт в следующий перелом");
G.Life.arc().behavior.returns = 3; step(game); ok(G.Act.profile().phase >= 3, "возвращение становится физическим следом");
G.Life.arc().skins = 2; G.Life.arc().behavior.returns = 7; step(game); ok(G.Act.profile().phase >= 4, "новая кожа продолжает историю");
G.Life.arc().skins = 3; G.WorldMemory.remember(game, game.world.nodes[0], "chosen"); step(game); ok(G.Act.profile().phase === 5 && G.Act.profile().complete, "первый круг завершается без финального экрана");
var saved = G.Act.profile(); G.Act.resetCache(); ok(G.Act.profile().phase === saved.phase && G.Act.profile().complete === saved.complete, "состояние акта переживает перезагрузку");
ok(G.Act.profile().seen.length >= 5, "переломы не повторяются бесконечно");
console.log("\nИтого: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
