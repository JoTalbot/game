var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // Версия видна в отчёте с телефона: без неё нельзя понять, о какой
  // сборке говорит человек. Сверяется сторожем `tools/check-sync.sh`
  // вместе с build-apk.sh и gradle — три места, одно число.
  G.VERSION = "1.8.2";

  G.TAU = Math.PI * 2;

  G.clamp = function (v, a, b) {
    return v < a ? a : v > b ? b : v;
  };

  // Приведение к конечному числу. Сейв может повредиться или прийти
  // из очень старой версии: строки, null, NaN ломали камеру и физику
  // ("x" + 45 = "x45", NaN в координате игрока). Если значение не
  // число — отдаём значение по умолчанию.
  G.num = function (v, fallback) {
    var n = Number(v);
    return isFinite(n) ? n : (fallback === undefined ? 0 : fallback);
  };

  G.lerp = function (a, b, t) {
    return a + (b - a) * t;
  };

  G.unlerp = function (a, b, v) {
    return (v - a) / (b - a || 1);
  };

  G.map = function (v, a, b, c, d) {
    return c + (d - c) * ((v - a) / (b - a || 1));
  };

  G.smooth = function (t) {
    return t * t * (3 - 2 * t);
  };

  G.smoother = function (t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  };

  G.easeOut = function (t) {
    return 1 - Math.pow(1 - t, 3);
  };

  G.dist = function (ax, ay, bx, by) {
    var dx = ax - bx;
    var dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  };

  G.dist2 = function (ax, ay, bx, by) {
    var dx = ax - bx;
    var dy = ay - by;
    return dx * dx + dy * dy;
  };

  G.ang = function (ax, ay, bx, by) {
    return Math.atan2(by - ay, bx - ax);
  };

  G.normAng = function (a) {
    while (a > Math.PI) a -= G.TAU;
    while (a < -Math.PI) a += G.TAU;
    return a;
  };

  G.lerpAng = function (a, b, t) {
    return a + G.normAng(b - a) * t;
  };

  G.rand = function (a, b) {
    if (b === undefined) return Math.random() * a;
    return a + Math.random() * (b - a);
  };

  G.irand = function (a, b) {
    return Math.floor(G.rand(a, b));
  };

  G.pick = function (arr) {
    return arr[(Math.random() * arr.length) | 0];
  };

  G.chance = function (p) {
    return Math.random() < p;
  };

  G.sign = function (v) {
    return v < 0 ? -1 : v > 0 ? 1 : 0;
  };

  G.hexToRgb = function (h) {
    h = h.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16)
    ];
  };

  G.rgb = function (r, g, b, a) {
    r = r | 0;
    g = g | 0;
    b = b | 0;
    if (a === undefined || a >= 1) return "rgb(" + r + "," + g + "," + b + ")";
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  };

  G.mixRgb = function (a, b, t) {
    return [
      G.lerp(a[0], b[0], t),
      G.lerp(a[1], b[1], t),
      G.lerp(a[2], b[2], t)
    ];
  };

  G.rgbToHsl = function (r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h,
      s,
      l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  };

  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  G.hslToRgb = function (h, s, l) {
    var r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r * 255, g * 255, b * 255];
  };

  // Mulberry32
  G.Rng = function (seed) {
    this.s = seed >>> 0;
  };
  G.Rng.prototype.next = function () {
    var t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  G.Rng.prototype.range = function (a, b) {
    return a + this.next() * (b - a);
  };
  G.Rng.prototype.int = function (a, b) {
    return Math.floor(this.range(a, b));
  };
  G.Rng.prototype.pick = function (arr) {
    return arr[this.int(0, arr.length)];
  };
  G.Rng.prototype.chance = function (p) {
    return this.next() < p;
  };

  G.hashStr = function (s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  G.now = function () {
    return performance.now() / 1000;
  };

  // Немой запасной интерфейс. Игра — душа, а не кнопки: если ui.js не
  // загрузился (стенд, урезанная сборка, ошибка сети), мир должен жить
  // дальше молча, а не падать на пятнадцати вызовах G.UI.*.
  // Настоящий ui.js перекрывает это целиком.
  G.UI = {
    game: null,
    bind: function () {},
    hint: function () {},
    law: function () {},
    paintSeason: function () {},
    paintSigil: function () {},
    toggleSigil: function () {},
    setMute: function () {},
    apply: function () {}
  };
})(IGRA);
