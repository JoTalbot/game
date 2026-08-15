// Проверки души без браузера. Запуск: node tools/probe/run.js
// Не тесты ради тестов: каждая проверка сторожит то, что уже ломалось.
"use strict";
var H = require("./harness");

var pass = 0;
var fail = 0;
var current = "";

function group(name) {
  current = name;
  console.log("\n— " + name);
}

function ok(cond, what, detail) {
  if (cond) {
    pass++;
    console.log("  ✓ " + what + (detail ? "  (" + detail + ")" : ""));
  } else {
    fail++;
    console.log("  ✗ " + what + (detail ? "  (" + detail + ")" : ""));
  }
}

var G = H.boot();

// ——— зов ———
group("зов: путь всегда есть");
(function () {
  var game = H.makeWorld(G, 12345);
  var arrivals = 0;
  var sawCompass = false;
  for (var i = 0; i < 60 * 240; i++) {
    var tgt = game.world.call;
    H.step(G, game, 1 / 60, tgt, tgt ? 85 : 0);
    if (game.world.arrived > arrivals) arrivals = game.world.arrived;
    if (tgt && Math.hypot(tgt.x - game.player.x, tgt.y - game.player.y) > 500) sawCompass = true;
  }
  ok(arrivals >= 3, "зов зовёт снова и снова", arrivals + " дорог за 4 минуты");
  ok(sawCompass, "зов рождается далеко — нужен компас");
  ok(game.world.nodes.length > 12, "приход растит мир", game.world.nodes.length + " узлов");
})();

group("зов: язык и сейв");
(function () {
  var game = H.makeWorld(G, 7);
  game.world.makeCall(game.player, game.dna);
  G.Lang.id = "en";
  var en = G.callText("chaos");
  G.Lang.id = "ru";
  var ru = G.callText("chaos");
  ok(en !== ru && /[a-z]/.test(en) && /[а-я]/.test(ru), "зов говорит на двух языках", ru + " / " + en);
  var json = JSON.parse(JSON.stringify(game.world.toJSON()));
  ok(json.call && json.callT != null && json.arrived != null, "зов переживает выход");
  ok(json.call.text === undefined, "текст зова не заморожен в сейве (иначе язык не переключится)");
})();

// ——— спутник ———
group("спутник: преданное существо идёт следом");
(function () {
  function walk(bond, temper) {
    var game = H.makeWorld(G, 5);
    game.world.beings = [];
    var b = new G.Being(0, 0, "empathy");
    b.bond = bond;
    b.fear = 0.1;
    b.temper = temper;
    game.world.beings.push(b);
    var worst = 0;
    for (var i = 0; i < 60 * 30; i++) {
      H.step(G, game, 1 / 60, { x: game.player.x + 1000, y: game.player.y }, 85);
      var d = Math.hypot(game.player.x - b.x, game.player.y - b.y);
      if (i > 120 && d > worst) worst = d;
    }
    return worst;
  }
  var loyal = walk(0.9, "shy");
  var shyLoyal = walk(0.7, "curious");
  var stranger = walk(0.3, "shy");
  ok(loyal < 200, "преданный не отстаёт", "худшее расстояние " + loyal.toFixed(0));
  ok(shyLoyal < 200, "преданность сильнее характера", "худшее " + shyLoyal.toFixed(0));
  ok(stranger > 800, "непривязанный остаётся собой", "ушёл на " + stranger.toFixed(0));
})();

// ——— память ———
group("память: что человек вырастил, не должно стираться");
(function () {
  var game = H.makeWorld(G, 3);
  var w = game.world;
  G.Organs.plantBloom(w, 10, 10, "пауза имеет форму");
  w.laws.push({ id: "moreAnchors", ru: "якорей больше", t: 5 });
  w.anchorCap = 6;
  var b = new G.Being(20, 20, "empathy");
  b.temper = "singer";
  b.trueName = "Шёпот";
  b.named = true;
  b.bond = 0.9;
  b.debt = 2;
  w.beings.push(b);
  var d = JSON.parse(JSON.stringify(w.toJSON()));

  // повторяем то, что делает Game.load
  var w2 = new G.World(3);
  w2.beings = [];
  (d.beings || []).forEach(function (sb) {
    var nb = new G.Being(sb.x, sb.y, sb.hue);
    nb.bond = sb.bond || 0;
    if (sb.temper) nb.temper = sb.temper;
    if (sb.trueName) nb.trueName = sb.trueName;
    nb.named = !!sb.named;
    nb.debt = sb.debt || 0;
    w2.beings.push(nb);
  });
  w2.blooms = d.blooms || [];
  w2.laws = d.laws || [];
  w2.anchorCap = d.anchorCap || 3;

  ok(w2.blooms.length === 1 && w2.blooms[0].verse === "пауза имеет форму", "сад помнит стихи");
  ok(w2.laws.length === 1, "законы (молнии) помнятся");
  ok(w2.anchorCap === 6, "расширенный предел якорей помнится");
  var r = w2.beings[0];
  ok(r.temper === "singer" && r.trueName === "Шёпот" && r.named, "существо возвращается собой, а не чужим");
  ok(r.debt === 2, "долг существа помнится");
})();

// ——— рендер ———
group("рендер: закон холста и зов на экране");
(function () {
  var game = H.makeWorld(G, 9);
  var ctx = H.ctxStub();
  game.world.makeCall(game.player, game.dna);
  G.Renderer.draw(ctx, game);
  var setT = ctx.calls.indexOf("setTransform") >= 0;
  ok(setT, "кадр начинается с матрицы плотности");
  ok(ctx.calls.length > 50, "кадр действительно рисуется", ctx.calls.length + " операций");

  // зов за спиной → компас
  var c = game.world.call;
  c.x = game.player.x + 5000;
  c.y = game.player.y;
  var ctx2 = H.ctxStub();
  G.Renderer.drawCall(ctx2, game.cam, game, 1.5);
  ok(ctx2.calls.indexOf("rotate") >= 0, "далёкий зов рисует стрелку-компас");

  // зов перед глазами → маяк с подписью
  c.x = game.player.x + 40;
  c.y = game.player.y + 20;
  var ctx3 = H.ctxStub();
  G.Renderer.drawCall(ctx3, game.cam, game, 1.5);
  ok(ctx3.calls.indexOf("fillText") >= 0, "близкий зов говорит словом");
})();

// ——— тишина ———
group("голос: Игра не тараторит");
(function () {
  var said = [];
  var realSay = G.Voice.sayText;
  G.Voice.sayText = function (t) {
    said.push(t);
    return realSay.apply(G.Voice, arguments);
  };
  var game = H.makeWorld(G, 21);
  for (var i = 0; i < 60 * 120; i++) {
    var tgt = game.world.call;
    H.step(G, game, 1 / 60, tgt, tgt ? 85 : 0);
  }
  G.Voice.sayText = realSay;
  ok(said.length < 30, "за две минуты Игра говорит редко", said.length + " реплик");
})();

console.log("\n" + (fail ? "✗ " : "✓ ") + pass + " прошло, " + fail + " упало\n");
process.exit(fail ? 1 : 0);
