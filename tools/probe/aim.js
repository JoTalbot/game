// Стенд руки: держится ли взгляд, пока палец лежит на месте.
//
// Человек: «не получается обводить сущности — сбивается после перелёта по
// стрелочке с указанием расстояния, и в начале мелкие тоже не обводятся».
// Оба раза виновата не рука. Срыв взгляда мерили в МИРЕ — расстоянием от
// пальца до узла. Но мировая точка под пальцем считается от КАМЕРЫ, а
// камера догоняет игрока после перелёта. Палец лежит, а точка под ним
// уезжает: на отставшей камере — за 0.28 с на 75 единиц при пороге 70.
//
// Стенд поднимает НАСТОЯЩИЙ engine.js: стенд, дублирующий логику движка,
// врёт дважды.
"use strict";
var fs = require("fs");
var path = require("path");
var H = require("./harness");

var WEB = path.join(__dirname, "..", "..", "web", "js");

function canvasStub() {
  var ctx = H.ctxStub();
  return {
    width: 800,
    height: 600,
    style: {},
    getContext: function () { return ctx; },
    addEventListener: function () {},
    removeEventListener: function () {},
    getBoundingClientRect: function () {
      return { left: 0, top: 0, width: 800, height: 600 };
    },
    setPointerCapture: function () {},
    releasePointerCapture: function () {}
  };
}

function bootEngine() {
  var G = H.boot();
  var canvas = canvasStub();
  // Голос Игры пишет в узлы страницы; без них onDown падает на первой реплике.
  function domStub() {
    return {
      textContent: "",
      style: {},
      classList: { add: function () {}, remove: function () {}, toggle: function () {} },
      appendChild: function () {},
      addEventListener: function () {},
      setAttribute: function () {}
    };
  }
  var nodes = {};
  global.document.getElementById = function (id) {
    if (id === "stage") return canvas;
    if (!nodes[id]) nodes[id] = domStub();
    return nodes[id];
  };
  var src = fs.readFileSync(path.join(WEB, "engine.js"), "utf8");
  new Function("window", "document", "navigator", "localStorage",
               "performance", "IGRA", src)(
    global.window, global.document, global.navigator,
    global.localStorage, global.performance, global.IGRA);
  return G;
}

// Стенд обязан быть повторяем, иначе он мерит везение, а не игру.
// `harness.makeWorld` сеет глобальный Math.random с самого начала, а этот
// стенд — нет: полтора года все замеры на живом движке (долг памяти,
// голос, цена кадра) гоняли НЕЗАСЕЯННУЮ случайность. Один и тот же код
// давал то 3 исхода долга, то 6; проверка краснела и зеленела сама по
// себе, и по ней нельзя было судить ни об одной правке. Сеем тем же
// зерном и тем же способом, что и harness.
function makeGame(G, seed) {
  H.seedRandom((seed || 1) * 7919);
  var g = new G.Game();
  g.state = "play";
  g.w = 800;
  g.h = 600;
  g.cam.w = 800;
  g.cam.h = 600;
  g.world = new G.World(seed || 1);
  g.player = new G.Player();
  g.world.birthShore(g.player, g.dna);
  // время идёт: иначе onDown примет касание за второй тап и даст импульс
  g.time = 5;
  g.input.lastTap = 0;
  return g;
}

function firstNode(g, small) {
  for (var i = 0; i < g.world.nodes.length; i++) {
    var n = g.world.nodes[i];
    if (n.dead || n.state === "gone") continue;
    if (small && (n.r || 12) > 13) continue;
    return n;
  }
  return null;
}

