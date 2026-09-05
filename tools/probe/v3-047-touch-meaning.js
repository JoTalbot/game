"use strict";
var H = require("./harness");
var fs = require("fs");
var vm = require("vm");
var path = require("path");
var G = H.boot();

// V3-047 is an integration patch. The normal browser shell has these layers
// before it, while the lightweight probe harness intentionally loads fewer
// files. Load only the two real dependencies needed by the patch, then the
// patch itself. Otherwise the probe would test the harness ordering instead
// of the game, which is a charmingly human way to manufacture a false bug.
["spatial-memory", "v3-047-touch-meaning"].forEach(function (name) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, "../../web/js/" + name + ".js"), "utf8"), { filename: name + ".js" });
});

function ok(cond, msg) {
  if (!cond) { console.error("✗ " + msg); process.exitCode = 1; }
  else console.log("✓ " + msg);
}

ok(G.TouchMeaning && G.TouchMeaning.version === "3.0.1-v3047", "V3-047 модуль загружается");
ok(G.TouchMeaning.target === 104 && G.TouchMeaning.min === 84, "touch target имеет безопасный запас");
ok(G.Game && G.Game.prototype.__v3047TargetPatch === true, "расширенный tap-target подключён к onDown");
ok(G.Renderer && G.Renderer.__v3047MeaningPatch === true, "возвращение получает визуальный ripple");
ok(G.SpatialMemory && G.SpatialMemory.__v3047MeaningPatch === true, "сигнал возвращения подключён к памяти");

var game = H.makeWorld(G, 47047);
var node = game.world.nodes.filter(function (n) { return n && n.state === "alive" && !n.dead; })[0];
if (node) {
  game.player.x = node.x;
  game.player.y = node.y;
  game.input.wx = node.x;
  game.input.wy = node.y;
  game.input.x = 10;
  game.input.y = 10;
  game.input.gsx = 10;
  game.input.gsy = 10;
  game.state = "play";
  ok(!!G.TouchMeaning.target && G.TouchMeaning.target > 76, "малые цели получают больше пальцевого запаса");
}
console.log("V3-047 probe завершён");
