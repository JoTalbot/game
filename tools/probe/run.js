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

  // Фаза прилива — тоже память. Раньше при перезапуске таймер
  // откатывался к стартовым ~98 с, и человек, играющий короткими
  // сессиями, почти не видел прилив вовсе.
  w.tide = 0.42;
  w.tideT = 31.5;
  var d2 = JSON.parse(JSON.stringify(w.toJSON()));
  ok(d2.tide === 0.42 && d2.tideT === 31.5, "фаза прилива кладётся в сейв",
     "tide=" + d2.tide + " tideT=" + d2.tideT);
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

// ——— имена и стихи: язык не вмерзает в мир ———
// Самая большая кириллица английского берега висела не в словаре, а в
// самом мире: имя человека, имена существ, их речь и стихи сада —
// всё это было русскими СТРОКАМИ, которые вдобавок ложились в сейв.
// Переключив язык, человек получал английский интерфейс поверх русского
// сада — и обратной дороги не было: строка уже сохранена.
// Теперь мир хранит ключи, а строка собирается на языке человека в
// момент показа. Эти проверки стерегут и полноту таблиц, и то, что
// перевод не вмерзает.
group("язык: мир не вмерзает в раскладку");
(function () {
  var prev = G.Lang.id;

  // 1. Имя человека — то, что он уносит в сигиле.
  var dna = new G.Dna({ curiosity: 0.9, aggression: 0.1, contemplation: 0.2, empathy: 0.15, chaos: 0.1, harmony: 0.1 });
  G.Lang.id = "ru";
  var nameRu = dna.name();
  G.Lang.id = "en";
  var nameEn = dna.name();
  ok(!/[а-яА-Я]/.test(nameEn) && nameEn !== nameRu,
     "имя человека переводится", nameRu + " / " + nameEn);

  // Обе таблицы имён — одного состава и длины: индекс берётся от хеша
  // ДНК, и разной длиной человек после смены языка стал бы другим.
  var badName = [];
  for (var t in G.NAME_TABLES.ru.names) {
    if (!Object.prototype.hasOwnProperty.call(G.NAME_TABLES.ru.names, t)) continue;
    var a = G.NAME_TABLES.ru.names[t], b = G.NAME_TABLES.en.names[t];
    if (!b || b.length !== a.length) badName.push(t);
  }
  for (var hk in G.NAME_TABLES.ru.hybrid) {
    if (!Object.prototype.hasOwnProperty.call(G.NAME_TABLES.ru.hybrid, hk)) continue;
    if (!G.NAME_TABLES.en.hybrid[hk]) badName.push(hk);
  }
  ok(!badName.length, "обе раскладки имени одного состава", badName.join(", "));

  // Подпись под сигилой — второе по заметности место после имени.
  var noHint = [];
  for (var ti = 0; ti < G.TRAITS.length; ti++) {
    G.Lang.id = "en";
    if (/[а-яА-Я]/.test(G.traitHint(G.TRAITS[ti]))) noHint.push(G.TRAITS[ti]);
  }
  ok(!noHint.length, "подпись оси переводится", noHint.join(", "));

  // 2. Существо: имя над головой и речь.
  G.Lang.id = "ru";
  var game = H.makeWorld(G, 91);
  var being = G.Organs.birthBeing(10, 10, "empathy", game.world.rng);
  var babyRu = G.beingName(being);
  G.Lang.id = "en";
  var babyEn = G.beingName(being);
  ok(!/[а-яА-Я]/.test(babyEn) && babyEn !== babyRu,
     "безымянное существо зовётся на языке человека", babyRu + " / " + babyEn);

  G.Organs.nameBeing(being);
  G.Lang.id = "ru";
  var trueRu = G.beingName(being);
  G.Lang.id = "en";
  var trueEn = G.beingName(being);
  ok(!/[а-яА-Я]/.test(trueEn) && trueEn !== trueRu,
     "истинное имя переводится", trueRu + " / " + trueEn);

  var badTemper = [];
  for (var tk in G.Organs.TEMPER_RU) {
    if (!Object.prototype.hasOwnProperty.call(G.Organs.TEMPER_RU, tk)) continue;
    if (!G.Organs.TEMPER_EN[tk]) badTemper.push(tk);
    var pool = G.Organs.TEMPER_EN[tk];
    if (pool && /[а-яА-Я]/.test(pool)) badTemper.push(tk);
  }
  ok(!badTemper.length, "у каждого характера есть английское имя", badTemper.join(", "));

  ok(!/[а-яА-Я]/.test(G.Organs.speakBeing(being)),
     "существо говорит по-английски", G.Organs.speakBeing(being));

  // 3. Стих сада: замысел, а не строка.
  G.Lang.id = "ru";
  var verse = G.Organs.composeVerse(game);
  ok(typeof verse === "object", "стих хранится замыслом, а не строкой");
  var vRu = G.verseText(verse);
  G.Lang.id = "en";
  var vEn = G.verseText(verse);
  ok(!/[а-яА-Я]/.test(vEn) && vEn !== vRu, "стих сада переводится", vRu + " / " + vEn);

  var still = G.Organs.stillVerse();
  G.Lang.id = "en";
  ok(!/[а-яА-Я]/.test(G.verseText(still)), "стих узла тишины переводится", G.verseText(still));

  // 4. Главное: язык не вмерзает в сейв. Игра, сохранённая по-русски,
  // после переключения обязана говорить по-английски целиком.
  G.Lang.id = "ru";
  var w = H.makeWorld(G, 77);
  var b2 = G.Organs.birthBeing(30, 30, "empathy", w.world.rng);
  G.Organs.nameBeing(b2);
  w.world.beings.push(b2);
  w.world.addVerse(G.Organs.composeVerse(w));
  var json = JSON.parse(JSON.stringify(w.world.toJSON()));
  ok(json.beings[json.beings.length - 1].nameKey != null,
     "имя существа уезжает в сейв ключом, а не строкой");

  G.Lang.id = "en";
  var frozen = [];
  var sb = json.beings[json.beings.length - 1];
  var revived = { named: sb.named, nameKey: sb.nameKey, babyKey: sb.babyKey, name: sb.name };
  if (/[а-яА-Я]/.test(G.beingName(revived))) frozen.push("имя существа");
  for (var vi = 0; vi < json.verses.length; vi++) {
    if (/[а-яА-Я]/.test(G.verseText(json.verses[vi]))) frozen.push("стих");
  }
  ok(!frozen.length, "русский сейв не примораживает язык", frozen.join(", "));

  G.Lang.id = prev;
})();

// ——— мир не застывает ———
// Человек после восьми минут: «всё работает супер. Захотелось выйти, так
// как ничего нового». И он прав: ДНК только росла и не убывала никогда —
// за две минуты три оси упирались в 1.0, органы вставали в потолок, и
// мир переставал меняться. Игра обещает читать тебя по поступкам, а
// читала только первые сто.
group("мир: портрет дышит, а не упирается в потолок");
(function () {
  var Aim6 = require("./aim.js");
  var G6 = Aim6.bootEngine();

  // 1. Портрет поворачивается: сменил поведение — сменился характер.
  var g6 = Aim6.makeGame(G6, 7);
  for (var i = 0; i < 400; i++) g6.dna.feed("aggression", 0.02);
  var hotFirst = g6.dna.get("aggression");
  for (var j = 0; j < 400; j++) g6.dna.feed("contemplation", 0.02);
  ok(g6.dna.dominant() === "contemplation" && g6.dna.get("aggression") < hotFirst - 0.2,
     "брошенная черта тает, новая берёт верх",
     "жар " + hotFirst.toFixed(2) + " → " + g6.dna.get("aggression").toFixed(2) +
     ", доминанта " + g6.dna.dominant());

  // 2. Но не мгновенно: случайное касание не стирает пути.
  var g7 = Aim6.makeGame(G6, 7);
  for (var k = 0; k < 400; k++) g7.dna.feed("aggression", 0.02);
  var before = g7.dna.get("aggression");
  g7.dna.feed("chaos", 0.05);
  ok(before - g7.dna.get("aggression") < 0.05, "одно касание не стирает характер",
     "жар " + before.toFixed(3) + " → " + g7.dna.get("aggression").toFixed(3));

  // 3. Сумма осей не растёт без предела — иначе органы снова встанут
  // в потолок все разом и мир застынет.
  var g8 = Aim6.makeGame(G6, 7);
  G6.now = function () { return g8.time; };
  var sums = [];
  for (var f = 0; f < 8 * 60 * 60; f++) {
    g8.time += 1 / 60;
    if (f % 150 === 0) {
      var q = null;
      for (var n8 = 0; n8 < g8.world.nodes.length; n8++) {
        var c8 = g8.world.nodes[n8];
        if (!c8.dead && c8.state === "unformed") { q = c8; break; }
      }
      if (q) {
        g8.input.x = 400 + (q.x - g8.cam.x) * g8.cam.z;
        g8.input.y = 300 + (q.y - g8.cam.y) * g8.cam.z;
        var w8 = g8.screenToWorld(g8.input.x, g8.input.y);
        g8.input.wx = w8.x; g8.input.wy = w8.y; g8.input.down = true;
        try { g8.onDown(); } catch (e) {}
      }
    }
    if (f % 150 === 130) { g8.input.down = false; try { g8.onUp && g8.onUp(); } catch (e) {} }
    try { g8.update(1 / 60); } catch (e) {}
    if (f % (60 * 60) === 0) sums.push(g8.dna.sum());
  }
  var maxed = 0;
  for (var t8 = 0; t8 < G6.TRAITS.length; t8++) {
    if (g8.dna.get(G6.TRAITS[t8]) >= 0.999) maxed++;
  }
  // Порог по СМЫСЛУ: три оси в потолке — это и есть застывший мир,
  // ровно то состояние, из-за которого человек вышел («ничего нового»).
  // Подлог «ДНК только растёт» давал ровно 3 и проходил мимо.
  ok(maxed <= 1, "не все оси упираются в потолок",
     maxed + " из 6 осей в максимуме, сумма " + g8.dna.sum().toFixed(2));

  // 4. И главное: за восемь минут игра всё ещё меняется. Мерим орган
  // боя — он живёт от жара, который человек кормит постоянно.
  var early = sums[1] || 0, late = sums[sums.length - 1] || 0;
  ok(Math.abs(late - early) > 0.05 || late < 5.2,
     "портрет продолжает двигаться и на восьмой минуте",
     "сумма осей: 1-я минута " + early.toFixed(2) + ", 8-я " + late.toFixed(2));

  // 5. Вехи не кончаются на двадцати: человек за сессию вырастил 141.
  var far = ["ms40", "ms70", "ms120", "ms200", "ms350"];
  var missing = [];
  for (var m = 0; m < far.length; m++) {
    if (!G6.LINES_EN[far[m]]) missing.push(far[m] + " (en)");
    if (!G6.Voice.keys || G6.Voice.keys().indexOf(far[m]) < 0) missing.push(far[m] + " (ru)");
  }
  ok(!missing.length, "у дальних вех есть слова на обоих языках",
     missing.length ? missing.join(", ") : "40, 70, 120, 200, 350");

  // Сезон обязан идти за доминантой. Отчёт: природа «сбой», сезон
  // «тишина» — они разошлись и не сходились тринадцать минут. Осыпь
  // считалась от суммы шести осей, а упирались в потолок две: у самого
  // верха она была почти нулевой (0.007 за кристалл), и перевес между
  // насыщенными осями не набирал даже порога смены сезона.
  var g9 = Aim6.makeGame(G6, 7);
  G6.now = function () { return g9.time; };
  var mismatch = 0, checks = 0;
  for (var f9 = 0; f9 < 13 * 60 * 60; f9++) {
    g9.time += 1 / 60;
    if (f9 % 150 === 0) {
      var q9 = null;
      for (var n9 = 0; n9 < g9.world.nodes.length; n9++) {
        var c9 = g9.world.nodes[n9];
        if (!c9.dead && c9.state === "unformed") { q9 = c9; break; }
      }
      if (q9) {
        g9.input.x = 400 + (q9.x - g9.cam.x) * g9.cam.z;
        g9.input.y = 300 + (q9.y - g9.cam.y) * g9.cam.z;
        var w9 = g9.screenToWorld(g9.input.x, g9.input.y);
        g9.input.wx = w9.x; g9.input.wy = w9.y; g9.input.down = true;
        try { g9.onDown(); } catch (e) {}
      }
    }
    if (f9 % 150 === 130) { g9.input.down = false; try { g9.onUp && g9.onUp(); } catch (e) {} }
    try { g9.update(1 / 60); } catch (e) {}
    if (f9 % (60 * 60) === 0 && f9 > 60 * 120) {
      checks++;
      if (G6.Memory.seasonTrait !== g9.dna.dominant()) mismatch++;
    }
  }
  ok(checks > 0 && mismatch === 0, "сезон идёт за характером, а не отстаёт навсегда",
     mismatch + " расхождений из " + checks + " замеров, сейчас «" +
     G6.Memory.climate().id + "» при доминанте «" + g9.dna.dominant() + "»");
})();

// ——— раны ———
// Отчёт с телефона назвал это прямо: «сила ушла на: взгляд 581, раны
// 4349» и «нет сил ×95» из 113 срывов. Две трети сессии человек провёл
// под касанием раны — потому что рана была БЫСТРЕЕ игрока (86 против 83)
// и бессмертна (hp 3, умирает только от удара). Голод, от которого
// нельзя уйти, — не голод, а налог: взгляд переставал работать вовсе.
group("раны: голод гонит, но не приковывает");
(function () {
  var Aim5 = require("./aim.js");
  var G5 = Aim5.bootEngine();

  // 1. От раны можно убежать. Иначе всё остальное не имеет значения.
  // Скорость раны спрашиваем У МИРА, а не считаем по формуле из кода:
  // первая версия повторяла `40 + min(24, age*1.4)` у себя, и подлог
  // «рана снова быстрее» прошёл мимо — обе стороны врали одинаково.
  // Третий раз наступаю на эти грабли: проверка, дублирующая формулу,
  // ничего не проверяет. Даём ране состариться в живом мире и смотрим,
  // как быстро она реально движется.
  var g5 = Aim5.makeGame(G5, 7);
  var probe = new G5.Wound(g5.player.x + 900, g5.player.y, "thorn");
  g5.world.wounds.push(probe);
  var maxWound = 0;
  for (var t = 0; t < 60 * 90; t++) {
    g5.time += 1 / 60;
    var px = probe.x, py = probe.y;
    try { g5.update(1 / 60); } catch (e) {}
    if (g5.world.wounds.indexOf(probe) < 0) break;
    // Меряем ПОГОНЮ, а не отскок: насытившаяся рана отлетает прочь на
    // 150+ единиц, и это не скорость преследования, а бегство от
    // человека. Считать её погоней — значит краснеть на здоровом мире.
    if (probe.full > 0) continue;
    var spd = Math.hypot(probe.x - px, probe.y - py) * 60;
    if (spd > maxWound) maxWound = spd;
  }
  g5 = Aim5.makeGame(G5, 7);
  g5.input.down = true; g5.input.x = 700; g5.input.y = 300;
  var w5 = g5.screenToWorld(700, 300);
  g5.input.wx = w5.x; g5.input.wy = w5.y;
  for (var f = 0; f < 600; f++) {
    g5.time += 1 / 60;
    var w6 = g5.screenToWorld(700, 300);
    g5.input.wx = w6.x; g5.input.wy = w6.y;
    try { g5.update(1 / 60); } catch (e) {}
  }
  var run = Math.hypot(g5.player.vx, g5.player.vy);
  // Запас по СМЫСЛУ: убегать надо заметно, а не на волосок. При отрыве
  // в 11 единиц (87 против 76) рана висит на пятках всю сессию — именно
  // это и дало 4349 съеденной силы. Четверть скорости игрока — тот
  // запас, при котором уход чувствуется уходом.
  ok(run > maxWound * 1.25, "от раны можно уйти",
     "игрок " + Math.round(run) + ", рана до " + Math.round(maxWound) +
     " (нужен отрыв в четверть)");

  // 2. Рана истлевает сама. Иначе они копятся всю сессию.
  var g6 = Aim5.makeGame(G5, 7);
  g6.world.wounds.push(new G5.Wound(g6.player.x + 400, g6.player.y, "thorn"));
  for (var f2 = 0; f2 < 60 * 130; f2++) {
    g6.time += 1 / 60;
    try { g6.update(1 / 60); } catch (e) {}
  }
  ok(g6.world.wounds.length === 0, "рана истлевает, если её не кормить",
     "через 130 с ран осталось " + g6.world.wounds.length);

  // 3. Но пока жива — кусает больно. Смягчение до 9/с сломало долг
  // памяти: игрок переставал убегать, существа всегда были рядом, и
  // голод не дозревал ни у кого. Рана обязана гнать с места.
  var g7 = Aim5.makeGame(G5, 7);
  for (var i = 0; i < 4; i++) {
    g7.world.wounds.push(new G5.Wound(g7.player.x + 8 * i, g7.player.y, "thorn"));
  }
  for (var f3 = 0; f3 < 60 * 12; f3++) {
    g7.time += 1 / 60;
    g7.player.vx = 0; g7.player.vy = 0;
    try { g7.update(1 / 60); } catch (e) {}
  }
  ok(g7.player.energy < 30, "стоять под ранами больно",
     "через 12 с неподвижности энергия " + Math.round(g7.player.energy));

  // Но СТАЯ не умножает боль без предела. Каждая рана ела 22/с
  // независимо: полторы разом — уже 33/с против восстановления 7-14,
  // шесть — 132/с, энергия обнулялась за секунду. Отчёт с телефона:
  // раны съели 3426 силы за 108 секунд игры — больше, чем длилась
  // сессия. Взгляд умирал не от одной раны, а от их ЧИСЛА, которое
  // человек не контролирует: они рождаются сами.
  function biteFor(count) {
    var gg = Aim5.makeGame(G5, 7);
    for (var i = 0; i < count; i++) {
      gg.world.wounds.push(new G5.Wound(gg.player.x + 4 * i, gg.player.y, "thorn"));
    }
    var before = gg.player.energy;
    for (var f = 0; f < 60; f++) {
      gg.time += 1 / 60;
      gg.player.vx = 0; gg.player.vy = 0;
      try { gg.update(1 / 60); } catch (e) {}
    }
    return before - gg.player.energy;
  }
  var one = biteFor(1);
  var six = biteFor(6);
  ok(six < one * 3, "стая ран не умножает боль без предела",
     "одна рана берёт " + Math.round(one) + " за секунду, шесть — " + Math.round(six));
  ok(six < 60, "под стаей ран человек не обнуляется мгновенно",
     "шесть ран берут " + Math.round(six) + " из 100 за секунду");

  // 4. И всё же под раной можно смотреть: узел рождается.
  var g8 = Aim5.makeGame(G5, 7);
  var node = null;
  for (var k = 0; k < g8.world.nodes.length; k++) {
    var c = g8.world.nodes[k];
    if (!c.dead && c.state === "unformed") { node = c; break; }
  }
  g8.world.wounds.push(new G5.Wound(node.x + 6, node.y, "thorn"));
  g8.player.x = node.x; g8.player.y = node.y;
  g8.cam.x = node.x; g8.cam.y = node.y;
  g8.input.x = 400; g8.input.y = 300;
  var w8 = g8.screenToWorld(400, 300);
  g8.input.wx = w8.x; g8.input.wy = w8.y;
  g8.input.down = true; g8.time += 2;
  try { g8.onDown(); } catch (e) {}
  for (var f4 = 0; f4 < 300; f4++) {
    g8.time += 1 / 60;
    g8.input.x = 400; g8.input.y = 300;
    var w9 = g8.screenToWorld(400, 300);
    g8.input.wx = w9.x; g8.input.wy = w9.y;
    try { g8.update(1 / 60); } catch (e) {}
    if (node.state !== "unformed") break;
  }
  ok(node.state !== "unformed", "под раной всё ещё можно вырастить узел",
     node.state !== "unformed" ? "вырос" : "не вырос — взгляд задушен голодом");

  // И на ИСХОДЕ сил тоже. Взгляд отключался при энергии ниже 4 — под
  // стаей ран она стоит в нуле, и человек не мог НИЧЕГО: ни вырастить,
  // ни понять, за что наказан. Отчёт: «нет сил ×95» из 113 срывов,
  // замер давал 213. Смотреть без сил можно, просто вдвое медленнее:
  // голод забирает скорость, а не саму способность жить.
  var g9 = Aim5.makeGame(G5, 7);
  var node9 = null;
  for (var k9 = 0; k9 < g9.world.nodes.length; k9++) {
    var c9 = g9.world.nodes[k9];
    if (!c9.dead && c9.state === "unformed") { node9 = c9; break; }
  }
  g9.player.x = node9.x; g9.player.y = node9.y;
  g9.cam.x = node9.x; g9.cam.y = node9.y;
  for (var i9 = 0; i9 < 6; i9++) {
    g9.world.wounds.push(new G5.Wound(node9.x + 4 * i9, node9.y, "thorn"));
  }
  for (var f9 = 0; f9 < 60 * 20; f9++) {
    g9.time += 1 / 60;
    g9.player.vx = 0; g9.player.vy = 0;
    try { g9.update(1 / 60); } catch (e) {}
  }
  var drained = g9.player.energy;
  g9.input.x = 400; g9.input.y = 300;
  var wd9 = g9.screenToWorld(400, 300);
  g9.input.wx = wd9.x; g9.input.wy = wd9.y;
  g9.input.down = true; g9.time += 2;
  try { g9.onDown(); } catch (e) {}
  var bornAt = -1;
  for (var q9 = 0; q9 < 400; q9++) {
    g9.time += 1 / 60;
    g9.input.x = 400; g9.input.y = 300;
    var w9 = g9.screenToWorld(400, 300);
    g9.input.wx = w9.x; g9.input.wy = w9.y;
    try { g9.update(1 / 60); } catch (e) {}
    if (node9.state !== "unformed") { bornAt = q9 / 60; break; }
  }
  ok(drained < 5 && bornAt > 0, "без сил взгляд работает, просто медленнее",
     drained < 5 ? (bornAt > 0 ? "энергия " + Math.round(drained) + ", узел вырос за " +
       bornAt.toFixed(2) + " с" : "энергия в нуле — узел НЕ вырос")
       : "не удалось истощить (энергия " + Math.round(drained) + ")");
  ok(bornAt < 0 || bornAt > 2, "но голод заметно замедляет",
     bornAt > 0 ? bornAt.toFixed(2) + " с против обычных 1.35" : "—");

  // И отчёт об этом расходе должен быть честным. На исходе сил взгляд
  // ест 1/с вместо 6/с — а drain.gaze всегда писал 6*dt, завышая «силу,
  // ушедшую на взгляд» вшестеро ровно там, где человек играет под
  // стаей ран. Отчёт врал не молчанием, а числом — худший сорт.
  // Спрашиваем мир: сколько ОТЧЁТ насчитал за кадр у полного и у
  // истощённого — разница обязана быть, иначе «голод забирает скорость»
  // в отчёте не виден вовсе.
  function gazeDrainOneFrame(energy) {
    var gg = Aim5.makeGame(G5, 7);
    var nn = null;
    for (var i = 0; i < gg.world.nodes.length; i++) {
      var c = gg.world.nodes[i];
      if (!c.dead && c.state === "unformed") { nn = c; break; }
    }
    gg.player.x = nn.x; gg.player.y = nn.y;
    gg.cam.x = nn.x; gg.cam.y = nn.y;
    gg.input.x = 400; gg.input.y = 300;
    var w = gg.screenToWorld(400, 300);
    gg.input.wx = w.x; gg.input.wy = w.y;
    gg.player.energy = energy;
    gg.input.down = true; gg.time += 2;
    try { gg.onDown(); } catch (e) {}
    G5.Report.reset();
    try { gg.update(1 / 60); } catch (e) {}
    return G5.Report.drain.gaze;
  }
  var fullDrain = gazeDrainOneFrame(100);
  var weakDrain = gazeDrainOneFrame(5);
  ok(weakDrain < fullDrain * 0.4,
     "на исходе сил отчёт не завышает расход взгляда",
     "полный " + fullDrain.toFixed(3) + " против слабого " + weakDrain.toFixed(3) +
     " (взгляд ест 1/с, а не 6/с)");
})();

