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

// ——— законы: молния должна быть понятной ———
group("законы: молния объясняет себя");
(function () {
  var game = H.makeWorld(G, 33);
  var w = game.world;

  // ставим трещину под ноги и трогаем её законом «тяжесть наоборот»
  G.Organs.spawnCrack(w, game.player.x + 10, game.player.y + 10);
  var crack = w.cracks[w.cracks.length - 1];
  crack.law = { id: "invert", ru: "тяжесть наоборот", hint: "шаг идёт в другую сторону", en: "weight inverted", enHint: "your step goes the other way", lasts: 11 };
  var said = [];
  var realSay = G.Voice.sayText;
  G.Voice.sayText = function (t) { said.push(t); return realSay.apply(G.Voice, arguments); };
  G.Organs.applyLaw(game, crack);
  G.Voice.sayText = realSay;

  ok(w.active && w.active.length === 1, "у временного закона есть срок");
  ok(w.active[0].left > 10, "срок начинается полным", w.active[0].left + " с");
  ok(said.join(" ").indexOf("тяжесть наоборот") >= 0, "закон называет себя вслух");

  // пока закон жив — его видно в кадре
  var ctx = H.ctxStub();
  G.Renderer.draw(ctx, game, 1.2);
  ok(ctx.calls.indexOf("fillRect") >= 0, "действующий закон рисуется на кромке");

  // время идёт — закон истекает и прощается
  var bye = [];
  var realSay2 = G.Voice.sayText;
  G.Voice.sayText = function (t) { bye.push(t); return realSay2.apply(G.Voice, arguments); };
  for (var i = 0; i < 60 * 14; i++) H.step(G, game, 1 / 60, null, 0);
  G.Voice.sayText = realSay2;
  ok(!w.active.length, "закон истекает сам");
  ok(bye.join(" ").indexOf("тяжесть вернулась") >= 0, "берег сообщает, что закон отпустил");
})();

// ——— закон переживает выход ———
group("законы: срок не сгорает при выходе");
(function () {
  var game = H.makeWorld(G, 35);
  G.Organs.spawnCrack(game.world, game.player.x + 6, game.player.y);
  var crack = game.world.cracks[game.world.cracks.length - 1];
  crack.law = { id: "invert", ru: "тяжесть наоборот", hint: "шаг наоборот", en: "weight inverted", enHint: "step inverted", lasts: 11 };
  G.Organs.applyLaw(game, crack);
  var raw = JSON.parse(JSON.stringify(game.world.toJSON()));
  ok(raw.active && raw.active.length === 1, "действующий закон попадает в сейв");
  ok(raw.invertMove > 0, "следствие закона тоже сохраняется", "invertMove=" + raw.invertMove.toFixed(1));
})();

// ——— законы говорят по-английски ———
group("законы: вторая раскладка");
(function () {
  var prev = G.Lang.id;
  G.Lang.id = "en";
  var game = H.makeWorld(G, 34);
  G.Organs.spawnCrack(game.world, game.player.x + 8, game.player.y);
  var crack = game.world.cracks[game.world.cracks.length - 1];
  crack.law = { id: "tideSleep", ru: "прилив спит", hint: "забвение не придёт", en: "the tide sleeps", enHint: "oblivion will not come for a while", lasts: 32 };
  var said = [];
  var realSay = G.Voice.sayText;
  G.Voice.sayText = function (t) { said.push(t); return realSay.apply(G.Voice, arguments); };
  G.Organs.applyLaw(game, crack);
  G.Voice.sayText = realSay;
  var all = said.join(" ");
  ok(all.indexOf("the tide sleeps") >= 0, "по-английски закон звучит по-английски");
  ok(!/[а-яА-Я]/.test(all), "кириллица не течёт в английский берег", all.slice(0, 40));
  ok(G.lawEnded("tideSleep").indexOf("tide") >= 0, "прощание закона тоже переведено");
  G.Lang.id = prev;
})();

