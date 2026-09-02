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
  function rememberBeing(b, entry) {
    b.memory = b.memory || [];
    var key = entry.kind + ":" + (entry.id || entry.with || "unknown");
    for (var i = 0; i < b.memory.length; i++) {
      var old = b.memory[i];
      if (old && (old.kind + ":" + (old.id || old.with || "unknown")) === key) return;
    }
    b.memory.push(entry);
    if (b.memory.length > 8) b.memory.shift();
  }

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

      // Закон оставляет спутнику не только страх, но и конкретную память.
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
            rememberBeing(b, { kind: "law", id: c.law && c.law.id ? c.law.id : "unknown", time: Number(game.time) || 0 });
            if (G.Voice) G.Voice.say("kind", true);
          }
        }
      }

      // Разные темпераменты оставляют взаимные воспоминания, но только один
      // раз на пару. Так встреча становится частью характера существа.
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
            rememberBeing(a, { kind: "encounter", with: d.temper || "unknown", time: Number(game.time) || 0 });
            rememberBeing(d, { kind: "encounter", with: a.temper || "unknown", time: Number(game.time) || 0 });
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
