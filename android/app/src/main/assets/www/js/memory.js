var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var SEASONS = {
    aggression: {
      id: "жар",
      hint: "неделя удара. мир отвечает острее.",
      tide: 1.25,
      wounds: 1.6,
      garden: 0.6,
      cracks: 1.1,
      spawn: 0.9
    },
    curiosity: {
      id: "странствие",
      hint: "горизонт шире, чем память.",
      tide: 0.9,
      wounds: 0.8,
      garden: 0.9,
      cracks: 1,
      spawn: 1.7
    },
    contemplation: {
      id: "тишина",
      hint: "сад пишет быстрее, чем ты дышишь.",
      tide: 0.75,
      wounds: 0.55,
      garden: 1.8,
      cracks: 0.7,
      spawn: 0.85
    },
    empathy: {
      id: "оттепель",
      hint: "раны мягче. имена липнут.",
      tide: 0.8,
      wounds: 0.45,
      garden: 1.3,
      cracks: 0.8,
      spawn: 1
    },
    chaos: {
      id: "сбой",
      hint: "законы не держатся. швы наружу.",
      tide: 1.1,
      wounds: 1.1,
      garden: 0.7,
      cracks: 2.2,
      spawn: 1.1
    },
    harmony: {
      id: "хор",
      hint: "берег сам попадает в такт.",
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

    setFromDna: function (dna, force) {
      var t = dna.dominant();
      if (!force && this.seasonTrait === t) return false;
      this.seasonTrait = t;
      this.season = SEASONS[t] || SEASONS.contemplation;
      return true;
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
      if (a === b) {
        return "ты всё ещё " + G.TRAIT_RU[a] + ". я почти поверила, что это навсегда.";
      }
      return "вчера ты был " + G.TRAIT_RU[a] + ". сегодня — " + G.TRAIT_RU[b] + ". я сменила погоду.";
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
      b.name = prevName || "вчерашний ты";
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
      var clim = this.climate();
      for (var s = 0; s < steps; s++) {
        for (var i = w.nodes.length - 1; i >= 0; i--) {
          var n = w.nodes[i];
          if (n.state !== "alive") continue;
          if (w.anchors.indexOf(n.id) >= 0) continue;
          n.care = Math.max(0, n.care - 0.045 * clim.tide);
          if (n.care < 0.12 && G.chance(0.18)) {
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
          b.debt += 0.06 * (hours > 12 ? 1.3 : 1);
          b.x += G.rand(-18, 18);
          b.y += G.rand(-18, 18);
          if (b.debt > 1.2) debt++;
        }
      }
      if (hours > 2 && G.chance(0.7)) {
        var verse = G.Organs.composeVerse(game);
        w.verses.push(verse);
        this.note("пока тебя не было: " + verse);
      }
      return { hours: hours, lost: lost, blooms: blooms, debt: debt };
    },

    greet: function (game, report) {
      var self = this;
      var lines = [];
      if (this.sessions <= 1) {
        lines.push("ты вернулся в тот же сон. я считаю дни.");
      } else {
        lines.push("день " + this.days + ". сессия " + this.sessions + ".");
      }
      if (report && report.hours >= 0.5) {
        var h = report.hours < 2 ? "недолго" : report.hours < 10 ? "несколько часов" : "целую жизнь без тебя";
        lines.push("берег спал " + h + ".");
        if (report.lost) lines.push("забвение съело " + report.lost + ", пока ты был не здесь.");
        if (report.blooms) lines.push("сад вырос сам. ему не нужно разрешение.");
      }
      var shift = this.commentShift(this.lastDna, game.dna);
      if (shift) lines.push(shift);
      lines.push("сейчас сезон — " + this.climate().id + ". " + this.climate().hint);
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
      this.leftAt = data.leftAt || Date.now();
      this.lastDna = (data.dna && data.dna.values) || data.lastDna || null;
      this.lastName = data.lastName || "";
      this.notes = data.notes || [];
      this.days = data.days || 1;
      var now = Date.now();
      if (data.leftAt) {
        var hours = (now - data.leftAt) / 3600000;
        var dayGap = Math.floor((now - (data.firstAt || data.leftAt)) / 86400000) + 1;
        this.days = Math.max(this.days, dayGap);
        var report = this.sleepWorld(game, hours);
        this.setFromDna(game.dna, true);
        var changed = this.lastDna && this.commentShift(this.lastDna, game.dna).indexOf("вчера") === 0;
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
