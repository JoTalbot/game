var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var KEY = "igra.boss-shadow.v1";
  var cache = null;
  var MAX_TRACES = 8;

  function fresh() {
    return { version: 1, encounters: 0, defeats: 0, escapes: 0, intensity: 0, fear: 0, debt: 0, nameKey: null, trait: "aggression", traces: [], lastLife: 0, lastOutcome: "" };
  }
  function load() {
    var a = fresh();
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === "object") for (var k in a) if (p[k] != null) a[k] = p[k];
      }
    } catch (e) {}
    a.encounters = Math.max(0, Number(a.encounters) || 0);
    a.defeats = Math.max(0, Number(a.defeats) || 0);
    a.escapes = Math.max(0, Number(a.escapes) || 0);
    a.intensity = Math.max(0, Math.min(1, Number(a.intensity) || 0));
    a.fear = Math.max(0, Math.min(1, Number(a.fear) || 0));
    a.debt = Math.max(0, Math.min(1, Number(a.debt) || 0));
    if (!Array.isArray(a.traces)) a.traces = [];
    return a;
  }
  function state() { if (!cache) cache = load(); return cache; }
  function persist() { try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(state())); } catch (e) {} }
  function lifeNumber() { return G.Life && G.Life.profile ? (G.Life.profile().skins || 0) + 1 : 1; }
  function trace(a, boss, outcome) {
    if (!boss) return;
    a.traces.push({ x: Number(boss.x) || 0, y: Number(boss.y) || 0, kind: "wound", nameKey: boss.nameKey, trait: a.trait, outcome: outcome, life: lifeNumber(), t: Date.now() });
    if (a.traces.length > MAX_TRACES) a.traces.splice(0, a.traces.length - MAX_TRACES);
  }
  function applyRelationships(a) {
    if (!G.Relationships || !G.Relationships.profile) return;
    var r = G.Relationships.profile();
    a.fear = Math.min(1, Math.max(a.fear, r.fear * 0.55 + a.intensity * 0.15));
    a.debt = Math.min(1, Math.max(a.debt, r.debt * 0.45 + a.intensity * 0.1));
  }

  G.BossShadow = {
    resetCache: function () { cache = null; },
    profile: function () {
      var a = state();
      return { encounters: a.encounters, defeats: a.defeats, escapes: a.escapes, intensity: a.intensity, fear: a.fear, debt: a.debt, nameKey: a.nameKey, trait: a.trait, traces: a.traces.slice(), lastLife: a.lastLife, lastOutcome: a.lastOutcome };
    },
    observe: function (game) {
      var a = state(), w = game && game.world;
      if (!w) return;
      if (w.boss) {
        if (w.boss._shadowSeen !== true) {
          w.boss._shadowSeen = true;
          a.encounters++;
          a.nameKey = w.boss.nameKey;
          a.trait = (G.DNA && G.DNA.get && G.DNA.get("aggression") >= G.DNA.get("harmony")) ? "aggression" : "chaos";
          a.intensity = Math.min(1, a.intensity + 0.08);
          a.lastLife = lifeNumber();
          applyRelationships(a);
          persist();
        }
        return;
      }
      applyRelationships(a);
      if (a.intensity > 0.02) a.intensity = Math.max(0, a.intensity - 0.00012);
      persist();
    },
    onOutcome: function (game, boss, outcome) {
      var a = state();
      if (!boss || boss._shadowOutcome) return;
      boss._shadowOutcome = true;
      a.nameKey = boss.nameKey != null ? boss.nameKey : a.nameKey;
      a.lastLife = lifeNumber();
      a.lastOutcome = outcome;
      if (outcome === "defeat") {
        a.defeats++;
        a.intensity = Math.min(1, a.intensity + 0.22);
        a.fear = Math.min(1, a.fear + 0.08);
      } else if (outcome === "escape") {
        a.escapes++;
        a.intensity = Math.min(1, a.intensity + 0.12);
        a.fear = Math.min(1, a.fear + 0.04);
      }
      trace(a, boss, outcome);
      applyRelationships(a);
      persist();
      if (G.Report && G.Report.act) G.Report.act("boss");
    },
    apply: function (game) {
      var a = state(), w = game && game.world;
      if (!w) return;
      // Тень не создаёт нового босса и не блокирует игру. Она меняет уже
      // существующие органы: страх существ, память Director и форму следов.
      for (var i = 0; i < w.beings.length; i++) {
        var b = w.beings[i];
        if (!b || b.dead) continue;
        if (a.fear > 0.45) b.fear = Math.min(1, Math.max(b.fear || 0, a.fear * 0.28));
        if (a.debt > 0.45 && b.bond >= 0.55) b.relationship = b.relationship || {};
      }
      if (a.traces.length && w.meta > 0 && !w.__bossShadowRestored) {
        w.__bossShadowRestored = true;
        var t = a.traces[a.traces.length - 1];
        var n = w.spawnNode(game.player.x + (t.x - game.player.x) * 0.16, game.player.y + (t.y - game.player.y) * 0.16, "wound");
        n.state = "alive";
        n.kind = "wound";
        n.care = Math.max(0.25, 0.35 + a.intensity * 0.3);
        n.roots = Math.min(1, a.intensity * 0.35);
        n.shadow = true;
        n.shadowLife = t.life;
        n.shadowOutcome = t.outcome;
        n.verse = "то, что ты победил, не исчезло";
        if (G.Voice && a.intensity > 0.55) G.Voice.say("bossShadow");
      }
    }
  };

  if (G.Organs && G.Organs.killBoss) {
    var originalKill = G.Organs.killBoss;
    G.Organs.killBoss = function (game, mercy) {
      var boss = game && game.world && game.world.boss;
      var result = originalKill.apply(this, arguments);
      if (G.BossShadow && boss) G.BossShadow.onOutcome(game, boss, mercy ? "defeat" : "defeat");
      return result;
    };
  }
  if (G.World && G.World.prototype && G.World.prototype.update) {
    var originalUpdate = G.World.prototype.update;
    G.World.prototype.update = function (dt, player, dna, fx, game) {
      var result = originalUpdate.apply(this, arguments);
      if (G.BossShadow && game) G.BossShadow.observe(game);
      if (G.BossShadow && game) G.BossShadow.apply(game);
      return result;
    };
  }
})(IGRA);