// Загрузка всех скриптов ровно в порядке index.html, с минимальным DOM.
// Стенды (run.js/balance.js/care.js) грузят только модули логики и НЕ трогают
// ui.js, lang.js apply и main.js boot — то есть настоящий запуск игры они не
// проверяют. Здесь ловится то, что ломается лишь при живом старте.
var fs = require("fs"), vm = require("vm"), path = require("path");
var ROOT = path.join(__dirname, "..", "..", "web");

function el(id) {
  var e = {
    id: id || "", style: {}, width: 800, height: 600, textContent: "", innerHTML: "",
    value: "", dataset: {}, children: [], childNodes: [], parentNode: null,
    classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
    appendChild: function () {}, removeChild: function () {}, insertBefore: function () {},
    setAttribute: function () {}, getAttribute: function () { return null; },
    removeAttribute: function () {}, addEventListener: function () {},
    removeEventListener: function () {}, focus: function () {}, blur: function () {},
    click: function () {}, remove: function () {},
    querySelector: function () { return el(); }, querySelectorAll: function () { return []; },
    getBoundingClientRect: function () { return { left: 0, top: 0, width: 800, height: 600 }; },
    getContext: function () { return new Proxy({}, { get: function () { return function () { return {}; }; } }); }
  };
  e.childNodes = [{ nodeValue: "", nodeType: 3 }];
  return e;
}

var doc = {
  getElementById: function (id) { return el(id); },
  querySelector: function () { return el(); },
  querySelectorAll: function () { return []; },
  createElement: function () { return el(); },
  createTextNode: function () { return { nodeValue: "" }; },
  addEventListener: function () {}, removeEventListener: function () {},
  body: el("body"), documentElement: el("html"), head: el("head"),
  hidden: false, visibilityState: "visible", readyState: "complete"
};

var ctx = {
  console: console, document: doc, navigator: { userAgent: "node", language: "ru", vibrate: function () {} },
  location: { href: "http://local/", search: "", reload: function () {} },
  localStorage: (function () { var m = {}; return {
    getItem: function (k) { return k in m ? m[k] : null; },
    setItem: function (k, v) { m[k] = String(v); },
    removeItem: function (k) { delete m[k]; } }; })(),
  requestAnimationFrame: function () { return 1; }, cancelAnimationFrame: function () {},
  setTimeout: function () { return 1; }, clearTimeout: function () {},
  setInterval: function () { return 1; }, clearInterval: function () {},
  devicePixelRatio: 2, innerWidth: 800, innerHeight: 600,
  performance: { now: function () { return Date.now(); } },
  Date: Date, Math: Math, JSON: JSON, parseFloat: parseFloat, parseInt: parseInt,
  isNaN: isNaN, String: String, Number: Number, Array: Array, Object: Object,
  Boolean: Boolean, RegExp: RegExp, Error: Error, Proxy: Proxy, Promise: Promise
};
ctx.addEventListener = function () {};
ctx.removeEventListener = function () {};
ctx.matchMedia = function () { return { matches: false, addListener: function () {}, addEventListener: function () {} }; };
ctx.getComputedStyle = function () { return { getPropertyValue: function () { return ""; } }; };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
ctx.AudioContext = function () {
  return new Proxy({}, { get: function () {
    return function () { return { connect: function () {}, start: function () {}, stop: function (),
      gain: { value: 0, setValueAtTime: function () {}, linearRampToValueAtTime: function () {} },
      frequency: { value: 0, setValueAtTime: function () {} } }; }; } });
};
ctx.webkitAudioContext = ctx.AudioContext;
vm.createContext(ctx);

var html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
var files = [];
html.replace(/<script src="([^"]+)"/g, function (_, s) { files.push(s); return _; });

var fails = 0;
files.forEach(function (f) {
  try {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
  } catch (e) {
    fails++;
    console.log("  ✗ " + f + " → " + e.message);
    console.log("    " + (e.stack.split("\n")[1] || "").trim());
  }
});

