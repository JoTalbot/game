// Стенд без браузера: грузит душу игры (web/js/*.js) в node с подставными
// window/document/localStorage. Браузера в песочнице нет — это единственный
// способ проверить орган до сборки APK. Запуск: node tools/probe/run.js
"use strict";
var fs = require("fs");
var vm = require("vm");
var path = require("path");

var ROOT = path.resolve(__dirname, "..", "..");

var ORDER = [
  "math",
  "lang",
  "dna",
  "save",
  "audio",
  "fx",
  "igra",
  "report",
  "organs",
  "memory",
  "fate",
  "world",
  "director",
  // v3 life arc wraps Director after all legacy logic is loaded.
  "life",
  "renderer",
  // ui грузится последним, как в index.html: он трогает всё остальное
  "ui"
];

function boot(opts) {
  opts = opts || {};
  var store = {};
  global.window = {
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1,
    addEventListener: function () {},
    removeEventListener: function () {},
    matchMedia: function () {
      return { matches: false, addEventListener: function () {} };
    },
    requestAnimationFrame: function () {},
    location: { href: "http://local/", search: "" }
  };
  global.navigator = {
    vibrate: function () {},
    deviceMemory: 4,
    hardwareConcurrency: 4,
    language: "ru",
    userAgent: "probe"
  };
  // Живой подставной DOM: без него не поднять ui.js — 452 строки
  // интерфейса, которые не проверялись ни разу за всю историю игры.
  // Заглушка возвращала null на любой getElementById, и bind() падал бы
  // на первой кнопке.
  require("./dom.js").install();
  global.localStorage = {
    getItem: function (k) {
      return store[k] != null ? store[k] : null;
    },
    setItem: function (k, v) {
      store[k] = String(v);
    },
    removeItem: function (k) {
      delete store[k];
    }
  };
  global.performance = { now: function () { return Date.now(); } };
  global.IGRA = {};

  ORDER.forEach(function (n) {
    var p = path.join(ROOT, "web", "js", n + ".js");
    vm.runInThisContext(fs.readFileSync(p, "utf8"), { filename: n + ".js" });
  });

  var G = global.IGRA;
  if (!opts.audio) {
    G.Audio.tone = function () {};
    G.Audio.chord = function () {};
    G.Audio.pluck = function () {};
    G.Audio.crystallize = function () {};
    G.Audio.tide = function () {};
    G.Audio.ui = function () {};
    G.Audio.speak = function () {};
  }
  G._store = store;
  return G;
}

// Мир без движка: World + Dna + подставная игра с fx/floaters.
function makeWorld(G, seed) {
  seedRandom((seed || 1) * 7919);
  var w = new G.World(seed || 1);
  var dna = new G.Dna();
  // настоящий игрок, а не заглушка: у него есть трейл и мотыльки,
  // без которых рендер падает
  var player = new G.Player();
  player.stillT = player.stillT || 0;
  w.birthShore(player, dna);
  var fx = new G.Particles(200);
  var floaters = new G.Floaters();
  var game = {
    world: w,
    dna: dna,
    player: player,
    fx: fx,
    floaters: floaters,
    time: 0,
    dpr: 1,
    sky: false,
    state: "play",
    // Director читает ввод: без него первый мозг спотыкается
    input: { down: false, x: 0, y: 0, wx: 0, wy: 0, rhythm: 0, wild: 0, taps: [] },
    metaT: 0,
    metaFlash: 0,
    metas: 0,
    // метаморфоза — то, что нельзя сломать. Стенд повторяет её так же,
    // как движок: beginMeta помечает состояние, finishMeta пересобирает мир.
    beginMeta: function () {
      this.state = "meta";
      this.metaT = 0;
      this.metaFlash = 1;
      this.metas++;
    },
    finishMeta: function () {
      this.world.metamorphose(this.player, this.dna);
      this.state = "play";
      this.metaFlash = 0.6;
    },
    save: function () {},
    cam: { x: 0, y: 0, z: 1, w: 800, h: 600 }
  };
  useGameClock(G, game);
  // Director и Voice — синглтоны: без сброса счётчики, органы и антиспам
  // предыдущего игрока перетекают в следующего, и стенд меряет смесь
  // всех прогонов сразу.
  if (G.Director && G.Director.reset) G.Director.reset();
  if (G.Voice && G.Voice.reset) G.Voice.reset();
  if (G.Life && G.Life.resetCache) G.Life.resetCache();
  return game;
}

