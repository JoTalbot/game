// Замер речи: сколько Игра говорит за сессию и не повторяется ли.
//
// Голос — самое заметное, что есть у Игры, и самое лёгкое испортить:
// одна реплика без кулдауна превращает существо в бубнящее радио.
// Считаем ПРИНЯТЫЕ вызовы say (счётчики по выведенной строке врут:
// очередь откладывает вывод, а поле называется current, не line).
var H = require("./harness.js");
var G = H.boot();

function spy() {
  var hits = {}, order = [], times = [];
  var real = G.Voice.say.bind(G.Voice);
  return {
    hits: hits, order: order, times: times,
    install: function (game) {
      // Считаем ПРОЗВУЧАВШЕЕ, а не попытки. say часто уходит в отказ
      // (антиспам) или в очередь — счёт всех вызовов давал lost×36 там,
      // где человек слышал реплику несколько раз. Признак «сказала»:
      // обновился lastAt.
      G.Voice.say = function (key, force) {
        var was = G.Voice.lastAt;
        var r = real(key, force);
        if (G.Voice.lastAt !== was) {
          hits[key] = (hits[key] || 0) + 1;
          order.push(key);
          times.push(game.time);
        }
        return r;
      };
    },
    restore: function () { G.Voice.say = real; }
  };
}

function play(seed, mode, secs) {
  var game = H.makeWorld(G, seed);
  var s = spy();
  s.install(game);
  var tended = {};
  while (game.time < secs) {
    var n = null;
    if (mode === "садовник") {
      var live = game.world.nodes.filter(function (x) {
        return x.state === "alive" && x.care < 0.5;
      });
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
  s.restore();
  // медиана паузы между репликами: ощущение темпа речи
  var gaps = [];
  for (var g = 1; g < s.times.length; g++) gaps.push(s.times[g] - s.times[g - 1]);
  gaps.sort(function (a, b) { return a - b; });
  var med = gaps.length ? gaps[(gaps.length / 2) | 0] : 0;
  return { hits: s.hits, total: s.order.length, uniq: Object.keys(s.hits).length, med: med };
}

console.log("\n— речь: сколько Игра говорит за 10 минут\n");
var modes = [[12, "сеятель"], [12, "садовник"], [13, "садовник"]];
var worst = 0, worstKey = "";
modes.forEach(function (m) {
  var r = play(m[0], m[1], 600);
  var keys = Object.keys(r.hits).sort(function (a, b) { return r.hits[b] - r.hits[a]; });
  console.log("[" + m[1] + " seed" + m[0] + "] реплик: " + r.total +
    " | уникальных ключей: " + r.uniq +
    " | медиана паузы: " + r.med.toFixed(0) + "с");
  console.log("   топ: " + keys.slice(0, 6).map(function (k) {
    return k + "×" + r.hits[k];
  }).join(", "));
  if (r.hits[keys[0]] > worst) { worst = r.hits[keys[0]]; worstKey = keys[0]; }
});
console.log("\nсамая назойливая реплика: " + worstKey + "×" + worst);
// Порог вкусовой, но нарушать его — значит превращать голос в фон.
if (worst > 16) {
  console.log("✗ одна реплика звучит чаще раза в 40 секунд — это бубнёж");
  process.exit(1);
}
console.log("✓ ни одна реплика не забивает остальные\n");