var G = ctx.IGRA;
function ok(cond, name, note) {
  if (!cond) fails++;
  console.log("  " + (cond ? "✓" : "✗") + " " + name + (note ? "  (" + note + ")" : ""));
}
console.log("\n— живой запуск: игра поднимается как в браузере");
ok(files.length === 21, "все скрипты index.html прочитаны", files.length + " шт");
ok(!!G, "IGRA собрана");
ok(!!(G && G.app), "игра стартовала (G.app есть)");
ok(!!(G && G.app && G.app.world), "мир создан");
ok(!!(G && G.app && G.app.world && G.app.world.nodes), "берег засеян");
var vkeys = G && G.Voice ? G.Voice.keys() : [];
ok(vkeys.length > 40, "голос знает ключи", vkeys.length + " ключей");
var noEn = vkeys.filter(function (k) {
  return !(G.LINES_EN && G.LINES_EN[k] && G.LINES_EN[k].length);
});
ok(noEn.length === 0, "у каждой реплики есть английская раскладка",
   noEn.length ? "без перевода: " + noEn.join(", ") : "все переведены");
var cyr = Object.keys((G.UI_STR && G.UI_STR.en) || {}).filter(function (k) {
  return /[а-яё]/i.test(G.UI_STR.en[k]);
});
ok(cyr.length === 0, "в английском интерфейсе нет кириллицы",
   cyr.length ? "русское: " + cyr.join(", ") : "чисто");
var uiMiss = Object.keys((G.UI_STR && G.UI_STR.ru) || {}).filter(function (k) {
  return !(G.UI_STR.en && k in G.UI_STR.en);
});
ok(uiMiss.length === 0, "обе раскладки интерфейса одного состава",
   uiMiss.length ? "нет в en: " + uiMiss.join(", ") : Object.keys(G.UI_STR.ru).length + " ключей");

var nameMiss = [];
["spark", "relic", "thorn", "still", "echo", "shard", "tone", "wound", "memory"].forEach(function (k) {
  if (!(G.KIND_EN && G.KIND_EN[k])) nameMiss.push("порода " + k);
});
["curiosity", "aggression", "contemplation", "empathy", "chaos", "harmony"].forEach(function (k) {
  if (!(G.TRAIT_EN && G.TRAIT_EN[k])) nameMiss.push("ось " + k);
});
ok(nameMiss.length === 0, "у пород и осей есть английские имена",
   nameMiss.length ? nameMiss.join(", ") : "15 имён");

var VERBS = ["crystallize", "forget", "anchor", "resonate", "metamorphose", "update", "toJSON"];
var missing = VERBS.filter(function (v) {
  return !G || !G.app || !G.app.world || typeof G.app.world[v] !== "function";
});
ok(missing.length === 0, "мир умеет всё, чем игра пользуется",
   missing.length ? "нет: " + missing.join(", ") : VERBS.length + " глаголов");

var VOICE_VERBS = ["say", "update", "reset", "keys"];
var vmiss = VOICE_VERBS.filter(function (v) { return !G || !G.Voice || typeof G.Voice[v] !== "function"; });
ok(vmiss.length === 0, "голос умеет всё, чем игра пользуется",
   vmiss.length ? "нет: " + vmiss.join(", ") : VOICE_VERBS.length + " глаголов");

var crashed = null;
try {
  var g = G.app;
  for (var f = 0; f < 1800; f++) {
    g.world.update(1 / 60, g.player, g.dna, g.fx, g);
    if (G.Director && G.Director.update) G.Director.update(1 / 60, g);
    G.Voice.update(1 / 60);
  }
} catch (e) { crashed = e.message; }
ok(!crashed, "полминуты кадров без падения", crashed || "1800 кадров");

var grew = null;
try {
  var w = G.app.world;
  var un = w.nodes.filter(function (n) { return n.state !== "alive"; })[0];
  var gest = { still: 0.9, explore: 0.3, speed: 0, calm: 0.8, aggr: 0, care: 0.9 };
  if (un) { w.crystallize(un, gest, G.app.dna); grew = un.state === "alive"; }
  else grew = "нет неоформленных";
} catch (e) { grew = "упало: " + e.message; }
ok(grew === true || grew === "нет неоформленных", "узел кристаллизуется", String(grew));
console.log(fails ? "\n✗ " + fails + " падений при живом запуске\n" : "\n✓ игра поднимается без ошибок\n");
process.exit(fails ? 1 : 0);