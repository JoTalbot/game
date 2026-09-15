// Весы берега: сколько человек вырастил и куда это ушло.
// Два канала разлуки, и путать их нельзя:
//   «забыто приливом»  — забвение, потеря (тонуло без внимания, w.lost);
//   «стало созвездием» — смена кожи, память (узел стал звездой, w.carried).
// Метаморфоза уносит больше прилива у сеятеля — это замысел, а не перекос:
// неудержанное не исчезает, оно становится небом (см. HANDOFF, решение 19.08).
// Забота окупается, если пережившего больше, чем забвения у брошенного.
// Прогонять после любой правки забвения, прилива или care.
// Запуск: node tools/probe/balance.js
var H = require("./harness.js");
var G = H.boot();

// Детерминированный выбор садовника: тот же LCG, что в стороже run.js.
// Без него Math.random() давал разброс заботы 40–49% между прогонами, и
// нельзя было отличить регрессию от шума. Один seed — одни числа.
var rndSeed = 20240815;
function rnd() {
  rndSeed = (rndSeed * 1664525 + 1013904223) >>> 0;
  return rndSeed / 4294967296;
}

// Регрессионный коридор, а не точное число: исторический рабочий баланс
// держал потерю около 12% у сеятеля и 9% у садовника. Коридор ±8 п.п.
// оставляет место для безопасной настройки, но ловит возврат к старой
// катастрофе (~87% потерь) и ситуацию, когда забота перестаёт окупаться.
var LIMIT = {
  minGrownPerSeed: 1,
  maxLossPct: 20,
  maxLossDeltaPct: 3,
  maxCarriedPct: 100
};

function fail(message) {
  console.error("BALANCE FAIL: " + message);
  process.exitCode = 1;
}

function run(seed, tend) {
  var game = H.makeWorld(G, seed);
  var grown = 0;
  while (game.time < 600) {
    var n = null;
    if (tend) {
      var live = game.world.nodes.filter(function (x) { return x.state === "alive" && x.care < 0.5; });
      if (live.length && rnd() < 0.5) n = live[(rnd() * live.length) | 0];
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

var results = {};
["сеятель", "садовник"].forEach(function (name, ti) {
  var sg = 0, sl = 0, sc = 0;
  results[name] = [];
  [11, 12, 13].forEach(function (s) {
    var r = run(s, ti === 1);
    var pct = r.grown ? Math.round((100 * r.lost) / r.grown) : 0;
    sg += r.grown; sl += r.lost; sc += r.carried;
    results[name].push(r);
    console.log(name, "seed" + s, "выращено", r.grown, "| забыто приливом", r.lost, "(" + pct + "%) | стало созвездием", r.carried, "| живых", r.live);
    if (r.grown < LIMIT.minGrownPerSeed) fail(name + " seed" + s + ": нет выращивания (grown=" + r.grown + ")");
    if (!Number.isFinite(r.lost) || r.lost < 0) fail(name + " seed" + s + ": некорректный lost=" + r.lost);
    if (!Number.isFinite(r.carried) || r.carried < 0) fail(name + " seed" + s + ": некорректный carried=" + r.carried);
  });
  var lossPct = sg ? (100 * sl) / sg : 100;
  var carriedPct = sg ? (100 * sc) / sg : 100;
  results[name].summary = { grown: sg, lost: sl, carried: sc, lossPct: lossPct, carriedPct: carriedPct };
  console.log("  → " + name + ": забвение съедает " + Math.round(lossPct) + "% выращенного, в созвездие ушло " + Math.round(carriedPct) + "% (память, не потеря)\n");
  if (lossPct > LIMIT.maxLossPct) fail(name + ": забвение " + Math.round(lossPct) + "% > " + LIMIT.maxLossPct + "%");
  if (carriedPct > LIMIT.maxCarriedPct) fail(name + ": carried " + Math.round(carriedPct) + "% > " + LIMIT.maxCarriedPct + "%");
});

var seedLoss = results["сеятель"].summary.lossPct;
var gardenerLoss = results["садовник"].summary.lossPct;
if (gardenerLoss > seedLoss + LIMIT.maxLossDeltaPct) {
  fail("забота перестала окупаться: садовник " + Math.round(gardenerLoss) + "% потерь против сеятеля " + Math.round(seedLoss) + "%");
}

if (!process.exitCode) console.log("BALANCE PASS: детерминированный регрессионный коридор соблюдён.");
