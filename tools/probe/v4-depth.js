"use strict";
var fs = require("fs"), vm = require("vm"), path = require("path"), H = require("./harness");
var ROOT = path.resolve(__dirname, "..", "..");
var G = H.boot();
[
  "life.js", "relationships.js", "world-memory.js", "trajectory.js", "release-systems.js",
  "v6-body.js", "v8-lineage.js", "v4-history-routes.js", "v4-beings.js", "v4-second-act.js", "v4-depth.js"
].forEach(function (f) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", "js", f), "utf8"), { filename: f }); });
var pass = 0, fail = 0;
function ok(c, s) { if (c) { pass++; console.log("  ✓ " + s); } else { fail++; console.log("  ✗ " + s); } }
function step(game, n) { for (var i = 0; i < n; i++) { G.V4SecondAct.observe(1, game); G.V4Depth.observe(1, game); } }
var game = H.makeWorld(G, 8801);
G.Life.arc().initialized = true;
G.Life.arc().behavior = {born:4,returns:5,pulses:4,still:6,motion:3};
game.world.beings = [{x:game.player.x,y:game.player.y,dead:false,bond:0.9,v4Id:"depth-witness"}];
game.world.nodes.forEach(function (n) { n.x=game.player.x; n.y=game.player.y; n.care=0.9; });
G.V4SecondAct.reset();
G.V4Depth.reset();
step(game, 180);
var p = G.V4Depth.profile();
ok(p.version === 1, "V4.3 depth layer имеет собственную версию схемы");
ok(p.beats.length >= 1, "накопленная память порождает world-beat");
ok(p.beats.every(function (b) { return b.id && b.route && b.place && b.generation >= 0; }), "каждый beat содержит маршрут, место и поколение");
ok(p.beats[0].cause || p.beats[0].place, "beat сохраняет причинный след V4");
ok(game.player.v4DepthBeat === p.lastBeat && game.player.v4DepthRoute === p.lastRoute, "beat доходит до живого тела игрока");
ok(game.world.nodes.some(function (n) { return n.v4DepthBeat === p.lastBeat && n.v4DepthRoute === p.lastRoute; }), "beat оставляет физический след в ближайшем мире");
var saved = JSON.parse(G.Save.get("igra.v4-depth.v1"));
ok(saved.version === 1 && saved.beats.length === p.beats.length, "depth state сохраняется между тиками");
var before = p.beats.length;
step(game, 45);
ok(G.V4Depth.profile().beats.length === before, "один и тот же cadence не создаёт дубликаты beat");
console.log("\nИтого: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
