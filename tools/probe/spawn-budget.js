"use strict";
var fs = require("fs");
var src = fs.readFileSync("web/js/v3-spawn-budget.js", "utf8");
var index = fs.readFileSync("web/index.html", "utf8");
var sw = fs.readFileSync("web/sw.js", "utf8");
function ok(cond, what) {
  if (!cond) throw new Error("spawn-budget probe failed: " + what);
  console.log("  ✓ " + what);
}
ok(index.indexOf("js/v3-spawn-budget.js") >= 0, "patch загружается в игре");
ok(sw.indexOf("./js/v3-spawn-budget.js") >= 0, "patch входит в offline shell");
ok(src.indexOf("__v3037SpawnBudget") >= 0, "патч защищён от двойной установки");
ok(src.indexOf("live >= 18") >= 0 && src.indexOf("allowed = 0") >= 0, "при высокой плотности burst полностью останавливается");
ok(src.indexOf("live >= 14") >= 0 && src.indexOf("Math.min(allowed, 1)") >= 0, "на высокой плотности остаётся максимум одно рождение за burst");
ok(src.indexOf("live >= 10") >= 0 && src.indexOf("Math.min(allowed, 2)") >= 0, "на средней плотности остаётся максимум два рождения за burst");
ok(src.indexOf("World.prototype.spawnNode") < 0, "прямые сюжетные spawnNode не перехватываются");
console.log("spawn-budget probe: PASS");