// Так играет живой человек: палец опускается на ПУСТОЕ место, ведёт
// игрока к узлу и, дойдя, замирает на узле не отрываясь. Захват решался
// только в onDown — то есть когда палец был ещё далеко, — и узел под
// неподвижным пальцем не рождался никогда. Человек: «новые планеты не
// обводятся, а продолжаешь движение».
function walkAndHold(G, opts) {
  opts = opts || {};
  var g = makeGame(G, opts.seed);
  var n = firstNode(g, opts.small);
  if (!n) return { error: "нет узла" };

  // палец на пустоте в стороне — это жест ходьбы
  g.input.x = 400 + (opts.away || 140);
  g.input.y = 300 + (opts.away || 140);
  var w = g.screenToWorld(g.input.x, g.input.y);
  g.input.wx = w.x;
  g.input.wy = w.y;
  g.input.down = true;
  g.time += 2;
  g.onDown();
  g.player.gaze = null;          // человек начал с пустого места

  var frames = Math.round((opts.seconds || 4) * 60);
  for (var f = 0; f < frames; f++) {
    g.time += 1 / 60;
    // палец приведён на узел и лежит там
    var tx = 400 + (n.x - g.cam.x);
    var ty = 300 + (n.y - g.cam.y);
    g.input.x = tx;
    g.input.y = ty;
    var w2 = g.screenToWorld(tx, ty);
    g.input.wx = w2.x;
    g.input.wy = w2.y;
    try { g.update(1 / 60); } catch (e) { return { error: e.message }; }
    if (n.state !== "unformed") return { crystal: true, at: f / 60 };
  }
  return { crystal: false, gaze: !!g.player.gaze };
}

// Растим узлы один за другим, как играет человек: подвёл, подержал до
// рождения, отпустил, пошёл к следующему. Возвращает, сколько якорей
// досталось на сколько рождений.
function growMany(G, opts) {
  opts = opts || {};
  var g = makeGame(G, opts.seed);
  var anchors = 0, grown = 0;
  var W = Object.getPrototypeOf(g.world);
  var orig = W.anchor;
  W.anchor = function (n) { var r = orig.call(this, n); if (r) anchors++; return r; };

  var rounds = opts.rounds || 12;
  for (var round = 0; round < rounds; round++) {
    var n = null;
    for (var i = 0; i < g.world.nodes.length; i++) {
      var c = g.world.nodes[i];
      if (!c.dead && c.state === "unformed") { n = c; break; }
    }
    if (!n) { g.world.scatter(g.player.x, g.player.y, 6, 300); continue; }
    g.player.x = n.x; g.player.y = n.y;
    g.cam.x = n.x; g.cam.y = n.y;
    g.input.x = 400; g.input.y = 300;
    var w = g.screenToWorld(400, 300);
    g.input.wx = w.x; g.input.wy = w.y;
    g.input.down = true; g.time += 1;
    try { g.onDown(); } catch (e) {}
    // держим чуть дольше рождения (1.35 с), но заметно меньше якоря
    var frames = Math.round((opts.seconds || 1.66) * 60);
    for (var f = 0; f < frames; f++) {
      g.time += 1 / 60;
      var sx = 400 + (n.x - g.cam.x), sy = 300 + (n.y - g.cam.y);
      g.input.x = sx; g.input.y = sy;
      var w2 = g.screenToWorld(sx, sy);
      g.input.wx = w2.x; g.input.wy = w2.y;
      try { g.update(1 / 60); } catch (e) {}
    }
    g.input.down = false;
    try { g.onUp && g.onUp(); } catch (e) {}
    if (n.state === "alive") grown++;
  }
  W.anchor = orig;
  return { grown: grown, anchors: anchors };
}

// Обратная крайность: человек ВЕДЁТ игрока сквозь плотный берег и не
// хочет ничего трогать. Палец всё время в движении — захвата быть не
// должно, иначе ходьба цепляется за каждый встречный узел.
function walkThrough(G, opts) {
  opts = opts || {};
  var g = makeGame(G, opts.seed);
  g.world.scatter(g.player.x, g.player.y, 14, 300);
  g.input.x = 400 + 150;
  g.input.y = 300 + 150;
  var w = g.screenToWorld(g.input.x, g.input.y);
  g.input.wx = w.x;
  g.input.wy = w.y;
  g.input.down = true;
  g.time += 2;
  g.onDown();
  g.player.gaze = null;

  var grabbed = 0;
  var frames = Math.round((opts.seconds || 10) * 60);
  for (var f = 0; f < frames; f++) {
    g.time += 1 / 60;
    var sx = 400 + 150 * Math.cos(f / 40);
    var sy = 300 + 150 * Math.sin(f / 40);
    g.input.x = sx;
    g.input.y = sy;
    var w2 = g.screenToWorld(sx, sy);
    g.input.wx = w2.x;
    g.input.wy = w2.y;
    try { g.update(1 / 60); } catch (e) { return { error: e.message }; }
    if (g.player.gaze) { grabbed++; g.player.gaze = null; }
  }
  return { grabbed: grabbed };
}

