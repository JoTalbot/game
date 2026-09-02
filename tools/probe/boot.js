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
  "js/metamorphosis.js", "js/boss-shadow.js", "js/spatial-memory.js", "js/renderer.js", "js/webgl-renderer.js", "js/engine.js", "js/ui.js", "js/main.js"
];
const ok = (condition, label, detail = "") => { if (!condition) throw new Error(`${label}${detail ? `: ${detail}` : ""}`); console.log(`✓ ${label}${detail ? ` (${detail})` : ""}`); };
ok(files.length >= required.length, "структура index.html содержит полный набор скриптов", `${files.length} шт.`);
for (const src of required) ok(files.includes(src), `подключён ${src}`);
const noopContext = new Proxy({}, { get(target, prop) { if (prop === "measureText") return () => ({ width: 0 }); if (prop === "createLinearGradient" || prop === "createRadialGradient") return () => ({ addColorStop() {} }); if (!(prop in target)) target[prop] = () => {}; return target[prop]; }, set(target, prop, value) { target[prop] = value; return true; } });
const canvas = { style: {}, width: 800, height: 600, offsetWidth: 800, offsetHeight: 600, getContext(type) { return type === "2d" ? noopContext : null; }, getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; }, addEventListener() {} };
const context = { console, setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame: () => 0, cancelAnimationFrame: () => {}, performance: { now: () => Date.now() }, location: { href: "https://igra.local/www/index.html", protocol: "https:", search: "" }, navigator: { language: "ru-RU", userLanguage: "ru-RU" }, localStorage: { _data: Object.create(null), getItem(k) { return this._data[k] ?? null; }, setItem(k, v) { this._data[k] = String(v); }, removeItem(k) { delete this._data[k]; }, clear() { this._data = Object.create(null); } }, document: { readyState: "complete", documentElement: { lang: "ru", clientWidth: 800, clientHeight: 600 }, body: { appendChild() {}, removeChild() {}, classList: { add() {}, remove() {}, contains() { return false; } } }, createElement() { return { style: {}, setAttribute() {}, appendChild() {}, remove() {}, addEventListener() {} }; }, getElementById(id) { return id === "stage" ? canvas : null; }, querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {} }, window: null, globalThis: null, innerWidth: 800, innerHeight: 600, devicePixelRatio: 1, screen: { width: 800, height: 600 }, visualViewport: null, AudioContext: function() {}, webkitAudioContext: function() {} };
context.window = context; context.globalThis = context; context.addEventListener = function () {}; context.removeEventListener = function () {}; context.window.requestAnimationFrame = context.requestAnimationFrame; context.window.cancelAnimationFrame = context.cancelAnimationFrame;
const sandbox = vm.createContext(context);
for (const src of files) vm.runInContext(fs.readFileSync(path.join(root, "web", src), "utf8"), sandbox, { filename: src });
const G = sandbox.IGRA;
ok(!!G, "IGRA загружен");
ok(typeof G.Game === "function", "конструктор Game доступен");
if (!G.app) { G.app = new G.Game(); if (G.UI && G.UI.bind) G.UI.bind(G.app); if (G.app.start) G.app.start(); }
ok(!!G.app && !!G.app.world, "G.app доступен");
ok(Array.isArray(G.app.world.nodes), "узлы мира доступны");
// Полный browser boot оставляет игру на титуле до первого жеста. Для
// интеграционного прогона поднимаем первый берег тем же публичным методом,
// которым пользуется UI, а не мутируем внутренние массивы мира.
if (G.app.world.nodes.length === 0 && G.app.state === "title" && typeof G.app.startBirth === "function") G.app.startBirth();
ok(G.app.world.nodes.length > 0, "в мире есть живые узлы");
ok(G.Voice && typeof G.Voice.say === "function", "Voice Game доступен");
ok(G.World && typeof G.World.prototype.crystallize === "function", "кристаллизация доступна");
ok(G.BossShadow && typeof G.BossShadow.profile === "function", "долгая тень босса доступна");
ok(G.SpatialMemory && typeof G.SpatialMemory.profile === "function", "пространственная память доступна");
const worldMethods = ["crystallize", "forget", "anchor", "resonate", "metamorphose", "update", "toJSON"];
for (const method of worldMethods) ok(typeof G.World.prototype[method] === "function", `World.${method} доступен`);
const voiceMethods = ["say", "update", "reset", "keys"];
for (const method of voiceMethods) ok(typeof G.Voice[method] === "function", `Voice.${method} доступен`);
const voiceKeys = typeof G.Voice.keys === "function" ? G.Voice.keys() : [];
ok(voiceKeys.length > 40, "словарь Voice содержит живой набор фраз", `${voiceKeys.length} ключей`);
const before = G.app.world.nodes.length;
for (let i = 0; i < 1800; i++) G.app.world.update(1 / 60);
ok(G.app.world.nodes.length === before, "1800 кадров проходят без разрушения мира");
const node = G.app.world.nodes[0];
const result = G.app.world.crystallize(node, 0.8);
ok(!!result, "кристаллизация возвращает результат");
console.log("BOOT PROBE PASS");
