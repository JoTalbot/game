// Весы прилива: сколько человек вырастил и сколько у него забрали.
// Прогонять после любой правки забвения, прилива или care.
// Запуск: node tools/probe/balance.js
var H = require("./harness.js");
var G = H.boot();

function run(seed, tend) {
  var game = H.makeWorld(G, seed);
  var grown = 0;
  while (game.time < 600) {
    var n = null;
    if (tend) {
      var live = game.world.nodes.filter(function (x) { return x.state === "alive" && x.care < 0.5; });
      if (live.length && Math.random() < 0.5) n = live[(Math.random() * live.length) | 0];
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
    } else if (H.gaze(G, game, n, 2.2, true)) grown++;
  }
  var w = game.world;
  return {
    grown: grown,
    lost: w.lost,
    carried: w.carried,
    live: w.nodes.filter(function (x) { return x.state === "alive"; }).length
  };
}

["сеятель", "садовник"].forEach(function (name, ti) {
  var sg = 0, sl = 0;
  [11, 12, 13].forEach(function (s) {
    var r = run(s, ti === 1);
    var pct = r.grown ? Math.round((100 * r.lost) / r.grown) : 0;
    sg += r.grown; sl += r.lost;
    console.log(name, "seed" + s, "выращено", r.grown, "| забыто приливом", r.lost, "(" + pct + "%) | унесено метаморфозой", r.carried, "| живых", r.live);
  });
  console.log("  → " + name + ": забвение съедает " + Math.round((100 * sl) / sg) + "% выращенного\n");
});
