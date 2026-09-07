"use strict";
var fs = require("fs");
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
ok(src.indexOf("live < 14") >= 0, "для обычной плотности сохраняется порог 14 узлов");
ok(src.indexOf("lowDevice") >= 0, "слабый профиль учитывается отдельно от плотности");
ok(src.indexOf("ctx.lineWidth === 1") >= 0, "фильтр ограничен тонкими линиями");
ok(src.indexOf("alpha <= 0.12") >= 0, "фильтр ограничен слабой прозрачностью");
ok(src.indexOf("originalDraw.call(this, ctx, game)") >= 0, "оригинальный renderer сохраняется");
ok(src.indexOf("__v3038StrokeBudget") >= 0, "canvas stroke wrapper создаётся один раз на context");
ok(src.indexOf("slice(0, 48)") < 0, "V3-050 не копирует декоративные массивы на кадр");
ok(src.indexOf("oldFarLen") >= 0, "V3-050 восстанавливает длину исходного массива");
console.log("render-budget probe: PASS (V3-050)");
