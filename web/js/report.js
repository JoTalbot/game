var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // Чёрный ящик берега.
  //
  // До сих пор обратная связь ходила через чат: я спрашивал «ушёл ли гул»,
  // человек вспоминал по памяти через день после сессии. Половина вопросов
  // — про то, что человек и не обязан замечать: сколько кадров в секунду,
  // не сорвался ли рендер, сколько раз он на самом деле вернулся к узлу.
  // Игра знает это точно. Пусть говорит сама.
  //
  // Правило: сюда идут только те мерки, которые нельзя добыть стендом. Всё,
  // что воспроизводится в `tools/probe`, там и живёт — отчёт не свалка.
  G.Report = {
    // плавность: копим гистограмму кадров, а не среднее. Среднее прячет
    // рывки — 58 fps со ступором раз в минуту и ровные 58 неразличимы.
    frames: 0,
    slow: 0,      // кадр дольше 1/30 с
    stall: 0,     // кадр дольше 1/8 с — видимый рывок
    worst: 0,
    fpsSum: 0,
    // сбои: единственный способ узнать о поломке на чужом телефоне
    errors: [],
    // поступки: что человек делал, а не что он о себе думает
    acts: {
      taps: 0, gazes: 0, crystals: 0, returns: 0,
      anchors: 0, pulses: 0, calls: 0, laws: 0,
      sky: 0, sigil: 0, lang: 0
    },
    startedAt: 0,
    playT: 0,

    reset: function () {
      this.frames = 0; this.slow = 0; this.stall = 0; this.worst = 0; this.fpsSum = 0;
      this.errors = [];
      this.playT = 0;
      this.startedAt = Date.now();
      for (var k in this.acts) if (this.acts.hasOwnProperty(k)) this.acts[k] = 0;
    },

    act: function (key, n) {
      if (this.acts[key] == null) return;
      this.acts[key] += n || 1;
    },

    frame: function (dt) {
      if (!dt || dt <= 0) return;
      this.frames++;
      this.playT += dt;
      this.fpsSum += 1 / dt;
      if (dt > 1 / 30) this.slow++;
      if (dt > 0.125) this.stall++;
      if (dt > this.worst) this.worst = dt;
    },

    // Ошибка рендера раньше уходила в невидимый `#fit-debug` и умирала
    // вместе с сессией. Теперь она доживает до отчёта — одинаковые
    // схлопываются, иначе один сломанный орган забьёт весь текст.
    error: function (msg) {
      msg = String(msg || "").slice(0, 140);
      for (var i = 0; i < this.errors.length; i++) {
        if (this.errors[i].msg === msg) { this.errors[i].n++; return; }
      }
      if (this.errors.length < 6) this.errors.push({ msg: msg, n: 1 });
    },

    fps: function () {
      return this.frames ? Math.round(this.fpsSum / this.frames) : 0;
    },

    // Вопросы берега. Не анкета «оцените от 1 до 5»: Игра — существо, она
    // спрашивает о том, что чувствует человек, и своим голосом. Ответ —
    // одно касание, потому что печатать на телефоне после часа игры никто
    // не станет. Порядок держим постоянным: так ответы разных сессий
    // сравнимы между собой.
    ASKS: [
      { id: "hum", ru: "фон гудел?", en: "did the background hum?",
        opts: { ru: ["тихо", "гудел", "не заметил"], en: ["quiet", "it hummed", "didn't notice"] } },
      { id: "hand", ru: "рука слушалась?", en: "did your hand obey?",
        opts: { ru: ["да", "срывалось", "мелкие не ловятся"], en: ["yes", "it slipped", "small ones evade"] } },
      { id: "silence", ru: "я много говорю?", en: "do i talk too much?",
        opts: { ru: ["в самый раз", "много", "слишком молчу"], en: ["just right", "too much", "too silent"] } },
      { id: "care", ru: "возвращаться было зачем?", en: "was returning worth it?",
        opts: { ru: ["да, видно", "не понял", "не пробовал"], en: ["yes, visible", "unclear", "didn't try"] } },
      { id: "why", ru: "зачем ты здесь остался?", en: "why did you stay?",
        opts: { ru: ["красиво", "интересно росло", "из упрямства", "сам не знаю"],
                en: ["beauty", "it grew", "stubbornness", "no idea"] } }
    ],
    answers: {},

    askText: function (a) {
      return G.Lang && G.Lang.id === "en" ? a.en : a.ru;
    },

    optText: function (a) {
      return (G.Lang && G.Lang.id === "en" ? a.opts.en : a.opts.ru) || a.opts.ru;
    },

    // Сам текст. Голый факт, ничего лишнего: человек вставит его в чат,
    // и он должен читаться и мной, и им.
    text: function (game) {
      var L = [];
      var w = game.world;
      var mins = Math.round(this.playT / 6) / 10;
      var en = G.Lang && G.Lang.id === "en";

      function line(a, b) { L.push(a + ": " + b); }

      L.push("— " + (en ? "IGRA" : "ИГРА") + " " + (G.VERSION || "?") + " —");
      line(en ? "played" : "сыграно", mins + (en ? " min" : " мин"));
      // Размер спрашиваем у окна, а не только у игры: в отчёте с телефона
      // это первое, по чему видно «сага экрана вернулась». Стенд ловил
      // тут NaN×NaN — подставная игра без холста, и в живой игре до
      // первого resize было бы то же самое.
      var sw = Math.round(game.w || (typeof window !== "undefined" ? window.innerWidth : 0) || 0);
      var sh = Math.round(game.h || (typeof window !== "undefined" ? window.innerHeight : 0) || 0);
      line(en ? "screen" : "экран",
        (sw && sh ? sw + "×" + sh : "?") + " @" + (Number(game.dpr) || 1).toFixed(1) +
        (G.Quality && !G.Quality.glow ? (en ? " (weak)" : " (слабый)") : ""));

      // Плавность — первое, что нужно знать про чужой телефон.
      var st = this.frames
        ? this.fps() + " fps" +
          (this.slow ? ", " + (en ? "slow frames " : "тяжёлых кадров ") + this.slow : "") +
          (this.stall ? ", " + (en ? "stalls " : "рывков ") + this.stall : "") +
          (this.worst > 0.125 ? ", " + (en ? "worst " : "худший ") + Math.round(this.worst * 1000) + " ms" : "")
        : "—";
      line(en ? "smoothness" : "плавность", st);

      var a = this.acts;
      line(en ? "grown" : "выращено", w.discovered + " (" + (en ? "alive " : "живых ") +
        w.nodes.filter(function (n) { return n.state === "alive"; }).length + ")");
      line(en ? "returns" : "возвращений", a.returns + (en ? ", anchors " : ", якорей ") + a.anchors);
      line(en ? "lost to tide" : "забрал прилив", w.lost +
        (en ? ", carried by rebirth " : ", унесла метаморфоза ") + (w.carried || 0));
      line(en ? "shores" : "берегов", w.meta + (en ? ", roads " : ", дорог ") + (w.arrived || 0) +
        (en ? ", beings " : ", существ ") + w.beings.length);
      line(en ? "laws touched" : "законов тронуто", a.laws +
        (en ? ", pulses " : ", пульсов ") + a.pulses);
      line(en ? "sky opened" : "небо открывал", a.sky +
        (en ? ", sigil " : ", сигилу ") + a.sigil);

      // Кем он оказался — по поступкам, а не по состоянию мира.
      line(en ? "nature" : "природа", game.dna.name() + " · " + G.traitName(game.dna.dominant()));
      line(en ? "season" : "сезон", G.Memory.climateName() + ", " +
        (en ? "day " : "день ") + G.Memory.days + ", " +
        (en ? "session " : "сессия ") + G.Memory.sessions);
      if (G.Fate && G.Fate.chosen) line(en ? "fate" : "судьба", G.Fate.chosen);

      // Ответы человека — сверху смысла, ниже цифр: цифры я и так знаю,
      // а это единственное, что знает только он.
      var said = [];
      for (var q = 0; q < this.ASKS.length; q++) {
        var ans = this.answers[this.ASKS[q].id];
        if (ans) said.push(this.askText(this.ASKS[q]) + " " + ans);
      }
      if (said.length) L.push((en ? "answers: " : "ответы: ") + said.join(" · "));
      var note = document.getElementById("report-note");
      if (note && note.value.trim()) L.push((en ? "in his words: " : "словами: ") + note.value.trim().slice(0, 400));

      if (this.errors.length) {
        var e = [];
        for (var i = 0; i < this.errors.length; i++) {
          e.push(this.errors[i].msg + (this.errors[i].n > 1 ? " ×" + this.errors[i].n : ""));
        }
        line(en ? "FAILURES" : "СБОИ", e.join(" | "));
      }

      return L.join("\n");
    }
  };
})(IGRA);
