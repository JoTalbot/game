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
      sky: 0, sigil: 0, lang: 0, rescued: 0, blooms: 0
    },
    startedAt: 0,
    playT: 0,
    night: { count: 0, hours: 0, lost: 0, blooms: 0, debt: 0 },

    noteNight: function (report) {
      if (!report || !report.hours || report.hours < 0.08) return;
      this.night.count++;
      this.night.hours += report.hours;
      this.night.lost += report.lost || 0;
      this.night.blooms += report.blooms || 0;
      this.night.debt += report.debt || 0;
    },

    // ЖЕСТЫ. Человек четыре релиза подряд говорит «срывается», а все
    // замеры зелёные: стенд дёргает игру напрямую и не воспроизводит
    // настоящий ввод. Значит правду знает только телефон — пусть он её и
    // расскажет. Каждое касание записывается: сколько длилось, взялся ли
    // взгляд, чем кончилось и ПОЧЕМУ оборвалось.
    gestures: { taps: 0, held: 0, born: 0, torn: 0, empty: 0, walk: 0 },
    // причины срыва — по именам, а не одним числом: иначе снова гадать
    tornBy: {},
    // сколько успел продержаться сорвавшийся взгляд (нужно, чтобы понять,
    // рвётся ли он сразу или у самой цели: рождение на 1.35 с)
    tornAt: [],
    // где именно рвётся: сразу после перелёта по зову или в обычной игре
    tornAfterCall: 0,
    lastCallAt: -999,

    gestureStart: function () {
      this.gestures.taps++;
      this._gT = 0;
      this._gHeld = false;
      // Исход жеста записывается один раз. Без этого флага срыв посреди
      // жеста (палец ушёл, узел исчез, смена кожи) гасил взгляд, а на
      // отпускании onUp засчитывал тот же жест ещё раз как «шаг» или
      // «в пустоту»: один тык давал два исхода, и воронка не сходилась.
      this._gDone = false;
    },

    gestureHold: function (dt, hasGaze) {
      this._gT = (this._gT || 0) + dt;
      if (hasGaze && !this._gHeld) {
        this._gHeld = true;
        this.gestures.held++;
      }
    },

    // why — короткое имя причины: "палец ушёл", "узел исчез", "нет сил",
    // "смена кожи", "система забрала". Именно оно и есть ответ на вопрос,
    // который я четыре релиза задаю вслепую.
    // Медиана честная: при чётном числе — среднее двух средних. Наивное
    // `[len>>1]` на двух значениях даёт больший из них, и отчёт врёт в
    // сторону «всё плохо» — а по этим числам я принимаю решения.
    median: function (arr) {
      if (!arr || !arr.length) return 0;
      var a = arr.slice().sort(function (x, y) { return x - y; });
      var m = a.length >> 1;
      var v = a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
      return Math.round(v * 100) / 100;
    },

    // Причины срыва живут КЛЮЧАМИ, а строкой становятся при показе — та
    // же болезнь, что чинили по всему миру в 0.4.46: русский текст,
    // вмерзающий в данные. Проверка поймала это сразу.
    WHY: {
      slip:   { ru: "палец ушёл",           en: "finger slipped away" },
      gone:   { ru: "узел исчез",           en: "the node vanished" },
      died:   { ru: "узел умер",            en: "the node died" },
      energy: { ru: "нет сил",              en: "out of strength" },
      meta:   { ru: "смена кожи",           en: "the shedding" },
      system: { ru: "система забрала жест", en: "the system took the gesture" },
      let:    { ru: "отпустил сам",         en: "let go himself" }
    },
    whyText: function (key) {
      var w = this.WHY[key];
      if (!w) return String(key);
      return G.Lang && G.Lang.id === "en" ? w.en : w.ru;
    },

    // Куда девалась сила. Отчёт показал «нет сил ×3» — а взгляд почти
    // бесплатен (ест 6/с при восстановлении 7-14/с). Значит энергию ели
    // раны (22/с при касании) или пульс (-16). Без разбивки это снова
    // гадание: пишем, кто именно.
    drain: { gaze: 0, wound: 0, pulse: 0, boss: 0 },
    noteDrain: function (who, amount) {
      if (this.drain[who] == null) return;
      this.drain[who] += amount || 0;
    },
    lowest: 100,
    noteEnergy: function (e) {
      if (e < this.lowest) this.lowest = Math.round(e);
    },

    slips: [],
    gestureTorn: function (why, t, slip) {
      this.gestures.torn++;
      this._gDone = true;
      var key = String(why || "?");
      this.tornBy[key] = (this.tornBy[key] || 0) + 1;
      if (t != null && this.tornAt.length < 60) this.tornAt.push(Math.round(t * 100) / 100);
      if (slip != null && this.slips.length < 60) this.slips.push(Math.round(slip));
      if (this.playT - this.lastCallAt < 20) this.tornAfterCall++;
    },

    gestureBorn: function () { this.gestures.born++; this._gDone = true; },
    gestureEmpty: function () { this.gestures.empty++; },
    gestureWalk: function () { this.gestures.walk++; },
    noteCall: function () { this.lastCallAt = this.playT; },

    reset: function () {
      this.frames = 0; this.slow = 0; this.stall = 0; this.worst = 0; this.fpsSum = 0;
      this.errors = [];
      this.playT = 0;
      this.startedAt = Date.now();
      this.gestures = { taps: 0, held: 0, born: 0, torn: 0, empty: 0, walk: 0 };
      this.tornBy = {};
      this.tornAt = [];
      this.slips = [];
      this.tornAfterCall = 0;
      this.lastCallAt = -999;
      this.drain = { gaze: 0, wound: 0, pulse: 0, boss: 0 };
      this.lowest = 100;
      this.night = { count: 0, hours: 0, lost: 0, blooms: 0, debt: 0 };
      this.zoom = { min: 9, max: 0, sum: 0, n: 0 };
      for (var k in this.acts) if (this.acts.hasOwnProperty(k)) this.acts[k] = 0;
    },

    // Отдаление камеры: человек прямо назвал его как условие срыва
    // («при отдалении экрана только некоторые ещё можно обвести»).
    zoom: { min: 9, max: 0, sum: 0, n: 0 },
    noteZoom: function (z) {
      if (!z || !isFinite(z)) return;
      if (z < this.zoom.min) this.zoom.min = z;
      if (z > this.zoom.max) this.zoom.max = z;
      this.zoom.sum += z;
      this.zoom.n++;
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
      // Возраст мира рядом со временем сессии: без него отчёт выглядел
      // так, будто за две минуты выросло сто узлов и сменилось четыре
      // берега.
      var worldMin = Math.round((game.time || 0) / 6) / 10;
      line(en ? "played" : "сыграно", mins + (en ? " min" : " мин") +
        (worldMin > mins + 0.5
          ? (en ? ", world is " : ", миру ") + worldMin + (en ? " min old" : " мин")
          : ""));
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

      // Правда о сейве — тем же хранилищем, которым он пишется. Без этой
      // строки «сейв не работает» неразличим: молчит ли localStorage/мост,
      // или человек просто не нажал «вернуться». probe() делает живой круг
      // записал-прочитал, backend() называет, чем игра пишет на этой
      // машине: native (SharedPreferences в Android) или localStorage.
      line(en ? "save" : "сейв",
        (G.Save && G.Save.backend ? G.Save.backend() : "?") +
        (G.Save && G.Save.probe ? (G.Save.probe() ? (en ? " ok" : " жив") : (en ? " BROKEN" : " СЛОМАН")) : "") +
        (G.Save && G.Save.exists ? (G.Save.exists() ? (en ? " exists" : " есть") : (en ? " empty" : " пуст")) : ""));

      if (this.night.count) {
        line(en ? "while away" : "пока тебя не было",
          Math.round(this.night.hours * 10) / 10 + (en ? "h" : "ч") +
          (en ? ", shore lost " : ", берег потерял ") + this.night.lost +
          (this.night.blooms ? (en ? ", blooms+rescued " : ", расцвело ") + this.night.blooms : "") +
          (this.night.debt ? (en ? ", farewells " : ", прощаний ") + this.night.debt : ""));
      }

      // РУКА — главный раздел. Человек четыре релиза говорит
      // «срывается», и это единственное место, где игра может ответить
      // сама: сколько касаний, сколько взяли взгляд, сколько дожили до
      // рождения и по какой причине оборвались остальные.
      var ge = this.gestures;
      line(en ? "touches" : "касаний", ge.taps +
        (en ? ", took gaze " : ", взяли взгляд ") + ge.held +
        (en ? ", grew " : ", выросло ") + ge.born +
        (en ? ", broke " : ", сорвалось ") + ge.torn +
        (en ? ", walked " : ", шагов ") + ge.walk +
        (en ? ", into nothing " : ", в пустоту ") + ge.empty);

      var why = [];
      for (var k in this.tornBy) {
        if (this.tornBy.hasOwnProperty(k)) why.push(this.whyText(k) + " ×" + this.tornBy[k]);
      }
      if (why.length) line(en ? "broke because" : "срыв по причине", why.join(", "));

      if (this.tornAt.length) {
        var srt = this.tornAt.slice().sort(function (x, y) { return x - y; });
        var mid = this.median(srt);
        var early = srt.filter(function (x) { return x < 0.4; }).length;
        line(en ? "broke at" : "срыв на секунде",
          (en ? "median " : "медиана ") + mid + (en ? "s, near-instant " : "с, почти сразу ") +
          early + (en ? " of " : " из ") + srt.length +
          (en ? " (birth at 1.35s)" : " (рождение на 1.35с)"));
      }
      if (this.slips.length) {
        var sl = this.slips.slice().sort(function (x, y) { return x - y; });
        line(en ? "finger slipped" : "палец уезжал на",
          (en ? "median " : "медиана ") + this.median(sl) +
          (en ? ", max " : ", максимум ") + sl[sl.length - 1] +
          (en ? " screen points (break at 112)" : " точек экрана (порог срыва 112)"));
      }
      if (this.tornAfterCall) {
        line(en ? "broke after a call" : "срыв сразу после зова",
          this.tornAfterCall + (en ? " (within 20s of arrival)" : " (в первые 20с после прилёта)"));
      }

      // Босс — самый мощный отток силы в игре (38/с против 22/с у раны), и
      // он был невидим в отчёте: «сила ушла на» и «падала до» врали ровно
      // в бою, где человек терял больше всего. Каждый канал оттока обязан
      // быть посчитан, иначе разбивка снова гадание.
      if (this.drain.gaze + this.drain.wound + this.drain.pulse + this.drain.boss > 1) {
        line(en ? "strength spent on" : "сила ушла на",
          (en ? "gaze " : "взгляд ") + Math.round(this.drain.gaze) +
          (en ? ", wounds " : ", раны ") + Math.round(this.drain.wound) +
          (en ? ", pulses " : ", пульсы ") + Math.round(this.drain.pulse) +
          (en ? ", boss " : ", босс ") + Math.round(this.drain.boss) +
          (en ? "; lowest " : "; падала до ") + this.lowest);
      }

      if (this.zoom.n) {
        line(en ? "camera zoom" : "отдаление камеры",
          (en ? "from " : "от ") + this.zoom.min.toFixed(2) +
          (en ? " to " : " до ") + this.zoom.max.toFixed(2) +
          (en ? ", average " : ", в среднем ") + (this.zoom.sum / this.zoom.n).toFixed(2));
      }

      var a = this.acts;
      // Эти числа — за ВСЮ жизнь мира, а не за сессию: они приходят из
      // сейва вместе с берегом. Отчёт «сыграно 2.5 мин / выращено 105 /
      // берегов 4» читался как безумие, пока не стало видно, что счёт
      // идёт с первого дня. Помечаем прямо в строке.
      line(en ? "grown (all time)" : "выращено за всю жизнь", w.discovered +
        " (" + (en ? "alive " : "живых ") +
        w.nodes.filter(function (n) { return n.state === "alive"; }).length + ")");
      line(en ? "returns" : "возвращений", a.returns + (en ? ", anchors " : ", якорей ") + a.anchors + " (" + (en ? "now " : "сейчас ") + w.anchors.length + "/" + (w.anchorCap||3) + ")" + (en ? ", rescued " : ", спасено ") + (a.rescued||0));
      line(en ? "lost to tide (all time)" : "забрал прилив за всю жизнь", w.lost +
        (en ? ", carried by rebirth " : ", унесла метаморфоза ") + (w.carried || 0));
      line(en ? "shores (all time)" : "берегов за всю жизнь", w.meta + (en ? ", roads " : ", дорог ") + (w.arrived || 0) +
        (en ? ", beings " : ", существ ") + w.beings.length);
      line(en ? "laws touched" : "законов тронуто", a.laws +
        (en ? ", pulses " : ", пульсов ") + a.pulses + (en ? ", blooms+rescued " : ", цветов ") + (a.blooms||0));
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
      // `note.value` может не быть вовсе: в стенде DOM подставной, а на
      // телефоне элемент мог не успеть родиться. Падение здесь означало
      // бы, что человек нажал «рассказать» и получил пустой экран —
      // именно в тот момент, когда хочет что-то сказать.
      var note = document.getElementById("report-note");
      var own = note && typeof note.value === "string" ? note.value.trim() : "";
      if (own) L.push((en ? "in his words: " : "словами: ") + own.slice(0, 400));

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
