// Стенд слуха: что звучит, когда никто ничего не делает.
//
// Человек играет с APK и говорит: «на фоне какой-то шум». На слух в
// песочнице не проверишь — браузера нет. Поэтому подставляем Web Audio,
// который не издаёт звук, а честно считает громкости: сколько на выходе
// держат постоянные слои (гул, шум-погода, дыхание сада) и сколько
// коротких нот сыплется в секунду.
//
// Главное, что стенд умеет и чего не видно в коде: параметр можно
// не только задать числом, но и подмешать в него сигнал LFO. Тогда
// настоящая громкость = значение + размах LFO, и слой, задуманный
// тихим, может оказаться в разы громче задуманного.
"use strict";
var H = require("./harness.js");

function Param(v) {
  this.value = v;
  this.mods = []; // сюда подключаются LFO
  this._t = 0;
}
Param.prototype.setValueAtTime = function (v) { this.value = v; return this; };
Param.prototype.setTargetAtTime = function (v) { this.value = v; return this; };
Param.prototype.linearRampToValueAtTime = function (v) { this.value = v; return this; };
Param.prototype.exponentialRampToValueAtTime = function (v) { this.value = v; return this; };
Param.prototype.cancelScheduledValues = function () { return this; };
// Настоящий размах параметра: постоянная часть плюс всё, что в него влито.
// Вклад берём ТЕКУЩИЙ, а не тот, что был в момент подключения: игра
// крутит громкость LFO на ходу, и снимок при connect показал бы ноль
// там, где на деле качает.
Param.prototype.swing = function () {
  var amp = 0;
  for (var i = 0; i < this.mods.length; i++) {
    var m = this.mods[i];
    amp += Math.abs(m && m.gain ? m.gain.value : m);
  }
  return { base: this.value, amp: amp, peak: this.value + amp, low: this.value - amp };
};

