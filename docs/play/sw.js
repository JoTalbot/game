// Малый offline shell для браузерного берега.
//
// Android/WebView носит игру в пакете, ему service worker не нужен. А вот
// запасной берег на GitHub Pages должен открываться без сети: концепт
// обещает оффлайн. Кэшируем только оболочку одной версией; данные в
// localStorage и так живут на устройстве.
var CACHE = "igra-shell-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/img/icon.png",
  "./css/fonts.css",
  "./css/game.css"
];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(ASSETS);
  }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key !== CACHE;
    }).map(function (key) {
      return caches.delete(key);
    }));
  }));
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(function (hit) {
    return hit || fetch(event.request).catch(function () {
      return caches.match("./index.html");
    });
  }));
});
