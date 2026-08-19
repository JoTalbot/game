var IGRA = IGRA || {};
(function (G) {
  "use strict";

  function boot() {
    if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () {});
      });
    }
    G.Lang.init();
    G.Quality.init();
    // Тестовый «быстрый конец»: подхватывается из сейва, если был включён
    // пятью касаниями по логотипу (см. ui.js). Ускоряет только развилку
    // судьбы — ради проверки обеих концовок на устройстве.
    G.DEBUG.fast = (G.Save && G.Save.get("igra.debug.fast") === "1");
    // «Ты — голос»: если есть voiceplus (прожитое «стать игрой»), в новой
    // жизни игрок — уже голос, а не игрок (см. Fate.plus и startBirth).
    G.Fate.plus = (G.Save && !!G.Save.get("igra.voiceplus"));
    var game = new G.Game();
    G.app = game;
    G.UI.bind(game);
    game.start();
    G.Fate.greetPlus();

    // gentle title pulse
    var word = document.getElementById("word");
    if (word) {
      setTimeout(function () {
        word.classList.add("on");
      }, 400);
    }
    var tag = document.getElementById("tag");
    if (tag) {
      setTimeout(function () {
        tag.classList.add("on");
      }, 1400);
    }
    var actions = document.getElementById("title-actions");
    if (actions) {
      setTimeout(function () {
        actions.classList.add("on");
      }, 2000);
    }

    // first-run whisper
    if (!G.Save.exists()) {
      setTimeout(function () {
        var w = document.getElementById("whisper");
        if (w) w.classList.add("on");
      }, 2800);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(IGRA);