function ctxStub() {
  var ctx = {
    currentTime: 0,
    sampleRate: 44100,
    state: "running",
    destination: { _name: "out", _in: [] },
    resume: function () {}
  };
  var live = []; // короткие ноты, заведённые за такт

  function node(name) {
    return { _name: name, _in: [], _out: [], disconnect: function () {
      var self = this;
      for (var i = 0; i < self._out.length; i++) {
        var d = self._out[i];
        if (d && d._in) { var k = d._in.indexOf(self); if (k >= 0) d._in.splice(k, 1); }
      }
      self._out = [];
    }, connect: function (d) {
      this._out.push(d);
      if (d && d._in) d._in.push(this);
      // подключение осциллятора В ПАРАМЕТР — это модуляция
      if (d instanceof Param) d.mods.push(this);
      return d;
    }, disconnect: function () {} };
  }

  ctx.createGain = function () {
    var g = node("gain");
    g.gain = new Param(1);
    var origConnect = g.connect;
    g.connect = function (d) {
      // если гейн льётся в параметр — его вклад равен его же громкости
      if (d instanceof Param) { d.mods.push(g); g._out.push(d); return d; }
      return origConnect.call(g, d);
    };
    // disconnect обязан рвать связь В ОБЕ СТОРОНЫ и вынимать себя из
    // параметров, куда был влит. Пока он чистил только свой список
    // исходящих, отключённый гейн оставался в master._in — обход графа
    // считал мёртвые узлы живыми, и замер говорил, что утечка не лечится.
    g.disconnect = function () {
      for (var i = 0; i < g._out.length; i++) {
        var d = g._out[i];
        if (d instanceof Param) { var m = d.mods.indexOf(g); if (m >= 0) d.mods.splice(m, 1); }
        else if (d && d._in) { var k = d._in.indexOf(g); if (k >= 0) d._in.splice(k, 1); }
      }
      g._out = [];
    };
    return g;
  };
  ctx.createBiquadFilter = function () {
    var f = node("filter");
    f.type = "lowpass";
    f.frequency = new Param(350);
    f.Q = new Param(1);
    f.gain = new Param(0);
    // как и у гейна: рвать надо в обе стороны, иначе отключённый фильтр
    // остаётся во входах приёмника и обход считает его живым
    f.disconnect = function () {
      for (var i = 0; i < f._out.length; i++) {
        var d = f._out[i];
        if (d instanceof Param) { var m = d.mods.indexOf(f); if (m >= 0) d.mods.splice(m, 1); }
        else if (d && d._in) { var k = d._in.indexOf(f); if (k >= 0) d._in.splice(k, 1); }
      }
      f._out = [];
    };
    return f;
  };
  ctx.createOscillator = function () {
    var o = node("osc");
    o.type = "sine";
    o.frequency = new Param(440);
    o.detune = new Param(0);
    o.start = function (t) { o._start = t || ctx.currentTime; live.push(o); };
    o.stop = function (t) { o._stop = t || ctx.currentTime; };
    o.disconnect = function () {
      // рвём связи в обе стороны, как настоящий Web Audio: и свой список
      // исходящих, и упоминание себя во входах приёмника, и вклад в
      // параметр, если осциллятор работал модулятором (LFO)
      for (var i = 0; i < o._out.length; i++) {
        var d = o._out[i];
        if (d instanceof Param) { var m = d.mods.indexOf(o); if (m >= 0) d.mods.splice(m, 1); }
        else if (d && d._in) { var k = d._in.indexOf(o); if (k >= 0) d._in.splice(k, 1); }
      }
      o._out = [];
    };
    return o;
  };
  ctx.createBuffer = function (ch, len, sr) {
    return { length: len, sampleRate: sr, getChannelData: function () { return new Float32Array(len); } };
  };
  ctx.createBufferSource = function () {
    var s = node("src");
    s.buffer = null;
    s.loop = false;
    s.playbackRate = new Param(1);
    s.start = function () {};
    s.stop = function () {};
    return s;
  };
  ctx._live = live;
  // Сколько узлов до сих пор висит в графе. Web Audio не убирает их сам:
  // остановленный осциллятор молчит, но гейн, в который он включён,
  // остаётся подключён к выходу и продолжает суммироваться. Тысяча
  // мёртвых узлов на телефоне — это уже нагрузка и грязь в звуке.
  ctx._who = function () {
    var out = {};
    var stack = [ctx.destination];
    var visited = [];
    while (stack.length) {
      var n = stack.pop();
      if (!n || visited.indexOf(n) >= 0) continue;
      visited.push(n);
      out[n._name || "?"] = (out[n._name || "?"] || 0) + 1;
      if (n._in) for (var i = 0; i < n._in.length; i++) stack.push(n._in[i]);
    }
    return out;
  };
  ctx._graphSize = function () {
    var seen = 0;
    var stack = [ctx.destination];
    var visited = [];
    while (stack.length) {
      var n = stack.pop();
      if (!n || visited.indexOf(n) >= 0) continue;
      visited.push(n);
      seen++;
      if (n._in) for (var i = 0; i < n._in.length; i++) stack.push(n._in[i]);
    }
    return seen;
  };
  return ctx;
}