// ——— английский берег без кириллицы ———
group("язык: обе раскладки полны");
(function () {
  var ru = G.UI_STR.ru;
  var en = G.UI_STR.en;
  var missing = [];
  for (var k in ru) {
    if (!Object.prototype.hasOwnProperty.call(ru, k)) continue;
    if (!en[k]) missing.push(k);
  }
  ok(!missing.length, "у каждого русского слова есть английское", missing.join(", "));

  var cyr = [];
  for (var k2 in en) {
    if (!Object.prototype.hasOwnProperty.call(en, k2)) continue;
    if (/[а-яА-Я]/.test(String(en[k2]))) cyr.push(k2);
  }
  ok(!cyr.length, "в английской раскладке нет кириллицы", cyr.join(", "));

  // голос: каждый ключ должен звучать на обоих языках
  var voiceKeys = G.Voice.keys ? G.Voice.keys() : [];
  var noEn = [];
  for (var vk = 0; vk < voiceKeys.length; vk++) {
    if (!G.LINES_EN[voiceKeys[vk]]) noEn.push(voiceKeys[vk]);
  }
  ok(!noEn.length, "у каждой реплики Игры есть английская", noEn.join(", "));

  var prev = G.Lang.id;
  G.Lang.id = "en";
  ok(!/[а-яА-Я]/.test(G.Memory.climateName()), "сезон переводится", G.Memory.climateName());
  ok(!/[а-яА-Я]/.test(G.Memory.climateHint()), "подсказка сезона переводится");
  ok(!/[а-яА-Я]/.test(G.Lang.t("skyLine")), "небо забвения переводится", G.Lang.t("skyLine"));
  G.Lang.id = prev;
})();

// ——— первая минута: то, что нельзя сломать ———
group("первая минута без туториала");
(function () {
  var game = H.makeWorld(G, 7);
  var said = [];
  var realSay = G.Voice._set;
  G.Voice._set = function (t) {
    said.push({ t: game.time, line: t });
    return realSay.apply(G.Voice, arguments);
  };

  // человек, не читавший подсказок: подошёл к мерцанию и задержал палец
  var firstGrown = 0;
  var grownCount = 0;
  for (var round = 0; round < 6 && game.time < 60; round++) {
    var n = H.nearestUnformed(game);
    if (!n) break;
    // дойти
    for (var i = 0; i < 60 * 6 && game.time < 60; i++) {
      if (Math.hypot(n.x - game.player.x, n.y - game.player.y) < 40) break;
      H.step(G, game, 1 / 60, n, 150);
    }
    if (H.gaze(G, game, n, 2.2, true)) {
      grownCount++;
      if (!firstGrown) firstGrown = game.time;
    }
  }
  G.Voice._set = realSay;

  ok(game.world.nodes.length > 4, "берегу есть что показать", game.world.nodes.length + " узлов");
  ok(grownCount > 0, "взгляд выращивает узел", grownCount + " за минуту");
  ok(firstGrown && firstGrown < 25, "первое рождение — в первые секунды", firstGrown ? firstGrown.toFixed(1) + " с" : "не случилось");
  ok(said.length < 14, "но Игра не заваливает словами", said.length + " реплик за минуту");
})();

// ——— долгая игра не топит сейв ———
group("долгая игра: сейв не пухнет");
(function () {
  var game = H.makeWorld(G, 11);
  var T = 1800; // полчаса
  while (game.time < T) {
    var n = H.nearestUnformed(game);
    if (!n) {
      for (var k = 0; k < 60 * 3; k++) H.step(G, game, 1 / 60, null, 0);
      continue;
    }
    for (var i = 0; i < 60 * 8 && game.time < T; i++) {
      if (Math.hypot(n.x - game.player.x, n.y - game.player.y) < 40) break;
      H.step(G, game, 1 / 60, n, 150);
    }
    H.gaze(G, game, n, 2.2, true);
  }
  var w = game.world;
  var kb = JSON.stringify(w.toJSON()).length / 1024;

  ok(w.stars.length <= 160, "звёзды забвения не копятся без предела", w.stars.length + " звёзд");
  ok(w.verses.length <= 60, "стихи не копятся без предела", w.verses.length + " строк");
  ok(kb < 45, "сейв за полчаса остаётся лёгким", kb.toFixed(1) + " КБ");
  ok(w.stars.length > 40, "но небо не пустеет — забвение видно", w.stars.length + " звёзд");

  // метаморфоза — из списка того, что нельзя сломать
  ok(game.metas > 0, "за полчаса игра хотя бы раз перерождается", game.metas + " раз");
  ok(game.state === "play", "после метаморфозы мир возвращается к игре", game.state);
  ok(w.nodes.length > 0 && game.player, "мир переживает перерождение", w.nodes.length + " узлов");
})();