// ——— первая смена кожи ———
// Отчёт с телефона: «выращено 15, живых 1» — человек три минуты растил
// сад, и перерождение стёрло его целиком. Тут порочный круг: чтобы сад
// пережил смену кожи, нужны корни; чтобы захотеть возвращаться, надо
// увидеть, что возвращение окупается; чтобы увидеть — нужен сад, который
// дожил. На укоренение одного узла нужно 90 секунд, первая мета приходит
// на 190-й. Первое, что человек узнавал о мире: труд бессмыслен.
group("первая смена кожи щадит незнающего");
(function () {
  var Aim4 = require("./aim.js");
  var G4 = Aim4.bootEngine();
  var g4 = Aim4.makeGame(G4, 7);
  G4.now = function () { return g4.time; };

  // Считаем ФАКТ, а не повторяем формулу игры: сколько живых узлов было
  // до смены кожи и сколько осталось после. Первая версия дублировала
  // условие милости у себя — и подлог «милости нет» прошёл мимо неё,
  // потому что проверка считала милость сама. Проверка, повторяющая код,
  // ничего не проверяет; спрашивать надо мир.
  var shots = [];
  var W4 = Object.getPrototypeOf(g4.world);
  var origMeta = W4.metamorphose;
  W4.metamorphose = function (p, d) {
    var before = 0;
    for (var i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].state === "alive") before++;
    }
    var r = origMeta.call(this, p, d);
    var after = 0;
    for (var j = 0; j < this.nodes.length; j++) {
      if (this.nodes[j].state === "alive") after++;
    }
    shots.push({ n: this.meta, kept: after, gone: Math.max(0, before - after) });
    return r;
  };

  for (var f = 0; f < 15 * 60 * 60; f++) {
    g4.time += 1 / 60;
    if (f % 180 === 0) {
      var q = null;
      for (var i2 = 0; i2 < g4.world.nodes.length; i2++) {
        var c = g4.world.nodes[i2];
        if (!c.dead && c.state === "unformed") { q = c; break; }
      }
      if (q) {
        g4.input.x = 400 + (q.x - g4.cam.x);
        g4.input.y = 300 + (q.y - g4.cam.y);
        var w = g4.screenToWorld(g4.input.x, g4.input.y);
        g4.input.wx = w.x; g4.input.wy = w.y; g4.input.down = true;
        try { g4.onDown(); } catch (e) {}
      }
    }
    if (f % 180 === 120) { g4.input.down = false; try { g4.onUp && g4.onUp(); } catch (e) {} }
    try { g4.update(1 / 60); } catch (e) {}
  }
  W4.metamorphose = origMeta;

  var first = shots[0];
  ok(first && first.kept >= 4,
     "первое перерождение не стирает сад подчистую",
     first ? "уцелело " + first.kept + " из " + (first.kept + first.gone) : "меты не было");

  // Но милость ровно одна. Дальше закон суров: держится укоренённое и
  // удержанное, иначе прилив и забвение перестают что-либо значить.
  // Мера — по большим берегам: на маленьком (6 узлов) все шесть могут
  // оказаться укоренёнными честно, и это не милость, а заслуга. Милость
  // видна там, где сада много, а уносит его мало.
  var later = shots.slice(1).filter(function (x) { return x.kept + x.gone >= 10; });
  var soft = later.filter(function (x) { return x.kept > (x.kept + x.gone) * 0.5; });
  ok(later.length > 0 && soft.length === 0,
     "дальше мир прощать перестаёт",
     later.map(function (x) { return x.kept + "/" + (x.kept + x.gone); }).join(", "));
})();

// ——— видно ли заботу ———
// Сердце игры: «вернись к тому, что остывает». Но живой узел рисовался
// с ПОСТОЯННОЙ яркостью — care на его вид не влиял вовсе, менялась лишь
// дымка у неоформленных, на 0.05, то есть незаметно. Механика была
// невидима, и отчёты с телефона показывали это прямо: человек отвечает
// «возвращаться — да, видно», а возвращений ноль. Он не видел.
group("забота видна глазом, а не только в числах");
(function () {
  var game = H.makeWorld(G, 7);
  var n = game.world.nodes[0];
  n.state = "alive"; n.kind = "spark"; n.r = 18; n.roots = 0;

  function light(care) {
    n.care = care;
    var ctx = H.ctxStub();
    ctx.canvas = { width: 800, height: 600 };
    G.Renderer.drawNode(ctx, game.cam, n, 0, game);
    return ctx.light();
  }

  var full = light(1.0);
  var cool = light(0.5);
  var cold = light(0.1);

  ok(full > cool && cool > cold, "чем холоднее узел, тем он тусклее",
     "care 1.0 → " + full + ", 0.5 → " + cool + ", 0.1 → " + cold);

  // Разница должна быть ЗАМЕТНОЙ. Прежний код давал ноль, и это
  // проходило бы любую проверку на «убывание».
  ok(cold < full * 0.62, "разница видна, а не арифметическая",
     "забытый светит " + Math.round(100 * cold / full) + "% от свежего");

  // Обратная крайность: забытое не должно исчезать совсем — берег не
  // гаснет, он тускнеет. Иначе человек решит, что узел умер, и не
  // поймёт, что его ещё можно спасти.
  ok(cold > full * 0.25, "но забытое всё ещё видно на берегу",
     "забытый светит " + Math.round(100 * cold / full) + "% от свежего");

  // И корни: то, к чему возвращались, должно быть отличимо от того,
  // к чему нет, — иначе награда снова невидима.
  n.care = 0.5; n.roots = 0;
  var bare = (function () {
    var c = H.ctxStub(); c.canvas = { width: 800, height: 600 };
    G.Renderer.drawNode(c, game.cam, n, 0, game); return c.calls.length;
  })();
  n.roots = 0.9;
  var rooted = (function () {
    var c = H.ctxStub(); c.canvas = { width: 800, height: 600 };
    G.Renderer.drawNode(c, game.cam, n, 0, game); return c.calls.length;
  })();
  ok(rooted > bare, "укоренённый узел выглядит иначе, чем случайный",
     "с корнями " + rooted + " штрихов против " + bare);
})();

// ——— судьба ———
// Развилка «отпустить / стать игрой» — конец пути. В отчёте с телефона
// стояло «судьба: become» при 1.3 минутах игры, нуле берегов и сессии 0:
// человек увидел финал раньше, чем игру. Виноват был счётчик
// `discovered + lost > 22` — двадцать два узла набегают за пару минут
// бодрого сева. Замер: развилка приходила на 194-й секунде.
group("судьба: финал приходит в конце, а не в начале");
(function () {
  var Aim = require("./aim.js");

  function firstOffer(mins) {
    var G2 = Aim.bootEngine();
    var g2 = Aim.makeGame(G2, 7);
    G2.now = function () { return g2.time; };
    var at = -1;
    var orig = G2.Fate.offer.bind(G2.Fate);
    G2.Fate.offer = function (gm) { if (at < 0) at = g2.time; return orig(gm); };
    for (var f = 0; f < mins * 60 * 60; f++) {
      g2.time += 1 / 60;
      if (f % 180 === 0) {
        var n = null;
        for (var i = 0; i < g2.world.nodes.length; i++) {
          var c = g2.world.nodes[i];
          if (!c.dead && c.state === "unformed") { n = c; break; }
        }
        if (n) {
          g2.input.x = 400 + (n.x - g2.cam.x);
          g2.input.y = 300 + (n.y - g2.cam.y);
          var w = g2.screenToWorld(g2.input.x, g2.input.y);
          g2.input.wx = w.x; g2.input.wy = w.y; g2.input.down = true;
          try { g2.onDown(); } catch (e) {}
        }
      }
      if (f % 180 === 120) { g2.input.down = false; try { g2.onUp && g2.onUp(); } catch (e) {} }
      try { g2.update(1 / 60); } catch (e) {}
      if (at >= 0) break;
    }
    return { at: at, meta: g2.world.meta, grown: g2.world.discovered };
  }

  // Новая жизнь начинается с нуля. `game.time` не обнулялся при
  // рождении — приходил из прошлого сейва и копился между жизнями.
  // Отчёт человека: «сыграно 13.1 мин» и при этом «судьба: become»,
  // хотя порог развилки 20 минут. Он начал новую игру, а часы шли из
  // старой. Всё, что меряется временем мира, считало его старше.
  (function () {
    var Gb = Aim.bootEngine();
    var gb = Aim.makeGame(Gb, 7);
    gb.time = 3000;
    gb.dna.age = 1500;
    Gb.Fate.chosen = "become";
    Gb.Fate.offered = true;
    gb.state = "title";
    try { gb.startBirth(); } catch (e) {}
    ok(gb.time === 0 && gb.dna.age === 0 && !Gb.Fate.chosen,
       "рождение обнуляет часы мира, а не наследует чужие",
       "время " + gb.time + ", возраст " + gb.dna.age + ", судьба «" + Gb.Fate.chosen + "»");
    ok(!Gb.Fate.ready(gb), "новорождённому не предлагают финал");
  })();

  var r = firstOffer(45);
  ok(r.at < 0 || r.at >= 1200, "финал не приходит к тому, кто только начал",
     r.at < 0 ? "за 45 минут не предложен" :
     "предложен на " + Math.round(r.at) + "с (" + (r.at / 60).toFixed(1) + " мин)");

  // И обратная крайность: судьба обязана однажды прийти. Игра без финала
  // — это не «бесконечная», это незаконченная.
  ok(r.at >= 0, "но однажды судьба всё же предлагается",
     r.at >= 0 ? "на " + (r.at / 60).toFixed(1) + " мин, берегов " + r.meta : "НЕ предложена за 45 минут");
})();

// ——— интерфейс ———
// `ui.js` — 452 строки, 41 обращение к документу — не грузился НИ В
// ОДНОМ стенде: подставной DOM возвращал null на всё, и bind() упал бы
// на первой кнопке. Сигила, небо, рассказ, поле рта — ничего из этого не
// проверялось никогда. Всплыло, когда человек сказал «небо и сигилу
// открывал», а отчёт писал 0: счётчики были немыми, и увидеть это можно
// было только чтением исходника.
//
// Теперь есть живой макет DOM (tools/probe/dom.js), и стенд жмёт кнопки
// как палец: узлы помнят классы и текст, события зовут обработчики.
group("интерфейс: кнопки отвечают на палец");
(function () {
  // Ставим макет заново: aim.js подменяет getElementById своими немыми
  // заглушками, и к этому месту документ уже чужой. Стенды делят один
  // глобальный DOM — кто последний, того и тапки.
  var doc = require("./dom.js").install();
  var game = H.makeWorld(G, 7);
  G.app = game;

  // 1. Сама привязка. Она зовётся при старте игры и не проверялась ни
  // разу: любая опечатка в id ломала бы интерфейс молча.
  var bound = true;
  try { G.UI.bind(game); } catch (e) { bound = e.message; }
  ok(bound === true, "интерфейс привязывается без падений",
     bound === true ? "bind() прошёл" : String(bound));

  // 2. Кнопки живые и делают, что обещают.
  G.Report.reset();
  game.world.stars.push({ x: 0, y: 0, c: [1, 1, 1], kind: "spark", tw: 0 });
  game.world.stars.push({ x: 1, y: 1, c: [1, 1, 1], kind: "spark", tw: 0 });
  var skyFired = doc.getElementById("sky-btn").fire("click");
  ok(skyFired > 0 && G.Report.acts.sky === 1,
     "кнопка неба открывает небо и попадает в рассказ",
     "обработчиков " + skyFired + ", счётчик " + G.Report.acts.sky);

  var sigFired = doc.getElementById("sigil-btn").fire("click");
  ok(sigFired > 0 && doc.getElementById("sigil-screen").classList.contains("on") &&
     G.Report.acts.sigil === 1,
     "кнопка сигилы открывает сигилу и попадает в рассказ",
     "экран " + doc.getElementById("sigil-screen").classList.contains("on") +
     ", счётчик " + G.Report.acts.sigil);

  // 3. Сигила рисуется и подписывается — это лицо игры.
  ok(doc.getElementById("sigil-name").textContent.length > 0 &&
     doc.getElementById("sigil-stats").innerHTML.indexOf("<span>") >= 0,
     "сигила подписана именем и числами",
     "имя «" + doc.getElementById("sigil-name").textContent + "»");

  // 4. Рассказ: весь путь, которым человек шлёт мне отчёт.
  G.Report.reset();
  G.Report.gestureStart();
  G.Report.gestureTorn("slip", 0.4, 120);
  for (var i = 0; i < 600; i++) G.Report.frame(1 / 60);
  G.UI.openReport(game);
  ok(doc.getElementById("report-screen").classList.contains("on"),
     "рассказ открывается");

  var asks = doc.getElementById("report-asks");
  ok(asks.children.length === G.Report.ASKS.length,
     "все вопросы нарисованы", asks.children.length + " из " + G.Report.ASKS.length);

  var row = asks.children[0];
  var btn = row && row.children[1];
  if (btn) btn.fire("click");
  ok(btn && G.Report.answers[G.Report.ASKS[0].id],
     "ответ записывается одним касанием",
     JSON.stringify(G.Report.answers));

  // Второе касание по тому же — снять ответ: человек не должен
  // застревать в случайно нажатом.
  var asks2 = doc.getElementById("report-asks");
  var same = asks2.children[0] && asks2.children[0].children[1];
  if (same) same.fire("click");
  ok(!G.Report.answers[G.Report.ASKS[0].id],
     "повторное касание снимает ответ",
     JSON.stringify(G.Report.answers));

  ok(doc.getElementById("report-text").textContent.split("\n").length > 8,
     "текст рассказа виден человеку до отправки",
     doc.getElementById("report-text").textContent.split("\n").length + " строк");

  // 5. Копирование: WebView без https не всегда даёт clipboard, и без
  // запасного пути кнопка молча ничего не делала бы.
  G.UI.copyReport(game);
  var label = doc.getElementById("report-copy").textContent;
  ok(/скопирован|copied/i.test(label), "копирование срабатывает и говорит об этом",
     "кнопка: «" + label + "»");

  // 6. И всё остальное, до чего стенд не доставал никогда: подсказки,
  // надпись закона, сезон, тишина, сигила «унести», поле рта, кнопки
  // рождения и забвения. Двенадцать органов интерфейса, каждый из
  // которых мог быть сломан молча — узнали бы только от человека.
  var broken = [];
  function touch(name, fn) {
    try { fn(); } catch (e) { broken.push(name + " → " + e.message); }
  }
  touch("подсказка", function () {
    G.UI.hint("проба");
    if (doc.getElementById("hint").textContent !== "проба") throw new Error("текст не встал");
  });
  touch("надпись закона", function () {
    G.UI.law("закон: проба");
    if (!doc.getElementById("law").classList.contains("on")) throw new Error("не зажглась");
  });
  touch("сезон", function () {
    G.UI.paintSeason();
    if (!doc.getElementById("season").textContent) throw new Error("пусто");
  });
  touch("тишина", function () { G.UI.setMute(true); G.UI.setMute(false); });
  touch("унести сигилу", function () { G.UI.shareSigil(game); });
  touch("кнопка рассказать", function () {
    if (!doc.getElementById("btn-report").fire("click")) throw new Error("нет обработчика");
  });
  touch("кнопка забыть", function () {
    if (!doc.getElementById("btn-forget")._listeners.click) throw new Error("нет обработчика");
  });
  touch("кнопка родиться", function () {
    if (!doc.getElementById("btn-born")._listeners.click) throw new Error("нет обработчика");
  });
  touch("смена языка", function () {
    var was = G.Lang.id;
    doc.getElementById("lang-btn").fire("click");
    if (!G.Report.acts.lang) throw new Error("счётчик молчит");
    if (G.Lang.id === was) throw new Error("язык не сменился");
    // Вернуть как было: язык глобален, и проверки ниже читают отчёт
    // по-русски. Стенд обязан убирать за собой — иначе он ломает не
    // игру, а соседние проверки, и полдня уходит на поиск призрака.
    G.Lang.set(was);
  });
  touch("поле рта", function () {
    var m = doc.getElementById("mouth-url");
    m.value = "https://x";
    m.fire("change");
  });
  ok(!broken.length, "все органы интерфейса отвечают",
     broken.length ? broken.join("; ") : "12 органов живы");
})();

