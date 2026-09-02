"use strict";
var fs = require("fs"), vm = require("vm"), path = require("path"), H = require("./harness");
var ROOT = path.resolve(__dirname, "..", "..");
var G = H.boot();
["life.js", "relationships.js", "world-memory.js", "trajectory.js", "act.js", "director-events.js"].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", "js", f), "utf8"), { filename: f });
});
var pass = 0, fail = 0;
function ok(c, s) { if (c) { pass++; console.log("  ✓ " + s); } else { fail++; console.log("  ✗ " + s); } }
function clean() {
  G.Save.set("igra.director-events.v1", JSON.stringify({ version: 1, fired: [], last: -999, total: 0 }));
  G.DirectorEvents.resetCache();
}
function step(game, t) { game.time = t; G.DirectorEvents.observe(1, game); }

console.log("\n— V3-010: Director Event System");
clean();
var game = H.makeWorld(G, 7710);
G.Life.resetCache(); G.Relationships.resetCache(); G.WorldMemory.resetCache(); G.Trajectory.resetCache(); G.Act.resetCache();
G.Life.arc().initialized = true;
G.Life.arc().skins = 1;
G.Life.arc().behavior = { born: 8, returns: 4, pulses: 0, still: 0, motion: 0 };
var rel = G.Relationships.profile(); rel.trust = 0.7;
var b = new G.Being(game.player.x + 80, game.player.y + 80, "empathy"); b.bond = 0.7; game.world.beings.push(b);
G.Act.state().phase = 3;
step(game, 100); step(game, 180);
var first = G.DirectorEvents.profile();
ok(first.total === 1 && first.fired.length === 1, "событие выбирается и записывается один раз");
var firedId = first.fired[0];
step(game, 190); ok(G.DirectorEvents.profile().total === 1, "кулдаун не превращает наблюдение в спам");
G.DirectorEvents.resetCache(); ok(G.DirectorEvents.profile().fired[0] === firedId, "состояние события переживает перезагрузку");

clean();
game = H.makeWorld(G, 7711); game.time = 10; game.player.stillT = 80;
game.dna.get = function (k) { return k === "contemplation" ? 0.7 : 0.2; };
var n = game.world.nodes[0]; n.x = game.player.x + 40; n.y = game.player.y + 40;
n.state = "alive"; n.dead = false; n.care = 0.2; n.roots = 0.1;
G.Life.resetCache(); G.Life.arc().initialized = true; G.Life.arc().behavior = { born: 0, returns: 0, pulses: 0, still: 0, motion: 0 };
step(game, 10); step(game, 90);
ok(n.quietMemory === true && n.care >= 0.96, "долгое внимание оставляет тихий физический след");

clean();
game = H.makeWorld(G, 7712); game.time = 10;
var oldGet = game.dna.get;
game.dna.get = function (k) { return k === "harmony" ? 0.8 : oldGet.call(game.dna, k); };
var tone = game.world.nodes[0]; tone.x = game.player.x + 40; tone.y = game.player.y + 40;
tone.kind = "tone"; tone.state = "alive"; tone.dead = false; tone.care = 0.2;
step(game, 10); step(game, 90);
ok(tone.weather === true && tone.care > 0.2, "гармония меняет существующий мир, а не создаёт меню события");

console.log("\nИтого: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
