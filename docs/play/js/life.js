var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var KEY = "igra.life.v1";
  var DEFAULT = {
    born: false, skins: 0, awaken: false, bond: false, shadow: false,
    legacy: false, threshold: false, traits: [], lastTrait: "", lastAge: 0,
    lastMeta: 0, lastSeen: 0, initialized: false,
    behavior: { born: 0, returns: 0, pulses: 0, still: 0, motion: 0 }
  };
  var TRAIT_KIND = {
    curiosity: "relic", aggression: "thorn", contemplation: "still",
    empathy: "echo", chaos: "shard", harmony: "tone"
  };

  function cloneDefault() {
    return {
      born: false, skins: 0, awaken: false, bond: false, shadow: false,
      legacy: false, threshold: false, traits: [], lastTrait: "", lastAge: 0,
      lastMeta: 0, lastSeen: 0, initialized: false,
      behavior: { born: 0, returns: 0, pulses: 0, still: 0, motion: 0 }
    };
  }
  function load() {
    var a = cloneDefault();
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === "object") {
          for (var k in a) if (p[k] != null) a[k] = p[k];
          if (!Array.isArray(a.traits)) a.traits = [];
          a.skins = Math.max(0, Math.floor(Number(a.skins) || 0));
          var b = cloneDefault().behavior;
          if (p.behavior && typeof p.behavior === "object") {
            for (var bk in b) if (p.behavior[bk] != null) b[bk] = Math.max(0, Number(p.behavior[bk]) || 0);
          }
          a.behavior = b;
        }
      }
    } catch (e) {}
    return a;
  }
  function persist(a) { try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(a)); } catch (e) {} }
  function traitLabel(t) { return t ? (G.traitName ? G.traitName(t) : t) : ""; }
  function speak(ru, en) { if (G.Voice && G.Voice.sayText) G.Voice.sayText(G.Lang && G.Lang.id === "en" ? en : ru, true); }

  G.Life = {
    _arc: null, _lastMilestone: "", _ready: false,
    resetCache: function () { this._arc = null; this._lastMilestone = ""; this._ready = false; },
    arc: function () { if (!this._arc) this._arc = load(); return this._arc; },
    persist: function () { if (this._arc) persist(this._arc); },
    summary: function () {
      var a = this.arc();
      return { skins: a.skins || 0, traits: a.traits.slice(), awaken: !!a.awaken,
        bond: !!a.bond, shadow: !!a.shadow, legacy: !!a.legacy, threshold: !!a.threshold };
    },
    profile: function () {
      var a = this.arc(), counts = {}, i, t, best = a.lastTrait || "", bestN = 0;
      for (i = 0; i < a.traits.length; i++) { t = a.traits[i]; counts[t] = (counts[t] || 0) + 1; }
      for (var k in counts) if (counts[k] > bestN || (counts[k] === bestN && k === a.lastTrait)) { bestN = counts[k]; best = k; }
      return { skins: a.skins || 0, traits: a.traits.slice(), counts: counts,
        dominant: best, lastTrait: a.lastTrait || "", awaken: !!a.awaken,
        bond: !!a.bond, shadow: !!a.shadow, legacy: !!a.legacy, threshold: !!a.threshold,
        behavior: { born: a.behavior.born || 0, returns: a.behavior.returns || 0,
          pulses: a.behavior.pulses || 0, still: a.behavior.still || 0, motion: a.behavior.motion || 0 } };
    },
    observe: function (dt, game) {
      var a = this.arc(), dna = game && game.dna, w = game && game.world;
      if (!dna || !w) return;
      var age = dna.age || 0, meta = w.meta || 0, currentTrait = dna.dominant ? dna.dominant() : "";
      var dirty = false;
      if (!a.initialized) {
        a.initialized = true; a.lastAge = age; a.lastMeta = meta; a.lastSeen = Date.now();
        if (age > 2) a.born = true; persist(a); this._ready = true; return;
      }
      var d = G.Director || {};
      var behavior = a.behavior || (a.behavior = cloneDefault().behavior);
      var born = Number(d._born) || 0, returns = Number(d._returns) || 0, pulses = Number(dna.pulses) || 0;
      var still = Math.max(0, Number(game.time) - (Number(game.input.lastTap) || 0));
      behavior.born = Math.max(behavior.born || 0, born);
      behavior.returns = Math.max(behavior.returns || 0, returns);
      behavior.pulses = Math.max(behavior.pulses || 0, pulses);
      behavior.still = Math.max(behavior.still || 0, still);
      behavior.motion = Math.max(behavior.motion || 0, Number(game.time) || 0);
      if (!a.born && age > 2) { a.born = true; dirty = true; }
      var newSkin = false;
      if (meta > a.lastMeta) {
        var crossed = meta - a.lastMeta; a.skins = (a.skins || 0) + crossed; newSkin = true;
        if (currentTrait) { a.lastTrait = currentTrait; a.traits.push(currentTrait); if (a.traits.length > 12) a.traits.shift(); }
        a.lastMeta = meta; dirty = true; speak("новая кожа помнит больше, чем старый берег.", "the new skin remembers more than the old shore.");
      }
      if (!newSkin && a.lastAge > 120 && age + 20 < a.lastAge) {
        a.skins = (a.skins || 0) + 1; newSkin = true;
        if (currentTrait) { a.lastTrait = currentTrait; a.traits.push(currentTrait); if (a.traits.length > 12) a.traits.shift(); }
        dirty = true; speak("новая кожа помнит больше, чем старый берег.", "the new skin remembers more than the old shore.");
      }
      if (!a.awaken && age >= 55) { a.awaken = true; this._lastMilestone = "awaken"; dirty = true; speak("ты уже не просто родился. ты начинаешь отвечать миру.", "you are no longer only born. you are beginning to answer the world."); }
      var hasBond = false;
      for (var i = 0; i < w.beings.length; i++) if (!w.beings[i].dead && (w.beings[i].bond || 0) >= 0.55) { hasBond = true; break; }
      if (!a.bond && hasBond) { a.bond = true; this._lastMilestone = "bond"; dirty = true; speak("теперь в твоей истории есть кто-то ещё.", "now there is someone else in your story."); }
      if (!a.shadow && ((w.boss && !w.boss.dead) || (w.wounds && w.wounds.length >= 1))) { a.shadow = true; this._lastMilestone = "shadow"; dirty = true; speak("брошенное вернулось не как прошлое. оно смотрит на тебя.", "what you left did not return as the past. it looks at you."); }
      if (!a.legacy && a.skins >= 2) { a.legacy = true; this._lastMilestone = "legacy"; dirty = true; speak("берега уже складываются в одну жизнь.", "the shores are beginning to form one life."); }
      if (!a.threshold && a.skins >= 3) { a.threshold = true; this._lastMilestone = "threshold"; dirty = true; speak("ты живёшь не в берегах. берега живут в тебе.", "you do not live in the shores. the shores live in you."); }
      a.lastAge = age; a.lastSeen = Date.now();
      if (dirty) persist(a);
      this._ready = true;
      if (newSkin && a.legacy) this.leaveLegacy(game);
      this.applyConsequences(game);
    },
    applyConsequences: function (game) {
      var a = this.arc(), b = a.behavior || {}, w = game && game.world;
      if (!game || !w) return false;
      var stage = Math.floor(a.skins || 0), applied = game.__lifeConsequences || (game.__lifeConsequences = {});
      if ((b.returns || 0) >= 3 && !applied.return3) {
        var remembered = null;
        for (var i = 0; i < w.nodes.length; i++) if (!w.nodes[i].dead && w.nodes[i].state === "alive" && !w.nodes[i].legacy) { remembered = w.nodes[i]; break; }
        if (!remembered && G.Node) { remembered = new G.Node(game.player.x, game.player.y, "memory"); remembered.state = "alive"; remembered.growth = 1; w.nodes.push(remembered); }
        if (remembered) { remembered.memory = true; remembered.care = Math.max(remembered.care || 0, 0.75); remembered.verse = G.Lang && G.Lang.id === "en" ? "you came back" : "ты вернулся"; remembered.returnTrace = true; applied.return3 = true; }
      }
      if ((b.returns || 0) >= 7 && !applied.return7) { applied.return7 = true; for (var r = 0; r < w.nodes.length; r++) if (w.nodes[r].memory && !w.nodes[r].dead) w.nodes[r].roots = Math.max(w.nodes[r].roots || 0, 0.65); }
      if ((b.pulses || 0) >= 4 && !applied.pulse4 && G.Wound && w.wounds.length === 0) { applied.pulse4 = true; var ang = G.rand(0, 1000) / 1000 * G.TAU, dist = 300 + G.rand(0, 100), wound = new G.Wound(game.player.x + Math.cos(ang) * dist, game.player.y + Math.sin(ang) * dist, "thorn"); wound.consequence = true; w.wounds.push(wound); }
      if ((b.still || 0) >= 90 && !applied.still90) { var quiet = w.nearestNode ? w.nearestNode(game.player.x, game.player.y, 180) : null; if (quiet && !quiet.dead) { quiet.memory = true; quiet.care = Math.max(quiet.care || 0, 0.9); quiet.quiet = true; applied.still90 = true; } }
      if (stage >= 1 && !applied.stage1) { applied.stage1 = true; if ((b.born || 0) >= 20) w.scatter(game.player.x, game.player.y, 1, 360); if ((b.returns || 0) >= 3) w.scatter(game.player.x, game.player.y, 1, 220); }
      return true;
    },
    leaveLegacy: function (game) {
      var a = this.arc();
      if (!game || !game.world || !a.legacy || game.__lifeLegacySkin === a.skins) return null;
      game.__lifeLegacySkin = a.skins;
      var n = new G.Node(game.player.x + G.rand(-150, 150), game.player.y + G.rand(-150, 150), "memory");
      n.state = "alive"; n.growth = 1; n.care = 0.9; n.roots = 0.5; n.memory = true;
      n.verse = G.Lang && G.Lang.id === "en" ? "a shore you already crossed" : "берег, который ты уже пересёк";
      n.name = a.lastTrait ? traitLabel(a.lastTrait) : "memory";
      game.world.nodes.push(n); return n;
    },
    applyLegacy: function (game) {
      var a = this.arc();
      if (!game || !game.world || !a.legacy || game.world.__lifeLegacyApplied) return false;
      game.world.__lifeLegacyApplied = true;
      var p = this.profile(), history = p.traits.slice(), seen = {}, inherited = [], i, trait, kind;
      for (i = history.length - 1; i >= 0 && inherited.length < 3; i--) { trait = history[i]; kind = TRAIT_KIND[trait]; if (kind && !seen[kind]) { seen[kind] = true; inherited.push(kind); } }
      if (!inherited.length && p.lastTrait && TRAIT_KIND[p.lastTrait]) inherited.push(TRAIT_KIND[p.lastTrait]);
      var candidates = [];
      for (i = 0; i < game.world.nodes.length; i++) if (!game.world.nodes[i].dead && game.world.nodes[i].state === "unformed") candidates.push(game.world.nodes[i]);
      for (var c = 0; c < inherited.length && c < candidates.length; c++) { candidates[c].hint = inherited[c]; candidates[c].legacy = true; }
      var legacy = new G.Node(game.player.x + game.world.rng.range(-210, 210), game.player.y + game.world.rng.range(-210, 210), "memory");
      legacy.state = "alive"; legacy.growth = 1; legacy.care = 0.95; legacy.roots = 0.7; legacy.memory = true; legacy.legacy = true;
      legacy.name = p.lastTrait ? traitLabel(p.lastTrait) : "memory"; legacy.verse = G.Lang && G.Lang.id === "en" ? "you have been here before" : "ты уже был здесь"; game.world.nodes.push(legacy);
      if (p.bond && G.Being) { var echo = new G.Being(game.player.x + game.world.rng.range(-260, 260), game.player.y + game.world.rng.range(-260, 260), "empathy"); echo.bond = 0.32; echo.legacy = true; echo.memory = ["someone was here"]; game.world.beings.push(echo); }
      if (p.shadow && G.Wound && game.world.wounds.length === 0) { var wound = new G.Wound(game.player.x + game.world.rng.range(-420, 420), game.player.y + game.world.rng.range(-420, 420), p.lastTrait && TRAIT_KIND[p.lastTrait] ? TRAIT_KIND[p.lastTrait] : "spark"); wound.legacy = true; game.world.wounds.push(wound); }
      if (p.threshold) { game.world.bounds += 260; game.world.scatter(game.player.x, game.player.y, 2, 620); }
      return true;
    }
  };
  if (G.Director && G.Director.observe) { var originalObserve = G.Director.observe; G.Director.observe = function (dt, game) { originalObserve.call(this, dt, game); if (G.Life) G.Life.observe(dt, game); }; }
  if (G.World && G.World.prototype && G.World.prototype.birthShore) { var originalBirthShore = G.World.prototype.birthShore; G.World.prototype.birthShore = function (player, dna) { originalBirthShore.call(this, player, dna); if (G.Life) G.Life.applyLegacy({ player: player, world: this, dna: dna }); }; }
})(IGRA);
