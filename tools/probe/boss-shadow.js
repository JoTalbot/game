"use strict";
var fs = require("fs"), vm = require("vm"), path = require("path"), H = require("./harness");
var ROOT = path.resolve(__dirname, "..", "..");
var G = H.boot();
vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", "js", "boss-shadow.js"), "utf8"), { filename: "boss-shadow.js" });
var pass = 0, fail = 0;
function ok(c, s, d) { if (c) { pass++; console.log("  ✓ " + s + (d ? "  (" + d + ")" : "")); } else { fail++; console.log("  ✗ " + s + (d ? "  (" + d + ")" : "")); } }
function clean() {
  G.Save.set("igra.boss-shadow.v1", JSON.stringify({ version: 1, encounters: 0, defeats: 0, escapes: 0, intensity: 0, fear: 0, debt: 0, nameKey: null, trait: "aggression", traces: [], lastLife: 0, lastOutcome: "" }));
  G.BossShadow.resetCache();
}
console.log("\n— V3-013: босс как долгосрочная тень");
clean();
var game = H.makeWorld(G, 13013);
game.world.boss = { x: 90, y: 0, r: 28, hp: 1, maxHp: 1, nameKey: 2, phase: 0, lunge: 0, stun: 0, weak: 0 };
G.BossShadow.observe(game);
ok(G.BossShadow.profile().encounters === 1, "встреча попадает в долгую память");
var boss = game.world.boss;
G.BossShadow.onOutcome(game, boss, "defeat");
var p = G.BossShadow.profile();
ok(p.defeats === 1 && p.escapes === 0 && p.lastOutcome === "defeat", "победа записывается отдельным исходом");
ok(p.traces.length === 1 && p.traces[0].outcome === "defeat", "победа оставляет физический след");

var mature = H.makeWorld(G, 13014);
mature.world.meta = 1;
G.BossShadow.apply(mature);
var shadowNodes = mature.world.nodes.filter(function (n) { return n && n.shadow; });
ok(shadowNodes.length === 1, "след возвращается на зрелом берегу");
G.BossShadow.apply(mature);
ok(mature.world.nodes.filter(function (n) { return n && n.shadow; }).length === 1, "след идемпотентен и не размножается");

clean();
game = H.makeWorld(G, 13015);
game.world.boss = { x: 90, y: 0, r: 28, hp: 10, maxHp: 10, nameKey: 1, phase: 0, lunge: 0, stun: 0, weak: 0 };
G.BossShadow.observe(game);
G.Organs.updateBoss(game, 51);
p = G.BossShadow.profile();
ok(p.escapes === 1 && p.defeats === 0 && p.lastOutcome === "escape", "уход босса не выдаётся за победу");
ok(p.traces.length === 1 && p.traces[0].outcome === "escape", "уход тоже оставляет след");

G.BossShadow.resetCache();
p = G.BossShadow.profile();
ok(p.escapes === 1 && p.traces.length === 1, "тень переживает сброс кэша");
ok(JSON.stringify(p).length < 5000, "долгая память босса остаётся компактной");
console.log("Итого: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
