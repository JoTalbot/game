var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var KEY = "igra.organ-conflicts.v1";
  var MAX = 12;
  var RADIUS = 220;

  function load() {
    var s = { version: 1, seen: [], total: 0 };
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === "object") {
          if (Array.isArray(p.seen)) s.seen = p.seen.slice(-MAX);
          s.total = Math.max(0, Math.floor(Number(p.total) || 0));
        }
      }
    } catch (e) {}
    return s;
  }
  function save(s) {
    try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(s)); } catch (e) {}
  }
  function has(s, id) { return s.seen.indexOf(id) >= 0; }
  function mark(s, id) {
    if (has(s, id)) return false;
    s.seen.push(id);
    if (s.seen.length > MAX) s.seen.shift();
    s.total++;
    save(s);
    return true;
  }
  function dist(a, b) {
    return Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
  }
  function near(a, b) { return dist(a, b) <= RADIUS; }

  var Conflicts = {
    resetCache: function () { this._state = null; },
    state: function () { if (!this._state) this._state = load(); return this._state; },
    profile: function () {
      var s = this.state();
      return { version: 1, seen: s.seen.slice(), total: s.total };
    },

    // Органы не должны жить как независимые кнопки. Когда два выращенных
    // слоя оказываются рядом, они спорят за один и тот же кусок берега.
    // Конфликт одноразов для пары, но оставляет состояние в самих органах.
    observe: function (dt, game) {
      if (!game || game.state !== "play" || !game.world || !game.player) return;
      var w = game.world, s = this.state();
      var blooms = w.blooms || [], cracks = w.cracks || [], beings = w.beings || [];
      var i, j, b, c, id;

      // Сад против трещины: живое растение рядом с законом теряет часть
      // заботы, но получает память о шве. Это не «наказание», а новый
      // характер места, который потом может быть замечен памятью мира.
      for (i = 0; i < blooms.length; i++) {
        b = blooms[i];
        if (!b || b.dead) continue;
        for (j = 0; j < cracks.length; j++) {
          c = cracks[j];
          if (!c || c.dead || !near(b, c)) continue;
          id = "garden-scar:" + (b.id != null ? b.id : i) + ":" + (c.id != null ? c.id : j);
          if (mark(s, id)) {
            b.conflict = "scar";
            b.care = Math.max(0, (Number(b.care) || 0) - 0.16);
            b.roots = Math.max(Number(b.roots) || 0, 0.35);
            c.conflict = "garden";
            c.actTrace = true;
            if (G.Voice) G.Voice.say("combat", true);
          }
        }
      }

      // Спутник против трещины: близость к живому закону меняет не только
      // страх существа, но и его долг. После этого отношение может стать
      // частью следующего поведения, а не просто числом доверия.
      for (i = 0; i < beings.length; i++) {
        b = beings[i];
        if (!b || b.dead || Number(b.bond) <= 0.45) continue;
        for (j = 0; j < cracks.length; j++) {
          c = cracks[j];
          if (!c || c.dead || !near(b, c)) continue;
          id = "being-law:" + (b.id != null ? b.id : i) + ":" + (c.id != null ? c.id : j);
          if (mark(s, id)) {
            b.conflict = "law";
            b.fear = Math.min(1, (Number(b.fear) || 0) + 0.18);
            b.debt = (Number(b.debt) || 0) + 0.15;
            b.memory = b.memory || [];
            b.memory.push({ kind: "law", id: c.law && c.law.id ? c.law.id : "unknown", time: Number(game.time) || 0 });
            if (b.memory.length > 8) b.memory.shift();
            if (G.Voice) G.Voice.say("kind", true);
          }
        }
      }

      // Два существа рядом могут спорить за один сад. У каждого остаётся
      // свой темперамент, но место становится общим следом. Это создаёт
      // различие между «два существа встретились» и «два существа живут
      // рядом» без отдельной системы квестов.
      for (i = 0; i < beings.length; i++) {
        var a = beings[i];
        if (!a || a.dead) continue;
        for (j = i + 1; j < beings.length; j++) {
          var d = beings[j];
          if (!d || d.dead || !near(a, d)) continue;
          if ((a.temper || "") === (d.temper || "")) continue;
          id = "being-being:" + (a.id != null ? a.id : i) + ":" + (d.id != null ? d.id : j);
          if (mark(s, id)) {
            a.conflict = "other-temper";
            d.conflict = "other-temper";
            a.memory = a.memory || [];
            d.memory = d.memory || [];
            a.memory.push({ kind: "encounter", with: d.temper || "unknown", time: Number(game.time) || 0 });
            d.memory.push({ kind: "encounter", with: a.temper || "unknown", time: Number(game.time) || 0 });
            if (a.memory.length > 8) a.memory.shift();
            if (d.memory.length > 8) d.memory.shift();
          }
        }
      }
    }
  };

  G.OrganConflicts = Conflicts;
  if (G.Director && G.Director.observe) {
    var originalObserve = G.Director.observe;
    G.Director.observe = function (dt, game) {
      originalObserve.call(this, dt, game);
      if (G.OrganConflicts) G.OrganConflicts.observe(dt, game);
    };
  }
})(IGRA);
