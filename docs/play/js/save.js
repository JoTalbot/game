var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var KEY = "igra.save.v1";

  // Сейв обязан переживать перезапуск приложения. В браузере это
  // localStorage. Но WebView на Android грузит игру с кастомного origin
  // (https://igra.local, отдаётся через shouldInterceptRequest), и там
  // localStorage может не жить между запусками — тогда человек каждый раз
  // возвращается на пустой берег и справедливо пишет «сейв не работает».
  // Поэтому оболочка подставляет нативный мост `window.AndroidSave`
  // (SharedPreferences) — он переживает всё, кроме удаления игры.
  // Игра предпочитает его, localStorage остаётся запасным (браузер, PWA).
  function native() {
    try {
      if (typeof window !== "undefined" && window.AndroidSave) {
        return window.AndroidSave;
      }
    } catch (e) {}
    return null;
  }

  function parse(raw) {
    if (!raw) return null;
    try {
      var value = JSON.parse(raw);
      return value && typeof value === "object" ? value : null;
    } catch (e) {
      return null;
    }
  }

  G.Save = {
    load: function () {
      var n = native();
      if (n) {
        try {
          var nativeValue = parse(n.read(KEY));
          if (nativeValue) return nativeValue;
        } catch (e) {}
      }
      try {
        return parse(localStorage.getItem(KEY));
      } catch (e) {
        return null;
      }
    },
    write: function (data) {
      var s = JSON.stringify(data);
      var n = native();
      if (n) {
        try { n.write(KEY, s); return true; } catch (e) {}
      }
      try {
        localStorage.setItem(KEY, s);
        return true;
      } catch (e) {
        return false;
      }
    },
    clear: function () {
      var n = native();
      if (n) {
        try { n.remove(KEY); } catch (e) {}
      }
      try {
        localStorage.removeItem(KEY);
      } catch (e) {}
    },
    exists: function () {
      var n = native();
      if (n) {
        try { if (parse(n.read(KEY))) return true; } catch (e) {}
      }
      try {
        return !!parse(localStorage.getItem(KEY));
      } catch (e) {
        return false;
      }
    },
    // Чем на самом деле пишется сейв — для отчёта. native на Android,
    // localStorage в браузере. «Сейв не работает» без этой строки
    // неразличим: молчит ли localStorage, или человека просто не было.
    backend: function () {
      return native() ? "native" : "localStorage";
    },
    // Круг «записал — прочитал» тем же хранилищем, которым идёт сейв.
    // Правда о живом хранилище, а не о коде: если тут false — виноват
    // WebView, а не логика игры.
    probe: function () {
      var key = "igra.save.probe";
      var n = native();
      try {
        if (n) {
          n.write(key, "1");
          var ok = n.read(key) === "1";
          try { n.remove(key); } catch (cleanup) {}
          return ok;
        }
        localStorage.setItem(key, "1");
        var localOk = localStorage.getItem(key) === "1";
        localStorage.removeItem(key);
        return localOk;
      } catch (e) {
        if (n) {
          try { n.remove(key); } catch (cleanup) {}
        } else {
          try { localStorage.removeItem(key); } catch (cleanup2) {}
        }
        return false;
      }
    },

    // Универсальное ключ-значение через то же хранилище, что и сейв.
    // Сюда ходят все мелкие настройки, которые раньше жили в localStorage
    // (язык, рот, voiceplus): на Android localStorage может не пережить
    // перезапуск, и выбор человека терялся так же, как терялся сейв.
    get: function (key) {
      var n = native();
      if (n) {
        try { var v = n.read(key); if (v != null) return v; } catch (e) {}
      }
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
      var n = native();
      if (n) {
        try { n.write(key, value); return; } catch (e) {}
      }
      try { localStorage.setItem(key, value); } catch (e) {}
    },
    del: function (key) {
      var n = native();
      if (n) {
        try { n.remove(key); } catch (e) {}
      }
      try { localStorage.removeItem(key); } catch (e) {}
    }
  };
})(IGRA);
