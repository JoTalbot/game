"use strict";
var fs = require("fs");
var vm = require("vm");
var path = require("path");
var src = fs.readFileSync("web/js/v3-render-budget.js", "utf8");
var index = fs.readFileSync("web/index.html", "utf8");
var sw = fs.readFileSync("web/sw.js", "utf8");
function ok(cond, what) {
  if (!cond) throw new Error("render-budget probe failed: " + what);
  console.log("  ✓ " + what);
}
ok(index.indexOf("js/v3-render-budget.js") >= 0, "visual budget загружается после renderer");
ok(sw.indexOf("./js/v3-render-budget.js") >= 0, "visual budget входит в offline shell");
ok(src.indexOf("__v3038RenderBudget") >= 0, "патч защищён от двойной установки");
ok(src.indexOf("var live = 0") >= 0, "renderer считает живые узлы без изменения модели");
ok(src.indexOf("state === \"alive\"") >= 0, "порог плотности опирается на состояние живых узлов");
ok(src.indexOf("lowDevice") >= 0, "слабый профиль учитывается отдельно от плотности");
ok(src.indexOf("this.lineWidth === 1") >= 0, "фильтр ограничен тонкими линиями");
ok(src.indexOf("alpha <= 0.12") >= 0, "фильтр ограничен слабой прозрачностью");
ok(src.indexOf("originalDraw.call(this, ctx, game)") >= 0, "оригинальный renderer сохраняется");
ok(src.indexOf("__v3038StrokeBudget") >= 0, "canvas stroke wrapper создаётся один раз на context");
ok(src.indexOf("slice(0, 48)") < 0, "V3-050 не копирует декоративные массивы на кадр");
ok(src.indexOf("oldFarLen") >= 0, "V3-050 восстанавливает длину исходного массива");
ok(src.indexOf("oldStarsLen") >= 0, "V3-050 восстанавливает длину world.stars");
ok(src.indexOf("oldBloomsLen") >= 0, "V3-050 восстанавливает длину world.blooms");

// V3-052: regression for the physical `undefined.age` failure. The previous
// guard covered beings but World.update also dereferenced bloom entries.
var H = require("./harness");
var G = H.boot();
var cap = fs.readFileSync(path.join("web", "js", "v3-being-cap.js"), "utf8");
vm.runInThisContext(cap, { filename: "v3-being-cap.js" });
var game = H.makeWorld(G, 52052);
game.world.blooms = [null, undefined, { x: 1, y: 2 }, { x: 3, y: 4, age: NaN, phase: null }];
game.world.beings = [null, undefined, new G.Being(20, 20, "empathy")];
var updateErr = null;
try { H.step(G, game, 1 / 60, null, 0); } catch (e) { updateErr = e; }
ok(!updateErr, "malformed blooms do not crash World.update");
ok(game.world.blooms.length === 2 && game.world.blooms.every(function (b) { return b && Number.isFinite(b.age) && Number.isFinite(b.phase); }), "malformed bloom entries are removed and normalized");
var drawErr = null;
try { G.Renderer.draw(H.ctxStub(), game); } catch (e) { drawErr = e; }
ok(!drawErr, "malformed blooms do not crash Renderer.draw");

console.log("render-budget probe: PASS (V3-052)");