// ——— якорь: самый дорогой жест не должен быть пустым ———
group("якорь переживает перерождение");
(function () {
  var game = H.makeWorld(G, 7);
  var w = game.world;
  for (var i = 0; i < 200; i++) H.step(G, game, 1 / 60, null, 0);
  w.nodes.filter(function (n) { return n.state === "unformed"; })
    .slice(0, 3).forEach(function (n) { H.gaze(G, game, n, 2.2, true); });
  w.nodes.filter(function (n) { return n.state === "alive"; })
    .slice(0, 3).forEach(function (n) { w.anchor(n); });
  var ids = w.anchors.slice();
  ok(ids.length > 0, "якорь вообще ставится", ids.length + " якорей");
  w.metamorphose(game.player, game.dna);
  var surv = w.nodes.filter(function (n) { return ids.indexOf(n.id) >= 0; });
  // birthShore обнуляет nodes: если позвать его после того, как удержанное
  // уже положено в nodes, якоря исчезают молча, а список anchors висит на
  // мёртвых id. Так и было — жест ничего не значил.
  ok(surv.length === ids.length, "удержанное переходит в новый мир",
    surv.length + " из " + ids.length);
  ok(w.anchors.length === surv.length, "список якорей не висит на мёртвых id",
    w.anchors.length + " якорей на " + surv.length + " узлов");
})();

// ——— забота должна что-то значить ———
group("прилив и забвение: возвращаться выгоднее, чем бросать");
(function () {
  var tend = 0, tendLive = 0, drop = 0, dropLive = 0, anyRoots = 0, anyLost = 0;
  // Садовник должен быть один и тот же в каждом прогоне. С Math.random()
  // его выбор менялся от запуска к запуску, и один и тот же баланс давал
  // то 14%, то 23% — стенд мерил шум и по нему нельзя было настраивать.
  var rndSeed = 20240815;
  function rnd() {
    rndSeed = (rndSeed * 1664525 + 1013904223) >>> 0;
    return rndSeed / 4294967296;
  }
  // Пять миров, а не два: на двух seed-ах итог скакал через порог от
  // случайной расстановки узлов, и один и тот же баланс то проходил,
  // то падал. Вывод о заботе должен быть про баланс, а не про везение.
  [11, 12, 13, 14, 15].forEach(function (seed) {
    var game = H.makeWorld(G, seed);
    var tended = {}, born = {};
    while (game.time < 600) {
      var n = null;
      var live = game.world.nodes.filter(function (x) { return x.state === "alive" && x.care < 0.5; });
      if (live.length && rnd() < 0.6) {
        var mine = live.filter(function (x) { return tended[x.id]; });
        var pool = mine.length && rnd() < 0.75 ? mine : live;
        n = pool[(rnd() * pool.length) | 0];
      }
      var back = !!n;
      if (!n) n = H.nearestUnformed(game);
      if (!n) { for (var k = 0; k < 180; k++) H.step(G, game, 1 / 60, null, 0); continue; }
      for (var i = 0; i < 480 && game.time < 600; i++) {
        if (Math.hypot(n.x - game.player.x, n.y - game.player.y) < 40) break;
        H.step(G, game, 1 / 60, n, 150);
      }
      if (back) {
        for (var j = 0; j < 90; j++) H.step(G, game, 1 / 60, null, 0);
        n.care = Math.min(1, n.care + 0.5);
        tended[n.id] = 1;
      } else if (H.gaze(G, game, n, 2.2, true)) born[n.id] = 1;
    }
    var alive = {};
    game.world.nodes.forEach(function (x) { if (x.state === "alive") alive[x.id] = 1; });
    var tk = Object.keys(tended);
    var bk = Object.keys(born).filter(function (id) { return !tended[id]; });
    tend += tk.length; tendLive += tk.filter(function (id) { return alive[id]; }).length;
    drop += bk.length; dropLive += bk.filter(function (id) { return alive[id]; }).length;
    anyRoots += game.world.nodes.filter(function (x) { return x.roots > 0; }).length;
    anyLost += game.world.lost;
  });
  var tp = Math.round((100 * tendLive) / tend);
  var dp = Math.round((100 * dropLive) / drop);
  ok(tp > dp + 15, "к чему возвращались — живёт дольше брошенного", tp + "% против " + dp + "%");
  ok(anyRoots > 0, "возвращение пускает корни", anyRoots + " укоренённых");
  ok(anyLost > 0, "но прилив по-прежнему забирает", anyLost + " забыто");
  ok(dp < 60, "брошенное не выживает само собой", dp + "% брошенного уцелело");
})();