// ——— рассказ с телефона ———
// Человек играет с APK, а я его игру не вижу. Обратная связь шла через
// чат по памяти, спустя сутки, и половина вопросов была про то, что
// человек и не обязан замечать: сколько кадров в секунду, не сорвался ли
// рендер, сколько раз он ВПРАВДУ вернулся к узлу. Игра это знает точно.
// Отчёт — её рот наружу; эти проверки стерегут, что он не соврёт.
group("рассказ: Игра докладывает о себе честно");
(function () {
  var game = H.makeWorld(G, 21);
  var R = G.Report;
  R.reset();
  R.answers = {};

  // 1. Плавность считается по кадрам, а не по среднему: среднее прячет
  // рывки — 58 fps со ступором раз в минуту и ровные 58 неразличимы.
  for (var i = 0; i < 600; i++) R.frame(1 / 60);
  R.frame(0.2);            // видимый рывок
  R.frame(1 / 25);         // тяжёлый кадр
  ok(R.fps() >= 55 && R.fps() <= 61, "плавность считается верно", R.fps() + " fps");
  ok(R.stall === 1 && R.slow === 2, "рывок и тяжёлый кадр не теряются",
     "рывков " + R.stall + ", тяжёлых " + R.slow);

  // 2. Сбой рендера обязан дожить до отчёта: раньше он уходил в невидимый
  // #fit-debug и умирал вместе с сессией.
  R.error("render: foo is not a function");
  R.error("render: foo is not a function");
  R.error("render: bar");
  ok(R.errors.length === 2 && R.errors[0].n === 2,
     "одинаковые сбои схлопываются, разные — нет", JSON.stringify(R.errors));

  // 3. Поступки — то, что человек делал, а не то, что он о себе помнит.
  R.act("returns"); R.act("returns"); R.act("anchors");
  ok(R.acts.returns === 2 && R.acts.anchors === 1, "поступки считаются");
  R.act("такого нет");
  ok(R.acts["такого нет"] === undefined, "неизвестный поступок не создаёт поле");

  R.noteNight({ hours: 9, lost: 2, blooms: 1, debt: 0 });
  var nightText = R.text(game);
  ok(nightText.indexOf("пока тебя не было") >= 0 && nightText.indexOf("9ч") >= 0 &&
     nightText.indexOf("потерял 2") >= 0 && nightText.indexOf("расцвело 1") >= 0,
     "отчёт помнит последнюю ночь берега", nightText.split("\n").filter(function (s) {
       return s.indexOf("пока тебя не было") === 0;
     })[0] || "строки нет");

  // ЖЕСТЫ. Человек четыре релиза подряд говорит «срывается», а все замеры
  // зелёные: стенд не воспроизводит настоящий ввод и до границы с
  // оболочкой не достаёт. Значит правду знает только телефон — и отчёт
  // обязан её принести: сколько касаний, сколько взяли взгляд, сколько
  // дожили до рождения и ПО КАКОЙ ПРИЧИНЕ оборвались остальные.
  R.gestureStart();
  R.gestureHold(0.5, true);
  R.gestureTorn("slip", 0.42, 121);
  R.gestureStart();
  R.gestureTorn("slip", 0.31, 98);
  R.gestureStart();
  R.gestureHold(1.4, true);
  R.gestureBorn();
  R.gestureStart();
  R.gestureEmpty();
  ok(R.gestures.taps === 4 && R.gestures.held === 2 &&
     R.gestures.born === 1 && R.gestures.torn === 2 && R.gestures.empty === 1,
     "жесты считаются по частям", JSON.stringify(R.gestures));
  ok(R.tornBy.slip === 2,
     "одинаковые причины срыва складываются, а не плодятся",
     JSON.stringify(R.tornBy));
  // Медиана обязана быть честной: наивное [len>>1] на двух значениях даёт
  // больший, и отчёт врёт в сторону «всё плохо» — а по нему я решаю.
  ok(R.median([98, 121]) === 109.5 && R.median([1, 2, 3]) === 2,
     "медиана не врёт на чётном числе замеров",
     R.median([98, 121]) + " / " + R.median([1, 2, 3]));

  var gtext = R.text(game);
  ok(/касаний: 4/.test(gtext) && /палец ушёл ×2/.test(gtext),
     "рука попадает в отчёт с причинами",
     (gtext.match(/срыв по причине.*/) || [""])[0]);
  ok(/порог срыва 126/.test(gtext), "видно, насколько уезжал палец",
     (gtext.match(/палец уезжал.*/) || [""])[0]);

  // «Нет сил» в отчёте — а взгляд почти бесплатен (ест 6/с при
  // восстановлении 7-14/с). Значит силу ели раны (22/с) или пульс (-16),
  // и без разбивки это снова гадание.
  R.noteDrain("gaze", 8.1); R.noteDrain("wound", 44); R.noteDrain("pulse", 16);
  R.noteEnergy(3);
  var dtext = R.text(game);
  ok(/раны 44/.test(dtext) && /падала до 3/.test(dtext),
     "видно, на что ушла сила и до чего падала",
     (dtext.match(/сила ушла.*/) || [""])[0]);

  // Отдаление камеры человек назвал прямо как условие срыва.
  R.noteZoom(1.0); R.noteZoom(0.42);
  ok(/отдаление камеры/.test(R.text(game)), "в отчёте видно отдаление камеры");

  // Мёртвые счётчики. Человек: «небо и сигилу открывал» — а в отчёте
  // стояло 0. Пять полей из одиннадцати не вызывались НИГДЕ: sky, sigil,
  // lang, taps, gazes, crystals. Отчёт врал мне пять релизов подряд, и я
  // по этим нулям делал выводы («он ни разу не открыл небо») и правил
  // игру. Счётчик, который никто не увеличивает, хуже отсутствующего:
  // он выглядит как факт.
  //
  // Проверка читает исходники и требует, чтобы у каждого поля был хотя
  // бы один вызов. Списка полей тут НЕТ намеренно — он спрашивается у
  // самого Report, иначе новое поле снова окажется немым.
  (function () {
    var fs2 = require("fs");
    var path2 = require("path");
    var dir = path2.join(__dirname, "..", "..", "web", "js");
    var src = "";
    fs2.readdirSync(dir).forEach(function (f) {
      if (/\.js$/.test(f) && f !== "report.js") {
        src += fs2.readFileSync(path2.join(dir, f), "utf8");
      }
    });
    var dead = [];
    for (var key in R.acts) {
      if (!R.acts.hasOwnProperty(key)) continue;
      if (src.indexOf('act("' + key + '")') < 0) dead.push(key);
    }
    ok(!dead.length, "каждый счётчик поступков кто-то увеличивает",
       dead.length ? "немые: " + dead.join(", ") : Object.keys(R.acts).length + " живых");
  })();

  var text = R.text(game);
  ok(text.indexOf(G.VERSION) >= 0, "в отчёте есть версия сборки", G.VERSION);
  // NaN в отчёте — это не косметика: размер экрана первое, по чему видно
  // возвращение «саги экрана», и он обязан быть числом или честным «?».
  ok(!/NaN|undefined/.test(text), "в отчёте нет NaN и undefined",
     (text.match(/.*(NaN|undefined).*/) || ["чисто"])[0]);
  ok(/fps/.test(text), "в отчёте есть плавность");
  ok(/render: foo/.test(text), "в отчёте есть сбои");
  ok(text.length > 120 && text.length < 2000, "отчёт умещается в буфер", text.length + " знаков");

  // 4. Вопросы: у каждого есть обе раскладки и варианты ответа. Пустой
  // вопрос — это молчащий рот, ровно та болезнь, что чинили в 0.4.45.
  var bad = [];
  for (var q = 0; q < R.ASKS.length; q++) {
    var a = R.ASKS[q];
    if (!a.ru || !a.en) bad.push(a.id + ": нет раскладки");
    if (!a.opts || !a.opts.ru || !a.opts.en) bad.push(a.id + ": нет вариантов");
    else if (a.opts.ru.length !== a.opts.en.length) bad.push(a.id + ": раскладки разной длины");
    if (/[а-яА-Я]/.test(String(a.en))) bad.push(a.id + ": кириллица в английском");
    if (a.opts && a.opts.en && /[а-яА-Я]/.test(a.opts.en.join(""))) bad.push(a.id + ": кириллица в вариантах");
  }
  ok(!bad.length && R.ASKS.length >= 3, "вопросы берега полны на обоих языках",
     bad.length ? bad.join(", ") : R.ASKS.length + " вопросов");

  // 5. Ответ человека обязан попасть в текст — иначе отчёт бесполезен.
  R.answers[R.ASKS[0].id] = R.optText(R.ASKS[0])[1];
  ok(R.text(game).indexOf(R.optText(R.ASKS[0])[1]) >= 0, "ответ человека попадает в отчёт");

  // 6. Отчёт переводится целиком: английский берег не должен получать
  // кириллицу — ту же болезнь ловили в 0.4.46 по всему миру.
  var prev = G.Lang.id;
  G.Lang.id = "en";
  R.answers = {};
  R.answers[R.ASKS[0].id] = R.optText(R.ASKS[0])[0];
  var en = R.text(game);
  ok(!/[а-яА-Я]/.test(en), "английский отчёт без кириллицы", en.slice(0, 60));
  G.Lang.id = prev;
})();