// Один шаг мира. speed — с какой прытью игрок идёт к цели (0 = стоит).
// Часы стенда. В браузере G.now() — настенное время, и оно совпадает с
// игровым. В стенде 600 игровых секунд проходят за ~3 реальных, поэтому
// настенные часы делают вид, что вся сессия случилась в одно мгновение:
// антиспам Voice (18 с на ключ, 4.5 с на любую реплику) душит всё подряд
// и замер показывает немоту, которой в живой игре нет.
// Стенд должен быть повторяем. Игра зовёт Math.random() в полусотне мест
// (id узлов, фазы, разброс Director, органы), поэтому один и тот же баланс
// давал то 14%, то 23% выживших — по такому шуму настраивать нельзя.
// Подменяем глобальный генератор на детерминированный: игра этого не
// замечает, а прогон становится воспроизводимым.
function seedRandom(seed) {
  var s = (seed || 1) >>> 0;
  Math.random = function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function useGameClock(G, game) {
  G.now = function () { return game.time; };
}

function step(G, game, dt, target, speed) {
  var p = game.player;
  if (target && speed) {
    var dx = target.x - p.x;
    var dy = target.y - p.y;
    var d = Math.hypot(dx, dy) || 1;
    p.vx = (dx / d) * speed;
    p.vy = (dy / d) * speed;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.stillT = 0;
  } else {
    p.vx = 0;
    p.vy = 0;
    p.stillT += dt;
  }
  game.time += dt;
  // Метаморфоза длится 3.2 с и сама себя завершает — движок делает это
  // в Game.update. Без этого мир навсегда застревает в перерождении.
  if (game.state === "meta") {
    game.metaT += dt;
    if (game.metaT > 3.2) game.finishMeta();
  }
  game.world.update(dt, p, game.dna, game.fx, game);
  // Director — первый мозг: без него берег нем и не растит фронтир,
  // а проверки тишины считают чужую тишину
  if (G.Director && G.Director.observe) {
    try {
      G.Director.observe(dt, game);
    } catch (e) {
      if (!step._warned) {
        step._warned = true;
        console.log("  (Director споткнулся в стенде: " + e.message + ")");
      }
    }
  }
  // Голос живёт по часам движка (engine.js зовёт Voice.update каждый кадр).
  // Без этого очередь реплик никогда не сливается и стенд меряет немоту,
  // которой в игре нет.
  if (G.Voice && G.Voice.update) G.Voice.update(dt);
  game.fx.update(dt);
  game.floaters.update(dt);
}

// Взгляд — главный жест игры, и он живёт в Game._gaze, а не в World.
// Стенд повторяет его честно: палец лежит на узле, время идёт,
// узел кристаллизуется. Возвращает true, если что-то выросло.
function gaze(G, game, node, seconds, still) {
  var dt = 1 / 60;
  var grown = false;
  var gest = node.gesture;
  for (var i = 0; i < Math.round(seconds / dt); i++) {
    if (node.dead || node.state === "alive") break;
    node.care = Math.min(1, node.care + dt * 0.4);
    if (still === false) gest.explore += dt * 0.5;
    else gest.still += dt * 0.8;
    game.player.gazeT += dt;
    game.time += dt;
    // как в engine.js:654 — взгляд тикает вслух шесть раз в секунду,
    // а НЕ каждый кадр. Без этого условия звуковой замер насчитал
    // 17 тысяч тиков вместо честных двух с половиной.
    if (G.Audio && G.Audio.gazeTick && game.player.gazeT > 0.2 &&
        Math.floor(game.player.gazeT * 6) !== Math.floor((game.player.gazeT - dt) * 6)) {
      G.Audio.gazeTick(G.clamp(game.player.gazeT / 1.35, 0, 1), game.dna.dominant());
    }
    if (game.player.gazeT >= 1.35) {
      if (node.state !== "alive") {
        game.dna.gazes++;
        node.state = "crystallizing";
        var kind = game.world.crystallize(node, gest, game.dna);
        var trait = G.KIND_TRAIT[kind];
        if (trait) game.dna.feed(trait, 0.045);
        // как в engine.js:665 — рождение звучит. Без этой строки звуковой
        // замер врал: казалось, что кристаллизация молчит, хотя молчал стенд.
        if (G.Audio && G.Audio.crystallize) G.Audio.crystallize(trait || game.dna.dominant());
        if (G.Director && G.Director.onCrystal) {
          try {
            G.Director.onCrystal(game, kind);
          } catch (e) {}
        }
        grown = true;
      }
      game.player.gazeT = 0;
    }
    game.world.update(dt, game.player, game.dna, game.fx, game);
  }
  return grown;
}

// Ближайший узел, на который вообще можно смотреть.
function nearestUnformed(game) {
  var best = null;
  var bd = 1e9;
  for (var i = 0; i < game.world.nodes.length; i++) {
    var n = game.world.nodes[i];
    if (n.dead || n.state === "alive") continue;
    var d = Math.hypot(n.x - game.player.x, n.y - game.player.y);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}

// Подставной 2D-контекст: считает вызовы, ничего не рисует.
//
// Он запоминает и ЯРКОСТЬ — альфу каждой заливки, обводки и градиента.
// Без этого нельзя проверить то, что человек видит глазом: тускнеет ли
// узел, к которому не возвращались. Число вызовов у яркого и у погасшего
// узла одинаковое — меняются только цвета, и раньше стенд их не видел.
function ctxStub() {
  var o = { calls: [], alphas: [], stops: [], _fill: "", _stroke: "" };
  function noteAlpha(v) {
    var m = /rgba?\([^)]*?,\s*([\d.]+)\s*\)/.exec(String(v));
    if (m) o.alphas.push(parseFloat(m[1]));
  }
  // Суммарная яркость нарисованного — грубая, но честная мера «сколько
  // света» ушло на объект.
  o.light = function () {
    var s = 0;
    for (var i = 0; i < o.alphas.length; i++) s += o.alphas[i];
    return Math.round(s * 1000) / 1000;
  };
  [
    "save", "restore", "beginPath", "closePath", "arc", "moveTo", "lineTo",
    "fill", "stroke", "fillText", "strokeText", "translate", "rotate", "scale",
    "setTransform", "transform", "resetTransform", "clearRect", "fillRect",
    "strokeRect", "rect", "quadraticCurveTo", "bezierCurveTo", "ellipse",
    "clip", "drawImage", "setLineDash", "arcTo", "putImageData"
  ].forEach(function (m) {
    o[m] = function () {
      o.calls.push(m);
    };
  });
  o.createRadialGradient = o.createLinearGradient = function () {
    o.calls.push("gradient");
    return { addColorStop: function (stop, color) { noteAlpha(color); o.stops.push(color); } };
  };
  Object.defineProperty(o, "fillStyle", {
    get: function () { return o._fill; },
    set: function (v) { o._fill = v; noteAlpha(v); }
  });
  Object.defineProperty(o, "strokeStyle", {
    get: function () { return o._stroke; },
    set: function (v) { o._stroke = v; noteAlpha(v); }
  });
  Object.defineProperty(o, "globalAlpha", {
    get: function () { return o._alpha == null ? 1 : o._alpha; },
    set: function (v) { o._alpha = v; o.alphas.push(v); }
  });
  return o;
}

module.exports = {
  boot: boot,
  makeWorld: makeWorld,
  step: step,
  gaze: gaze,
  nearestUnformed: nearestUnformed,
  ctxStub: ctxStub
};
