var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var KEY = "igra.relationships.v1";
  var DEFAULT = { version: 1, encounters: 0, trust: 0, fear: 0, debt: 0, losses: 0, rescues: 0, memories: [], companion: false, legacy: 0 };
  var cache = null;

  function fresh() {
    return { version: 1, encounters: 0, trust: 0, fear: 0, debt: 0, losses: 0, rescues: 0, memories: [], companion: false, legacy: 0 };
  }
  function load() {
    var a = fresh();
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === "object") for (var k in a) if (p[k] != null) a[k] = p[k];
        a.encounters = Math.max(0, Number(a.encounters) || 0);
        a.trust = Math.max(0, Math.min(1, Number(a.trust) || 0));
        a.fear = Math.max(0, Math.min(1, Number(a.fear) || 0));
        a.debt = Math.max(0, Math.min(1, Number(a.debt) || 0));
        a.losses = Math.max(0, Number(a.losses) || 0);
        a.rescues = Math.max(0, Number(a.rescues) || 0);
        a.legacy = Math.max(0, Number(a.legacy) || 0);
        if (!Array.isArray(a.memories)) a.memories = [];
      }
    } catch (e) {}
    return a;
  }
  function state() { if (!cache) cache = load(); return cache; }
  function persist() { try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(state())); } catch (e) {} }
  function remember(a, text) {
    if (!text) return;
    if (a.memories.indexOf(text) < 0) a.memories.push(text);
    if (a.memories.length > 8) a.memories.shift();
  }

  G.Relationships = {
    resetCache: function () { cache = null; },
    profile: function () {
      var a = state();
      return { encounters: a.encounters, trust: a.trust, fear: a.fear, debt: a.debt,
        losses: a.losses, rescues: a.rescues, memories: a.memories.slice(),
        companion: !!a.companion, legacy: a.legacy };
    },
    observe: function (dt, game) {
      var a = state(), w = game && game.world;
      if (!w || !Array.isArray(w.beings)) return;
      var live = 0, bonded = 0, nearest = null, nearestD = 1e9, i, b, d;
      for (i = 0; i < w.beings.length; i++) {
        b = w.beings[i];
        if (!b) continue;
        if (!Array.isArray(b.memory)) b.memory = [];
        if (!b.dead) {
          live++;
          d = Math.sqrt(G.dist2(game.player.x, game.player.y, b.x, b.y));
          if (d < nearestD) { nearestD = d; nearest = b; }
          if ((b.bond || 0) >= 0.55) bonded++;
        }
      }
      if (live) {
        a.encounters += dt * Math.min(1, live * 0.08);
        if (nearest && nearestD < 72) {
          var wasTrust = a.trust;
          a.trust = Math.min(1, a.trust + dt * 0.018 * (1 - (nearest.fear || 0)));
          a.fear = Math.max(0, a.fear - dt * 0.012);
          if (nearest.memory.length) {
            var last = nearest.memory[nearest.memory.length - 1];
            if (last && last.ev === "touched") { remember(a, "к тебе можно приблизиться"); a.rescues += dt * 0.004; }
            if (last && last.ev === "struck") { a.fear = Math.min(1, a.fear + dt * 0.04); a.trust = Math.max(0, a.trust - dt * 0.035); a.debt = Math.min(1, a.debt + dt * 0.025); remember(a, "ты однажды причинил боль"); }
          }
          if (wasTrust < 0.6 && a.trust >= 0.6) remember(a, "доверие стало взаимным");
        }
      }
      if (bonded && !a.companion) {
        a.companion = true;
        remember(a, "кто-то остался рядом");
      }
      var deadCount = 0;
      for (i = 0; i < w.beings.length; i++) if (w.beings[i] && w.beings[i].dead) deadCount++;
      if (deadCount && a.losses < deadCount) {
        a.losses = deadCount;
        remember(a, "не всякая связь переживает берег");
        a.fear = Math.min(1, a.fear + 0.08);
      }
      if (G.Life && G.Life.profile) {
        var lp = G.Life.profile();
        if (lp.legacy && lp.bond) a.legacy = Math.max(a.legacy, lp.skins || 1);
      }
      persist();
      this.apply(game);
    },
    apply: function (game) {
      var a = state(), w = game && game.world;
      if (!w) return;
      var candidates = [];
      for (var i = 0; i < w.beings.length; i++) if (w.beings[i] && !w.beings[i].dead) candidates.push(w.beings[i]);
      for (var j = 0; j < candidates.length; j++) {
        var b = candidates[j];
        b.relationship = b.relationship || { trust: 0.1, fear: 0.2, debt: 0, memories: 0 };
        var memoryCount = Array.isArray(b.memory) ? b.memory.length : 0;
        b.relationship.memories = Math.max(b.relationship.memories || 0, memoryCount);
        b.relationship.trust = Math.max(b.relationship.trust || 0, Math.min(1, a.trust + (b.bond || 0) * 0.45));
        b.relationship.fear = Math.max(0, Math.min(1, (b.fear || 0) * 0.55 + a.fear * 0.45));
        b.relationship.debt = Math.max(b.relationship.debt || 0, a.debt);
        if (a.companion && b.bond >= 0.55) b.relationship.companion = true;
        if (a.legacy && b.legacy) b.relationship.legacy = true;
        if (a.trust >= 0.6 && b.bond >= 0.45) b.bond = Math.min(1, b.bond + 0.003 * (1 - (b.fear || 0)));
        if (a.debt >= 0.45 && b.fear >= 0.35) b.vx *= 0.98, b.vy *= 0.98;
      }
    },
    onMetamorphosis: function (game) {
      var a = state(), w = game && game.world;
      if (!w || !a.companion) return;
      a.legacy++;
      remember(a, "связь пережила смену кожи");
      if (G.Being) {
        var echo = new G.Being(game.player.x + w.rng.range(-180, 180), game.player.y + w.rng.range(-180, 180), "empathy");
        echo.bond = Math.min(0.48, 0.2 + a.trust * 0.35);
        echo.fear = Math.min(0.6, a.fear + 0.1);
        echo.legacy = true;
        echo.relationship = { trust: a.trust * 0.65, fear: echo.fear, debt: a.debt, memories: a.memories.length, companion: true, legacy: true };
        echo.memory = [{ t: Date.now(), ev: "remembered" }];
        w.beings.push(echo);
      }
      persist();
    }
  };

  if (G.Director && G.Director.observe) {
    var originalObserve = G.Director.observe;
    G.Director.observe = function (dt, game) {
      originalObserve.call(this, dt, game);
      if (G.Relationships) G.Relationships.observe(dt, game);
    };
  }
  if (G.World && G.World.prototype && G.World.prototype.birthShore) {
    var originalBirth = G.World.prototype.birthShore;
    G.World.prototype.birthShore = function (player, dna) {
      originalBirth.call(this, player, dna);
      if (G.Relationships) G.Relationships.onMetamorphosis({ player: player, world: this, dna: dna });
    };
  }
})(IGRA);
