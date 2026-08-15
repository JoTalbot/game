// Стенд долгой игры: не пухнет ли мир, пока в него играют.
//
// Гул, который рос со временем, оказался утечкой графа Web Audio: узлы
// отзвучавших нот копились и продолжали сводиться — 1714 штук за десять
// минут. Ровные уровни громкости этого не показывали. Урок шире звука:
// болезнь может расти во времени и быть невидимой для проверок, которые
// смотрят на один кадр. Здесь я смотрю на час игры.
//
// Стенд поднимает НАСТОЯЩИЙ engine.js через aim.js — стенд, дублирующий
// логику движка, врёт дважды.
"use strict";
var Aim = require("./aim.js");

// Сколько чего в мире прямо сейчас.
function snap(g) {
  var w = g.world;
  return {
    nodes: w.nodes.length,
    beings: w.beings.length,
    stars: w.stars.length,
    forgotten: w.forgotten.length,
    verses: w.verses.length,
    wounds: w.wounds.length,
    anchors: w.anchors.length,
    fx: (g.fx && g.fx.list) ? g.fx.list.length : 0,
    // Всплывающие имена. Первый вариант стенда их не считал — и подлог,
    // снимающий потолок с эффектов, прошёл незамеченным. Что не меряешь,
    // то не стережёшь.
    floaters: (g.floaters && g.floaters.list) ? g.floaters.list.length : 0,
    trail: (g.player && g.player.trail) ? g.player.trail.length : 0,
    taps: g.input.taps ? g.input.taps.length : 0,
    // Без принудительной сборки мусора это число — шум: оно скачет на
    // мегабайты от того, когда движку вздумалось прибраться. Мерить кучу
    // имеет смысл только сразу после gc, поэтому зовём его, если дали.
    heap: (global.gc ? (global.gc(), 0) : 0,
           Math.round(process.memoryUsage().heapUsed / 1024)),
    gc: !!global.gc
  };
}

// Живой человек: изредка трогает берег, иначе мир стоит мёртвым и ничего
// не копит. Касание раз в три секунды, отпускание через две.
function poke(g, f) {
  if (f % 180 === 0) {
    var n = null;
    for (var i = 0; i < g.world.nodes.length; i++) {
      var c = g.world.nodes[i];
      if (!c.dead && c.state === "unformed") { n = c; break; }
    }
    if (n) {
      g.input.x = 400 + (n.x - g.cam.x);
      g.input.y = 300 + (n.y - g.cam.y);
      var w = g.screenToWorld(g.input.x, g.input.y);
      g.input.wx = w.x; g.input.wy = w.y;
      g.input.down = true;
      try { g.onDown(); } catch (e) {}
    }
  }
  if (f % 180 === 120) {
    g.input.down = false;
    try { g.onUp && g.onUp(); } catch (e) {}
  }
}

// Прожить `seconds` секунд игры и вернуть замеры на отметках `marks`.
// Отметки — в секундах, по возрастанию.
function live(seconds, marks, seed) {
  var G = Aim.bootEngine();
  var g = Aim.makeGame(G, seed || 7);
  marks = marks || [60, 600, 3600];

  var out = { at: {}, errors: 0, lastError: "" };
  out.at[0] = snap(g);

  var dt = 1 / 60;
  var t = 0;
  var mi = 0;
  var frames = Math.round(seconds * 60);

  for (var f = 0; f < frames; f++) {
    t += dt;
    g.time += dt;
    poke(g, f);
    try { g.update(dt); } catch (e) { out.errors++; out.lastError = e.message; }
    while (mi < marks.length && t >= marks[mi]) {
      out.at[marks[mi]] = snap(g);
      mi++;
    }
  }
  while (mi < marks.length) { out.at[marks[mi]] = snap(g); mi++; }
  return out;
}

module.exports = { live: live, snap: snap };

// Отдельный прогон под сборщиком мусора: только так куча честная.
// Зовётся из run.js через node --expose-gc.
if (require.main === module && process.argv[2] === "--json") {
  var rj = live(3600, [60, 600, 3600], 7);
  process.stdout.write(JSON.stringify(rj));
} else if (require.main === module) {
  var marks = [60, 300, 900, 1800, 3600];
  var r = live(3600, marks, 7);
  var keys = [0].concat(marks);
  console.log("час игры настоящим движком:\n");
  for (var i = 0; i < keys.length; i++) {
    var s = r.at[keys[i]];
    console.log(
      String(keys[i]).padStart(5) + " с | узлы " + String(s.nodes).padStart(3) +
      " | существа " + String(s.beings).padStart(3) +
      " | звёзды " + String(s.stars).padStart(4) +
      " | забыто " + String(s.forgotten).padStart(3) +
      " | строфы " + String(s.verses).padStart(3) +
      " | эффекты " + String(s.fx).padStart(4) +
      " | имена " + String(s.floaters).padStart(3) +
      " | след " + String(s.trail).padStart(4) +
      " | куча " + String(s.heap).padStart(6) + " КБ"
    );
  }
  console.log("\nпадений update: " + r.errors +
              (r.lastError ? " (последнее: " + r.lastError + ")" : ""));
}