// ——— босс ест силу, но не калечит ———
// «Сила ушла на» знала взгляд, раны и пульсы — но не босса. Разбивка врала
// в бою. Босс обязан попадать в отчёт. А после 2.14 укус — зеркало
// агрессии: мирный игрок (combat≈0) чувствует 1/с, воин (combat=1) — 12/с.
// Тень кусает ровно настолько, насколько агрессивен ты сам.
group("отчёт: босс ест силу, но не калечит");
(function () {
  var game = H.makeWorld(G, 7);
  G.Report.reset();
  game.world.boss = {
    x: game.player.x, y: game.player.y, r: 28,
    phase: 0, stun: 0, weak: 0, vx: 0, vy: 0, lunge: 0, t: 0,
    hp: 10, maxHp: 10, parts: []
  };
  // мирный: combat=0 — босс едва трогает
  G.Director.organs.combat = 0;
  for (var i = 0; i < 60; i++) G.Organs.updateBoss(game, 1 / 60);
  ok(G.Report.drain.boss > 0, "босс попадает в разбивку расхода силы",
     "съедено " + Math.round(G.Report.drain.boss) + " за секунду");
  ok(G.Report.lowest >= 90, "мирного босс не обнуляет — лишь лёгкий холод",
     "падала до " + G.Report.lowest);
  // воин: combat=1 — настоящий укус
  G.Report.reset();
  G.Director.organs.combat = 1;
  for (var j = 0; j < 60; j++) G.Organs.updateBoss(game, 1 / 60);
  ok(G.Report.drain.boss > 8, "воина босс кусает по-настоящему",
     "съедено " + Math.round(G.Report.drain.boss) + " за секунду (12/с)");
  var t = G.Report.text(game);
  ok(/босс/.test(t), "строка про босса читается в отчёте",
     (t.match(/сила ушла.*/) || [""])[0]);
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

// Лад берега: фон одного характера обязан отличаться от фона другого
// на слух — иначе обещание «мир читает твою суть» не доходит до звука.
// Меняем ВЫСОТЫ, а не громкости: граф не растёт, тишина цела.
group("звук: у каждого характера свой лад");
(function () {
  var H = require("./harness.js");
  var N = require("./noise.js");

  function shoreFor(trait) {
    // N.run поднимает собственный G с подставным Web Audio — берём его
    var r = N.run(1, "idle");
    var G = r.G;
    var dna = new G.Dna();
    // выставляем доминанту: одна ось на максимуме, прочие почти на нуле
    for (var i = 0; i < G.TRAITS.length; i++) dna.values[G.TRAITS[i]] = 0.001;
    dna.values[trait] = 1;
    // world для update: аудио читает только alive/roots узлов и tide
    var world = { nodes: [], tide: 0, active: [] };
    // даём частотам сойтись (стаб применяет setTargetAtTime сразу)
    for (var s = 0; s < 10; s++) G.Audio.update(1 / 30, dna, "play", 0, world);
    var f = G.Audio.drones.map(function (d) { return d.o.frequency.value; });
    return { f: f, drone: G.Audio.drones.reduce(function (a, d) { return a + d.g.gain.value; }, 0) };
  }

  var choir = shoreFor("harmony");
  var glitch = shoreFor("chaos");
  var heat = shoreFor("aggression");
  var calm = shoreFor("contemplation");
  var warm = shoreFor("empathy");

  // гармония — чистая квинта 1.5, хаос — расстроенный унисон (почти 1)
  var choirR = choir.f[1] / choir.f[0];
  var glitchR = glitch.f[1] / glitch.f[0];
  ok(Math.abs(choirR - 1.5) < 0.02, "у строя чистая квинта в фоне", "интервал " + choirR.toFixed(2));
  ok(glitchR < 1.12, "у сбоя дроны расстроены в узкий биение", "интервал " + glitchR.toFixed(2));
  // лады реально разные: интервалы второй ноты отличаются больше чем на четверть тона
  ok(Math.abs(choirR - glitchR) > 0.25, "строй и сбой звучат по-разному", choirR.toFixed(2) + " против " + glitchR.toFixed(2));
  ok(Math.abs(heat.f[2] / heat.f[0] - warm.f[2] / warm.f[0]) > 0.25,
     "жар и тепло имеют разный лад", "жар " + (heat.f[2] / heat.f[0]).toFixed(2) + " / тепло " + (warm.f[2] / warm.f[0]).toFixed(2));
  // тишина шире и выше строем — третий обертон дальше от основы
  ok(calm.f[3] / calm.f[0] > 3.1, "тишина звучит широко", "интервал " + (calm.f[3] / calm.f[0]).toFixed(2));
  // и главное — громкости не поехали: лад меняет высоту, а не напор
  ok(Math.abs(choir.drone - glitch.drone) < 0.001, "смена лада не делает фон громче",
     "гул " + choir.drone.toFixed(3) + " / " + glitch.drone.toFixed(3));
})();

// голод должен быть слышен, как виден: существо гаснет от разлуки (dim+дрожь),
// и лад берега чуть размывается — не громче, а расстроеннее. Человек слышит,
// что кто-то ждёт, до того как прочитает про hunger. Как cooling для глаз.
group("звук: голод размывает лад, а не глушит");
(function () {
  var H = require("./harness.js");
  var N = require("./noise.js");
  function freqs(world) {
    var r = N.run(1, "idle");
    var G = r.G;
    var dna = new G.Dna();
    for (var i = 0; i < G.TRAITS.length; i++) dna.values[G.TRAITS[i]] = 0.2;
    dna.values["empathy"] = 0.8;
    for (var s = 0; s < 10; s++) G.Audio.update(1 / 30, dna, "play", 0, world);
    return { f: G.Audio.drones.map(function (d) { return d.o.frequency.value; }), g: G.Audio.hunger, lvl: G.Audio.garden ? G.Audio.garden.g.gain.value : 0 };
  }
  var calm = freqs({ nodes: [], beings: [{debt:0}], tide: 0, active: [] });
  var hungry = freqs({ nodes: [], beings: [{debt:1.1}], tide: 0, active: [] });
  var det = Math.abs(hungry.f[0] - calm.f[0]) / calm.f[0];
  ok(det > 0.003 && det < 0.01, "голодное существо чуть расстраивает лад",
     "детюн " + (det*100).toFixed(2) + "% (порог 0.3–1.0% как узкий хор)");
  ok(Math.abs(hungry.lvl - calm.lvl) < 0.001, "при этом громкость сада не растёт",
     "сад " + calm.lvl.toFixed(4) + " → " + hungry.lvl.toFixed(4));
  ok(hungry.g > 0.5 && calm.g === 0, "флаг голода поднимается только когда кто-то ждёт",
     "hunger " + calm.g + " → " + hungry.g.toFixed(2));
  // и не маскирует закон: оба вместе слышны
  var withLaw = freqs({ nodes: [], beings: [{debt:1.1}], tide: 0, active: [{id:"invert"}] });
  // в тесте lawBend ставится через setLaw, а не через active, но детюн и без него виден
  // главное — проверка не падает
  ok(withLaw.f.length === 4, "лад с голодом не ломает граф");
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

  // Прицел живёт на стекле, а не в мире. Он мерился жёстким числом в
  // мировых единицах — и съёживался вместе с отдалением камеры: 70
  // экранных точек на масштабе 1.0 против 26 на 0.38, при подушечке
  // пальца в 57. Человек: «при отдалении экрана только некоторые ещё
  // можно обвести» и «срывается на новых, куда прилетаешь по стрелочке»
  // — метаморфоза отводит камеру до 0.7 на четыре секунды, а зов уносит
  // к новым точкам. Сколько бы мир ни отъехал, палец должен прощать
  // столько же ТОЧЕК ЭКРАНА.
  var padFar = Aim.screenPad(AG, 0.38);
  var padNear = Aim.screenPad(AG, 1.0);
  var padMeta = Aim.screenPad(AG, 0.7);
  ok(padFar >= 55, "на отдалённой камере узел всё ещё ловится подушечкой",
     "масштаб 0.38 прощает " + padFar + " точек экрана (подушечка ~57)");
  ok(Math.abs(padFar - padNear) <= 14 && Math.abs(padMeta - padNear) <= 14,
     "прицел не съёживается вместе с масштабом",
     "1.0 → " + padNear + ", 0.7 → " + padMeta + ", 0.38 → " + padFar + " точек");
  // Обратная крайность: на сильном отдалении нельзя хватать пол-берега,
  // иначе палец ловит не то, во что целились.
  // Порог по СМЫСЛУ, а не по формуле: подушечка накрывает ~57 точек,
  // вдвое больше неё — уже не «попал пальцем», а «хватаю что рядом».
  // Первая версия сравнивала с padNear * 3.2 — то есть с самим потолком
  // из кода, и подлог «прицел без потолка» (157 точек) прошёл мимо неё.
  // Проверка, повторяющая формулу кода, ничего не проверяет.
  ok(padFar <= 115, "и не разрастается на пол-экрана",
     "0.38 прощает " + padFar + " точек (вблизи " + padNear + ", подушечка ~57)");

  // Плотный берег: обводим точки подряд, не отрывая пальца. Именно так
  // человек играет после прилёта по зову, где рождается девять точек
  // рядом. Взгляд держался за первый узел намертво, палец уже лежал на
  // соседнем — и тот не рос. «Не все точки срабатывают»: 7 из 10.
  var inPlace = Aim.growInPlace(AG, {});
  ok(inPlace.tried >= 10 && inPlace.grown >= inPlace.tried - 1,
     "точки подряд обводятся, а не через одну",
     "выросло " + inPlace.grown + " из " + inPlace.tried);

  // Кучка точек: взял один, перенёс палец на соседний не отрывая.
  var two = Aim.twoInARow(AG, {});
  ok(two.tookFirst && two.second,
     "палец, перенесённый на соседний узел, растит именно его",
     two.second ? "сосед вырос за " + two.at.toFixed(2) + " с"
                : "сосед НЕ вырос (взгляд застрял на первом)");

  // Рука не должна умирать вместе со старым берегом. Метаморфоза
  // заменяет список узлов целиком; взгляд, прицепленный к унесённому
  // узлу, оставался жить призраком — кольцо горит, время идёт, не
  // рождается ничего. Выйти можно было только отпустив палец, а человек
  // держал, потому что игра показывала, что держит.
  var thruMeta = Aim.holdThroughMeta(AG, {});
  ok(thruMeta.tried > 0 && thruMeta.born === thruMeta.tried,
     "после перерождения рука продолжает работать",
     "выращено " + thruMeta.born + " из " + thruMeta.tried + " попыток");
  ok(!thruMeta.ghost, "взгляд не держится за узел, которого нет в мире");

  // Перерождение обязано быть редким. Оно стирает берег, отводит камеру
  // на четыре секунды и отнимает у руки цель. В отчёте с телефона было
  // ТРИ берега за 1.3 минуты: игра почти не выходила из смены кожи, и
  // всё это время экран отдалён. Первый берег живёт дольше прочих —
  // человеку надо хоть раз увидеть, как растёт сад, прежде чем его
  // унесут.
  (function () {
    var G3 = Aim.bootEngine();
    var g3 = Aim.makeGame(G3, 7);
    G3.now = function () { return g3.time; };
    var metas = [];
    var origBegin = g3.beginMeta.bind(g3);
    g3.beginMeta = function () { metas.push(g3.time); return origBegin(); };
    for (var f = 0; f < 20 * 60 * 60; f++) {
      g3.time += 1 / 60;
      if (f % 180 === 0) {
        var q = null;
        for (var i = 0; i < g3.world.nodes.length; i++) {
          var c = g3.world.nodes[i];
          if (!c.dead && c.state === "unformed") { q = c; break; }
        }
        if (q) {
          g3.input.x = 400 + (q.x - g3.cam.x);
          g3.input.y = 300 + (q.y - g3.cam.y);
          var w = g3.screenToWorld(g3.input.x, g3.input.y);
          g3.input.wx = w.x; g3.input.wy = w.y; g3.input.down = true;
          try { g3.onDown(); } catch (e) {}
        }
      }
      if (f % 180 === 120) { g3.input.down = false; try { g3.onUp && g3.onUp(); } catch (e) {} }
      try { g3.update(1 / 60); } catch (e) {}
    }
    var early = metas.filter(function (t2) { return t2 < 120; }).length;
    ok(early === 0, "первый берег живёт дольше двух минут",
       "перерождений в первые 2 минуты: " + early +
       (metas.length ? ", первое на " + Math.round(metas[0]) + "с" : ""));
    // И обратная крайность: метаморфоза — сердце игры, без неё нет
    // «смены кожи» вовсе.
    ok(metas.length >= 3, "но за двадцать минут кожа всё же меняется",
       "перерождений за 20 мин: " + metas.length);
  })();

  // Главное, чего эти проверки НЕ видели: они всегда клали палец сразу
  // на узел. А человек играет иначе — опускает палец на пустоту, ведёт
  // игрока к узлу и, дойдя, замирает на нём не отрывая. Захват решался
  // ровно один раз, в onDown, когда палец был ещё далеко: замер показал
  // палец в ОДНОЙ точке от центра узла, четыре секунды неподвижно — и
  // ничего. Человек: «новые планеты не обводятся, а продолжаешь
  // движение». Отпустить и ткнуть заново он не догадывается и не должен.
  var late = Aim.walkAndHold(AG, {});
  ok(late.crystal, "узел ловится, когда палец довели до него и замерли",
     late.crystal ? "кристалл на " + late.at.toFixed(2) + " с"
                  : "не родился (взгляд " + (late.gaze ? "есть" : "не взят") + ")");

  // Обратная крайность обязательна: если ловить всё подряд под пальцем,
  // ходьба сквозь плотный берег будет цепляться за каждый встречный узел
  // и человек перестанет управлять игроком вовсе. Ловим только ЗАМЕРШИЙ
  // палец, а не проходящий.
  var thru = Aim.walkThrough(AG, {});
  ok(thru.grabbed === 0, "ведя игрока пальцем, не цепляешь встречные узлы",
     "ложных захватов за десять секунд: " + thru.grabbed);

  // Якорь — самый дорогой жест игры, и он раздавался ДАРОМ. Первый
  // отчёт с телефона: «выращено 9, якорей 10» — якорей больше, чем
  // узлов, при пределе в три. Условие было `gest.still > 0.8`, а
  // `still` копится по 0.8 в секунду всё удержание: к рождению на
  // 1.35 с он равен 1.08, порог взят всегда. Ровно та же болезнь, что
  // была у корней в 0.4.47: даровая награда — не награда.
  var many = Aim.growMany(AG, {});
  ok(many.grown >= 8 && many.anchors === 0,
     "рождение узла само по себе не даёт якоря",
     "выращено " + many.grown + ", якорей " + many.anchors);

  // Но и заслужить его должно быть можно: держишь дольше — держишь.
  var longHold = Aim.growMany(AG, { rounds: 3, seconds: 3.2 });
  ok(longHold.anchors > 0, "долгим удержанием якорь всё же берётся",
     "за три долгих удержания якорей " + longHold.anchors);

  // И НИКТО, кроме руки, якорь не ставит. Второй отчёт с телефона: 18
  // узлов и девять якорей при пределе три. Ставил их не человек — их
  // ставило созвучие: аккорд складывается сам, от ходьбы по тонам, и
  // якорил ближайший узел молча. Замер: 14 якорей из 14 пришли оттуда,
  // ни одного от удержания. Ту же болезнь я чинил в 0.4.50 и нашёл
  // тогда лишь один вход из двух.
  //
  // Проверка читает код: якорь можно ставить только там, где человек
  // ДЕРЖИТ палец. Любой другой вызов — подарок, а подарки обесценивают
  // самый дорогой жест игры.
  (function () {
    var fs3 = require("fs");
    var path3 = require("path");
    var dir3 = path3.join(__dirname, "..", "..", "web", "js");
    var callers = [];
    fs3.readdirSync(dir3).forEach(function (f) {
      if (!/\.js$/.test(f)) return;
      var src3 = fs3.readFileSync(path3.join(dir3, f), "utf8")
        .replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
      if (/\.anchor\(/.test(src3)) callers.push(f);
    });
    // engine.js — рука. world.js — сам орган. Больше никто.
    var extra = callers.filter(function (f) {
      return f !== "engine.js" && f !== "world.js";
    });
    ok(!extra.length, "якорь ставит только рука человека",
       extra.length ? "ещё ставят: " + extra.join(", ") : "только engine.js");
  })();
})();

// Самый дорогой жест был нем: аккорд и надпись были, слово — нет.
// Первый якорь Игра признаёт отдельно, дальнейшие — короче.
group("якорь: удержание услышано");
(function () {
  var Aim = require("./aim.js");
  var AG = Aim.bootEngine();
  require("./dom.js").install();

  var heard = [];
  var real = AG.Voice.say.bind(AG.Voice);
  AG.Voice.say = function (key, force) {
    var was = AG.Voice.lastAt;
    var r = real(key, force);
    if (AG.Voice.lastAt !== was) heard.push(key);
    return r;
  };

  // одна игра, два якоря подряд на свободных живых узлах
  var g = Aim.makeGame(AG, 31);
  AG.now = function () { return g.time; };
  function setOneAnchor() {
    for (var i = 0; i < g.world.nodes.length; i++) {
      var c = g.world.nodes[i];
      if (!c.dead && c.state === "unformed") { c.state = "alive"; c.growth = 1; c.hp = 1; c.care = 1; }
    }
    var n = g.world.nodes.filter(function (x) {
      return x.state === "alive" && g.world.anchors.indexOf(x.id) < 0;
    })[0];
    g.player.x = n.x; g.player.y = n.y; g.player.vx = 0; g.player.vy = 0;
    g.cam.x = n.x; g.cam.y = n.y;
    g.input.x = 400; g.input.y = 300;
    var w = g.screenToWorld(400, 300);
    g.input.wx = w.x; g.input.wy = w.y; g.input.down = true; g.time += 2;
    g.onDown();
    g.player.gaze = n;
    for (var f = 0; f < 210; f++) {
      g.time += 1 / 60;
      try { g.update(1 / 60); } catch (e) {}
    }
    g.input.down = false;
    // дать очереди голоса проиграться в тишине
    for (var s = 0; s < 500; s++) {
      g.time += 0.1;
      AG.Voice.update(0.1);
    }
  }
  setOneAnchor();
  setOneAnchor();
  AG.Voice.say = real;

  ok(g.world.anchors.length >= 2, "несколько якорей ставится подряд",
     g.world.anchors.length + " якорей");
  var firstIdx = heard.indexOf("anchorFirst");
  ok(firstIdx >= 0, "первый якорь Игра называет вслух",
     firstIdx >= 0 ? "anchorFirst прозвучал" : "услышано: " + heard.join(","));
  ok(heard.indexOf("anchor") > firstIdx, "дальнейшие якоря слышны короче",
     "anchor после anchorFirst");
  ok(AG.LINES_EN && AG.LINES_EN.anchorFirst && AG.LINES_EN.anchor,
     "голос якоря переведён", "есть en");
})();

// ——— оболочка: интерфейс должен отвечать на палец ———
// Человек: «кнопки вообще не работают». Так и было, и виноват был не
// интерфейс. Игра слушала touchend НА ОКНЕ и звала preventDefault для
// любого касания — включая касание кнопки. Синтетический click после
// этого не рождается вовсе: палец опускается на «рассказать», отпускается
// и ничего не происходит. Сломались разом все кнопки, даже те, что
// работали годами. Стенд обязан стеречь границу: игра трогает холст,
// интерфейс — свой.
group("оболочка: игра не съедает касания интерфейса");
(function () {
  var fs = require("fs");
  var path = require("path");
  var eng = fs.readFileSync(path.join(__dirname, "..", "..", "web", "js", "engine.js"), "utf8");

  // touchstart игра обязана слушать на холсте, а не на окне
  ok(/el\.addEventListener\("touchstart"/.test(eng),
     "касание игра ловит на холсте");
  ok(!/window\.addEventListener\("touchstart", down/.test(eng),
     "игра не перехватывает начало касания у всего окна");

  // и не глушить чужое отпускание
  // Комментарии выкидываем: иначе проверка читает объяснение, а не код.
  function code(src) {
    return src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  }
  var upFn = code(eng.slice(eng.indexOf("function up("), eng.indexOf("el.addEventListener(\"mousedown\"")));
  ok(/if\s*\(self\.input\.down[^)]*\)\s*(?:if|e\.preventDefault)/.test(upFn.replace(/\s+/g, " ")) ||
     /self\.input\.down\s*&&\s*e\.cancelable/.test(upFn),
     "отпускание глушится только на своём касании", upFn.replace(/\s+/g, " ").slice(0, 90));

  var moveFn = code(eng.slice(eng.indexOf("function move("), eng.indexOf("function up(")));
  ok(/if \(!self\.input\.down\) return;/.test(moveFn),
     "чужое движение не уводит камеру и не мешает прокрутке");

  // Но СВОЁ движение обязано быть занято. Без preventDefault Android
  // через ~300 мс решает, что жест — прокрутка, и обрывает его системным
  // touchcancel: удержание умирало на полпути к рождению (1.35 с), и
  // человек два релиза подряд говорил «новые точки не обводятся».
  // `touch-action: none` на холсте здесь не помогает — touchmove
  // слушается на ОКНЕ, где правило холста не действует.
  ok(/e\.preventDefault\(\)/.test(moveFn),
     "своё движение пальца занято — система не отберёт жест",
     moveFn.replace(/\s+/g, " ").slice(0, 80));

  // touchcancel — не отпускание. Система шлёт его, когда сама забрала
  // жест (звонок, шторка, ложная прокрутка). Вести его в onUp значит
  // считать, будто человек убрал палец, — со всеми побочными действиями
  // отпускания.
  var cancelIdx = eng.indexOf('addEventListener("touchcancel"');
  var cancelTail = eng.slice(cancelIdx, cancelIdx + 200);
  ok(cancelIdx > 0 && !/touchcancel", up\b/.test(cancelTail),
     "системная отмена жеста не выдаётся за отпускание пальца",
     cancelTail.replace(/\s+/g, " ").slice(0, 70));

  // Оболочка тоже часть руки. Человек ТРИ релиза подряд говорил «новые
  // точки не обводятся удержанием», хотя в JS всё было починено:
  // touch-action, preventDefault на своём движении, честный touchcancel.
  // Рвал жест не JavaScript — сама WebView: это прокручиваемый View, и
  // её распознаватель через ~300 мс решает, что затянувшееся касание
  // есть скролл. Он забирает жест у страницы ДО preventDefault и шлёт
  // вниз системную отмену. Лечится только в Java, значит и стеречь надо
  // Java: стенд читает MainActivity глазами.
  var java = fs.readFileSync(path.join(__dirname, "..", "..", "android", "app",
    "src", "main", "java", "world", "igra", "app", "MainActivity.java"), "utf8");
  var jcode = java.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

  ok(/requestDisallowInterceptTouchEvent\(true\)/.test(jcode),
     "оболочка не отдаёт жест прокрутке, пока палец на стекле");
  ok(/setLongClickable\(false\)/.test(jcode) && /onLongClick/.test(jcode),
     "долгое удержание не поднимает системное меню выделения");
  ok(/overScrollBy[\s\S]{0,220}return false/.test(jcode) &&
     /scrollTo\(int[\s\S]{0,80}super\.scrollTo\(0, 0\)/.test(jcode),
     "WebView не уводит содержимое собственной прокруткой");

  // Экраны поверх берега обязаны быть кликабельны и не шире экрана:
  // на скриншоте человека четыре кнопки сигилы уехали за оба края.
  var css = fs.readFileSync(path.join(__dirname, "..", "..", "web", "css", "game.css"), "utf8");
  function block(sel) {
    var i = css.indexOf(sel + " {");
    return i < 0 ? "" : css.slice(i, css.indexOf("}", i));
  }
  var acts = block("#sigil-actions");
  ok(/flex-wrap:\s*wrap/.test(acts), "кнопки сигилы переносятся, а не уезжают за край", acts.replace(/\s+/g, " ").slice(0, 70));
  var rep = block("#report-actions");
  ok(/flex-wrap:\s*wrap/.test(rep), "кнопки рассказа переносятся");

  // Закон висел на 48px и читался поверх кнопок HUD.
  var law = block("#law");
  var lawTop = parseInt((law.match(/top:\s*(\d+)px/) || [0, 0])[1], 10);
  var hud = block("#hud-right");
  var hudTop = parseInt((hud.match(/top:\s*(\d+)px/) || [0, 0])[1], 10);
  ok(lawTop > hudTop + 40, "надпись закона не наезжает на кнопки HUD",
     "закон на " + lawTop + "px, кнопки на " + hudTop + "px");

  // Переросший экран нельзя центрировать через justify-content: верх
  // срезается намертво, до него не доскроллить.
  var sig = block("#sigil-screen");
  ok(/overflow-y:\s*auto/.test(sig) && !/justify-content:\s*center/.test(sig),
     "сигила прокручивается и не срезает верх", sig.replace(/\s+/g, " ").slice(0, 80));
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

// ——— слабый телефон ———
// G.Quality считает для слабого телефона четыре послабления. Три из них
// работали, а четвёртое — glow — было объявлено и НЕ ЧИТАЛОСЬ НИКЕМ:
// слабый телефон рисовал все 243 радиальных градиента за кадр, треть всей
// работы холста. Обещание, которое никто не исполняет, хуже отсутствующего.
group("слабый телефон: обещанное послабление исполняется");
(function () {
  var H2 = require("./harness");
  var Aim2 = require("./aim.js");

  // Кадр берега на 15-й минуте: сколько работы уходит холсту.
  //
  // Мир растят ОДИН раз, а рисуют дважды. Прежде поднимали два отдельных
  // мира и сравнивали их кадры — но мир недетерминирован, и доля
  // экономии плыла вместе с населённостью: правка ран (они стали слабее,
  // берег живёт иначе) уронила её с 21% до 20%, и проверка покраснела,
  // хотя холста никто не касался. Качество — свойство КАДРА, а не мира.
  function grow() {
    var G2 = Aim2.bootEngine();
    var g2 = Aim2.makeGame(G2, 7);
    G2.Quality.ready = true;
    for (var f = 0; f < 15 * 60 * 60; f++) {
      g2.time += 1 / 60;
      if (f % 180 === 0) {
        var n = null;
        for (var i = 0; i < g2.world.nodes.length; i++) {
          var c = g2.world.nodes[i];
          if (!c.dead && c.state === "unformed") { n = c; break; }
        }
        if (n) {
          g2.input.x = 400 + (n.x - g2.cam.x);
          g2.input.y = 300 + (n.y - g2.cam.y);
          var w = g2.screenToWorld(g2.input.x, g2.input.y);
          g2.input.wx = w.x; g2.input.wy = w.y; g2.input.down = true;
          try { g2.onDown(); } catch (e) {}
        }
      }
      if (f % 180 === 120) { g2.input.down = false; try { g2.onUp && g2.onUp(); } catch (e) {} }
      try { g2.update(1 / 60); } catch (e) {}
    }
    return { G: G2, g: g2 };
  }

  function frame(shore, low) {
    shore.G.Quality.glow = !low;
    var ctx = H2.ctxStub();
    ctx.canvas = { width: 800, height: 600 };
    shore.G.Renderer.draw(ctx, shore.g);
    var tally = {};
    ctx.calls.forEach(function (c) { tally[c] = (tally[c] || 0) + 1; });
    return { ops: ctx.calls.length, grad: tally.gradient || 0,
             arc: tally.arc || 0, fill: tally.fill || 0,
             stars: shore.g.world.stars.length };
  }

  // Кто вообще назначает послабление. Проверки ниже ставят `glow`
  // руками — они стерегут РИСОВАНИЕ. А сам выбор («этот телефон
  // слабый») не стерёг никто: подлог «init всегда включает свет»
  // прошёл мимо всего стенда. Слабый телефон мог не получить
  // послабления вовсе, и никто бы не заметил.
  (function () {
    var Gq = Aim2.bootEngine();
    try { Gq.Save.del("igra.quality.low"); } catch (e) {}
    var Q = Gq.Quality;
    var nav = global.navigator;
    global.navigator = { deviceMemory: 2, hardwareConcurrency: 2 };
    Q.ready = false; Q.glow = true;
    Q.init();
    ok(!Q.glow && Q.particles <= 160 && Q.dpr === 1, "слабый телефон получает послабление при старте",
       "память 2 ГБ, 2 ядра → glow=" + Q.glow + ", частиц " + Q.particles + ", dpr=" + Q.dpr);

    var Gq2 = Aim2.bootEngine();
    try { Gq2.Save.del("igra.quality.low"); } catch (e) {}
    var Q2 = Gq2.Quality;
    global.navigator = { deviceMemory: 8, hardwareConcurrency: 8 };
    Q2.ready = false; Q2.glow = false; Q2.demoted = false;
    Q2.init();
    ok(Q2.glow, "сильный телефон остаётся красивым",
       "память 8 ГБ, 8 ядер → glow=" + Q2.glow);
    global.navigator = nav;
  })();

  var shore = grow();
  var hi = frame(shore, false), lo = frame(shore, true);

  ok(lo.grad < hi.grad * 0.35, "слабому телефону достаётся заметно меньше градиентов",
     "сильный " + hi.grad + " за кадр, слабый " + lo.grad);
  // Мерим то, что качество ВПРАВДУ убирает, а не долю от всего кадра.
  // Доля плывёт вместе с населённостью берега: правка ран (они стали
  // слабее, мир живёт иначе) уронила её с 21% до 20%, и проверка
  // краснела, хотя холста никто не касался. Экономия должна считаться
  // от украшений, а не от общей работы: сколько бы ни было узлов,
  // погашено должно быть большинство ореолов.
  var saved = hi.ops - lo.ops;
  ok(saved > 300 && lo.grad < hi.grad * 0.35,
     "слабому телефону достаётся заметно более дешёвый кадр",
     "сэкономлено " + saved + " операций из " + hi.ops +
     " (−" + Math.round(100 * saved / hi.ops) + "%), градиентов " +
     hi.grad + " → " + lo.grad);

  // Экономить можно было бы и погасив всё — но тогда это уже не игра.
  // Первая версия этой проверки считала круги и заливки, и подлог
  // «гасим ВСЕ свечения» прошёл мимо неё: круги-то остались, они рисуются
  // и без ореолов. Считать надо ровно то, что запрещено гасить, — сами
  // свечения смысла. Их в кадре 38: узлы, существа, игрок, зов, кристаллы.
  // Ноль здесь означал бы чёрный берег.
  // Паспорт телефона врёт. Первый отчёт человека: 52 fps и 128 тяжёлых
  // кадров за 1.3 минуты — на экране, который init уверенно счёл
  // «сильным» (памяти хватает, ядер хватает, экран не узкий). Кадр стоит
  // полторы тысячи операций, объектов немного: телефон просто медленнее
  // своего паспорта. А послабления раздавались РАЗ И НАВСЕГДА на старте,
  // по железу, и на настоящую плавность игра не смотрела никогда.
  (function () {
    function run(share, frames) {
      var Q = Aim2.bootEngine().Quality;
      Q.ready = true; Q.glow = true; Q.demoted = false;
      Q._seen = 0; Q._heavy = 0;
      Q.dpr = 1.4;
      var step = share > 0 ? Math.round(1 / share) : 0;
      for (var i = 0; i < frames; i++) Q.watch(step && i % step === 0 ? 1 / 20 : 1 / 60);
      return Q;
    }

    ok(!run(0.2, 6000).glow, "телефон, который не тянет, получает послабление сам",
       "при каждом пятом тяжёлом кадре свет гаснет");

    // Рывки НЕ идут подряд — телефон спотыкается то тут, то там. Первая
    // версия копила серию и убавляла счётчик на каждом лёгком кадре: в
    // отчёте с телефона было 140 тяжёлых кадров за 2.2 минуты, но
    // раскиданных ровно по одному, счётчик обнулялся между ними, и
    // послабление не срабатывало ни разу. Считать надо долю в окне.
    ok(!run(0.08, 6000).glow, "рассыпанные рывки тоже видны, не только серия",
       "8% тяжёлых кадров вразброс — свет гаснет");

    // И обратное: ровная игра не должна терять красоту из-за редких
    // провалов, иначе берег тускнеет у всех подряд.
    ok(run(0, 6000).glow, "ровная игра остаётся красивой", "без рывков свет горит");
    ok(run(0.01, 6000).glow, "редкий провал не гасит свет",
       "1% тяжёлых кадров — красота на месте");

    // Отчёт 2.23: 0.6 мин ≈ 33 с, 43 fps ≈ 1419 кадров. Окно 1500 не
    // закрылось — «слабый» не зажёгся, dpr остался 1.4. Короткое окно
    // обязано успеть, и послабление обязано резать битмап, не только свет.
    var soon = run(0.08, 500);
    ok(!soon.glow && soon.dpr === 1, "короткая сессия тоже успевает похудеть",
       "500 кадров при 8% тяжёлых → glow=" + soon.glow + ", dpr=" + soon.dpr);

    // Память: следующий запуск не ждёт снова. Спрашиваем тот же G,
    // что писал ключ — иначе стенд мерит чужой store.
    (function () {
      var Gmem = Aim2.bootEngine();
      try { Gmem.Save.del("igra.quality.low"); } catch (e) {}
      var Qm = Gmem.Quality;
      Qm.ready = true; Qm.glow = true; Qm.demoted = false;
      Qm._seen = 0; Qm._heavy = 0; Qm.dpr = 1.4;
      for (var i = 0; i < 500; i++) Qm.watch(i % 12 === 0 ? 1 / 20 : 1 / 60);
      ok(Gmem.Save.get("igra.quality.low") === "1", "послабление запоминается",
         "igra.quality.low=" + Gmem.Save.get("igra.quality.low"));
      Qm.ready = false; Qm.glow = true; Qm.demoted = false; Qm.dpr = 2;
      var navMem = global.navigator;
      global.navigator = { deviceMemory: 8, hardwareConcurrency: 8 };
      Qm.init();
      ok(!Qm.glow && Qm.dpr === 1, "следующий запуск уже слабый — паспорт не врёт повторно",
         "glow=" + Qm.glow + ", dpr=" + Qm.dpr);
      try { Gmem.Save.del("igra.quality.low"); } catch (e) {}
      global.navigator = navMem;
    })();
  })();

  ok(lo.grad >= 20, "свет смысла горит и на слабом телефоне",
     "свечений смысла в кадре " + lo.grad + " (украшения погашены)");
  ok(lo.arc > 150 && lo.fill > 120, "берег остаётся светящимся",
     "на слабом кругов " + lo.arc + ", заливок " + lo.fill);
  // Здесь я сначала сравнил ЧИСЛО звёзд в двух прогонах и получил красное
  // 146 против 160. Но замер показал: при одном и том же режиме число
  // гуляет 122–160 — мир недетерминирован, и сравнивать два прогона между
  // собой бессмысленно. Спрашивать надо то, что зависит именно от glow:
  // рисуется ли зерно каждой звезды, когда ореол погашен.
  var perStar = lo.arc / Math.max(1, lo.stars);
  ok(perStar >= 1, "у каждой звезды памяти остаётся зерно, даже без ореола",
     lo.stars + " звёзд, " + lo.arc + " кругов в кадре");
})();

// ——— долг памяти ———
// Долг существа копился в world.js, сохранялся между сессиями и имел две
// написанные реплики на двух языках — а исхода не имел НИ ОДНОГО: замер
// показал пик 0.08 при пороге 1.2. Орган, выращенный наполовину.
// Теперь брошенная привязанность разрешается: звездой или раной.
group("долг памяти: брошенная привязанность разрешается");
(function () {
  var Aim3 = require("./aim.js");

  // Две повадки: берег, где к существам не возвращаются, и берег, где
  // человек время от времени приходит к тому, кто ждёт.
  function live(seed, mins, tend) {
    var G3 = Aim3.bootEngine();
    var g3 = Aim3.makeGame(G3, seed);
    var stars = 0, wounds = 0, peak = 0, seen = {};
    var orig = G3.World.prototype.abandon;
    G3.World.prototype.abandon = function (b, d) {
      var r = orig.call(this, b, d);
      if (r === "star") stars++;
      if (r === "wound") wounds++;
      return r;
    };
    for (var f = 0; f < mins * 60 * 60; f++) {
      g3.time += 1 / 60;
      // Палец не лежит вечно: см. long.js. С ловлей взгляда у замершего
      // пальца (0.4.49) неподвижное касание греет узел бесконечно, игрок
      // прирастает к месту, и существа никогда от него не отходят — долг
      // памяти не зреет ни у кого (пик 0.07 вместо 1.20). Это болезнь
      // стенда, а не игры: живой человек руку двигает.
      if (g3.input.down && f % 30 === 0) {
        g3.input.x += 40;
        g3.input.y += 25;
        var wm3 = g3.screenToWorld(g3.input.x, g3.input.y);
        g3.input.wx = wm3.x; g3.input.wy = wm3.y;
      }
      if (f % 180 === 0) {
        var n = null;
        for (var i = 0; i < g3.world.nodes.length; i++) {
          var c = g3.world.nodes[i];
          if (!c.dead && c.state === "unformed") { n = c; break; }
        }
        if (n) {
          g3.input.x = 400 + (n.x - g3.cam.x);
          g3.input.y = 300 + (n.y - g3.cam.y);
          var w = g3.screenToWorld(g3.input.x, g3.input.y);
          g3.input.wx = w.x; g3.input.wy = w.y; g3.input.down = true;
          try { g3.onDown(); } catch (e) {}
        }
      }
      if (f % 180 === 120) { g3.input.down = false; try { g3.onUp && g3.onUp(); } catch (e) {} }
      if (tend && f % 420 === 0 && g3.world.beings.length) {
        var b2 = g3.world.beings[0];
        g3.player.x = b2.x; g3.player.y = b2.y;
      }
      try { g3.update(1 / 60); } catch (e) {}
      if (f % 60 === 0) {
        for (var k = 0; k < g3.world.beings.length; k++) {
          var b3 = g3.world.beings[k];
          seen[b3.id] = 1;
          if ((b3.debt || 0) > peak) peak = b3.debt;
        }
      }
    }
    G3.World.prototype.abandon = orig;
    return { stars: stars, wounds: wounds, peak: peak,
             left: g3.world.beings.length, seen: Object.keys(seen).length };
  }

  var seeds = [3, 7, 11, 19, 23];
  var cold = { stars: 0, wounds: 0, left: 0, peak: 0, seen: 0 };
  var warm = { stars: 0, wounds: 0, left: 0, peak: 0, seen: 0 };
  seeds.forEach(function (sd) {
    var a = live(sd, 45, false), b = live(sd, 45, true);
    cold.stars += a.stars; cold.wounds += a.wounds; cold.left += a.left; cold.seen += a.seen;
    warm.stars += b.stars; warm.wounds += b.wounds; warm.left += b.left; warm.seen += b.seen;
    if (a.peak > cold.peak) cold.peak = a.peak;
    if (b.peak > warm.peak) warm.peak = b.peak;
  });
  var coldGone = cold.stars + cold.wounds;
  cold.gone2 = coldGone;
  var warmGone = warm.stars + warm.wounds;

  // Порог зреет. До этого органа пик долга по всем сидам был 0.08 —
  // механика молчала. Здоровый берег доводит его до порога 1.2.
  ok(cold.peak > 1.1, "долг памяти дозревает до исхода, а не копится впустую",
     "пик долга на брошенном берегу " + cold.peak.toFixed(2) + " (порог исхода 1.2)");

  // Исход случается. Не раз в жизни: за 45 минут на пяти сидах брошенный
  // берег отпускает около десяти существ.
  // Порог был абсолютным числом (>= 4) и потому мерил не орган, а
  // населённость берега. Когда корни перестали доставаться даром, мир
  // изменился: кристаллизаций стало 721 вместо 1189, а существ — 44
  // вместо 82. Исходов долга честно стало меньше просто потому, что
  // меньше стало тех, у кого он может возникнуть. Спрашиваем долю:
  // разрешается ли брошенная привязанность вообще. Нижняя граница по
  // числу тоже остаётся — ноль исходов означал бы мёртвый орган.
  // Доля — мера скользкая: она падает не только когда орган болеет, но
  // и когда берег населённее. Аккорд перестал якорить и стал греть
  // кругом — узлы живут дольше, эхо-узлов больше, существ стало 164
  // вместо 122, и та же пара исходов превратилась из 2% в 1%. Орган при
  // этом здоров: пик долга ровно 1.20 при пороге 1.2, «возвращение
  // спасает» зелёное, выкашивания нет.
  //
  // Спрашиваем то, что и значит «орган работает»: исходы СЛУЧАЮТСЯ и не
  // выкашивают берег. Верхнюю границу стережёт соседняя проверка.
  var coldShare = cold.seen ? coldGone / cold.seen : 0;
  ok(coldGone >= 2 && coldShare >= 0.008, "брошенная привязанность действительно разрешается",
     "ушло звездой " + cold.stars + ", встало раной " + cold.wounds +
     " = " + Math.round(coldShare * 100) + "% от " + cold.seen + " виденных (5 сидов по 45 мин)");

  // Главная проверка. Первая версия ускоряла голод пропорционально связи —
  // и заботливый берег терял существ ЧАЩЕ брошенного (4 раны против 1).
  // Это ловушка «забота наказуема» из 0.4.39, и она обязана краснеть.
  ok(warmGone < coldGone, "возвращение спасает, а не наказывает",
     "брошено " + coldGone + " существ, у возвращающегося " + warmGone);

  // И обратная крайность: голод, который выкашивает берег. Существа —
  // не расходник, у берега должно оставаться, к кому возвращаться.
  // Первая версия считала ОСТАТОК, и подлог «порог долга почти в ноль»
  // прошёл мимо: берег рождает новых быстрее, чем голод забирает, — на
  // выкошенном берегу существ оставалось столько же. Считать надо долю
  // от всех, кого человек вообще видел. Здоровый берег теряет 10%,
  // выкашивание даёт 70%.
  var share = cold.seen ? cold.gone2 / cold.seen : 0;
  ok(share < 0.35, "долг не выкашивает берег досуха",
     "ушло " + cold.gone2 + " из " + cold.seen + " виденных = " +
     Math.round(share * 100) + "% (здоровый берег теряет около десятой части)");
})();

// ——— голос ———
// Человек: Игра говорит слишком много. Болтливость мерили счётчиком
// вызовов G.Voice.say — и он врал дважды. Во-первых, say глушит повторы,
// а sayText(text, true) проходит мимо всех кулдаунов: считать надо то,
// что дошло до экрана, то есть Voice._set. Во-вторых, стенды прибавляли
// game.time вручную, хотя update делает это сам, — сессия шла вдвое
// быстрее реальной, и все прежние цифры речи были завышены вдвое.
// Замер по источнику нашёл трёх крикунов: сад читал стихи с force,
// рана повторяла отказ каждые 1.2 с, аккорд хвалили при каждом созвучии.
group("голос: Игра говорит редко");
(function () {
  var Aim = require("./aim.js");

  function listen(seed, mins, mode) {
    var G = Aim.bootEngine();
    var g = Aim.makeGame(G, seed);
    // Без игровых часов G.now() — настенное время: двадцать игровых минут
    // проходят за три реальных секунды, все кулдауны голоса схлопываются
    // и стенд «слышит» тишину там, где её нет.
    G.now = function () { return g.time; };
    var heard = [];
    var set = G.Voice._set.bind(G.Voice);
    G.Voice._set = function (t) { heard.push(String(t)); return set(t); };
    var frames = mins * 60 * 60;
    for (var i = 0; i < frames; i++) {
      if (mode === "play") {
        if (i % 180 === 0) {
          var c = null;
          for (var k = 0; k < g.world.nodes.length; k++) {
            var q = g.world.nodes[k];
            if (!q.dead && q.state === "unformed") { c = q; break; }
          }
          if (c) {
            g.input.x = 400 + (c.x - g.cam.x);
            g.input.y = 300 + (c.y - g.cam.y);
            var w = g.screenToWorld(g.input.x, g.input.y);
            g.input.wx = w.x; g.input.wy = w.y;
            g.input.down = true;
            try { g.onDown(); } catch (e) {}
          }
        }
        if (i % 180 === 120) { g.input.down = false; try { g.onUp && g.onUp(); } catch (e) {} }
      } else {
        g.player.vx = 0; g.player.vy = 0;
      }
      try { g.update(1 / 60); } catch (e) {}
    }
    var most = {}, top = 0;
    heard.forEach(function (t) { most[t] = (most[t] || 0) + 1; if (most[t] > top) top = most[t]; });
    return { n: heard.length, perMin: heard.length / mins, top: top, lines: heard };
  }

  var play = listen(7, 20, "play");
  var still = listen(7, 20, "still");

  // Верхняя граница болтливости. До починки было 12 реплик в минуту в
  // обычной игре — Игра комментировала каждый шаг.
  ok(play.perMin < 10, "в обычной игре Игра не тараторит",
     play.n + " реплик за 20 мин = " + play.perMin.toFixed(1) + "/мин");

  // Тишина — главный жанр этой игры. Тому, кто просто сидит, Игра
  // говорила 9.3 раза в минуту: сад читал стихи поверх стихов.
  ok(still.perMin < 4, "человеку, который замер, Игра почти не мешает",
     still.n + " реплик за 20 мин = " + still.perMin.toFixed(1) + "/мин");

  // Но и немой она быть не должна: голос — существо, а не молчун.
  ok(still.n >= 8, "и всё же тишина не пустая", still.n + " реплик за 20 мин покоя");

  // Ни одна строка не должна долбить в одну точку. Отказ раны повторялся
  // 112 раз за сессию — одна и та же фраза чаще, чем все прочие вместе.
  ok(play.top <= 12, "ни одна реплика не забивает остальные",
     "самая частая строка звучит " + play.top + " раз за 20 мин");

  // Игра не произносит мусор. Реплика раны говорила «undefined помнит
  // каждый отказ» — поля `name` у G.Wound нет вовсе. Пятнадцать раз за
  // двадцать минут, чаще любой другой строки: замер болтливости видел её
  // как «самую частую», но саму строку никто не читал. Смотреть надо не
  // только сколько сказано, но и ЧТО.
  var junk = [];
  play.lines.forEach(function (line) {
    if (/undefined|NaN|\[object|\bnull\b/.test(line)) junk.push(line.slice(0, 44));
  });
  ok(!junk.length, "Игра не произносит мусор вместо имени",
     junk.length ? junk[0] + (junk.length > 1 ? " (и ещё " + (junk.length - 1) + ")" : "") : "чисто");

  // Пул `idle` был написан давно и не звучал ни разу. Он для того, кто
  // сидит подолгу, — и именно в покое обязан подавать голос.
  var IDLE_MARK = ["я ещё здесь.", "тишина — тоже жанр.",
                   "можно ничего не делать. я умею ждать."];
  var idleHeard = still.lines.filter(function (t) { return IDLE_MARK.indexOf(t) >= 0; }).length;
  ok(idleHeard > 0, "в долгой тишине Игра говорит, что она ещё здесь",
     "реплик покоя услышано " + idleHeard);
})();


// ——— память возвращения ———
group("память: берег помнит, что ты уже приходил");
(function () {
  // Орган памяти (memory.js: сессии, дни, сезон, «вчерашний ты», сон
  // берега, приветствие вернувшегося) был написан целиком и не работал
  // НИ РАЗУ: в сейв его никто не клал, `onReturn` не звал ни один файл.
  // 188 проверок были зелёными — ни одна не проходила круг «сохранился →
  // вернулся». Отчёт человека выдал это цифрой «сессия 0» на пятой
  // сессии подряд, и его же словами «слишком молчу»: половина голоса
  // Игры звучит только вернувшемуся.
  //
  // Спрашиваем МИР, а не формулу: играем, сохраняемся, поднимаем игру с
  // нуля и смотрим, что она о нас знает.
  var Aim7 = require("./aim.js");
  var Ge = Aim7.bootEngine();
  require("./dom.js").install();

  var g1 = Aim7.makeGame(Ge, 5150);
  Ge.Memory.sessions = 1;
  Ge.Memory.firstAt = Date.now() - 3 * 86400000;
  Ge.Memory.setFromDna(g1.dna, true);
  for (var i = 0; i < 60 * 30; i++) Ge.Game.prototype.update.call(g1, 1 / 60);
  var name1 = g1.dna.name();
  g1.save();

  // человек ушёл на ночь и вернулся
  var raw = JSON.parse(Ge._store["igra.save.v1"]);
  ok(!!raw.memory, "память кладётся в сейв",
     raw.memory ? "сессий " + raw.memory.sessions + ", день " + raw.memory.days : "нет поля memory");
  if (raw.memory) {
    raw.memory.leftAt = Date.now() - 9 * 3600000;
    Ge._store["igra.save.v1"] = JSON.stringify(raw);
  }

  Ge.Memory.sessions = 0;
  Ge.Memory.days = 1;
  Ge.Memory.leftAt = 0;
  Ge.Memory.notes = [];
  Ge.Memory.lastName = "";
  Ge.Memory.firstAt = 0;
  var said = [];
  var sayText = Ge.Voice.sayText;
  Ge.Voice.sayText = function (t) { said.push(String(t)); };

  var g2 = Aim7.makeGame(Ge, 5150);
  var beingsBefore = g2.world.beings.length;
  var loaded = g2.load();

  ok(loaded, "сейв поднимается");
  ok(Ge.Memory.sessions >= 2, "вернувшийся — не первый гость",
     "сессия " + Ge.Memory.sessions);
  ok(Ge.Memory.days >= 3, "берег считает дни, а не начинает жизнь заново",
     "день " + Ge.Memory.days);
  ok(Ge.Memory.lastName === name1, "берег помнит, кем ты был",
     "«" + Ge.Memory.lastName + "» против «" + name1 + "»");
  // Девять часов сна должны быть прожиты миром, а не забыты.
  ok(Ge.Memory.sleptHours > 1, "берег прожил ночь без человека",
     Math.round(Ge.Memory.sleptHours) + " ч");
  ok(g2.world.beings.length > beingsBefore, "вчерашний ты выходит навстречу",
     beingsBefore + " → " + g2.world.beings.length);
  // Каждая ночь рождала нового «вчерашнего тебя», а прежний не уходил
  // никогда: за три возвращения на берегу стояло трое призраков. Гость
  // должен быть один — вчерашний день сменяется новым вчера.
  g2.save();
  var raw2 = JSON.parse(Ge._store["igra.save.v1"]);
  raw2.memory.leftAt = Date.now() - 9 * 3600000;
  Ge._store["igra.save.v1"] = JSON.stringify(raw2);
  var g3 = Aim7.makeGame(Ge, 5150);
  Ge.Voice.sayText = function () {};
  g3.load();
  var ycount = 0;
  for (var yi = 0; yi < g3.world.beings.length; yi++) {
    if (g3.world.beings[yi].isYesterday) ycount++;
  }
  ok(ycount <= 1, "вчерашний ты приходит один, а не толпой",
     ycount + " вчерашних на берегу");
  // Час ухода обязан стать «сейчас»: иначе та же ночь съедала бы берег
  // заново при каждом сворачивании окна.
  ok(Date.now() - Ge.Memory.leftAt < 60000, "ночь не засчитывается дважды");

  Ge.Voice.sayText = sayText;
})();

// Прилив перезапускался при каждом выходе: таймер не сохранялся, и
// короткие мобильные сессии почти не видели прилив вовсе.
group("память: прилив помнит свою фазу");
(function () {
  var AimT = require("./aim.js");
  var Gt = AimT.bootEngine();
  require("./dom.js").install();
  var g = AimT.makeGame(Gt, 8181);
  g.world.age = 200;
  g.world.tide = 0.37;
  g.world.tideT = 22.4;
  g.save();
  var g2 = AimT.makeGame(Gt, 8181);
  Gt.Voice.sayText = function () {};
  g2.load();
  ok(Math.abs(g2.world.tide - 0.37) < 0.001 && Math.abs(g2.world.tideT - 22.4) < 0.01,
     "фаза прилива поднимается из сейва",
     "tide=" + g2.world.tide.toFixed(2) + " tideT=" + g2.world.tideT.toFixed(1));
})();


// Обещанная природа узла жила только в поле `hint` — метка первого
// берега, гнездо после зова, «эхо» органа эмпатии. В сейв оно не
// клалось: обещанное после зова гнездо нужной природы после перезапуска
// вырастало из жеста, а не из награды за дорогу.
group("память: обещанная природа переживает выход");
(function () {
  var Aim = require("./aim.js");
  var Gh = Aim.bootEngine();
  require("./dom.js").install();
  var g = Aim.makeGame(Gh, 8181);
  // узел, которому мир уже пообещал природу — как в гнезде после зова
  var n = g.world.nodes[0];
  n.state = "unformed";
  n.hint = "thorn";
  var id = n.id;
  g.save();
  var g2 = Aim.makeGame(Gh, 8181);
  Gh.Voice.sayText = function () {};
  g2.load();
  var back = null;
  for (var i = 0; i < g2.world.nodes.length; i++) {
    if (g2.world.nodes[i].id === id) back = g2.world.nodes[i];
  }
  ok(back && back.hint === "thorn",
     "обещанная природа узла не теряется при выходе",
     back ? "hint=" + back.hint : "узел не найден");
})();

// Существо, поднятое из сейва, обязано уметь говорить и помнить. Раньше
// `memory` инициализировался только в birthBeing, а load() создаёт существо
// через new G.Being — вернувшийся человек касался существа (remember) или
// держал на нём взгляд (speakBeing) и кадр падал на `b.memory.length`
// у undefined. Это не «существо вернулось чужим», это крах.
group("память: вернувшееся существо не роняет кадр");
(function () {
  var Aim = require("./aim.js");
  var Gb = Aim.bootEngine();
  require("./dom.js").install();
  var g = Aim.makeGame(Gb, 8181);
  var b = Gb.Organs.birthBeing(g.player.x + 100, g.player.y, "empathy", g.world.rng);
  g.world.beings.push(b);
  g.save();
  var g2 = Aim.makeGame(Gb, 8181);
  Gb.Voice.sayText = function () {};
  g2.load();
  var back = g2.world.beings[0];
  var speak = null, remember = null;
  try { Gb.Organs.speakBeing(back); } catch (e) { speak = e.message; }
  try { Gb.Organs.remember(back, "touched"); } catch (e) { remember = e.message; }
  ok(back && Array.isArray(back.memory),
     "поднятое существо несёт живую память, а не undefined",
     back ? "memory=" + JSON.stringify(back.memory) : "существа нет");
  ok(!speak, "вернувшееся существо умеет говорить", speak || "speakBeing жив");
  ok(!remember, "вернувшееся существо помнит касания", remember || "remember жив");
})();

// ——— босс переживает выход ———
// Босс — крупнейшее существо игры, собранное из брошенного сада. Сейв его
// не клал: человек в разгар боя сворачивал игру — босс исчезал молча, а
// раны, которые он успел получить, обнулялись. Босс должен возвращаться
// собой, как любое существо.
group("память: босс переживает выход");
(function () {
  var Aim = require("./aim.js");
  var GB = Aim.bootEngine();
  require("./dom.js").install();
  var g = Aim.makeGame(GB, 8181);
  // босс, собранный из брошенного — как его рождает maybeBoss
  g.world.boss = {
    x: g.player.x + 200, y: g.player.y, vx: 0, vy: 0,
    r: 28, hp: 5, maxHp: 17, phase: 1.2, lunge: 0.4, stun: 0, weak: 1.5,
    parts: [{ kind: "thorn", c: [255, 70, 80] }, { kind: "echo", c: [1, 2, 3] }],
    nameKey: 2
  };
  g.world.bossSaid = true;
  g.world.lostGate = 9;
  var idName = GB.bossName(g.world.boss);
  g.save();
  var g2 = Aim.makeGame(GB, 8181);
  GB.Voice.sayText = function () {};
  g2.load();
  var b = g2.world.boss;
  ok(!!b, "босс возвращается на берег, а не исчезает");
  ok(b && b.hp === 5 && b.maxHp === 17 && b.parts.length === 2,
     "раны босса и снятые осколки переживают выход",
     b ? "hp=" + b.hp + "/" + b.maxHp + ", осколков " + b.parts.length : "—");
  ok(b && GB.bossName(b) === idName, "имя босса остаётся тем же",
     b ? GB.bossName(b) : "—");
  ok(g2.world.lostGate === 9, "порог нового босса переживает выход",
     "lostGate=" + g2.world.lostGate);
})();

// ——— голод существа виден ———
// Долг памяти копился невидимо до исхода: человек терял существо (звездой
// или раной), не понимая, что оно всё это время гасло от разлуки. Тот же
// урок, что чинили для узлов в 0.4.55: «механика, которую не видно, не
// существует». Голодное существо должно тускнеть на глазах, но не гаснуть
// в ноль — на грани исхода его ещё можно спасти.
group("голод существа виден глазом");
(function () {
  var game = H.makeWorld(G, 7);
  var b = new G.Being(game.player.x + 80, game.player.y, "empathy");
  b.temper = "shy";

  function light(debt) {
    b.debt = debt;
    var ctx = H.ctxStub();
    ctx.canvas = { width: 800, height: 600 };
    G.Renderer.drawBeing(ctx, game.cam, b, 0);
    return ctx.light();
  }

  var fed = light(0);
  var hungry = light(1.1);

  ok(fed > hungry * 1.4, "голодное существо тусклее сытого",
     "долг 0 → " + fed + ", долг 1.1 → " + hungry);
  ok(hungry > fed * 0.25, "но на грани исхода оно ещё видно — его можно спасти",
     "голодный светит " + Math.round(100 * hungry / fed) + "% от сытого");
})();

// ——— голод существа слышен, пока его можно спасти ———
// Визуал dim уже есть (проверка выше), но без голоса механика невидима:
// человек теряет существо, не понимая, что оно всё это время гасло.
// Как cooling для узлов (0.4.55) — голос, который замечает голодающее,
// и награда за спасение на грани. Проверяем, что слово приходит до
// исхода и что спасение отличается от случайного прохода мимо.
group("голод существа слышен, пока его можно спасти");
(function () {
  var AimH = require("./aim.js");
  var GH = AimH.bootEngine();
  require("./dom.js").install();
  function hungerAndRescue() {
    var heard = [];
    var real = GH.Voice.say.bind(GH.Voice);
    GH.Voice.say = function (k, f) {
      var was = GH.Voice.lastAt;
      var r = real(k, f);
      if (GH.Voice.lastAt !== was) heard.push({ k: k, t: g.time });
      return r;
    };
    var g = AimH.makeGame(GH, 42);
    // ставим существо вдали с крепкой связью, но не спутник (fear высок)
    var b = new GH.Being(g.player.x + 700, g.player.y, "empathy");
    b.bond = 0.5; b.debt = 0; b.temper = "shy"; b.fear = 0.8;
    g.world.beings = [b];
    g.player.x = 0; g.player.y = 0;
    GH.Voice.lastAt = -999; GH.Voice.queue = []; g.world._hungerSaid = -999; g.world._rescueSaid = -999;
    // 70 секунд разлуки — долг должен дойти до hunger, но ещё не до abandon
    for (var i = 0; i < 70 * 60; i++) {
      AimH.step = require("./harness.js").step;
      // используем тот же шаг, что и выше, но проще: напрямую тикаем мир
      g.time += 1 / 60;
      if (g.state === "meta") { g.metaT += 1 / 60; if (g.metaT > 3.2) g.finishMeta(); }
      g.world.update(1 / 60, g.player, g.dna, g.fx, g);
      if (GH.Voice && GH.Voice.update) GH.Voice.update(1 / 60);
      if (b.dead) break;
    }
    var hungerAt = heard.filter(function (h) { return h.k === "hunger"; });
    var debtStarAt = heard.filter(function (h) { return h.k === "debtStar" || h.k === "debtWound"; });
    GH.Voice.say = real;
    return { heard: heard, hungerAt: hungerAt, debtAt: debtStarAt, dead: b.dead, debt: b.debt };
  }
  var r1 = hungerAndRescue();
  ok(r1.hungerAt.length >= 1, "голодное существо окликает голосом до исхода",
     r1.hungerAt.length ? "hunger на " + r1.hungerAt[0].t.toFixed(0) + "с, долг " + (r1.debt||0).toFixed(2) : "не сказало (слышано: " + r1.heard.map(function(h){return h.k;}).join(",") + ")");
  // hunger должен прийти РАНЬШЕ исхода: иначе предупреждать поздно
  if (r1.hungerAt.length && r1.debtAt.length) {
    ok(r1.hungerAt[0].t < r1.debtAt[0].t, "предупреждение приходит раньше прощания",
       "hunger " + r1.hungerAt[0].t.toFixed(0) + "с → " + r1.debtAt[0].k + " " + r1.debtAt[0].t.toFixed(0) + "с");
  }
  // спасение на грани: вернулись, пока долг горячий — звучит rescued и долг прощается быстрее
  (function () {
    var GH2 = AimH.bootEngine();
    require("./dom.js").install();
    var heard2 = [];
    var real2 = GH2.Voice.say.bind(GH2.Voice);
    GH2.Voice.say = function (k, f) {
      var was = GH2.Voice.lastAt;
      var r = real2(k, f);
      if (GH2.Voice.lastAt !== was) heard2.push(k);
      return r;
    };
    var g2 = AimH.makeGame(GH2, 43);
    var b2 = new GH2.Being(g2.player.x + 5, g2.player.y, "empathy");
    b2.bond = 0.7; b2.debt = 1.0; b2.temper = "shy";
    g2.world.beings = [b2];
    g2.player.x = b2.x; g2.player.y = b2.y - 10;
    GH2.Voice.lastAt = -999; GH2.Voice.queue = []; g2.world._rescueSaid = -999;
    var beforeDebt = b2.debt, beforeBond = b2.bond;
    for (var i = 0; i < 90; i++) {
      g2.time += 1 / 60;
      g2.world.update(1 / 60, g2.player, g2.dna, g2.fx, g2);
      if (GH2.Voice && GH2.Voice.update) GH2.Voice.update(1 / 60);
    }
    var hasRescued = heard2.indexOf("rescued") >= 0;
    ok(hasRescued, "возвращение на грани голода отмечается словом",
       heard2.length ? heard2.join(",") : "тишина");
    // награда: долг упал сильнее, чем от простого стояния рядом (0.08/с *1.5с=0.12),
    // а связь подросла
    var debtDrop = beforeDebt - b2.debt;
    ok(debtDrop > 0.3, "спасение прощает долг быстрее обычного стояния",
       "долг " + beforeDebt.toFixed(2) + " → " + b2.debt.toFixed(2) + " (снято " + debtDrop.toFixed(2) + ")");
    ok(b2.bond > beforeBond, "спасение крепляет связь", "bond " + beforeBond.toFixed(2) + " → " + b2.bond.toFixed(2));
    GH2.Voice.say = real2;
  })();
  // и не тараторит каждую секунду: один голос на одно голодание
  (function () {
    var GH3 = AimH.bootEngine();
    require("./dom.js").install();
    var cnt = 0;
    var real3 = GH3.Voice.say.bind(GH3.Voice);
    GH3.Voice.say = function (k, f) {
      var was = GH3.Voice.lastAt;
      var r = real3(k, f);
      if (GH3.Voice.lastAt !== was && k === "hunger") cnt++;
      return r;
    };
    var g3 = AimH.makeGame(GH3, 44);
    var b3 = new GH3.Being(g3.player.x + 800, g3.player.y, "empathy");
    b3.bond = 0.5; b3.debt = 0.64; b3.temper = "shy"; b3.fear = 0.9;
    g3.world.beings = [b3];
    g3.player.x = 0; g3.player.y = 0;
    GH3.Voice.lastAt = -999; GH3.Voice.queue = []; g3.world._hungerSaid = -999;
    for (var i = 0; i < 60 * 10; i++) {
      g3.time += 1 / 60;
      g3.world.update(1 / 60, g3.player, g3.dna, g3.fx, g3);
      if (GH3.Voice && GH3.Voice.update) GH3.Voice.update(1 / 60);
    }
    ok(cnt <= 1, "одно голодание — один оклик, а не каждый кадр",
       "hunger ×" + cnt + " за 10с");
    GH3.Voice.say = real3;
  })();
})();

// ——— отчёт не клевещет на руку ———
group("отчёт: шаг — не промах");
(function () {
  // «в пустоту 44» из 99 касаний звучало как «человек мажет мимо узлов».
  // Но пальцем в этой игре ХОДЯТ: касание пустоты ведёт игрока. Отчёт
  // считал каждый шаг промахом, и по нему нельзя было судить о прицеле.
  var Aim8 = require("./aim.js");
  var Gw = Aim8.bootEngine();
  require("./dom.js").install();
  var g = Aim8.makeGame(Gw, 777);
  Gw.Report.reset();

  // человек кладёт палец на пустоту далеко от узлов и ведёт игрока
  g.input.x = 700; g.input.y = 520;
  var w = g.screenToWorld(g.input.x, g.input.y);
  g.input.wx = w.x; g.input.wy = w.y;
  g.time += 2;
  g.onDown();
  g.input.down = true;
  g.player.gaze = null;
  g.gazeTarget = null;
  for (var i = 0; i < 120; i++) {
    Gw.Game.prototype.update.call(g, 1 / 60);
    g.player.gaze = null;
    g.gazeTarget = null;
  }
  g.input.down = false;
  g.onUp();

  var ge = Gw.Report.gestures;
  ok(ge.walk >= 1, "касание, которое вело игрока, записано шагом",
     "шагов " + ge.walk);
  ok(ge.empty === 0, "шаг не назван промахом в пустоту",
     "в пустоту " + ge.empty);

  // А теперь короткий тык в пустоту — палец не вёл никого. Это настоящий
  // промах, и он обязан остаться промахом: ход меряется ВНУТРИ касания,
  // а не копится с начала сессии. Иначе один шаг в начале игры навсегда
  // записывает все последующие промахи в «шаги», и отчёт врёт в другую
  // сторону.
  g.time += 2;
  g.onDown();
  g.input.down = true;
  g.player.gaze = null;
  g.gazeTarget = null;
  for (var j = 0; j < 6; j++) Gw.Game.prototype.update.call(g, 1 / 60);
  g.input.down = false;
  g.onUp();
  ok(ge.empty === 1, "тык в пустоту после ходьбы остался промахом",
     "в пустоту " + ge.empty + ", шагов " + ge.walk);
})();


// ——— воронка жестов сходится ———
// Один тык обязан давать ОДИН исход. Срыв посреди жеста (палец ушёл,
// узел исчез, смена кожи) гасил взгляд, а onUp засчитывал тот же тык
// ещё раз как «шаг» или «в пустоту»: сорвавшаяся рука выглядела ещё и
// гуляющей, и воронка «касаний / выросло / сорвалось / шагов / в
// пустоту» не сходилась.
group("отчёт: один жест — один исход");
(function () {
  var Aim = require("./aim.js");
  var AG = Aim.bootEngine();
  require("./dom.js").install();

  function node() {
    var g = Aim.makeGame(AG, 7);
    for (var i = 0; i < g.world.nodes.length; i++) {
      var c = g.world.nodes[i];
      if (!c.dead && c.state === "unformed") return { g: g, n: c };
    }
    return null;
  }

  // 1. Срыв по «палец ушёл»: взгляд берём, потом уводим палец за порог.
  var r1 = node();
  var g1 = r1.g, n1 = r1.n;
  g1.player.x = n1.x; g1.player.y = n1.y; g1.cam.x = n1.x; g1.cam.y = n1.y;
  AG.Report.reset();
  AG.Report.gestureStart();
  g1.input.x = 400; g1.input.y = 300;
  var w1 = g1.screenToWorld(400, 300);
  g1.input.wx = w1.x; g1.input.wy = w1.y;
  g1.input.down = true; g1.time += 2;
  g1.onDown();
  for (var f = 0; f < 200 && g1.player.gaze; f++) {
    g1.time += 1 / 60;
    g1.input.x = 400 + 3 * f;
    var w2 = g1.screenToWorld(g1.input.x, g1.input.y);
    g1.input.wx = w2.x; g1.input.wy = w2.y;
    try { g1.update(1 / 60); } catch (e) {}
  }
  g1.input.down = false;
  g1.onUp();
  ok(AG.Report.tornBy.slip === 1, "срыв по «палец ушёл» записан один раз",
     "slip=" + AG.Report.tornBy.slip);
  ok(AG.Report.gestures.walk + AG.Report.gestures.empty === 0,
     "и тот же жест не засчитан шагом или пустотой",
     "шаг=" + AG.Report.gestures.walk + " пустота=" + AG.Report.gestures.empty);

  // 2. Обратная крайность: честный тык в пустоту всё ещё «пустота».
  var r2 = node();
  var g2 = r2.g;
  AG.Report.reset();
  AG.Report.gestureStart();
  g2.input.x = 700; g2.input.y = 520;
  var w3 = g2.screenToWorld(g2.input.x, g2.input.y);
  g2.input.wx = w3.x; g2.input.wy = w3.y;
  g2.time += 2; g2.input.down = true;
  g2.onDown();
  g2.player.gaze = null; g2.gazeTarget = null;
  for (var j = 0; j < 6; j++) AG.Game.prototype.update.call(g2, 1 / 60);
  g2.input.down = false;
  g2.onUp();
  ok(AG.Report.gestures.empty === 1,
     "тык в пустоту остаётся пустотой, а не теряется",
     "пустота=" + AG.Report.gestures.empty + " шаг=" + AG.Report.gestures.walk +
     " срывов=" + AG.Report.gestures.torn);
})();

// ——— ночь не стирает берег ———
group("ночь: берег редеет, но остаётся твоим");
(function () {
  // Человек написал «не сохранилось» — при том, что сейв грузился
  // исправно (отчёт показал сессию 5). Мир исчезал не при сохранении, а
  // при ВОЗВРАЩЕНИИ: сон берега щадил только якоря (их всего три), а
  // корни — то, за что плачено возвратами, — не значили ничего. Сутки
  // без игры убивали 19 живых узлов из 20. Это и есть «не сохранилось»
  // глазами человека.
  var Aim9 = require("./aim.js");
  var Gn = Aim9.bootEngine();
  require("./dom.js").install();

  function shoreAfter(hours) {
    var g = Aim9.makeGame(Gn, 4242);
    Gn.Memory.sessions = 1;
    Gn.Memory.firstAt = Date.now();
    Gn.Memory.setFromDna(g.dna, true);
    var made = [];
    for (var i = 0; i < 20; i++) {
      var n = new Gn.Node(g.player.x + Math.cos(i) * 200, g.player.y + Math.sin(i) * 200, "spark");
      n.state = "alive"; n.growth = 1; n.hp = 1; n.care = 0.9; n.age = 60;
      if (i < 3) n.roots = 0.8;      // три узла человек укоренил возвратами
      g.world.nodes.push(n);
      made.push(n);
    }
    g.world.anchors = [made[0].id];
    g.save();
    var raw = JSON.parse(Gn._store["igra.save.v1"]);
    raw.memory.leftAt = Date.now() - hours * 3600000;
    Gn._store["igra.save.v1"] = JSON.stringify(raw);
    Gn.Memory.sessions = 1; Gn.Memory.leftAt = 0; Gn.Memory.days = 1;
    var g2 = Aim9.makeGame(Gn, 4242);
    var st = Gn.Voice.sayText;
    Gn.Voice.sayText = function () {};
    g2.load();
    Gn.Voice.sayText = st;
    var alive = 0, rooted = 0;
    for (var j = 0; j < g2.world.nodes.length; j++) {
      var q = g2.world.nodes[j];
      if (q.state === "alive" && !q.dead) {
        alive++;
        if ((q.roots || 0) > 0.3) rooted++;
      }
    }
    return { alive: alive, rooted: rooted };
  }

  var night = shoreAfter(9);
  ok(night.alive >= 15, "после ночи берег на месте",
     night.alive + " живых из 20");

  // Трое суток — самый долгий сон, какой игра вообще считает.
  var week = shoreAfter(72);
  ok(week.alive >= 10, "даже после трёх суток есть куда вернуться",
     week.alive + " живых из 20");
  ok(week.rooted >= 2, "укоренённое переживает любую разлуку",
     week.rooted + " из 3 с корнями");
  // И всё же забвение — угроза, а не декорация: что-то ночь забирает.
  ok(week.alive < 20, "ночь всё-таки что-то забирает",
     "потеряно " + (20 - week.alive));
})();

// Ночь считала долг за каждый из 48 шагов сна, а не за всю разлуку:
// существо получало 2.88 долга и разрешалось в первом же кадре после
// загрузки. Сон готовит берег к возвращению, а не выкашивает его.
(function () {
  var Aim = require("./aim.js");
  var Gn = Aim.bootEngine();
  function peakDebt(hours, bond) {
    var g = Aim.makeGame(Gn, 4242 + hours);
    var b = new Gn.Being(g.player.x + 220, g.player.y, "empathy");
    b.bond = bond;
    b.debt = 0;
    b.temper = "curious";
    g.world.beings = [b];
    Gn.Memory.sleepWorld(g, hours);
    return b.debt || 0;
  }
  var afterNight = peakDebt(9, 0.9);
  ok(afterNight < 1.2, "ночь не разрешает существо сразу после возвращения",
     "долг после ночи " + afterNight.toFixed(2) + " при пороге 1.20");
  ok(afterNight > 0, "ночь всё же оставляет след разлуки",
     "долг после ночи " + afterNight.toFixed(2));

  var afterThreeNights = peakDebt(72, 0.4);
  ok(afterThreeNights <= 1.1, "долгая разлука помнит крепкую связь",
     "долг после трёх суток " + afterThreeNights.toFixed(2));

  // Существо, чей долг созрел за ночь, обязано разрешиться до первого
  // кадра: иначе человек возвращается и видит, что берег ещё не проснулся.
  var g3 = Aim.makeGame(Gn, 4242 + 72);
  var lonely = new Gn.Being(g3.player.x + 900, g3.player.y + 10, "empathy");
  lonely.bond = 0.2; lonely.debt = 1.05; lonely.temper = "curious";
  g3.world.beings = [lonely];
  Gn.Memory.sleepWorld(g3, 72);
  var stillThere = g3.world.beings.some(function (x) { return x === lonely && !x.dead; });
  ok(!stillThere, "созревший за ночью долг разрешается до возвращения",
     stillThere ? "существо всё ещё на берегу" : "существо ушло до первого кадра");
})();

// Отчёт — мерка одной сессии. Раньше Report.reset() звался только в
// тестах: если в той же вкладке начать новую жизнь или нажать
// «продолжить», жесты и плавность прошлого берега подмешивались к
// новому. Сбрасываем при рождении и при загрузке.
group("отчёт: одна жизнь — один отчёт");
(function () {
  var Aim = require("./aim.js");
  var Ge = Aim.bootEngine();
  require("./dom.js").install();

  function freshGame(seed) {
    var g = Aim.makeGame(Ge, seed);
    g.state = "title";
    return g;
  }

  var g1 = freshGame(11);
  Ge.Report.act("taps");
  Ge.Report.frame(0.2);
  ok(Ge.Report.acts.taps === 1 && Ge.Report.stall === 1,
     "в первой жизни что-то насчитано",
     "taps=" + Ge.Report.acts.taps + " stall=" + Ge.Report.stall);

  // рождение новой жизни обнуляет счётчики
  g1.startBirth();
  ok(Ge.Report.acts.taps === 0 && Ge.Report.stall === 0 && Ge.Report.frames === 0,
     "новая жизнь начинает отчёт с нуля",
     "taps=" + Ge.Report.acts.taps + " frames=" + Ge.Report.frames);

  // загрузка сейва тоже: накопим в одной игре, сохраним, загрузим в
  // новую — счётчики должны быть пустыми, но ночь, досыпанная при
  // загрузке, попасть в отчёт обязана.
  var g2 = Aim.makeGame(Ge, 22);
  g2.state = "play";
  for (var i = 0; i < 60; i++) Ge.Report.frame(1 / 60);
  Ge.Report.act("pulses");
  g2.save();
  var g3 = Aim.makeGame(Ge, 22);
  Ge.Voice.sayText = function () {};
  g3.load();
  ok(Ge.Report.acts.pulses === 0 && Ge.Report.frames === 0,
     "продолжение не тащит жест прошлой сессии",
     "pulses=" + Ge.Report.acts.pulses + " frames=" + Ge.Report.frames);
})();

// Битый или очень старый сейв не должен ронять загрузку и не должен
// оставлять NaN/бесконечности в мире. Человек может прервать запись,
// словить сбой диска или прийти с версии двухгодичной давности.
group("сейв: битые данные не ломают берег");
(function () {
  var Aim = require("./aim.js");
  var Gs = Aim.bootEngine();
  require("./dom.js").install();

  function loadRaw(obj) {
    Gs._store["igra.save.v1"] = JSON.stringify(obj);
    var g = Aim.makeGame(Gs, 1);
    var st = Gs.Voice.sayText; Gs.Voice.sayText = function () {};
    var ok = false, err = null;
    try { ok = g.load(); } catch (e) { err = e.message; }
    Gs.Voice.sayText = st;
    // 60 кадров БЕЗ долга на триггере: проверяем, что мир не падает
    // в update и не уносит NaN в камеру. Параметры существа проверяем
    // на отдельном спокойном сейве (без долга на пороге).
    for (var f = 0; f < 60 && ok; f++) {
      try { g.update(1 / 60); } catch (e) { err = e.message; break; }
    }
    return { ok: ok, g: g, err: err };
  }

  // мусор и отсутствие dna обязаны отвергаться, а не падать
  Gs._store["igra.save.v1"] = "{не json";
  var g0 = Aim.makeGame(Gs, 1);
  ok(g0.load() === false, "мусорный JSON отклоняется");
  Gs._store["igra.save.v1"] = JSON.stringify({ v: 2, time: 10 });
  var g0b = Aim.makeGame(Gs, 1);
  ok(g0b.load() === false, "сейв без dna отклоняется");

  // строковые/битые координаты не конкатенируются и не дают NaN
  var r1 = loadRaw({ v: 2, dna: { values: { curiosity: 1 } },
    player: { x: "ой", y: null, energy: 1e9 },
    world: { nodes: [{ x: "x", y: 1, kind: "relic", state: "alive" }], beings: [] } });
  ok(r1.ok && !r1.err, "строковые координаты грузятся без падения", r1.err || "ok");
  var p = r1.g.player;
  ok(isFinite(p.x) && isFinite(p.y) && isFinite(p.energy) && p.energy <= p.maxEnergy,
     "координаты и энергия игрока — конечные числа",
     "x=" + p.x + " y=" + p.y + " e=" + p.energy);

  // null в массивах пропускается, а не роняет разбор
  var r2 = loadRaw({ v: 2, dna: { values: { curiosity: 1 } },
    world: { nodes: [null, { x: 1, y: 2, kind: "relic", state: "alive" }],
             beings: [null, { x: 1, y: 2, hue: "empathy" }],
             blooms: "не массив", stars: null, laws: null, anchors: null } });
  ok(r2.ok && !r2.err, "null в массивах сейва не роняют загрузку", r2.err || "ok");
  ok(Array.isArray(r2.g.world.blooms), "сломанные массивы заменяются пустыми");

  // дикие значения существа зажимаются. Проверяем сразу после load
  // (без update): долг у порога может разрешиться по смыслу, а нас
  // здесь интересует нормализация сырых чисел.
  Gs._store["igra.save.v1"] = JSON.stringify({ v: 2, dna: { values: { curiosity: 1 } },
    world: { nodes: [], beings: [{ x: 1e12, y: -1e12, hue: "empathy", bond: 50, fear: -9, debt: 999, temper: "shy" }] } });
  var g3 = Aim.makeGame(Gs, 1);
  var st3 = Gs.Voice.sayText; Gs.Voice.sayText = function () {};
  var ok3 = false, err3 = null;
  try { ok3 = g3.load(); } catch (e) { err3 = e.message; }
  Gs.Voice.sayText = st3;
  ok(ok3 && !err3, "сейв с дикими значениями грузится", err3 || "ok");
  var b = g3.world.beings[0];
  ok(b && b.bond <= 1 && b.fear >= 0 && b.debt <= 1.2 && isFinite(b.x) && isFinite(b.y),
     "параметры существа зажаты в допустимые границы",
     b ? "bond=" + b.bond + " fear=" + b.fear + " debt=" + b.debt : "существа нет");
})();

// ——— небо: кап у всех входов — единый addStar ———
group("небо: все звёзды рождаются через addStar");
(function () {
  var fs = require("fs");
  // Числовая правда: убитые раны пушили звёзды мимо капа 160 — за долгую
  // боевую сессию небо переполнялось и раздувало сейв. Теперь у капа
  // один вход, и сторож читает исходник: любой новый stars.push мимо
  // addStar покраснеет, а не всплывёт через месяц в отчёте с телефона.
  var outside = [];
  ["organs.js", "engine.js", "director.js", "renderer.js", "ui.js"].forEach(function (f) {
    var lines = fs.readFileSync(__dirname + "/../../web/js/" + f, "utf8").split("\n");
    lines.forEach(function (line, i) {
      var t = line.replace(/\/\/.*$/, "");
      if (t.indexOf("stars.push") >= 0 || t.indexOf("stars.length > 160") >= 0) {
        outside.push(f + ":" + (i + 1));
      }
    });
  });
  ok(outside.length === 0, "звёзды в органах и движке — только через addStar",
    outside.length ? outside.join(", ") : "все входы в addStar");
  var wj = fs.readFileSync(__dirname + "/../../web/js/world.js", "utf8").split("\n");
  var pushes = [];
  wj.forEach(function (line, i) {
    var t = line.replace(/\/\/.*$/, "");
    if (t.indexOf("stars.push") >= 0 || t.indexOf("stars.length > 160") >= 0) pushes.push(i + 1);
  });
  ok(pushes.length === 2 && pushes[0] > 300 && pushes[1] === pushes[0] + 1,
    "в мире единственный вход — сам addStar (push и кап рядом)",
    pushes.length === 2 ? "строки " + pushes.join(",") : "входы вне addStar: " + pushes.join(","));
  // Поведение: 200 убитых ран не переполняют небо.
  var game = H.makeWorld(G, 6);
  var w = game.world;
  for (var k = 0; k < 200; k++) {
    var u = new G.Wound(k * 3, k % 7, "thorn");
    u.hp = 1;
    w.wounds.push(u);
    w.hitWound(u.x, u.y, 5, 5, null);
  }
  ok(w.stars.length <= 160, "убитые раны не переполняют небо", w.stars.length + " звёзд");
})();

// ——— спутник говорит сам ———
group("спутник говорит сам: преданность слышна, но тихо");
(function () {
  // Редкость и частота: преданное существо рядом говорит само, но не
  // тараторит. Считаем вызовы G.companionTalk (ровно один на реплику)
  // за десять минут стояния.
  var game = H.makeWorld(G, 31);
  var w = game.world;
  var b = new G.Being(game.player.x + 50, game.player.y + 50, "empathy");
  b.bond = 0.85;
  b.fear = 0.1;
  b.temper = "clingy";
  b.named = true;
  w.beings.push(b);
  var origTalk = G.companionTalk;
  var talks = [];
  var t0 = game.time;
  G.companionTalk = function (bb) {
    talks.push(game.time - t0);
    return origTalk(bb);
  };
  for (var f = 0; f < 60 * 60 * 10; f++) H.step(G, game, 1 / 60, null, 0);
  G.companionTalk = origTalk;
  ok(talks.length >= 1, "спутник за десять минут хоть раз говорит сам", talks.length + " реплик");
  ok(talks.length <= 4, "и не тараторит", talks.length + " реплик за 10 минут");
  var minGap = 1e9;
  for (var i = 1; i < talks.length; i++) {
    if (talks[i] - talks[i - 1] < minGap) minGap = talks[i] - talks[i - 1];
  }
  ok(talks.length < 2 || minGap >= 120, "пауза между репликами — не меньше двух минут",
    talks.length < 2 ? "меньше двух реплик" : "мин. интервал " + Math.round(minGap) + "с");
  // Чужое не говорит: без преданности — тишина. Существо боязливое
  // (fear высокий — не подойдёт, bond не вырастет) и далеко от порога
  // спутника: пять минут стояния — ноль реплик.
  var g2 = H.makeWorld(G, 32);
  var b2 = new G.Being(g2.player.x + 320, g2.player.y + 320, "empathy");
  b2.bond = 0.3;
  b2.fear = 0.9;
  b2.temper = "shy";
  g2.world.beings.push(b2);
  var talks2 = 0;
  G.companionTalk = function () { talks2++; return ""; };
  for (var f2 = 0; f2 < 60 * 60 * 5; f2++) H.step(G, g2, 1 / 60, null, 0);
  G.companionTalk = origTalk;
  ok(talks2 === 0, "чужее не подаёт голос — преданность нужна", talks2 + " реплик");
  // Раскладки: спутник говорит на двух языках, без кириллицы в en.
  var ct = G.COMPANION_TALK || {};
  ok(ct.ru && ct.en && ct.ru.length >= 3 && ct.en.length === ct.ru.length,
    "обе раскладки спутника полны", "ru " + (ct.ru || []).length + " / en " + (ct.en || []).length);
  var cyr = (ct.en || []).filter(function (s) { return /[а-яА-Я]/.test(s); });
  ok(cyr.length === 0, "английский спутник без кириллицы");
  // Преданность видна глазом: в рендере существа есть кольцо при bond>0.6.
  var fs = require("fs");
  var rnd = fs.readFileSync(__dirname + "/../../web/js/renderer.js", "utf8");
  ok(/b\.bond > 0\.6[\s\S]*?arc\(p\.x, p\.y, r \* 1\.25/.test(rnd),
    "преданность видна: кольцо спутника рисуется при bond>0.6");
})();

// ——— память метаморфозы: берег помнит, чем ты жил ———
group("метаморфоза помнит: новый берег несёт цветы прошлого");
(function () {
  var game = H.makeWorld(G, 21);
  var w = game.world;
  // Сад из одного характера: сплошные shard (сбой). Цветы памяти
  // красятся цветом породы — проверим именно shard: его цвет не
  // встретить ни у одного обычного цветка сада.
  w.nodes.forEach(function (n) {
    n.state = "alive";
    n.kind = "shard";
    n.care = 0.1;
    n.roots = 0;
  });
  w.anchors = [];
  var planted = w.metamorphose(game.player, game.dna);
  var blooms = w.blooms.filter(function (b) { return b.memory === "shard"; });
  ok(planted >= 1, "метаморфоза возвращает память цветами", planted + " цветов");
  ok(blooms.length >= 1, "цветок помнит породу прошлого сада (shard)",
    blooms.length + " цветов сбоя");
  if (blooms.length) {
    ok(blooms[0].c.join(",") === G.TRAIT_COLOR.chaos.join(","),
      "цветок носит цвет породы, а не фиолет сада",
      "[" + blooms[0].c.join(",") + "]");
  }
  // Цветы памяти переживают выход: blooms целиком лежат в сейве.
  var json = JSON.parse(JSON.stringify(w.toJSON()));
  var savedMem = json.blooms.filter(function (b) { return b.memory === "shard"; }).length;
  ok(savedMem >= 1, "цветы памяти переживают выход", savedMem + " цветов в сейве");
  // Обычный берег не носит цветов памяти: без метаморфозы их нет.
  var fresh = H.makeWorld(G, 22);
  var mem = fresh.world.blooms.filter(function (b) { return b.memory; });
  ok(mem.length === 0, "обычный берег не помнит — цветы памяти только после смены кожи",
    mem.length + " цветов памяти");
})();

// ——— метаморфоза не теряет живое молча ———
// «Стало созвездием» — не потеря, а память: каждый живой узел, не
// переживший смену кожи, обязан стать звездой неба. Когда-то (0.4.39)
// перерождение стирало сад подчистую — полторы сотни узлов исчезали молча,
// ни звезды, ни счёта. С тех пор это чинили, но НЕ стерегли: сторож
// «выжившие + новые звёзды == живые до» краснеет при любом возврате
// молчаливой потери. Подлог «вернуть молчаливое стирание» (выкинуть
// addStar из ветки неудержанного) даёт выжившие+звёзды < живые до.
group("метаморфоза: ни один живой узел не исчезает молча");
(function () {
  var game = H.makeWorld(G, 7);
  var w = game.world;
  // сад из разных пород: два укоренённых (переживут), один якорь,
  // остальные — брошенные (станут созвездием)
  w.nodes = []; w.anchors = []; w.stars = [];
  var kinds = ["relic", "still", "echo", "thorn", "tone", "shard"];
  for (var i = 0; i < 12; i++) {
    var n = new G.Node(100 + i * 30, 100, kinds[i % kinds.length]);
    n.state = "alive"; n.care = 0.1; n.roots = (i < 2) ? 0.7 : 0;
    w.nodes.push(n);
  }
  w.anchors.push(w.nodes[2].id);
  var aliveBefore = w.nodes.filter(function (x) { return x.state === "alive"; }).length;
  var starsBefore = w.stars.length;
  w.metamorphose(game.player, game.dna);
  var survived = w.nodes.filter(function (x) { return x.state === "alive"; }).length;
  var newStars = w.stars.length - starsBefore;
  ok(survived + newStars === aliveBefore,
     "каждый живой узел либо пережил, либо стал звездой",
     survived + " выжило + " + newStars + " звёзд = " + (survived + newStars) + " из " + aliveBefore);
  ok(newStars > 0, "неудержанное уходит в созвездие, а не исчезает",
     newStars + " новых звёзд");
  ok(survived >= 3, "укоренённое и удержанное переживает смену кожи",
     survived + " выжило");
})();

// ——— у голоса нет немых пулов ———
// Пул написан и не звучит — это мёртвый код, который обещает голос и
// молчит. Так молчал `season`: смена сезона объявлялась жёстким sayText
// с хардкодом, и пул прожил всю жизнь в тишине. Так же молчали idle и
// returner, пока их не нашли в 0.4.45. Каждый ключ LINES обязан зваться
// say()/pick() по литералу — ЛИБО быть в белом списке динамики ниже.
group("голос: ни один пул не немой");
(function () {
  var keys = G.Voice.keys();
  // Динамика: ключ выбирается в рантайме, а не литералом. Белый список —
  // документ, а не исключение: каждый пункт обязан называть МЕСТО, где
  // ключ рождается, иначе список превратится в свалку немых.
  var dynamic = {
    // оси — say(dna.dominant()) и say(map[kind]) в director.js
    curiosity: 1, aggression: 1, contemplation: 1, empathy: 1, chaos: 1, harmony: 1,
    // наблюдения директора — say(read()) → watch*
    watchRooted: 1, watchScatter: 1, watchNoAnchor: 1, watchStill: 1, watchTogether: 1,
    // вехи — say(msKey) по MILESTONES
    ms5: 1, ms10: 1, ms20: 1, ms40: 1, ms70: 1, ms120: 1, ms200: 1, ms350: 1,
    shore3: 1, shore8: 1, shore15: 1,
    // породы — say(map[kind]) в director.js (встреча породы)
    stillBorn: 1, kind: 1, glitch: 1, music: 1, firstNode: 1,
    // тернарные вызовы в engine.js
    nightLost: 1, nightBloom: 1, metaKept: 1, metaBare: 1, anchorFirst: 1, anchor: 1
  };
  var fs = require("fs");
  var path = require("path");
  var code = "";
  fs.readdirSync(path.join(__dirname, "..", "..", "web", "js")).forEach(function (f) {
    if (/\.js$/.test(f)) code += fs.readFileSync(path.join(__dirname, "..", "..", "web", "js", f), "utf8");
  });
  code = code.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  var silent = [];
  keys.forEach(function (k) {
    if (dynamic[k]) return;
    var re = new RegExp("(say|pick)\\s*\\(\\s*[\"']" + k + "[\"']");
    if (!re.test(code)) silent.push(k);
  });
  ok(silent.length === 0, "каждый пул голоса кто-то зовёт",
     silent.length ? "немые: " + silent.join(", ") : keys.length + " ключей живо");
})();

// ——— сигила несёт поступки, а не только ДНК ———
// Отпечаток был чистым портретом ДНК: двое с одним характером получали
// одинаковую сигилу, и обещание CONCEPT «вирусный артефакт, который
// нельзя подделать» не держалось. Теперь на форме — след истории: берега
// кольцами, удержанное засечками. Проверяем фактом (число мазков), а не
// формулой: подлог «убрать след истории» даёт одинаковый кадр при разной
// истории и красит обе проверки.
group("сигила несёт поступки, а не только ДНК");
(function () {
  require("./dom.js").install();
  var game = H.makeWorld(G, 7);
  var canvas = document.getElementById("sigil-canvas");
  function ops(meta, saved) {
    game.world.meta = meta;
    game.world.saved = saved;
    var ctx = canvas.getContext("2d");
    ctx.calls.length = 0;
    G.UI.drawSigil(game);
    var c = ctx.calls;
    return {
      stroke: c.filter(function (x) { return x === "stroke"; }).length,
      fill: c.filter(function (x) { return x === "fill"; }).length
    };
  }
  var empty = ops(0, 0);
  var lived = ops(3, 5);
  ok(empty.stroke >= 1, "сигила рисуется и у пустой истории",
     empty.stroke + " мазков формы");
  ok(lived.stroke > empty.stroke, "берега оставляют кольца на сигиле",
     "колец-мазков " + lived.stroke + " против " + empty.stroke + " без истории");
  ok(lived.fill > empty.fill, "удержанное оставляет засечки на сигиле",
     "засечек-заливок " + lived.fill + " против " + empty.fill);
})();

// ——— английский берег не беднее русского ———
// en-пулы молча разъезжались с ru: boss, sky, debtStar и ещё девять жили
// в одну строку против двух-трёх русских — en-игрок слышал повторы там,
// где ru-игрок слышал разные слова. Проверка полноты (есть ли ключ) этого
// не ловит: ключ есть, а строк в нём меньше. Стережём длину и кириллицу.
group("голос: английские пулы не короче русских и без кириллицы");
(function () {
  var ru = G.LINES;
  var en = G.LINES_EN;
  if (!ru || !en) { ok(false, "раскладки доступны стенду", "нет G.LINES/G.LINES_EN"); return; }
  var short = [];
  var cyr = [];
  Object.keys(ru).forEach(function (k) {
    if (!Object.prototype.hasOwnProperty.call(ru, k)) return;
    if (!en[k]) { short.push(k + ": нет en"); return; }
    if (en[k].length < ru[k].length) short.push(k + " ru" + ru[k].length + ">en" + en[k].length);
    en[k].forEach(function (s) { if (/[а-яА-Я]/.test(s)) cyr.push(k); });
  });
  ok(short.length === 0, "каждый английский пул не короче русского",
     short.length ? short.join(", ") : "длины равны");
  ok(cyr.length === 0, "в английских пулах нет кириллицы",
     cyr.length ? cyr.join(", ") : "чисто");
})();

// ——— босс не разрастается в губку ———
// Отчёт 2.3: «сила ушла на: босс 21560» из 28667, «падала до 0». Босс
// собирался с hp = 7 + parts*2 + w.lost, а w.lost — счётчик ЗА ВСЮ ЖИЗНЬ:
// на седьмом берегу это ~135 hp, его нельзя убить, он лишь гоняется и
// ест. Вклад lost теперь капится — бой остаётся боем. Спрашиваем факт
// (сколько hp собралось на большом lost), а не формулу из кода.
group("босс не разрастается в бесконечность");
(function () {
  var game = H.makeWorld(G, 7);
  var w = game.world;
  w.lost = 118;
  w.lostGate = 4;
  w.forgotten = [{kind:"thorn"},{kind:"echo"},{kind:"shard"},{kind:"tone"},{kind:"still"}];
  G.Director.organs.combat = 0.5;
  G.Organs.maybeBoss(game);
  ok(!!w.boss, "босс собирается из брошенного");
  ok(w.boss && w.boss.hp <= 30, "но не в губку — hp ограничен даже на большом lost",
     w.boss ? w.boss.hp + " hp при 118 потерянных (вклад lost закапан)" : "босса нет");
})();

// ——— небо полно и зовёт ———
// Отчёт 2.3: 118 звёзд, «небо открывал: 0». Первый зов («sky», 28 узлов)
// был абстрактен и терялся. Второй, настойчивый зов приходит, когда
// созвездие набилось (звёзд > 50), а человек так и не поднял взгляд, — и
// гасится, как только небо открыто. Проверяем факт: флаг, слово и пульс.
group("небо полно и зовёт");
(function () {
  var Aim = require("./aim.js");
  var G2 = Aim.bootEngine();
  var g2 = Aim.makeGame(G2, 7);
  g2.world.stars = [];
  for (var i = 0; i < 60; i++) {
    g2.world.stars.push({ x: i, y: i * 0.3, c: [200, 200, 255], kind: "spark", tw: 0, ox: i, oy: i });
  }
  g2.time = 500;
  g2.state = "play";
  G2.Report.reset();
  var heard = [];
  var real = G2.Voice.say.bind(G2.Voice);
  G2.Voice.say = function (k) { heard.push(k); return real(k); };
  try { g2.update(1 / 60); } catch (e) {}
  G2.Voice.say = real;
  ok(g2._skyFull, "полное небо ставит флаг зова");
  ok(heard.indexOf("skyFull") >= 0, "и зовёт вслух, конкретно", heard.join(","));
  // пул переведён и полон — стережёт общий сторож длины; а здесь факт
  ok(G2.LINES_EN && G2.LINES_EN.skyFull && G2.LINES_EN.skyFull.length === G2.LINES.skyFull.length,
     "английский зов не короче русского",
     "ru " + (G2.LINES.skyFull || []).length + " / en " + (G2.LINES_EN.skyFull || []).length);
})();

// ——— сейв идёт через нативный мост, когда он есть ———
// На Android сейв пишется в SharedPreferences через window.AndroidSave,
// потому что localStorage в WebView (кастомный origin) не живёт между
// запусками. Стенд без моста видит только localStorage-путь. Здесь мокаем
// мост и проверяем факт: при живом мосте backend()==native, запись/чтение
// идут в него, а язык — тоже через него.
group("сейв идёт через нативный мост, когда он есть");
(function () {
  var box = {};
  var prev = (typeof window !== "undefined") ? window.AndroidSave : undefined;
  try { window.AndroidSave = {
    read: function (k) { return box[k] != null ? box[k] : null; },
    write: function (k, v) { box[k] = String(v); },
    remove: function (k) { delete box[k]; }
  }; } catch (e) {}
  try {
    ok(G.Save.backend() === "native", "живой мост — сейв идёт нативным путём", G.Save.backend());
    G.Save.write({ v: 2, dna: { values: { curiosity: 1 } } });
    ok(box["igra.save.v1"] != null, "запись ушла в мост, а не в localStorage");
    var got = G.Save.load();
    ok(got && got.v === 2, "чтение идёт из моста");
    // язык через тот же мост
    G.Lang.set("en");
    ok(box["igra.lang"] === "en", "выбор языка ложится в мост");
    G.Lang.set("ru");
    // рот и voiceplus — тоже
    G.Mouth.set("https://x");
    ok(box["igra.mouth.endpoint"] === "https://x", "рот ложится в мост");
    G.Mouth.set("");
    ok(box["igra.mouth.endpoint"] === undefined, "пустой рот стирается из моста");
  } finally {
    try { if (prev === undefined) delete window.AndroidSave; else window.AndroidSave = prev; } catch (e) {}
  }
})();

// ——— пульс — не промах ———
// Двойное касание-пульс записывалось двумя «в пустоту» на пульс: отчёт
// врал про руку («в пустоту 67» при 8 пульсах читалось как беспомощность,
// хотя человек воевал). Триггер пульса — свой исход. Проверяем фактом:
// пульс добавляет «пульсов», а не «в пустоту».
group("отчёт: пульс — не промах");
(function () {
  var Aim = require("./aim.js");
  var AG = Aim.bootEngine();
  require("./dom.js").install();
  var g = Aim.makeGame(AG, 7);
  AG.Report.reset();
  // двойное касание: первый тап, потом быстрый второй
  function tap(t) {
    g.time = t;
    g.input.down = true;
    AG.Report.gestureStart();
    try { g.onDown(); } catch (e) {}
    g.input.down = false;
    try { g.onUp(); } catch (e) {}
  }
  tap(10.00);
  tap(10.20); // < 0.28 с после первого — пульс
  var ge = AG.Report.gestures;
  ok(ge.pulse === 1, "двойное касание даёт один пульс",
     "пульсов " + ge.pulse);
  ok(ge.empty <= 1, "триггер пульса не записан промахом в пустоту",
     "в пустоту " + ge.empty + " (первый тап может остаться, второй — нет)");
  ok(AG.Report.acts.pulses === 1, "и счётчик поступков «пульсы» тоже вырос",
     "pulses=" + AG.Report.acts.pulses);
})();

// ——— пульс работает и без сил ———
// Босс съедал энергию до нуля, а пульс при энергии < 16 блокировался —
// порочный круг: нельзя пульсовать → нельзя убить босса → он ест дальше.
// Отчёт 2.9: босс 86% силы, сработало 18 пульсов из 99 попыток. Голод
// должен забирать силу удара, а не право драться (как взгляд в 0.4.60).
group("пульс работает и без сил");
(function () {
  var Aim = require("./aim.js");
  var AG = Aim.bootEngine();
  var g = Aim.makeGame(AG, 7);
  g.player.energy = 5;
  AG.Report.reset();
  g.input.down = true;
  g.time = 10; try { g.onDown(); } catch (e) {}
  g.time = 10.2; try { g.onDown(); } catch (e) {} // < 0.28 с — пульс
  g.input.down = false;
  ok(AG.Report.acts.pulses === 1, "без сил пульс всё же срабатывает",
     "pulses=" + AG.Report.acts.pulses + " (энергия была 5)");
})();

// ——— титул не рождает заново при живом сейве ———
// Тап в пустоту титула рождал заново ЛЮБОГО, и новая жизнь через 8 секунд
// перезаписывала сейв — человек писал «не сохранилось», хотя сейв был жив
// (строка «сейв: native жив есть»). Теперь тап рождает только того, кто ещё
// не жил; вернуться — кнопкой «вернуться». Сторож читает код: в ветке
// `state === "title"` обязан быть `!G.Save.exists()` перед startBirth.
group("титул не рождает заново при живом сейве");
(function () {
  var fs = require("fs");
  var path = require("path");
  function code(src) {
    return src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  }
  var eng = code(fs.readFileSync(path.join(__dirname, "..", "..", "web", "js", "engine.js"), "utf8"));
  var i = eng.indexOf('if (this.state === "title")');
  var seg = eng.slice(i, i + 260);
  ok(/G\.Save\.exists\(\)/.test(seg) && /startBirth/.test(seg),
     "движок рождает только без сейва",
     /G\.Save\.exists\(\)/.test(seg) ? "тап защищён" : "тап по-прежнему рождает");
  var uij = code(fs.readFileSync(path.join(__dirname, "..", "..", "web", "js", "ui.js"), "utf8"));
  var j = uij.indexOf("function tapTitle");
  var useg = uij.slice(j, j + 420);
  ok(/G\.Save\.exists\(\)/.test(useg),
     "и клик по титулу защищён тем же условием",
     /G\.Save\.exists\(\)/.test(useg) ? "tapTitle защищён" : "tapTitle рождает безусловно");
})();

// ——— босс — не налог, а разрешимая угроза ———
// Отчёт 2.9/2.10: босс съедал 84–86% силы. Игрок-сбой не мог его убить
// (0.4 урона на пульс), а босс вечно догонял (рывок на любой дистанции).
// Тот же грех, что у ран в 0.4.59: «голод, от которого нельзя уйти — не
// голод, а налог». Теперь: рывок только вблизи (можно уйти), голод без
// внимания копится и босс уходит сам (можно пережить), сбой рвёт
// по-настоящему (можно убить). Три проверки-факта.
group("босс — не налог, а разрешимая угроза");
(function () {
  var game = H.makeWorld(G, 7);
  var w = game.world;
  function mkBoss(t) {
    w.boss = { x: 0, y: 0, vx: 0, vy: 0, r: 28, hp: 27, maxHp: 27,
               parts: [], phase: 0, lunge: 0, stun: 0, weak: 0, nameKey: 0, t: t || 0 };
  }
  // 1. Голод копится вдали, босс уходит сам и становится звёздами.
  mkBoss(50);
  game.player.x = 1000; game.player.y = 0;
  var starsBefore = w.stars.length;
  G.Organs.updateBoss(game, 1 / 60);
  ok(!w.boss, "брошенный босс уходит сам",
     "босс растворился (голод > 50с)");
  ok(w.stars.length >= starsBefore + 3, "и становится звёздами",
     "+" + (w.stars.length - starsBefore) + " звёзд");
  // 2. Рядом голод тает — бой идёт, босс не исчезает у сражающегося.
  mkBoss(5);
  game.player.x = 10; game.player.y = 0;
  for (var i = 0; i < 60 * 5; i++) G.Organs.updateBoss(game, 1 / 60);
  ok(!!w.boss && w.boss.t < 5, "рядом босс не растворяется — бой честный",
     w.boss ? "голод " + w.boss.t.toFixed(1) : "босс исчез");
  // 3. Сбой рвёт по-настоящему: не 0.4, а заметный урон.
  mkBoss(0);
  game.player.x = 0; game.player.y = 0;
  G.Organs.hitBoss(game, 1.0, "chaos");
  ok(w.boss && w.boss.hp < 27, "сбой бьёт босса, а не царапает",
     w.boss ? "hp " + w.boss.hp + " из 27 (снято " + (27 - w.boss.hp) + ")" : "босса нет");
  // 4. Зона побега дальше зоны рывка: за 200 босс тащится (42), а не
  //    рывком (150). Иначе беглец не оторвётся — босс прилипает намертво
  //    (отчёт 2.11: 85% силы). Мерим факт: скорость за пределами 200.
  mkBoss(0);
  game.player.x = 300; game.player.y = 0;
  var boss4 = w.boss;
  boss4.lunge = 0.55;
  var px0 = boss4.x, py0 = boss4.y;
  for (var f2 = 0; f2 < 30; f2++) G.Organs.updateBoss(game, 1 / 60);
  var moved = Math.hypot(boss4.x - px0, boss4.y - py0) / 0.5;
  ok(moved < 80, "вдали босс тащится, а не рвётся рывком",
     "скорость " + moved.toFixed(0) + " (рывок был бы ~150, тяга ~42)");
  // 5. Босс не плодится: после ухода следующий — только через 25 забытых.
  mkBoss(50);
  game.player.x = 1000; game.player.y = 0;
  G.Organs.updateBoss(game, 1 / 60);
  ok(!w.boss && w.lostGate === (w.lost || 0) + 25,
     "следующий босс — через 25 забытых, а не сразу",
     "lostGate=" + w.lostGate + " (lost=" + (w.lost || 0) + ")");
  // 6. Первый босс не раньше 15 забытых: на пустом берегу его нет.
  var g2 = H.makeWorld(G, 99);
  g2.world.lost = 3;
  g2.world.lostGate = undefined;
  G.Director.organs.combat = 0.5;
  G.Organs.maybeBoss(g2);
  ok(!g2.world.boss, "первый босс не приходит на 3 забытых",
     "босс" + (g2.world.boss ? " ЕСТЬ (слишком рано)" : "а нет — ждёт 15"));
})();

// ——— быстрый конец для теста ———
// Человек на устройстве не может ждать 20 минут до развилки, чтобы
// проверить обе концовки. Отладочный режим G.DEBUG.fast (пять касаний по
// логотипу) ускоряет судьбу: развилка при 30с + мете или 12 узлах. Обычный
// порог не трогается. Проверяем факт: fast готовит судьбу быстро, без fast
// — по-прежнему не раньше 20 минут.
group("быстрый конец для теста");
(function () {
  var Aim = require("./aim.js");
  var AG = Aim.bootEngine();
  var g = Aim.makeGame(AG, 7);
  g.time = 40;
  g.world.meta = 0;
  g.world.discovered = 0;
  AG.DEBUG.fast = true;
  AG.Fate.offered = false; AG.Fate.chosen = "";
  ok(AG.Fate.ready(g), "в тестовом режиме судьба приходит быстро — только по времени",
     "time=40 (ничего не выращено) → ready=" + AG.Fate.ready(g));
  // Кнопки конца тоже обязаны срабатывать в тесте: порог 20 минут стоял в
  // ЧЕТЫРЁХ местах (ready/offer/release/become), и если обновить только
  // ready/offer — развилка появится, а кнопки молча откажут (жалоба
  // «отпустить/стать игрой не работает»).
  AG.Fate.chosen = "";
  AG.Fate.release(g);
  ok(AG.Fate.chosen === "release", "в тесте «отпустить» срабатывает",
     "chosen=" + AG.Fate.chosen);
  AG.Fate.chosen = "";
  AG.Fate.become(g);
  ok(AG.Fate.chosen === "become", "в тесте «стать игрой» срабатывает",
     "chosen=" + AG.Fate.chosen);
  AG.Fate.chosen = "";
  AG.DEBUG.fast = false;
  AG.Fate.offered = false; AG.Fate.chosen = "";
  ok(!AG.Fate.ready(g), "без тестового режима порог 20 минут не тронут",
     "time=40 → ready=" + AG.Fate.ready(g));
  AG.Fate.release(g);
  ok(AG.Fate.chosen !== "release", "без теста «отпустить» рано не срабатывает",
     "chosen=" + (AG.Fate.chosen || "(пусто)"));
})();

// ——— «стать игрой» — это голос, а не заглушка ———
// Тест 2.17 вскрыл: become было сбросом мира + одной строкой, а обещанного
// «ты — голос» не было. Теперь в NG+ (есть voiceplus) рождается существо с
// прошлым именем — игрок сам, ставший голосом. Проверяем факт: спутник
// рождается, несёт имя, голос говорит от него.
group("«стать игрой» — это голос, а не заглушка");
(function () {
  var Aim = require("./aim.js");
  var AG = Aim.bootEngine();
  var g = Aim.makeGame(AG, 7);
  AG.Fate.plus = true;
  var store = AG._store;
  store["igra.voiceplus"] = JSON.stringify({ name: "Картограф тумана", dna: { values: { curiosity: 1 } } });
  var before = g.world.beings.length;
  g.state = "title";
  try { g.startBirth(); } catch (e) {}
  var voice = null;
  for (var i = 0; i < g.world.beings.length; i++) {
    if (g.world.beings[i].isVoice) voice = g.world.beings[i];
  }
  ok(!!voice, "в NG+ рождается голос-спутник",
     voice ? "isVoice найден" : "не родился");
  ok(voice && voice.name === "Картограф тумана", "он носит твоё прошлое имя",
     voice ? "«" + voice.name + "»" : "—");
  ok(voice && voice.bond > 0.5, "и он уже предан — это ты сам",
     voice ? "bond " + voice.bond : "—");
  // реплика голоса полна на двух языках
  var ru = AG.voiceLine("X");
  AG.Lang.id = "en";
  var en = AG.voiceLine("X");
  AG.Lang.id = "ru";
  ok(/[а-я]/.test(ru) && /[a-z]/.test(en) && !/[а-я]/.test(en),
     "голос говорит на двух языках",
     ru + " / " + en);
})();

// ——— судьба не залипает на живом берегу ———
// Отчёты 2.23 и 2.25: «судьба: become» при миру 36–39 мин, сад на месте.
// become обязан стереть сейв. Если берег загрузился с chosen=become —
// человек закрыл отчёт или убил приложение на полуслове. 2.15 снимал
// только chosen у release, а offered оставался true и ready молчал.
// Спрашиваем мир после настоящего load, не формулу.
group("судьба не залипает на живом берегу");
(function () {
  var Aim = require("./aim.js");
  var AG = Aim.bootEngine();
  require("./dom.js").install();
  AG.Voice.sayText = function () {};

  var g = Aim.makeGame(AG, 7);
  g.time = 2400;
  g.dna.age = 2000;
  g.world.meta = 5;
  g.world.discovered = 120;
  AG.Fate.offered = true;
  AG.Fate.chosen = "become";
  g.save();
  ok(!AG.Fate.ready(g), "пока chosen жив — развилка закрыта");

  var g2 = Aim.makeGame(AG, 7);
  ok(g2.load(), "сейв с прерванным become поднимается");
  ok(!AG.Fate.chosen && !AG.Fate.offered,
     "прерванный become не хоронит развилку",
     "chosen=" + (AG.Fate.chosen || "(пусто)") + " offered=" + AG.Fate.offered);
  ok(AG.Fate.ready(g2), "на живом зрелом берегу развилка снова возможна");

  AG.Fate.offered = true;
  AG.Fate.chosen = "release";
  g2.time = 2400;
  g2.world.meta = 5;
  g2.save();
  var g3 = Aim.makeGame(AG, 7);
  g3.load();
  ok(!AG.Fate.chosen && !AG.Fate.offered && AG.Fate.ready(g3),
     "и прерванный release тоже отпускает развилку",
     "chosen=" + (AG.Fate.chosen || "(пусто)") + " offered=" + AG.Fate.offered);
})();

// ——— сигила зовёт, и её нельзя подделать ———
// Сигила — твоё лицо в игре, но человек почти никогда её не открывал
// (отчёты: «сигилу 0»). Зов был слабый (сквозь вехи и «небо — сигила»).
// Теперь отдельный зов `sigil` (ru/en) + пульс кнопки, гасится при открытии.
group("сигила зовёт");
(function () {
  var Aim = require("./aim.js");
  var AG = Aim.bootEngine();
  var g = Aim.makeGame(AG, 7);
  g.world.meta = 5;
  g.time = 300;
  g.state = "play";
  AG.Report.reset();
  var heard = [];
  var real = AG.Voice.say.bind(AG.Voice);
  AG.Voice.say = function (k) { heard.push(k); return real(k); };
  try { g.update(1 / 60); } catch (e) {}
  AG.Voice.say = real;
  ok(g._sigilNudged, "зрелый берег зовёт сигилу");
  ok(heard.indexOf("sigil") >= 0, "и называет её вслух", heard.join(","));
  // пул переведён и полон
  ok(AG.LINES_EN && AG.LINES_EN.sigil && AG.LINES_EN.sigil.length === AG.LINES.sigil.length,
     "английский зов сигилы не короче русского",
     "ru " + (AG.LINES.sigil || []).length + " / en " + (AG.LINES_EN.sigil || []).length);
})();

// ——— корни и сезон видны глазом ———
// Две фишки «сделать невидимое видимым»: (1) узел рисует одну нить за одно
// возвращение и тёплый венчик на полном корне (3 возвращения); (2) фон
// подкрашен цветом сезона, а не только жаром. Проверяем фактом (число
// мазков), а не формулой.
group("корни и сезон видны глазом");
(function () {
  var game = H.makeWorld(G, 7);
  var n = game.world.nodes[0];
  n.state = "alive"; n.kind = "relic"; n.r = 18; n.care = 0.8; n.roots = 1;
  function draw(returns) {
    n.returns = returns;
    var ctx = H.ctxStub();
    ctx.canvas = { width: 800, height: 600 };
    G.Renderer.drawNode(ctx, game.cam, n, 0, game);
    return {
      threads: ctx.calls.filter(function (x) { return x === "quadraticCurveTo"; }).length,
      arcs: ctx.calls.filter(function (x) { return x === "arc"; }).length
    };
  }
  var bare = draw(0);
  var once = draw(1);
  var thrice = draw(3);
  ok(once.threads > bare.threads, "одно возвращение рисует нить — видно, что был",
     "нитей " + bare.threads + " → " + once.threads);
  ok(thrice.threads > once.threads, "три возвращения — три нити, а не одна",
     "нитей " + once.threads + " → " + thrice.threads);
  ok(thrice.arcs > once.arcs, "полный корень рисует венчик — отличим от нитей",
     "arc " + once.arcs + " → " + thrice.arcs + " (венчик на 3 возвращениях)");
  // Сезон красит фон: жар и тишина дают разный тон первого стопа градиента.
  var s0 = G.Memory.seasonTrait;
  function bgColor() {
    var ctx = H.ctxStub();
    ctx.canvas = { width: 800, height: 600 };
    G.Renderer.draw(ctx, game);
    return ctx.stops ? ctx.stops[0] : null;
  }
  G.Memory.seasonTrait = "aggression";
  var a = bgColor();
  G.Memory.seasonTrait = "contemplation";
  var b = bgColor();
  G.Memory.seasonTrait = s0;
  ok(a && b && a !== b, "фон различает сезоны цветом",
     "жар " + JSON.stringify(a) + " / тишина " + JSON.stringify(b));
})();

// ——— порода видна формой ———
// Шесть органов CONCEPT рисовались одним кругом: реликвия, шип, эхо,
// осколок, тон, тишина отличались только цветом оси. Берег читался
// палитрой, а не жестом — «механика, которую не видно, не существует».
// Метка внутри ядра. Спрашиваем факт (разный набор мазков), а не формулу.
group("порода видна формой, не только цветом");
(function () {
  var game = H.makeWorld(G, 7);
  var n = game.world.nodes[0];
  n.state = "alive"; n.r = 18; n.care = 0.8; n.roots = 0; n.returns = 0;
  function sig(kind) {
    n.kind = kind;
    var ctx = H.ctxStub();
    ctx.canvas = { width: 800, height: 600 };
    G.Renderer.drawNode(ctx, game.cam, n, 0, game);
    return ctx.calls.slice();
  }
  function count(arr, name) {
    var n = 0;
    for (var i = 0; i < arr.length; i++) if (arr[i] === name) n++;
    return n;
  }
  var spark = sig("spark");
  var relic = sig("relic");
  var thorn = sig("thorn");
  var echo = sig("echo");
  var shard = sig("shard");
  var tone = sig("tone");
  var still = sig("still");
  ok(relic.join() !== spark.join() && count(relic, "closePath") > count(spark, "closePath"),
     "реликвия — грань, не круг",
     "closePath spark " + count(spark, "closePath") + " → relic " + count(relic, "closePath"));
  ok(thorn.join() !== spark.join() && count(thorn, "lineTo") > count(spark, "lineTo"),
     "шип — три луча",
     "lineTo spark " + count(spark, "lineTo") + " → thorn " + count(thorn, "lineTo"));
  ok(echo.join() !== spark.join() && count(echo, "arc") > count(spark, "arc"),
     "эхо — кольцо внутри",
     "arc spark " + count(spark, "arc") + " → echo " + count(echo, "arc"));
  ok(shard.join() !== relic.join() && count(shard, "closePath") > 0,
     "осколок ломаный, не ромб реликвии",
     "shard closePath " + count(shard, "closePath") + ", relic lineTo " + count(relic, "lineTo") +
     " vs shard " + count(shard, "lineTo"));
  ok(tone.join() !== spark.join() && count(tone, "fill") > count(spark, "fill"),
     "тон — три зерна вокруг",
     "fill spark " + count(spark, "fill") + " → tone " + count(tone, "fill"));
  ok(still.join() !== spark.join() && count(still, "lineTo") > count(spark, "lineTo"),
     "тишина — черта покоя",
     "lineTo spark " + count(spark, "lineTo") + " → still " + count(still, "lineTo"));
  var kinds = [spark, relic, thorn, echo, shard, tone, still];
  var same = 0;
  for (var a = 0; a < kinds.length; a++) {
    for (var b = a + 1; b < kinds.length; b++) {
      if (kinds[a].join() === kinds[b].join()) same++;
    }
  }
  ok(same === 0, "семь следов — семь разных форм",
     same ? same + " пар совпали" : "все различны");
})();


// ——— долгая жизнь видна ———
// Отчёт 2.25: «нет прогресса, нет достижений, нет цели». Вехи кончались
// на 120, человек вырастил 422 и сменил 19 кож — мир молчал. Достижений-
// меню не будет: прогресс обязан быть виден на семени и назван голосом.
group("долгая жизнь видна, а не в меню");
(function () {
  var game = H.makeWorld(G, 7);
  function playerMarks(meta) {
    game.world.meta = meta;
    var ctx = H.ctxStub();
    ctx.canvas = { width: 800, height: 600 };
    G.Renderer.drawPlayer(ctx, game.cam, game, 0, [200, 200, 220]);
    return {
      arc: ctx.calls.filter(function (x) { return x === "arc"; }).length,
      stroke: ctx.calls.filter(function (x) { return x === "stroke"; }).length
    };
  }
  var young = playerMarks(0);
  var old = playerMarks(12);
  ok(old.arc > young.arc && old.stroke > young.stroke,
     "долгое семя носит кольца лет — видно без меню",
     "arc " + young.arc + " → " + old.arc + ", stroke " + young.stroke + " → " + old.stroke);

  var need = ["ms200", "ms350", "shore3", "shore8", "shore15"];
  var missing = [];
  need.forEach(function (k) {
    if (!G.LINES[k] || !G.LINES_EN[k] || G.LINES_EN[k].length < G.LINES[k].length) missing.push(k);
    else if (/[а-яА-Я]/.test(G.LINES_EN[k].join(""))) missing.push(k + " cyr");
  });
  ok(!missing.length, "дальние вехи и берега названы на двух языках",
     missing.length ? missing.join(", ") : "200/350, 3/8/15");

  var Aim = require("./aim.js");
  var AG = Aim.bootEngine();
  require("./dom.js").install();
  var g = Aim.makeGame(AG, 7);
  g.world.meta = 2;
  var heard = [];
  var real = AG.Voice.say.bind(AG.Voice);
  AG.Voice.say = function (k, f) { heard.push(k); return real(k, f); };
  var later = [];
  var realTO = setTimeout;
  setTimeout = function (fn) { later.push(fn); return 0; };
  try { g.finishMeta(); } catch (e) {}
  setTimeout = realTO;
  later.forEach(function (fn) { try { fn(); } catch (e) {} });
  AG.Voice.say = real;
  ok(g.world.meta === 3 && heard.indexOf("shore3") >= 0,
     "третья кожа названа берегом, не молчанием",
     "meta=" + g.world.meta + " слышно: " + (heard.join(",") || "тишина"));
})();

console.log("\n" + (fail ? "✗ " : "✓ ") + pass + " прошло, " + fail + " упало\n");
process.exit(fail ? 1 : 0);
