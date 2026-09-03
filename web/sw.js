// Малый offline shell для браузерного берега.
// Android/WebView носит игру в пакете, ему service worker не нужен. А вот
// запасной берег на GitHub Pages должен открываться без сети.
var CACHE = "igra-shell-v7";
var ASSETS = [
  "./", "./index.html", "./manifest.json", "./assets/img/icon.png",
  "./assets/fonts/f0.ttf", "./assets/fonts/f1.ttf", "./assets/fonts/f2.ttf", "./assets/fonts/f3.ttf", "./assets/fonts/f4.ttf", "./assets/fonts/f5.ttf", "./assets/fonts/f6.ttf", "./assets/fonts/f7.ttf", "./assets/fonts/f8.ttf",
  "./css/fonts.css", "./css/game.css", "./js/math.js", "./js/lang.js", "./js/dna.js", "./js/save.js", "./js/audio.js", "./js/fx.js", "./js/igra.js", "./js/report.js", "./js/organs.js", "./js/memory.js", "./js/fate.js", "./js/world.js", "./js/director.js", "./js/director-events.js", "./js/director-content.js", "./js/life.js", "./js/relationships.js", "./js/world-memory.js", "./js/trajectory.js", "./js/act.js", "./js/organ-conflicts.js", "./js/metamorphosis.js", "./js/boss-shadow.js", "./js/spatial-memory.js", "./js/v3-depth.js", "./js/v3-continuity.js", "./js/release-systems.js", "./js/release-fixes.js", "./js/v4-beings.js", "./js/v4-history-routes.js", "./js/renderer.js", "./js/webgl-renderer.js", "./js/engine.js", "./js/ui.js", "./js/main.js"
];
self.addEventListener("install", function (event) { event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(ASSETS); })); });
self.addEventListener("activate", function (event) { event.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) { return caches.delete(key); })); })); });
self.addEventListener("fetch", function (event) { if (event.request.method !== "GET") return; event.respondWith(caches.match(event.request).then(function (hit) { return hit || fetch(event.request).catch(function () { return caches.match("./index.html"); }); })); });