function run(seconds, mode) {
  var G = H.boot();
  var game = H.makeWorld(G, 7);
  // часы стенда: игровое время, иначе антиспам голоса душит всё
  G.now = function () { return game.time; };

  // подставной Web Audio ставим ДО unlock, иначе игра построит граф
  // на настоящем контексте, которого в node нет
  var ctx = ctxStub();
  var live = ctx._live;
  global.window.AudioContext = function () { return ctx; };
  G.Audio.ready = false;
  G.Audio._unlock();
  var dt = 1 / 30;
  var t = 0;
  var notes = 0;
  var samples = [];

  // считаем короткие ноты: каждая заведённая осцилляция — это событие
  var startCount = 0;
  var origOsc = ctx.createOscillator;
  ctx.createOscillator = function () {
    var o = origOsc();
    var s = o.start;
    o.start = function (x) { startCount++; return s.call(o, x); };
    return o;
  };

  while (t < seconds) {
    ctx.currentTime = t;
    // Настоящий Web Audio зовёт onended, когда нота отзвучала. Без этого
    // уборка в audio.js никогда не случится и замер соврёт, что утечка
    // не лечится.
    for (var li = live.length - 1; li >= 0; li--) {
      var lo = live[li];
      if (lo._stop !== undefined && lo._stop <= t) {
        live.splice(li, 1);
        if (typeof lo.onended === "function") { lo.onended(); ctx._reaped = (ctx._reaped || 0) + 1; }
        else ctx._noReap = (ctx._noReap || 0) + 1;
      }
    }
    H.step(G, game, dt);
    // Audio.update зовёт движок (engine.js:535), а движка в стенде нет:
    // без этой строки уровень сада остаётся нулевым и замер врёт.
    if (G.Audio.setLaw) {
      var act = game.world.active;
      G.Audio.setLaw(act && act.length ? Math.min(1, act[act.length - 1].left / 6) : 0);
    }
    G.Audio.update(dt, game.dna, game.state, game.world.tide, game.world);
    if (mode === "gaze") {
      var n = H.nearestUnformed(game);
      if (n) H.gaze(G, game, n, 1.4, true);
    }
    t += dt;
    if (Math.abs(t % 1) < dt) {
      var gd = G.Audio.garden;
      var sw = gd ? gd.g.gain.swing() : { base: 0, amp: 0, peak: 0 };
      var alive = 0;
      for (var i = 0; i < game.world.nodes.length; i++) {
        var nd = game.world.nodes[i];
        if (!nd.dead && nd.state === "alive") alive++;
      }
      samples.push({
        t: Math.round(t),
        alive: alive,
        noise: G.Audio.noise ? G.Audio.noise.g.gain.value : 0,
        gardenBase: sw.base,
        gardenAmp: sw.amp,
        gardenPeak: sw.peak,
        drone: G.Audio.drones.reduce(function (a, d) { return a + d.g.gain.value; }, 0),
        droneHz: G.Audio.drones.map(function (d) { return Math.round(d.o.frequency.value); }),
        notes: startCount,
        graph: ctx._graphSize(),
        reaped: ctx._reaped || 0,
        noReap: ctx._noReap || 0
      });
    }
  }
  return { samples: samples, notes: startCount, G: G, who: ctx._who() };
}

function report(label, seconds, mode) {
  var r = run(seconds, mode);
  var s = r.samples;
  var last = s[s.length - 1];
  var maxPeak = 0, maxNoise = 0;
  s.forEach(function (x) {
    if (x.gardenPeak > maxPeak) maxPeak = x.gardenPeak;
    if (x.noise > maxNoise) maxNoise = x.noise;
  });
  console.log("\n— " + label + " (" + seconds + " с) —");
  console.log("  живых узлов в конце: " + last.alive);
  console.log("  гул (4 дрона, сумма):   " + last.drone.toFixed(3) + "   частоты: " + last.droneHz.join(", ") + " Гц");
  console.log("  шум-погода:             " + last.noise.toFixed(4) + "   (пик " + maxNoise.toFixed(4) + ")");
  console.log("  сад: уровень            " + last.gardenBase.toFixed(4) +
              "   размах LFO ±" + last.gardenAmp.toFixed(4) +
              "   → пик " + last.gardenPeak.toFixed(4));
  if (last.gardenAmp > last.gardenBase * 2 && last.gardenBase > 0) {
    console.log("  ! LFO громче самого слоя в " + (last.gardenAmp / last.gardenBase).toFixed(0) +
                " раз — сад не дышит, а гудит");
  }
  console.log("  коротких нот: " + r.notes + " (" + (r.notes / seconds).toFixed(1) + "/с)");
  return last;
}

// Тихий замер для run.js: те же числа, без печати.
function measure(seconds, mode) {
  var r = run(seconds, mode);
  var last = r.samples[r.samples.length - 1];
  last.notesPerSec = r.notes / seconds;
  return last;
}

module.exports = { measure: measure, run: run, report: report };

if (require.main === module) {
  console.log("Что звучит на фоне. Громкости — доли от общего выхода (master 0.55).");
  report("никто ничего не делает", 120, "idle");
  report("игрок смотрит и растит", 120, "gaze");
}
