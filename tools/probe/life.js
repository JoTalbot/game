// Узкий стенд v3-001: проверяет, что жизненная дуга действительно
// переживает сессии, не наследует ложные десятки кож со старого сейва и
// оставляет физический след после нескольких метаморфоз.
"use strict";
var fs = require("fs");
var vm = require("vm");
var path = require("path");
var H = require("./harness");

var ROOT = path.resolve(__dirname, "..", "..");
var G = H.boot();

// В обычном браузере life.js загружается сразу после Director. Здесь
// подключаем его поверх существующего стенда, не меняя старый набор проб.
vm.runInThisContext(
  fs.readFileSync(path.join(ROOT, "web", "js", "life.js"), "utf8"),
  { filename: "life.js" }
);

var pass = 0;
var fail = 0;
function ok(cond, what, detail) {
  if (cond) {
    pass++;
    console.log("  ✓ " + what + (detail ? "  (" + detail + ")" : ""));
  } else {
    fail++;
    console.log("  ✗ " + what + (detail ? "  (" + detail + ")" : ""));
  }
}

console.log("\n— жизненная дуга: persistent v3-001");
G.Life.resetCache();
var game = H.makeWorld(G, 9001);
G.Life.observe(1 / 60, game);
var baseMeta = game.world.meta || 0;

ok(G.Life.arc().initialized === true, "первая встреча создаёт baseline");
ok(G.Life.arc().skins === 0, "baseline не начисляет старые кожи");

// Одна смена кожи: meta растёт, а кожа запоминается.
game.world.meta = baseMeta + 1;
G.Life.observe(1 / 60, game);
ok(G.Life.arc().skins === 1, "первая новая кожа запоминается");

// Вторая кожа включает legacy и создаёт физическую память в берегу.
game.world.meta = baseMeta + 2;
G.Life.observe(1 / 60, game);
ok(G.Life.arc().skins === 2, "вторая кожа запоминается");
ok(G.Life.arc().legacy === true, "после двух кож появляется legacy");
ok(game.world.nodes.some(function (n) { return n.memory && n.state === "alive"; }), "прошлая кожа получает физический след");

// Третья кожа пересекает порог длинной дуги.
game.world.meta = baseMeta + 3;
G.Life.observe(1 / 60, game);
ok(G.Life.arc().skins === 3, "третья кожа запоминается");
ok(G.Life.arc().threshold === true, "после трёх кож достигается threshold");

// Повторное наблюдение не удваивает ничего.
var before = G.Life.summary();
G.Life.observe(1 / 60, game);
var after = G.Life.summary();
ok(JSON.stringify(before) === JSON.stringify(after), "повторный кадр идемпотентен");

// Сбрасываем кэш: данные должны прийти из того же Save.
G.Life.resetCache();
var loaded = G.Life.summary();
ok(loaded.skins === 3 && loaded.legacy && loaded.threshold, "дуга переживает сброс памяти модуля");

// Старый сейв без life.v1 и зрелый meta не должен мгновенно подарить
// человеку десятки веток прогресса.
G.Save.set("igra.life.v1", JSON.stringify({ skins: 0, lastMeta: 0, lastAge: 0 }));
G.Life.resetCache();
var oldGame = H.makeWorld(G, 9002);
oldGame.world.meta = 25;
oldGame.dna.age = 40;
G.Life.observe(1 / 60, oldGame);
ok(G.Life.arc().skins === 0, "старый зрелый сейв получает baseline, а не 25 кож");
ok(G.Life.arc().initialized === true, "старый сейв помечается инициализированным");

console.log("\nИтого: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
