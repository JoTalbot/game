#!/usr/bin/env node
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const html = fs.readFileSync(path.join(root, "web/index.html"), "utf8");
const files = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m => m[1]).filter(Boolean);
const required = [
  "js/math.js", "js/lang.js", "js/dna.js", "js/save.js", "js/audio.js", "js/fx.js", "js/igra.js", "js/report.js",
  "js/organs.js", "js/memory.js", "js/fate.js", "js/world.js", "js/director.js", "js/director-events.js",
  "js/life.js", "js/relationships.js", "js/world-memory.js", "js/trajectory.js", "js/act.js", "js/organ-conflicts.js",
  "js/metamorphosis.js", "js/renderer.js", "js/webgl-renderer.js", "js/engine.js", "js/ui.js", "js/main.js"
];
const ok = (condition, label, detail = "") => {
  if (!condition) throw new Error(`${label}${detail ? `: ${detail}` : ""}`);
  console.log(`✓ ${label}${detail ? ` (${detail})` : ""}`);
};

ok(files.length >= required.length, "структура index.html содержит полный набор скриптов", `${files.length} шт.`);
for (const src of required) ok(files.includes(src), `подключён ${src}`);

const context = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  performance: { now: () => Date.now() },
  location: { href: "https://igra.local/www/index.html" },
  navigator: { language: "ru-RU", userLanguage: "ru-RU" },
  localStorage: {
    _data: Object.create(null),
    getItem(k) { return this._data[k] ?? null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = Object.create(null); }
  },
  document: {
    readyState: "complete",
    documentElement: { lang: "ru" },
    body: { appendChild() {}, removeChild() {} },
    createElement() { return { style: {}, setAttribute() {}, appendChild() {}, remove() {} }; },
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {}
  },
  window: null,
  globalThis: null,
  AudioContext: function() {},
  webkitAudioContext: function() {}
};
context.window = context;
context.globalThis = context;
const sandbox = vm.createContext(context);
for (const src of files) {
  const code = fs.readFileSync(path.join(root, "web", src), "utf8");
  vm.runInContext(code, sandbox, { filename: src });
}

ok(!!sandbox.IGRA, "IGRA загружен");
ok(!!sandbox.G && !!sandbox.G.app, "G.app доступен");
ok(!!sandbox.G.app.world, "мир создан");
ok(Array.isArray(sandbox.G.app.world.nodes), "узлы мира доступны");
ok(sandbox.G.app.world.nodes.length > 0, "в мире есть живые узлы");
ok(sandbox.G.Voice && typeof sandbox.G.Voice.say === "function", "Voice Game доступен");
ok(sandbox.G.World && typeof sandbox.G.World.prototype.crystallize === "function", "кристаллизация доступна");

const worldMethods = ["crystallize", "forget", "anchor", "resonate", "metamorphose", "update", "toJSON"];
for (const method of worldMethods) ok(typeof sandbox.G.World.prototype[method] === "function", `World.${method} доступен`);
const voiceMethods = ["say", "update", "reset", "keys"];
for (const method of voiceMethods) ok(typeof sandbox.G.Voice[method] === "function", `Voice.${method} доступен`);

const voiceKeys = typeof sandbox.G.Voice.keys === "function" ? sandbox.G.Voice.keys() : [];
ok(voiceKeys.length > 40, "словарь Voice содержит живой набор фраз", `${voiceKeys.length} ключей`);

const before = sandbox.G.app.world.nodes.length;
for (let i = 0; i < 1800; i++) sandbox.G.app.world.update(1 / 60);
ok(sandbox.G.app.world.nodes.length === before, "1800 кадров проходят без разрушения мира");

const node = sandbox.G.app.world.nodes[0];
const result = sandbox.G.app.world.crystallize(node, 0.8);
ok(!!result, "кристаллизация возвращает результат");

console.log("BOOT PROBE PASS");
