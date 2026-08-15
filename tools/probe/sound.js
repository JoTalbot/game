// Замер звуковой картины: что и как часто звучит за сессию игры.
// Web Audio в node нет, поэтому G.Audio подменяется счётчиком: нас
// интересует не тембр, а частота и полнота — какие события мира
// вообще подают голос, а какие проходят молча.
var H = require("./harness.js");
var G = H.boot();

// Список голосов НЕ вбиваем руками: стенд со списком-литералом молча
// пропускает всё новое (а на добавленных forget/rooted он и вовсе упал,
// провалившись в настоящий Web Audio, которого в node нет). Спрашиваем
// сам audio.js — тогда новый звук попадает в замер сам собой.
var LIFECYCLE = ["update", "setLaw", "setHeart", "unlock", "_unlock", "setMuted",
                 "init", "resume", "stop", "keys"];
var VERBS = Object.keys(G.Audio).filter(function (k) {
  return typeof G.Audio[k] === "function" &&
         k.charAt(0) !== "_" && LIFECYCLE.indexOf(k) < 0;
});

function spy() {
  var hits = {}, log = [];
  VERBS.forEach(function (v) {
    G.Audio[v] = function () {
      hits[v] = (hits[v] || 0) + 1;
      log.push(v);
    };
  });
  G.Audio.ready = true;
  G.Audio.update = function () {};
  G.Audio._unlock = function () {};
  G.Audio.setLaw = function () {};
  G.Audio.setHeart = function () {};
  G.Audio.unlock = function () {};
  G.Audio.setMuted = function () {};
  return { hits: hits, log: log };
}

function play(seed, mode, secs) {
  var game = H.makeWorld(G, seed);
  var s = spy();
  var tended = {};
  while (game.time < secs) {
    var n = null;
    if (mode === "садовник") {
      var live = game.world.nodes.filter(function (x) { return x.state === "alive" && x.care < 0.5; });
      if (live.length && Math.random() < 0.6) {
        var mine = live.filter(function (x) { return tended[x.id]; });
        var pool = mine.length && Math.random() < 0.75 ? mine : live;
        n = pool[(Math.random() * pool.length) | 0];
      }
    }
    var back = !!n;
    if (!n) n = H.nearestUnformed(game);
    if (!n) { for (var k = 0; k < 180; k++) H.step(G, game, 1 / 60, null, 0); continue; }
    for (var i = 0; i < 480 && game.time < secs; i++) {
      if (Math.hypot(n.x - game.player.x, n.y - game.player.y) < 40) break;
      H.step(G, game, 1 / 60, n, 150);
    }
    if (back) {
      for (var j = 0; j < 90; j++) H.step(G, game, 1 / 60, null, 0);
      n.care = Math.min(1, n.care + 0.5);
      tended[n.id] = 1;
    } else H.gaze(G, game, n, 2.2, true);
  }
  return { hits: s.hits, total: s.log.length, world: game.world, dir: G.Director };
}

console.log("\n— звук: что слышно за 10 минут игры\n");
var modes = [[12, "сеятель"], [12, "садовник"], [13, "садовник"]];
var seen = {};
modes.forEach(function (m) {
  var r = play(m[0], m[1], 600);
  var keys = Object.keys(r.hits).sort(function (a, b) { return r.hits[b] - r.hits[a]; });
  keys.forEach(function (k) { seen[k] = 1; });
  console.log("[" + m[1] + " seed" + m[0] + "] звуков всего: " + r.total +
    " (" + (r.total / 10).toFixed(0) + " в минуту)");
  console.log("   " + keys.map(function (k) { return k + "×" + r.hits[k]; }).join(", "));
  console.log("   мир: забыто " + r.world.lost + ", унесено " + r.world.carried +
    ", укоренённых " + r.world.nodes.filter(function (n) { return n.roots >= 0.6; }).length);
});

var silent = VERBS.filter(function (v) { return !seen[v]; });
console.log("\nни разу не прозвучало: " + (silent.length ? silent.join(", ") : "—"));
