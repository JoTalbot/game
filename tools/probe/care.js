// Окупается ли забота? Сравниваем судьбу узлов, к которым человек
// возвращался, с теми, что вырастил и бросил. Забота должна побеждать.
var H = require("./harness.js");
var G = H.boot();

function run(seed) {
  var game = H.makeWorld(G, seed);
  var tended = {}, born = {};
  while (game.time < 600) {
    var n = null;
    // Настоящий садовник держит участок, а не бродит наугад: возвращается
    // к тем же узлам. Случайный выбор почти никогда не давал второго
    // визита, и корни не успевали проявиться в замере.
    var live = game.world.nodes.filter(function (x) { return x.state === "alive" && x.care < 0.5; });
    if (live.length && Math.random() < 0.6) {
      var mine = live.filter(function (x) { return tended[x.id]; });
      var pool = mine.length && Math.random() < 0.75 ? mine : live;
      n = pool[(Math.random() * pool.length) | 0];
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
  return {
    tend: tk.length, tendLive: tk.filter(function (id) { return alive[id]; }).length,
    drop: bk.length, dropLive: bk.filter(function (id) { return alive[id]; }).length,
    metas: game.world.meta,
    game: game
  };
}

var st = 0, stl = 0, sd = 0, sdl = 0;
[11, 12, 13].forEach(function (s) {
  var r = run(s);
  st += r.tend; stl += r.tendLive; sd += r.drop; sdl += r.dropLive;
  console.log("seed" + s + ": возвращался к " + r.tend + " → выжило " + r.tendLive +
    " (" + Math.round((100 * r.tendLive) / r.tend) + "%) | бросил " + r.drop +
    " → выжило " + r.dropLive + " (" + Math.round((100 * r.dropLive) / r.drop) + "%)" +
    (r.metas ? " [перерождений: " + r.metas + "]" : ""));
});
var tp = Math.round((100 * stl) / st), dp = Math.round((100 * sdl) / sd);
console.log("\nитого: забота " + tp + "% против " + dp + "% брошенного — " +
  (tp > dp + 8 ? "забота окупается" : "ЗАБОТА НЕ ОКУПАЕТСЯ"));
