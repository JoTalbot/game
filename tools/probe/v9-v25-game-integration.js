#!/usr/bin/env node
// Реальный шов движка: index.html -> Game.update -> V9-V25 bridge -> persistence -> Save.
// Здесь нельзя подменять Game.update вызовом bridge.step: иначе проверяется
// отдельная функция, а не тот путь, которым живёт APK/WebView.
"use strict";

var fs = require("fs");
var vm = require("vm");
var path = require("path");

var ROOT = path.resolve(__dirname, "../..");
var html = fs.readFileSync(path.join(ROOT, "web", "index.html"), "utf8");
var files = Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["']/g))
  .map(function (m) { return m[1]; })
  .filter(function (src) { return src && src !== "js/main.js"; });

function ok(condition, label, detail) {
  if (!condition) throw new Error(label + (detail ? ": " + detail : ""));
  console.log("✓ " + label + (detail ? " (" + detail + ")" : ""));
}

function domNode() {
  return {
    textContent: "",
    innerHTML: "",
    value: "",
    style: {},
    classList: {
      add: function () {},
      remove: function () {},
      toggle: function () {},
      contains: function () { return false; }
    },
    appendChild: function () {},
    removeChild: function () {},
    addEventListener: function () {},
    removeEventListener: function () {},
    setAttribute: function () {},
    getBoundingClientRect: function () { return { left: 0, top: 0, width: 800, height: 600 }; },
    offsetWidth: 800,
    offsetHeight: 600,
    offsetParent: {},
    getContext: function () { return null; }
  };
}

var ctx2d = new Proxy({
  canvas: { width: 800, height: 600 }
}, {
  get: function (target, prop) {
    if (prop === "measureText") return function () { return { width: 0 }; };
    if (prop === "createLinearGradient" || prop === "createRadialGradient") {
      return function () { return { addColorStop: function () {} }; };
    }
    if (!(prop in target)) target[prop] = function () {};
    return target[prop];
  },
  set: function (target, prop, value) { target[prop] = value; return true; }
});
var canvas = domNode();
canvas.width = 800;
canvas.height = 600;
canvas.getContext = function (type) { return type === "2d" ? ctx2d : null; };

var nodes = {};
var store = Object.create(null);
var context = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  requestAnimationFrame: function () { return 0; },
  cancelAnimationFrame: function () {},
  performance: { now: function () { return Date.now(); } },
  location: { href: "https://igra.local/www/index.html", protocol: "https:", search: "" },
  navigator: { language: "ru-RU", userLanguage: "ru-RU", vibrate: function () {}, deviceMemory: 4, hardwareConcurrency: 4, userAgent: "integration-probe" },
  document: {
    readyState: "loading",
    documentElement: { lang: "ru", clientWidth: 800, clientHeight: 600 },
    body: { appendChild: function () {}, removeChild: function () {}, classList: { add: function () {}, remove: function () {}, contains: function () { return false; } } },
    createElement: function () { return domNode(); },
    getElementById: function (id) {
      if (id === "stage") return canvas;
      if (!nodes[id]) nodes[id] = domNode();
      return nodes[id];
    },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
    removeEventListener: function () {}
  },
  localStorage: {
    getItem: function (k) { return store[k] == null ? null : store[k]; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    clear: function () { store = Object.create(null); }
  },
  innerWidth: 800,
  innerHeight: 600,
  devicePixelRatio: 1,
  screen: { width: 800, height: 600 },
  visualViewport: null,
  AudioContext: function () {},
  webkitAudioContext: function () {}
};
context.window = context;
context.globalThis = context;
context.addEventListener = function () {};
context.removeEventListener = function () {};

var sandbox = vm.createContext(context);
for (var i = 0; i < files.length; i++) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, "web", files[i]), "utf8"), sandbox, { filename: files[i] });
}

var G = sandbox.IGRA;
ok(G && typeof G.Game === "function", "реальный Game загружен");
ok(G.V9V25Bridge && G.V9V25Bridge.ensure, "V9-V25 bridge загружен");
ok(G.V9V25Persistence && G.V9V25Persistence.pack, "V9-V25 persistence загружен");
ok(G.Game.prototype.__v9v25Bridge === true, "bridge оборачивает настоящий Game.update");
ok(G.Game.prototype.__v9v25Persistence === true, "persistence оборачивает настоящий Game.save/load");

G.Save.clear();
var game = new G.Game();
game.state = "play";
game.w = 800;
game.h = 600;
game.cam.w = 800;
game.cam.h = 600;

// Сначала настоящий кадр создаёт baseline bridge. Затем используем тот же
// путь движения, что и движок: клавиша проходит через Game._move внутри
// Game.update. В реальном кадре скорость может быть меньше порога visit,
// поэтому один тестовый кадр получает реалистичный, но более крупный dt.
game.update(1 / 60);
var baselineX = game.player.x;
game.input.keys.ArrowRight = true;
game.update(0.1);
game.input.keys.ArrowRight = false;

var state = game.world.v9v25;
ok(!!state, "V9-V25 состояние создано настоящим update");
ok(game.player.x !== baselineX, "реальный Game._move изменил позицию", "x=" + game.player.x);
ok(state.metrics.actions >= 1, "реальное движение стало V9-V25 action", "actions=" + state.metrics.actions);
ok(state.lastAction && state.lastAction.type === "visit", "реальный action имеет тип visit");
ok(Array.isArray(state.replay) && state.replay.length === 1, "реальный action попал в replay", "replay=" + state.replay.length);

// Idle-кадр не должен создавать второй replay item.
game.update(1 / 60);
ok(state.replay.length === 1, "idle-кадр не дублирует replay");

// Полный save path: Game.save -> Save.write -> persistence wrapper -> Save.write(v9v25).
game.save();
var saved = G.Save.load();
ok(saved && saved.v9v25, "Game.save записал V9-V25 в реальное хранилище");
ok(saved.v9v25.replay && saved.v9v25.replay.length === 1, "Save содержит replay", "replay=" + saved.v9v25.replay.length);
ok(saved.v9v25.schema === 5, "Save содержит текущую schema", "schema=" + saved.v9v25.schema);

// Уничтожаем in-memory V9-V25 состояние и заставляем настоящий Game.load
// пройти через исходный loader, затем persistence wrapper восстановит слой.
game.world.v9v25 = null;
var loaded = game.load();
ok(loaded === true, "настоящий Game.load завершился успешно");
ok(game.world.v9v25 && Array.isArray(game.world.v9v25.replay), "Game.load восстановил V9-V25 state");
ok(game.world.v9v25.replay.length === 1, "Game.load восстановил replay", "replay=" + game.world.v9v25.replay.length);
ok(game.world.v9v25.replay[0].type === "visit", "Game.load сохранил смысл action", game.world.v9v25.replay[0].type);

console.log("V9-V25 real Game.update/save/load integration probe: PASS");
