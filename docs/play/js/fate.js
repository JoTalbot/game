var IGRA = IGRA || {};
(function (G) {
  "use strict";

  G.Fate = {
    offered: false,
    chosen: "",

    // Развилка «отпустить / стать игрой» — конец пути, а не веха. Она
    // приходила на ТРЕТЬЕЙ минуте: отчёт с телефона показал «судьба:
    // become» при 1.3 минутах игры, нуле берегов и сессии 0. Виноват был
    // счётчик `discovered + lost > 22` — двадцать два узла набегают за
    // пару минут бодрого сева, это разминка, а не прожитая жизнь.
    // Человек увидел финал раньше, чем игру.
    //
    // Теперь нужны две вещи разом: прожитое ВРЕМЯ и прожитые СОБЫТИЯ.
    // Время — главный порог, его не обойти ничем: меньше двадцати минут
    // на берегу — рано в любом случае. Дальше достаточно одного из трёх
    // свидетельств зрелости: две метаморфозы, долгий возраст ДНК или
    // большой сад, переживший прилив.
    ready: function (game) {
      if (this.offered || this.chosen) return false;
      if ((game.time || 0) < 1200) return false;
      return game.world.meta >= 2 ||
             game.dna.age > 900 ||
             game.world.discovered + game.world.lost > 90;
    },

    offer: function (game) {
      if (this.offered) return;
      this.offered = true;
      G.Voice.say("fate");
      G.Voice.sayText(G.Lang.t("fate"), true);
      var scr = document.getElementById("fate-screen");
      if (scr) scr.classList.add("on");
      G.Haptic.play("end");
    },

    release: function (game) {
      this.chosen = "release";
      var scr = document.getElementById("fate-screen");
      if (scr) scr.classList.remove("on");
      game.state = "release";
      game.releaseT = 0;
      G.Haptic.play("end");
      G.Audio.metamorphosis(game.dna);
      G.Voice.say("released");
      G.Voice.sayText(G.Lang.t("releaseLine"), true);
      for (var i = 0; i < game.world.nodes.length; i++) {
        var n = game.world.nodes[i];
        if (n.state === "alive") {
          game.world.stars.push({
            x: n.x * 0.14,
            y: n.y * 0.14,
            c: n.color(),
            kind: n.kind,
            tw: Math.random() * G.TAU
          });
        }
      }
      game.save();
    },

    become: function (game) {
      this.chosen = "become";
      var scr = document.getElementById("fate-screen");
      if (scr) scr.classList.remove("on");
      try {
        localStorage.setItem(
          "igra.voiceplus",
          JSON.stringify({
            name: game.dna.name(),
            dna: game.dna.toJSON(),
            at: Date.now()
          })
        );
      } catch (e) {}
      G.Haptic.play("meta");
      G.Voice.say("became");
      G.Voice.sayText(G.Lang.t("becameLine") + " " + game.dna.name() + ".", true);
      // «Стать игрой» стирает сохранение и перезагружает страницу — если
      // не спросить сейчас, спрашивать будет уже некого и не о чем.
      // Поэтому конец ждёт: отчёт открывается, а перезагрузку запускает
      // сам человек, закрыв его. Без этого рассказ о последней сессии
      // умирал бы вместе с ней через пять секунд.
      var finish = function () {
        G.Save.clear();
        try {
          localStorage.setItem("igra.lang", G.Lang.id);
        } catch (e) {}
        location.reload();
      };
      setTimeout(function () {
        if (G.UI && G.UI.openReport) {
          G.UI.openReport(game);
          G.UI.afterReport = finish;
        } else {
          finish();
        }
      }, 3000);
    },

    greetPlus: function () {
      try {
        var raw = localStorage.getItem("igra.voiceplus");
        if (!raw) return;
        var data = JSON.parse(raw);
        if (!data || !(data.dna || data.name)) return;
        setTimeout(function () {
          var who = G.dnaName(data.dna) || data.name;
          G.Voice.sayText(who + " " + G.Lang.t("readsYou"), true);
        }, 2400);
      } catch (e) {}
    }
  };
})(IGRA);
