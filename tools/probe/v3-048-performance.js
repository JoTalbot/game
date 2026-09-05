"use strict";
var H = require("./harness");
var fs = require("fs");
var vm = require("vm");
var path = require("path");
var G = H.boot();

function load(name) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, "../../web/js/" + name), "utf8"), { filename: name });
}
function ok(cond, msg) {
  if (!cond) { console.error("✗ " + msg); process.exitCode = 1; }
  else console.log("✓ " + msg);
}

load("v3-performance-guard.js");
load("v3-047-touch-meaning.js");
load("v3-048-performance-guard.js");

ok(G.Quality && G.Quality.__v3046 === true, "V3-046 guard активен");
ok(G.Quality && G.Quality.__v3048 === true, "V3-048 guard активен");
ok(G.TouchMeaning && G.TouchMeaning.target >= 104, "расширенный touch-target сохранён");
ok(G.Game && G.Game.prototype.__v3047TargetPatch === true, "tap-target patch сохранён");
ok(G.Renderer && G.Renderer.__v3047MeaningPatch === true, "return feedback сохранён");

var game = H.makeWorld(G, 48048);
ok(game && game.world && game.player, "игровой стенд создаётся");

console.log("V3-048 probe завершён");
