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

  G.Dna.prototype.feed = function (k, amt, dt) {
    this.add(k, amt * (dt || 1));
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

  G.Dna.prototype.name = function () {
    var a = this.dominant();
    var b = this.second();
    if (this.values[a] - this.values[b] < 0.06) {
      var key = a < b ? a + "+" + b : b + "+" + a;
      if (HYBRID[key]) return HYBRID[key];
    }
    return NAMES[a][(this.hash() + G.TRAITS.indexOf(b)) % NAMES[a].length];
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