// ——— фон ———
// Человек, играя с APK, сказал: «на фоне какой-то шум». Виноват был
// LFO дыхания сада: размах ±0.45 при уровне слоя 0.04 — модуляция
// вдесятеро громче того, что качает, то есть ровный гудящий тон
// поверх всей игры. На слух в песочнице это не поймать, поэтому
// сторожим числом: фон обязан быть тише гула, а пустой берег — молчать.
group("фон: тишина остаётся тишиной");
(function () {
  var A = require("./noise.js");
  var idle = A.measure(90, "idle");
  var full = A.measure(90, "gaze");

  ok(idle.gardenPeak < 0.001, "на пустом берегу сад молчит",
     "пик " + idle.gardenPeak.toFixed(4));
  ok(full.gardenAmp <= full.gardenBase, "дыхание тише того, что дышит",
     "±" + full.gardenAmp.toFixed(4) + " при уровне " + full.gardenBase.toFixed(4));
  ok(full.gardenPeak < full.drone, "фоновый слой не перекрикивает гул",
     "сад " + full.gardenPeak.toFixed(3) + " против гула " + full.drone.toFixed(3));
  ok(idle.noise < 0.006, "в покое шума почти нет",
     "пол " + idle.noise.toFixed(4));
  // Шум обязан ОЗНАЧАТЬ событие. Если пол и пик близки, он превращается
  // в постоянное сипение — фон, который нечего сообщить.
  var loud = A.run(300, "gaze");
  var peak = 0;
  loud.samples.forEach(function (x) { if (x.noise > peak) peak = x.noise; });
  ok(peak > idle.noise * 4, "прилив слышно как событие, а не как фон",
     "пик " + peak.toFixed(4) + " — в " + (peak / idle.noise).toFixed(0) + " раз выше пола");
  ok(full.alive > 10, "берег при этом полон", full.alive + " живых");

  // Человек: «чем дальше играешь, тем больше превращается в фоновый гул».
  // Web Audio не убирает за собой: отзвучавшая нота молчит, но её узлы
  // остаются подключены к выходу и продолжают сводиться. За 10 минут
  // копилось 1714 узлов — вот он, гул, растущий со временем. Граф обязан
  // оставаться постоянным, сколько бы ни было сыграно нот.
  var longRun = A.run(420, "gaze");
  var early = longRun.samples.filter(function (x) { return x.t === 60; })[0];
  var late = longRun.samples[longRun.samples.length - 1];
  ok(late.graph <= early.graph + 4, "звук не копится: граф не растёт со временем",
     "узлов " + early.graph + " → " + late.graph + " после " + late.notes + " нот");
  ok(late.notes > 200, "нот при этом сыграно много", late.notes + " нот");
})();

// ——— рука ———
// Человек: «не получается обводить сущности — сбивается после перелёта по
// стрелочке, и в начале мелкие тоже не обводятся». Срыв взгляда мерили в
// МИРЕ: расстоянием от пальца до узла. Но мировая точка под пальцем
// считается от камеры, а камера после перелёта догоняет игрока — и точка
// уползала из-под лежащего пальца сама. Со старым правилом взгляд рвался
// на 0.28 с (уход 75 при пороге 70), не дожив до кристалла на 1.35 с.
group("рука: взгляд держится, пока держит палец");
(function () {
  var Aim = require("./aim.js");
  var AG = Aim.bootEngine();

  var calm = Aim.hold(AG, { camLag: 0 });
  ok(calm.took, "палец на узле берёт взгляд");
  ok(calm.crystal, "спокойной рукой узел рождается",
     calm.crystal ? "кристалл на " + calm.at.toFixed(2) + " с"
                  : "сорвался на " + (calm.at || 0).toFixed(2) + " с");

  // то самое «после перелёта»: камера ещё едет за игроком
  var lag = Aim.hold(AG, { camLag: 120 });
  ok(lag.crystal, "ход камеры не рвёт взгляд из-под лежащего пальца",
     lag.crystal ? "кристалл на " + lag.at.toFixed(2) + " с"
                 : "сорвался на " + (lag.at || 0).toFixed(2) + " с, уход " +
                   Math.round(lag.drift || 0));

  // Прицел мерили от ЦЕНТРА узла одним радиусом на всех. Значит малёк
  // (r=11) требовал попасть на семь точек точнее, чем гнездо (r=18) —
  // при том что подушечка пальца накрывает около 57 точек холста и
  // человек вообще не видит, куда именно ткнул. Меряем от края.
  var padSmall = Aim.pad(AG, 11);
  var padBig = Aim.pad(AG, 24);
  // 57 точек — сама подушечка; прицел обязан быть ЩЕДРЕЕ неё, иначе
  // человек попадает ровно настолько, насколько случайно ткнул.
  ok(padSmall >= 65, "мелкий узел ловится подушечкой пальца, а не остриём",
     "прощает " + padSmall + " точек при r=11");
  ok(padBig > padSmall, "крупному узлу прощается больше, чем мелкому",
     "r=24 прощает " + padBig + ", r=11 — " + padSmall);
})();