// Палец кладут на узел и держат. camLag — насколько камера отстала от
// игрока (после перелёта по зову она догоняет). Возвращает, чем кончилось.
function hold(G, opts) {
  opts = opts || {};
  var g = makeGame(G, opts.seed);
  var n = firstNode(g, opts.small);
  if (!n) return { error: "нет узла" };

  g.player.x = n.x;
  g.player.y = n.y;
  g.cam.x = n.x - (opts.camLag || 0);
  g.cam.y = n.y;

  // палец — в ту точку ЭКРАНА, где узел сейчас виден
  g.input.x = 400 + (n.x - g.cam.x) + (opts.miss || 0);
  g.input.y = 300 + (n.y - g.cam.y);
  var w = g.screenToWorld(g.input.x, g.input.y);
  g.input.wx = w.x;
  g.input.wy = w.y;
  g.input.down = true;
  g.time += 2;
  g.onDown();

  if (!g.player.gaze) return { took: false };

  var frames = Math.round((opts.seconds || 3) * 60);
  for (var f = 0; f < frames; f++) {
    g.time += 1 / 60;
    try { g.update(1 / 60); } catch (e) { return { took: true, error: e.message }; }
    // На стекле палец не лежит идеально: touchmove сыплется от дрожи, и
    // движок каждый раз пересчитывает мировую точку из ТОЙ ЖЕ точки экрана.
    var w2 = g.screenToWorld(g.input.x, g.input.y);
    g.input.wx = w2.x;
    g.input.wy = w2.y;
    if (n.state !== "unformed") {
      return { took: true, crystal: true, at: f / 60 };
    }
    if (!g.player.gaze) {
      return {
        took: true,
        crystal: false,
        at: f / 60,
        drift: G.dist(w2.x, w2.y, n.x, n.y)
      };
    }
  }
  return { took: true, crystal: false, hold: true };
}

// Чистый замер прицела: один узел на пустом берегу, без соседей, которые
// перехватывают палец и смазывают картину. Сколько точек холста прощается?
function pad(G, r) {
  var g = makeGame(G, 1);
  var n = g.world.nodes[0];
  if (!n) return -1;
  g.world.nodes = [n];
  g.world.beings = [];
  n.r = r;
  var miss = -1;
  for (var d = 0; d < 400; d += 1) {
    if (g.world.nearestNode(n.x + d, n.y, 58) !== n) break;
    miss = d;
  }
  return miss;
}

// Самый дальний промах пальца, при котором узел ещё ловится.
function reach(G, opts) {
  opts = opts || {};
  var g = makeGame(G, opts.seed);
  var n = firstNode(g, opts.small);
  if (!n) return null;
  var miss = -1;
  for (var d = 0; d < 400; d += 2) {
    var got = g.world.nearestNode(n.x + d, n.y, 58);
    if (got !== n) break;
    miss = d;
  }
  return { r: n.r || 12, miss: miss };
}

module.exports = { bootEngine: bootEngine, hold: hold, reach: reach, pad: pad, makeGame: makeGame,
                   walkAndHold: walkAndHold, walkThrough: walkThrough, growMany: growMany };

if (require.main === module) {
  var G = bootEngine();
  console.log("камера на месте:      ", JSON.stringify(hold(G, { camLag: 0 })));
  console.log("камера отстала на 120:", JSON.stringify(hold(G, { camLag: 120 })));
  console.log("прицел, крупный узел: ", JSON.stringify(reach(G, {})));
  console.log("прицел, мелкий узел:  ", JSON.stringify(reach(G, { small: true })));
  console.log("чисто: r=11 прощает    ", pad(G, 11), "точек");
  console.log("чисто: r=24 прощает    ", pad(G, 24), "точек");
}
