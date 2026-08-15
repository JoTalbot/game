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
  function frame(low) {
    var G2 = Aim2.bootEngine();
    var g2 = Aim2.makeGame(G2, 7);
    G2.Quality.ready = true;
    G2.Quality.glow = !low;
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
    var ctx = H2.ctxStub();
    ctx.canvas = { width: 800, height: 600 };
    G2.Renderer.draw(ctx, g2);
    var tally = {};
    ctx.calls.forEach(function (c) { tally[c] = (tally[c] || 0) + 1; });
    return { ops: ctx.calls.length, grad: tally.gradient || 0,
             arc: tally.arc || 0, fill: tally.fill || 0,
             stars: g2.world.stars.length };
  }

  var hi = frame(false), lo = frame(true);

  ok(lo.grad < hi.grad * 0.35, "слабому телефону достаётся заметно меньше градиентов",
     "сильный " + hi.grad + " за кадр, слабый " + lo.grad);
  ok(lo.ops <= hi.ops * 0.8, "кадр слабого телефона дешевле хотя бы на пятую часть",
     "сильный " + hi.ops + " операций, слабый " + lo.ops +
     " (−" + Math.round(100 * (hi.ops - lo.ops) / hi.ops) + "%)");

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
    var Q = Aim2.bootEngine().Quality;
    Q.ready = true; Q.glow = true; Q.demoted = false; Q._heavy = 0;
    for (var i = 0; i < 300; i++) Q.watch(1 / 20);   // 20 fps
    ok(!Q.glow && Q.demoted, "телефон, который не тянет, получает послабление сам",
       "после 300 тяжёлых кадров glow=" + Q.glow);

    // И обратное: ровная игра не должна терять красоту ни при каких
    // редких провалах — иначе берег тускнеет у всех подряд.
    var Q2 = Aim2.bootEngine().Quality;
    Q2.ready = true; Q2.glow = true; Q2.demoted = false; Q2._heavy = 0;
    for (var j = 0; j < 3600; j++) Q2.watch(j % 120 === 0 ? 1 / 20 : 1 / 60);
    ok(Q2.glow, "ровная игра остаётся красивой", "редкие провалы не гасят свет");
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
  var coldShare = cold.seen ? coldGone / cold.seen : 0;
  ok(coldGone >= 2 && coldShare >= 0.02, "брошенная привязанность действительно разрешается",
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

console.log("\n" + (fail ? "✗ " : "✓ ") + pass + " прошло, " + fail + " упало\n");
process.exit(fail ? 1 : 0);