// ——— долгая игра ———
// Гул, растущий со временем, был утечкой графа Web Audio, и ни одна из
// пяти проверок звука его не видела: все они смотрели на один кадр.
// Мир может болеть так же — молча копить и пухнуть. Смотрю на час.
group("долгая игра: мир не пухнет за час");
(function () {
  var Long = require("./long.js");
  var r = Long.live(3600, [60, 600, 3600], 7);
  var a = r.at[60], b = r.at[600], c = r.at[3600];

  ok(r.errors === 0, "час игры проходит без падений",
     r.errors ? r.errors + " падений, последнее: " + r.lastError : "216000 кадров");

  // Сначала я написал это как «не растёт между 10-й и 60-й минутой» — и
  // проверка покраснела на здоровом мире: звёзды шли 121→160, забытое
  // 3→24, то есть списки как раз ДОРАСТАЛИ до своих потолков. Темп роста
  // ничего не говорит; спрашивать надо про предел. Числа — из кода:
  // world.js:302 звёзды 160, :312 забытое 24, :325 строфы 60, :573 узлы
  // 28, fx.js:6 эффекты 420, renderer.js:617 след 18, engine.js:233 тапы 8.
  // Потолка у floaters в коде нет: строки живут 2.2 с и уходят сами.
  // Значит стеречь надо не предел, а то, что их не сотни разом.
  var caps = { stars: 160, forgotten: 24, verses: 60, nodes: 28,
               fx: 420, trail: 18, taps: 8, floaters: 40 };
  var over = [];
  Object.keys(caps).forEach(function (k) {
    if (c[k] > caps[k]) over.push(k + " " + c[k] + " > " + caps[k]);
  });
  ok(over.length === 0, "ни один список мира не перерос свой потолок",
     over.length ? "переросли: " + over.join(", ")
                 : "звёзды " + c.stars + "/160, забытое " + c.forgotten +
                   "/24, строфы " + c.verses + "/60, эффекты " + c.fx + "/420");

  // Существа — единственные без потолка в коде: их рождает мир, и растут
  // они медленно. Стерегу отдельно и по здравому смыслу, а не по числу из
  // кода: полсотни существ на берегу — это уже не берег, а толпа.
  ok(c.beings <= 40, "существа не размножаются без меры",
     "через час " + c.beings + " существ (на 10-й минуте " + b.beings + ")");

  // Куча в обычном прогоне — шум: она скачет на мегабайты от того, когда
  // движку вздумалось прибраться, и моя первая версия этой проверки
  // краснела на здоровом мире. Проверка, которая врёт, хуже отсутствующей.
  // Поэтому час проживается ещё раз, отдельным процессом под сборщиком
  // мусора: только там разница между 10-й и 60-й минутой что-то значит.
  var hb = null, hc = null;
  try {
    var raw = require("child_process").execFileSync(
      process.execPath,
      ["--expose-gc", require("path").join(__dirname, "long.js"), "--json"],
      { encoding: "utf8", maxBuffer: 1 << 22 });
    var rg = JSON.parse(raw);
    hb = rg.at[600]; hc = rg.at[3600];
  } catch (e) { /* ниже скажем честно, что не смогли */ }
  ok(hb && hc && hc.heap <= hb.heap * 1.5,
     "за пятьдесят минут игры память не растёт",
     hb && hc ? "10-я минута " + hb.heap + " КБ, 60-я " + hc.heap + " КБ"
              : "замер под сборщиком мусора не удался");

  // Мир должен остаться живым, а не выродиться в пустой берег: болезнь
  // бывает и такая — всё «не растёт», потому что всё умерло.
  // Первый порог был `> 6` — и подлог, выедающий берег до 8 узлов, прошёл
  // мимо. Порог обязан стоять заметно выше того, что даёт поломка: пять
  // сидов (1, 3, 7, 11, 42) дают через час ровно 28 узлов, то есть потолок.
  // Живой берег упирается в предел; 20 — это уже болезнь.
  ok(c.nodes >= 20 && c.beings > 0, "через час берег всё ещё обитаем",
     "узлы " + c.nodes + " (здоровый упирается в 28), существа " + c.beings);
})();

console.log("\n" + (fail ? "✗ " : "✓ ") + pass + " прошло, " + fail + " упало\n");
process.exit(fail ? 1 : 0);
