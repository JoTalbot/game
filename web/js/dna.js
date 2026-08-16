var IGRA = IGRA || {};
(function (G) {
  "use strict";

  G.TRAITS = [
    "curiosity",
    "aggression",
    "contemplation",
    "empathy",
    "chaos",
    "harmony"
  ];

  G.TRAIT_RU = {
    curiosity: "взгляд",
    aggression: "жар",
    contemplation: "тишина",
    empathy: "тепло",
    chaos: "сбой",
    harmony: "строй"
  };

  // Шесть осей подписаны на сигиле и всплывают над каждым рождением.
  // Имена короткие и образные — «взгляд», а не «любопытство»; в
  // английском держим ту же меру: одно слово, не термин.
  G.TRAIT_EN = {
    curiosity: "gaze",
    aggression: "heat",
    contemplation: "stillness",
    empathy: "warmth",
    chaos: "glitch",
    harmony: "order"
  };

  G.traitName = function (trait) {
    if (G.Lang && G.Lang.id === "en") return G.TRAIT_EN[trait] || trait;
    return G.TRAIT_RU[trait] || trait;
  };

  G.TRAIT_RU_LONG = {
    curiosity: "Взгляд",
    aggression: "Жар",
    contemplation: "Тишина",
    empathy: "Тепло",
    chaos: "Сбой",
    harmony: "Строй"
  };

  G.TRAIT_HINT = {
    curiosity: "ты идёшь туда, где ещё нет имени",
    aggression: "ты касаешься, чтобы изменить силой",
    contemplation: "ты умеешь не делать",
    empathy: "ты останавливаешься перед чужим",
    chaos: "ты ломаешь рамку, чтобы увидеть шов",
    harmony: "ты слышишь пульс и отвечаешь ему"
  };

  // Подпись под сигилой — самое читаемое место игры после имени, и до сих
  // пор она была только по-русски: англичанин видел кириллицу на лице
  // собственного портрета.
  G.TRAIT_HINT_EN = {
    curiosity: "you walk where nothing has a name yet",
    aggression: "you touch in order to change by force",
    contemplation: "you know how not to act",
    empathy: "you stop in front of what is not yours",
    chaos: "you break the frame to see the seam",
    harmony: "you hear the pulse and answer it"
  };

  G.traitHint = function (trait) {
    if (G.Lang && G.Lang.id === "en") return G.TRAIT_HINT_EN[trait] || trait;
    return G.TRAIT_HINT[trait] || trait;
  };

  G.TRAIT_COLOR = {
    curiosity: [78, 224, 255],
    aggression: [255, 59, 78],
    contemplation: [123, 92, 255],
    empathy: [255, 143, 163],
    chaos: [198, 255, 58],
    harmony: [255, 193, 74]
  };

  G.TRAIT_NOTE = {
    curiosity: 659.25,
    aggression: 196.0,
    contemplation: 311.13,
    empathy: 392.0,
    chaos: 233.08,
    harmony: 523.25
  };

  var NAMES = {
    curiosity: ["Смотрящий в сторону", "Картограф тумана", "Тот, кто уходит дальше"],
    aggression: ["Тёплый удар", "Раскалённый", "Тот, кто рвёт форму"],
    contemplation: ["Долгое молчание", "Сад без садовника", "Тот, кто остаётся"],
    empathy: ["Тихое имя", "Держащий чужое", "Тот, к кому возвращаются"],
    chaos: ["Шов наизнанку", "Ошибка, которая живёт", "Тот, кто не повторяется"],
    harmony: ["Второй голос", "Камертон берега", "Тот, кто совпадает"]
  };

  // Имя человека — самое личное, что даёт Игра, и оно было только
  // русским: англичанин играл под кириллическим прозвищем и уносил его
  // в сигиле. Порядок строк тот же, что в NAMES: имя выбирается по
  // индексу от хеша ДНК, поэтому обе раскладки обязаны быть одной длины —
  // иначе при смене языка человек станет кем-то другим.
  var NAMES_EN = {
    curiosity: ["The One Who Looks Away", "Cartographer of Fog", "The One Who Goes Further"],
    aggression: ["Warm Blow", "The White-Hot", "The One Who Tears Form"],
    contemplation: ["Long Silence", "Garden Without a Gardener", "The One Who Stays"],
    empathy: ["Quiet Name", "Holder of What Is Not His", "The One They Return To"],
    chaos: ["Seam Inside Out", "A Mistake That Lives", "The One Who Never Repeats"],
    harmony: ["Second Voice", "Tuning Fork of the Shore", "The One Who Coincides"]
  };

  var HYBRID = {
    "curiosity+aggression": "Охотник за горизонтом",
    "curiosity+contemplation": "Архивариус пустоты",
    "curiosity+empathy": "Ищущий чужие следы",
    "curiosity+chaos": "Взломщик карты",
    "curiosity+harmony": "Собиратель созвездий",
    "aggression+contemplation": "Монах с ножом",
    "aggression+empathy": "Жестокая нежность",
    "aggression+chaos": "Красный сбой",
    "aggression+harmony": "Удар в такт",
    "contemplation+empathy": "Слушающий боль",
    "contemplation+chaos": "Тишина после ошибки",
    "contemplation+harmony": "Колокол без языка",
    "empathy+chaos": "Рана, которая шутит",
    "empathy+harmony": "Хор из двоих",
    "chaos+harmony": "Красивая поломка"
  };

  var HYBRID_EN = {
    "curiosity+aggression": "Hunter of the Horizon",
    "curiosity+contemplation": "Archivist of Emptiness",
    "curiosity+empathy": "Seeker of Other Tracks",
    "curiosity+chaos": "Map Breaker",
    "curiosity+harmony": "Gatherer of Constellations",
    "aggression+contemplation": "Monk With a Knife",
    "aggression+empathy": "Cruel Tenderness",
    "aggression+chaos": "Red Glitch",
    "aggression+harmony": "A Blow in Time",
    "contemplation+empathy": "Listener to Pain",
    "contemplation+chaos": "Silence After the Error",
    "contemplation+harmony": "Bell Without a Tongue",
    "empathy+chaos": "A Wound That Jokes",
    "empathy+harmony": "Choir of Two",
    "chaos+harmony": "Beautiful Breakage"
  };

  // Стенд сторожит полноту обеих раскладок имени: пропажа тут означает,
  // что человек при смене языка получит чужое имя или кириллицу.
  G.NAME_TABLES = { ru: { names: NAMES, hybrid: HYBRID }, en: { names: NAMES_EN, hybrid: HYBRID_EN } };

  G.Dna = function (raw) {
    this.values = {};
    for (var i = 0; i < G.TRAITS.length; i++) {
      var k = G.TRAITS[i];
      this.values[k] = raw && raw[k] != null ? raw[k] : 0.08;
    }
    this.care = 0.5;
    this.stillness = 0;
    this.motion = 0;
    this.taps = 0;
    this.gazes = 0;
    this.pulses = 0;
    this.age = 0;
  };

  G.Dna.prototype.get = function (k) {
    return this.values[k] || 0;
  };

  G.Dna.prototype.add = function (k, amt) {
    if (!this.values.hasOwnProperty(k)) return;
    this.values[k] = G.clamp(this.values[k] + amt, 0, 1);
  };

  // Кормишь одну ось — прочие тихо оседают.
  //
  // ДНК только росла и не убывала никогда: за две минуты игры три оси
  // упирались в 1.0, органы вставали в потолок, и мир переставал
  // меняться. Человек после восьми минут: «захотелось выйти, так как
  // ничего нового» — и он прав, нового не было ни секунды с третьей
  // минуты. Игра обещает читать тебя по поступкам, а читала только
  // первые сто.
  //
  // Теперь это ПОРТРЕТ, а не копилка: сумма осей стремится к пределу,
  // и то, чего ты давно не делал, медленно тает. Забросил жар ради
  // тишины — берег это заметит и станет другим. Осыпь мягкая (двадцатая
  // часть от прибавки на каждую другую ось): характер меняется за
  // минуты, а не мгновенно, и случайное касание не стирает пути.
  G.Dna.prototype.feed = function (k, amt, dt) {
    var gain = amt * (dt || 1);
    this.add(k, gain);
    if (gain <= 0) return;
    // Осыпь пропорциональна ТЕСНОТЕ: пока сумма осей мала, портрет
    // свободно растёт во все стороны; когда мир уже прочитан (сумма к
    // четырём из шести), каждая новая черта вытесняет прежние заметно.
    // При постоянной осыпи 5% три насыщенные оси всё равно стояли в
    // потолке всю игру — замер это показал.
    // Теснота — по САМОЙ ПОЛНОЙ оси, а не по сумме шести.
    //
    // Сумма росла медленно (три оси в потолке при сумме 2.7 из 6), а
    // осыпь считалась от неё — и у самого верха была почти нулевой:
    // 0.007 за кристалл. Две оси упирались в 1.000 и 0.999 и стояли так
    // всю сессию. Отчёт человека это и показал: доминанта «сбой», а
    // сезон «тишина» — они разошлись и не сходились тринадцать минут,
    // потому что перевес между двумя насыщенными осями не набирал даже
    // порога смены. Портрет снова не дышал, просто выше.
    //
    // Смотрим на потолок: чем ближе оси к единице, тем сильнее новая
    // черта вытесняет прежние. У полной оси осыпь становится ощутимой,
    // и характер снова может повернуться.
    var top = 0;
    for (var ti = 0; ti < G.TRAITS.length; ti++) {
      var tv = this.values[G.TRAITS[ti]];
      if (tv > top) top = tv;
    }
    // Порог 0.7, множитель 0.45: при 0.45/1.1 сумма осей переставала
    // расти вовсе — метаморфоза не случалась ни разу за полчаса, берег
    // вымирал (10 узлов вместо 28). Осыпь должна кусаться только у
    // самого потолка, где оси уже неразличимы, а не всю дорогу.
    var crowd = Math.max(0, top - 0.7) / 0.3;
    var drift = gain * (0.05 + crowd * 0.45);
    for (var i = 0; i < G.TRAITS.length; i++) {
      var o = G.TRAITS[i];
      if (o === k) continue;
      // ниже 0.08 не опускаем: ось, упавшая в ноль, перестаёт быть
      // частью портрета и её уже не разбудить.
      if (this.values[o] > 0.08) {
        this.values[o] = Math.max(0.08, this.values[o] - drift);
      }
    }
  };

  G.Dna.prototype.sum = function () {
    var s = 0;
    for (var i = 0; i < G.TRAITS.length; i++) s += this.values[G.TRAITS[i]];
    return s;
  };

  G.Dna.prototype.norm = function () {
    var s = this.sum() || 1;
    var o = {};
    for (var i = 0; i < G.TRAITS.length; i++) {
      var k = G.TRAITS[i];
      o[k] = this.values[k] / s;
    }
    return o;
  };

  G.Dna.prototype.ranked = function () {
    var self = this;
    return G.TRAITS.slice().sort(function (a, b) {
      return self.values[b] - self.values[a];
    });
  };

  G.Dna.prototype.dominant = function () {
    return this.ranked()[0];
  };

  G.Dna.prototype.second = function () {
    return this.ranked()[1];
  };

  G.Dna.prototype.blendRgb = function () {
    var n = this.norm();
    var r = 0,
      g = 0,
      b = 0;
    for (var i = 0; i < G.TRAITS.length; i++) {
      var k = G.TRAITS[i];
      var c = G.TRAIT_COLOR[k];
      var w = n[k];
      r += c[0] * w;
      g += c[1] * w;
      b += c[2] * w;
    }
    // lift so the seed always glows
    var m = Math.max(r, g, b) || 1;
    var lift = 220 / m;
    return [G.clamp(r * lift, 40, 255), G.clamp(g * lift, 40, 255), G.clamp(b * lift, 40, 255)];
  };

  G.Dna.prototype.color = function (a) {
    var c = this.blendRgb();
    return G.rgb(c[0], c[1], c[2], a);
  };

  // Имя не хранится строкой нигде: оно каждый раз выводится из ДНК. Это
  // и делает его переводимым — человек меняет язык и остаётся собой, а не
  // застревает в чужой раскладке. Индекс берётся от хеша ДНК, а не от
  // случайности, поэтому «Картограф тумана» и «Cartographer of Fog» —
  // один и тот же человек.
  G.Dna.prototype.name = function () {
    var tbl = G.NAME_TABLES[G.Lang && G.Lang.id === "en" ? "en" : "ru"] || G.NAME_TABLES.ru;
    var a = this.dominant();
    var b = this.second();
    if (this.values[a] - this.values[b] < 0.06) {
      var key = a < b ? a + "+" + b : b + "+" + a;
      if (tbl.hybrid[key]) return tbl.hybrid[key];
    }
    var pool = tbl.names[a] || NAMES[a];
    return pool[(this.hash() + G.TRAITS.indexOf(b)) % pool.length];
  };

  // Имя по сохранённой ДНК. «Новая игра+» помнила прошлое имя строкой —
  // и голос прошлого игрока обращался к новому на языке той сессии.
  G.dnaName = function (data) {
    if (!data) return "";
    if (data.values) return G.Dna.fromJSON(data).name();
    return "";
  };

  G.Dna.prototype.hash = function () {
    var s = "";
    for (var i = 0; i < G.TRAITS.length; i++) {
      s += this.values[G.TRAITS[i]].toFixed(3) + ",";
    }
    return G.hashStr(s);
  };

  G.Dna.prototype.seed = function () {
    return this.hash();
  };

  G.Dna.prototype.points = function (cx, cy, r) {
    var n = this.norm();
    var pts = [];
    for (var i = 0; i < 6; i++) {
      var k = G.TRAITS[i];
      var mag = 0.22 + n[k] * 0.78;
      var ang = -Math.PI / 2 + i * (Math.PI / 3);
      pts.push({
        x: cx + Math.cos(ang) * r * mag,
        y: cy + Math.sin(ang) * r * mag,
        k: k,
        v: this.values[k],
        n: n[k]
      });
    }
    return pts;
  };

  G.Dna.prototype.toJSON = function () {
    return {
      values: this.values,
      care: this.care,
      age: this.age,
      taps: this.taps,
      gazes: this.gazes,
      pulses: this.pulses
    };
  };

  G.Dna.fromJSON = function (data) {
    var d = new G.Dna(data && data.values);
    if (!data) return d;
    d.care = data.care != null ? data.care : 0.5;
    d.age = data.age || 0;
    d.taps = data.taps || 0;
    d.gazes = data.gazes || 0;
    d.pulses = data.pulses || 0;
    return d;
  };
})(IGRA);
