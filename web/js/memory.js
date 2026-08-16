var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var SEASONS = {
    aggression: {
      id: "жар",
      en: "heat",
      hint: "неделя удара. мир отвечает острее.",
      enHint: "a week of the blow. the world answers sharper.",
      tide: 1.25,
      wounds: 1.6,
      garden: 0.6,
      cracks: 1.1,
      spawn: 0.9
    },
    curiosity: {
      id: "странствие",
      en: "wandering",
      hint: "горизонт шире, чем память.",
      enHint: "the horizon is wider than memory.",
      tide: 0.9,
      wounds: 0.8,
      garden: 0.9,
      cracks: 1,
      spawn: 1.7
    },
    contemplation: {
      id: "тишина",
      en: "stillness",
      hint: "сад пишет быстрее, чем ты дышишь.",
      enHint: "the garden writes faster than you breathe.",
      tide: 0.75,
      wounds: 0.55,
      garden: 1.8,
      cracks: 0.7,
      spawn: 0.85
    },
    empathy: {
      id: "оттепель",
      en: "thaw",
      hint: "раны мягче. имена липнут.",
      enHint: "wounds are softer. names stick.",
      tide: 0.8,
      wounds: 0.45,
      garden: 1.3,
      cracks: 0.8,
      spawn: 1
    },
    chaos: {
      id: "сбой",
      en: "glitch",
      hint: "законы не держатся. швы наружу.",
      enHint: "laws do not hold. the seams show.",
      tide: 1.1,
      wounds: 1.1,
      garden: 0.7,
      cracks: 2.2,
      spawn: 1.1
    },
    harmony: {
      id: "хор",
      en: "choir",
      hint: "берег сам попадает в такт.",
      enHint: "the shore finds the beat on its own.",
      tide: 0.85,
      wounds: 0.7,
      garden: 1.15,
      cracks: 0.6,
      spawn: 1
    }
  };

  G.Memory = {
    season: SEASONS.contemplation,
    seasonTrait: "contemplation",
    days: 1,
    sessions: 0,
    leftAt: 0,
    lastDna: null,
    lastName: "",
    notes: [],
    sleptHours: 0,

    climate: function () {
      return this.season || SEASONS.contemplation;
    },

    // имя и подсказка сезона на языке человека: id остаётся ключом,
    // чтобы сейв и код не зависели от раскладки
    climateName: function () {
      var c = this.climate();
      return G.Lang && G.Lang.id === "en" ? c.en || c.id : c.id;
    },

    climateHint: function () {
      var c = this.climate();
      return G.Lang && G.Lang.id === "en" ? c.enHint || c.hint : c.hint;
    },

    // Сезон меняется от смены СУТИ, а не от дрожи.
    //
    // Пока ДНК только росла, доминанта была высечена в камне и сезон
    // менялся раз в жизни. Теперь портрет дышит (оси оседают, если их
    // не кормить) — и две близкие оси начали меняться местами каждый
    // кадр: замер поймал 376 «сезон сменился» за двадцать минут, по
    // 19 в минуту. Требуем ощутимого перевеса: новая доминанта должна
    // обойти прежнюю на 0.06, иначе это не смена характера, а рябь.
    setFromDna: function (dna, force) {
      var t = dna.dominant();
      if (!force && this.seasonTrait === t) return false;
      if (!force && this.seasonTrait &&
          dna.get(t) - dna.get(this.seasonTrait) < 0.06) return false;
      this.seasonTrait = t;
      this.season = SEASONS[t] || SEASONS.contemplation;
      return true;
    },

    // Сменилась ли доминанта. Раньше это выясняли, заглядывая в текст
    // реплики (`indexOf("вчера") === 0`) — на английском берегу такой
    // проверки не существовало, и «вчерашний ты» там не рождался вовсе,
    // если человек отсутствовал меньше трёх часов.
    shifted: function (prev, cur) {
      if (!prev) return false;
      var a = "curiosity", b = "curiosity", av = -1, bv = -1;
      for (var i = 0; i < G.TRAITS.length; i++) {
        var k = G.TRAITS[i];
        var pv = prev[k] != null ? prev[k] : 0;
        var cv = cur.get ? cur.get(k) : cur[k] || 0;
        if (pv > av) { av = pv; a = k; }
        if (cv > bv) { bv = cv; b = k; }
      }
      return a !== b;
    },

    commentShift: function (prev, cur) {
      if (!prev) return "";
      var a = "curiosity";
      var b = "curiosity";
      var av = -1;
      var bv = -1;
      for (var i = 0; i < G.TRAITS.length; i++) {
        var k = G.TRAITS[i];
        var pv = prev[k] != null ? prev[k] : 0;
        var cv = cur.get ? cur.get(k) : cur[k] || 0;
        if (pv > av) {
          av = pv;
          a = k;
        }
        if (cv > bv) {
          bv = cv;
          b = k;
        }
      }
      // Игра говорит человеку, кем он был вчера, — и говорила это только
      // по-русски даже на английском берегу.
      if (G.Lang && G.Lang.id === "en") {
        if (a === b) {
          return "you are still " + G.traitName(a) + ". i almost believed it was forever.";
        }
        return "yesterday you were " + G.traitName(a) + ". today — " + G.traitName(b) + ". i changed the weather.";
      }
      if (a === b) {
        return "ты всё ещё " + G.traitName(a) + ". я почти поверила, что это навсегда.";
      }
      return "вчера ты был " + G.traitName(a) + ". сегодня — " + G.traitName(b) + ". я сменила погоду.";
    },

    note: function (text) {
      this.notes.push({ t: Date.now(), text: text });
      if (this.notes.length > 16) this.notes.shift();
    },

    spawnYesterday: function (game, prevDna, prevName) {
      if (!prevDna) return null;
      var trait = "empathy";
      var best = -1;
      for (var i = 0; i < G.TRAITS.length; i++) {
        var k = G.TRAITS[i];
        var v = prevDna[k] != null ? prevDna[k] : 0;
        if (v > best) {
          best = v;
          trait = k;
        }
      }
      var map = {
        aggression: "wounded",
        empathy: "clingy",
        curiosity: "curious",
        contemplation: "shy",
        chaos: "shy",
        harmony: "singer"
      };
      var b = G.Organs.birthBeing(
        game.player.x + 70,
        game.player.y - 30,
        trait,
        game.world.rng
      );
      b.temper = map[trait] || "shy";
      b.isYesterday = true;
      b.named = true;
      b.name = prevName || (G.Lang ? G.Lang.t("yesterdayYou") : "вчерашний ты");
      b.trueName = b.name;
      b.bond = 0.35;
      b.fear = 0.15;
      b.hue = trait;
      game.world.beings.push(b);
      return b;
    },

    sleepWorld: function (game, hours) {
      hours = G.clamp(hours, 0, 72);
      this.sleptHours = hours;
      if (hours < 0.08) return { hours: hours, lost: 0, blooms: 0, debt: 0 };
      var w = game.world;
      var steps = Math.min(48, Math.floor(hours * 2.2) + 1);
      var lost = 0;
      var blooms = 0;
      var debt = 0;
      var shouldResolve = false;
      var clim = this.climate();
      // Ночь ПРОРЕЖИВАЕТ берег, а не стирает его.
      //
      // Здесь человек потерял свой мир и написал «не сохранилось». Сон
      // щадил только якоря (их всего три), а корни — то, за что плачено
      // возвратами, — не значили ничего. Замер: сутки без игры убивали
      // 19 живых узлов из 20, включая укоренённые. Человек возвращался
      // на пустой берег и справедливо считал, что сейв не работает.
      //
      // Два предела. Первый: ночь не может забрать больше трети живого —
      // берег редеет, но остаётся твоим. Второй: корни держат, как
      // держат при приливе. Забвение — угроза, а не ластик.
      var aliveAtDusk = 0;
      for (var ai = 0; ai < w.nodes.length; ai++) {
        if (w.nodes[ai].state === "alive" && !w.nodes[ai].dead) aliveAtDusk++;
      }
      var mayTake = Math.floor(aliveAtDusk * 0.34);
      for (var s = 0; s < steps; s++) {
        for (var i = w.nodes.length - 1; i >= 0; i--) {
          var n = w.nodes[i];
          if (n.state !== "alive") continue;
          if (w.anchors.indexOf(n.id) >= 0) continue;
          // Корень сохнет за ночь, но медленно — и пока он есть, узел
          // держится сам, как и при дневном приливе.
          var held = n.roots || 0;
          n.care = Math.max(0, n.care - 0.045 * clim.tide * (1 - held * 0.7));
          // Корень сохнет за всю разлуку, а не за каждый шаг сна: шагов
          // до 48, и прежние 0.012 за шаг съедали привычку целиком за
          // трое суток. Разлука ослабляет связь, но не отменяет её —
          // укоренённое человек заслужил возвратами.
          if (held > 0) n.roots = Math.max(0.3, held - 0.18 / steps);
          if (lost >= mayTake) continue;
          if (n.care < 0.12 && held < 0.45 && G.chance(0.18)) {
            w.forget(n, n.kind === "thorn" && G.chance(0.4));
            lost++;
          }
        }
        if (clim.garden > 1 && G.chance(0.35)) {
          G.Organs.plantBloom(
            w,
            game.player.x + G.rand(-120, 120),
            game.player.y + G.rand(-120, 120),
            ""
          );
          blooms++;
        }
        for (var j = 0; j < w.beings.length; j++) {
          var b = w.beings[j];
          if (b.isYesterday) continue;
          // Сон — это ОДНА длинная разлука, а не 48 независимых ночей подряд.
          // Раньше каждый шаг прибавлял 0.06, и за ночь привязанное существо
          // получало 2.88 долга сразу после загрузки: возвращение открывало
          // берег, а орган исхода срабатывал в первом же кадре. Меряй долг
          // часами тишины, как это делает дневная разлука.
          var nightDebt = G.clamp(hours * 0.021, 0, 0.8);
          b.debt = Math.max(b.debt || 0, (b.debt || 0) + nightDebt / steps * (1.4 - (b.bond || 0)));
          b.x += G.rand(-18, 18);
          b.y += G.rand(-18, 18);
          if ((b.debt || 0) > 1.2) shouldResolve = true;
        }
      }
      if (shouldResolve) {
        for (var k = w.beings.length - 1; k >= 0; k--) {
          var c = w.beings[k];
          if (!c.isYesterday && !c.dead && (c.debt || 0) > 1.2) {
            var out = w.abandon(c, game.dna);
            if (out !== "none") debt++;
          }
        }
      }
      if (hours > 2 && G.chance(0.7)) {
        var verse = G.Organs.composeVerse(game);
        w.addVerse(verse);
        this.note((G.Lang && G.Lang.id === "en" ? "while you were away: " : "пока тебя не было: ") + G.verseText(verse));
      }
      return { hours: hours, lost: lost, blooms: blooms, debt: debt };
    },

    greet: function (game, report) {
      var self = this;
      var lines = [];
      var en = G.Lang && G.Lang.id === "en";
      if (this.sessions <= 1) {
        lines.push(en
          ? "you came back into the same dream. i am counting the days."
          : "ты вернулся в тот же сон. я считаю дни.");
      } else {
        lines.push(en
          ? "day " + this.days + ". session " + this.sessions + "."
          : "день " + this.days + ". сессия " + this.sessions + ".");
        // Пул `returner` был написан давно и не звучал ни разу: Игра
        // встречала вернувшегося сухой цифрой сессии. Теперь после счёта
        // дней она говорит и по-человечески — но только тому, кто уже
        // возвращался трижды. Первым разам хватает цифры.
        if (this.sessions >= 3 && G.Voice && G.Voice.pick) {
          var back = G.Voice.pick("returner");
          if (back) lines.push(back);
        }
      }
      if (report && report.hours >= 0.5) {
        var h = en
          ? (report.hours < 2 ? "not long" : report.hours < 10 ? "a few hours" : "a whole life without you")
          : (report.hours < 2 ? "недолго" : report.hours < 10 ? "несколько часов" : "целую жизнь без тебя");
        lines.push(en ? "the shore slept " + h + "." : "берег спал " + h + ".");
        if (report.lost) {
          lines.push(en
            ? "oblivion ate " + report.lost + " while you were elsewhere."
            : "забвение съело " + report.lost + ", пока ты был не здесь.");
        }
        if (report.blooms) {
          lines.push(en
            ? "the garden grew on its own. it does not need permission."
            : "сад вырос сам. ему не нужно разрешение.");
        }
      }
      var shift = this.commentShift(this.lastDna, game.dna);
      if (shift) lines.push(shift);
      lines.push(
        (G.Lang && G.Lang.id === "en" ? "the season now is " : "сейчас сезон — ") +
          this.climateName() + ". " + this.climateHint()
      );
      var i = 0;
      function next() {
        if (i >= lines.length) return;
        G.Voice.sayText(lines[i], true);
        i++;
        if (i < lines.length) setTimeout(next, 3400);
      }
      next();
      this.note(lines[0]);
      G.Mouth.maybe("игрок вернулся. сезон " + this.climate().id + ". " + (shift || ""), function (line) {
        setTimeout(function () {
          G.Voice.sayText(line, true);
        }, 1200);
      });
    },

    onReturn: function (game, data) {
      this.sessions = (data.sessions || 0) + 1;
      this.lastDna = (data.dna && data.dna.values) || data.lastDna || null;
      this.lastName = data.lastName || "";
      this.notes = data.notes || [];
      this.days = data.days || 1;
      this.firstAt = data.firstAt || data.leftAt || Date.now();
      var now = Date.now();
      // Час ухода — теперь ЭТОТ приход, а не прошлый. Иначе берег,
      // проспавший ночь один раз, засыпал бы заново при каждом сворачивании
      // окна: `visibilitychange` меряет сон от `Memory.leftAt`, и та же ночь
      // съедала бы узлы снова и снова.
      this.leftAt = now;
      if (data.leftAt) {
        var hours = (now - data.leftAt) / 3600000;
        var dayGap = Math.floor((now - (data.firstAt || data.leftAt)) / 86400000) + 1;
        this.days = Math.max(this.days, dayGap);
        var report = this.sleepWorld(game, hours);
        if (G.Report) G.Report.noteNight(report);
        this.setFromDna(game.dna, true);
        var changed = this.shifted(this.lastDna, game.dna);
        if (hours > 3 || changed) {
          this.spawnYesterday(game, this.lastDna, this.lastName);
        }
        var self = this;
        setTimeout(function () {
          self.greet(game, report);
        }, 900);
      } else {
        this.setFromDna(game.dna, true);
      }
    },

    snapshot: function (game) {
      return {
        sessions: this.sessions,
        days: this.days,
        leftAt: Date.now(),
        firstAt: this.firstAt || Date.now(),
        lastDna: G.Director.snapshot(game.dna),
        lastName: game.dna.name(),
        notes: this.notes,
        seasonTrait: this.seasonTrait
      };
    },

    toJSON: function () {
      return {
        sessions: this.sessions,
        days: this.days,
        leftAt: Date.now(),
        firstAt: this.firstAt || Date.now(),
        notes: this.notes,
        seasonTrait: this.seasonTrait,
        lastName: this.lastName
      };
    }
  };

  G.Mouth = {
    key: "igra.mouth.endpoint",
    get: function () {
      try {
        return localStorage.getItem(this.key) || "";
      } catch (e) {
        return "";
      }
    },
    set: function (v) {
      try {
        if (!v) localStorage.removeItem(this.key);
        else localStorage.setItem(this.key, v.trim());
      } catch (e) {}
    },
    maybe: function (prompt, cb) {
      var url = this.get();
      if (!url || url.indexOf("http") !== 0) return false;
      try {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: prompt, lang: "ru", game: "igra" })
        })
          .then(function (r) {
            return r.json();
          })
          .then(function (j) {
            var line = (j && (j.line || j.text || j.message)) || "";
            if (line && cb) cb(String(line).slice(0, 180));
          })
          .catch(function () {});
        return true;
      } catch (e) {
        return false;
      }
    }
  };
})(IGRA);
