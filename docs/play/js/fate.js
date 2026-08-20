var IGRA = IGRA || {};
(function (G) {
  "use strict";

  G.Fate = {
    offered: false,
    chosen: "",
    // На каком берегу развилка уже стояла. null — ещё ни разу.
    // Отчёты 2.28: каждый вход после 48 с снова «become»/«release».
    // Конец — раз на кожу, не на каждую сессию.
    atMeta: null,
    // «Стать игрой» прожито: в новой жизни ты — голос, а не игрок.
    // Выставляется в boot() по наличию voiceplus (переживает перезагрузку,
    // потому что живёт отдельным ключом, который clear() сейва не трогает).
    plus: false,

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
    // Конец на живом берегу — прерванный жест. become обязан стереть
    // сейв; если сад загрузился, жест не дожил. offered без chosen —
    // человек закрыл экран кнопкой «назад»: это «ещё нет», а не финал.
    // 2.15 снимал только chosen у release, и второй конец умирал.
    unstick: function (meta) {
      var dirty = false;
      var had = this.chosen === "release" || this.chosen === "become" ||
                (this.offered && !this.chosen);
      if (had) {
        // Жест был — берег этот уже видел конец. Не предлагать снова,
        // пока кожа не сменится.
        if (this.atMeta == null && meta != null) this.atMeta = meta;
        this.chosen = "";
        this.offered = false;
        dirty = true;
        var scr = document.getElementById("fate-screen");
        if (scr) scr.classList.remove("on");
      }
      return dirty;
    },

    ready: function (game) {
      if (this.offered || this.chosen) return false;
      // Тестовый «быстрый конец»: развилка приходит почти сразу — только по
      // времени, без условий роста. Человеку достаточно подождать ~25 секунд
      // после рождения, ничего растить не нужно. Обычный порог (20 минут,
      // две метаморфозы / возраст / большой сад) не трогается.
      if (G.DEBUG && G.DEBUG.fast) {
        return (game.time || 0) > 25;
      }
      if (this.atMeta != null && (game.world.meta || 0) <= this.atMeta) return false;
      if ((game.time || 0) < 1200) return false;
      return game.world.meta >= 2 ||
             game.dna.age > 900 ||
             game.world.discovered + game.world.lost > 90;
    },

    offer: function (game) {
      if (this.offered) return;
      if ((game.time || 0) < 1200 && !(G.DEBUG && G.DEBUG.fast)) return;
      this.offered = true;
      this.atMeta = game.world.meta || 0;
      // Тест-режим одноразовый: развилка сработала — флаг гасится и в памяти,
      // и в сейве. Иначе «быстрый конец» застревал навсегда и приходил после
      // каждого старта (жалоба «после старта быстро наступает конец»).
      if (G.DEBUG && G.DEBUG.fast) {
        G.DEBUG.fast = false;
        try { G.Save.del("igra.debug.fast"); } catch (e) {}
      }
      G.Voice.say("fate");
      G.Voice.sayText(G.Lang.t("fate"), true);
      var scr = document.getElementById("fate-screen");
      if (scr) scr.classList.add("on");
      G.Haptic.play("end");
      // Иначе atMeta живёт только до dirtySave (8 с). Убил приложение
      // на развилке — следующий вход снова предлагает конец на той же коже.
      if (game && game.save) game.save();
    },

    release: function (game) {
      if ((game.time || 0) < 1200 && !(G.DEBUG && G.DEBUG.fast) && !this.chosen) return;
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
      if ((game.time || 0) < 1200 && !(G.DEBUG && G.DEBUG.fast) && !this.chosen) return;
      this.chosen = "become";
      if (game && game.save) game.save();
      var scr = document.getElementById("fate-screen");
      if (scr) scr.classList.remove("on");
      try {
        G.Save.set(
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
          G.Save.set("igra.lang", G.Lang.id);
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
        var raw = G.Save.get("igra.voiceplus");
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
