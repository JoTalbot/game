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
  "organs",
  "memory",
  "fate",
  "world",
  "director",
  "renderer"
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
  global.document = {
    getElementById: function () {
      return null;
    },
    querySelector: function () {
      return null;
    },
    querySelectorAll: function () {
      return [];
    },
    documentElement: { style: {} },
    body: { classList: { add: function () {}, remove: function () {} } },
    addEventListener: function () {},
    createElement: function () {
      return { getContext: function () { return null; }, style: {}, classList: { add: function () {}, remove: function () {} } };
    }
  };
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
    cam: { x: 0, y: 0, z: 1, w: 800, h: 600 }
  };
  return game;
}

// Один шаг мира. speed — с какой прытью игрок идёт к цели (0 = стоит).
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
    if (game.player.gazeT >= 1.35) {
      if (node.state !== "alive") {
        game.dna.gazes++;
        node.state = "crystallizing";
        var kind = game.world.crystallize(node, gest, game.dna);
        var trait = G.KIND_TRAIT[kind];
        if (trait) game.dna.feed(trait, 0.045);
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
function ctxStub() {
  var o = { calls: [], _fill: "", _stroke: "" };
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
    return { addColorStop: function () {} };
  };
  o.measureText = function (s) {
    return { width: String(s).length * 6 };
  };
  o.getImageData = function () {
    return { data: [0, 0, 0, 0] };
  };
  return o;
}

module.exports = {
  boot: boot,
  makeWorld: makeWorld,
  step: step,
  gaze: gaze,
  nearestUnformed: nearestUnformed,
  ctxStub: ctxStub,
  ROOT: ROOT,
  ORDER: ORDER
};
