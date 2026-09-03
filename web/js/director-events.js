var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var KEY = "igra.director-events.v1";
  var MAX = 6;
  var COOLDOWN = 75;

  function load() {
    var s = { version: 2, fired: [], last: -999, total: 0, thread: null };
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === "object") {
          if (Array.isArray(p.fired)) s.fired = p.fired.slice(-MAX);
          s.last = Number(p.last);
          s.total = Math.max(0, Math.floor(Number(p.total) || 0));
          if (p.thread && typeof p.thread === "object") {
            s.thread = {
              nodeId: p.thread.nodeId,
              createdSession: Math.max(0, Math.floor(Number(p.thread.createdSession) || 0)),
              createdDay: Math.max(0, Math.floor(Number(p.thread.createdDay) || 0)),
              life: Math.max(0, Math.floor(Number(p.thread.life) || 0))
            };
          }
        }
      }
    } catch (e) {}
    if (!isFinite(s.last)) s.last = -999;
    return s;
  }
  function save(s) {
    try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(s)); } catch (e) {}
  }
  function has(s, id) { return s.fired.indexOf(id) >= 0; }
  function fire(s, id, game) {
    if (has(s, id) || !game || !game.world) return false;
    s.fired.push(id);
    if (s.fired.length > MAX) s.fired.shift();
    s.total++;
    s.last = Number(game.time) || 0;
    save(s);
    if (G.Director) {
      G.Director.events = G.Director.events || [];
      G.Director.events.push({ id: id, time: s.last });
      if (G.Director.events.length > MAX) G.Director.events.shift();
    }
    return true;
  }
  function near(p, nodes, radius, predicate) {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n.dead && G.dist(p.x, p.y, n.x, n.y) < radius && (!predicate || predicate(n))) return n;
    }
    return null;
  }

  var Events = {
    resetCache: function () { this._state = null; },
    state: function () { if (!this._state) this._state = load(); return this._state; },
    profile: function () {
      var s = this.state();
      return { version: 2, fired: s.fired.slice(), last: s.last, total: s.total, thread: s.thread ? Object.assign({}, s.thread) : null };
    },

    // Событие здесь не «квест». Это короткая перемена состояния мира,
    // вызванная историей конкретного человека. Оно одноразовое для жизни
    // и сохраняется локально, поэтому повторный запуск не превращает берег
    // в автомат с одинаковыми сценками.
    observe: function (dt, game) {
      if (!game || game.state !== "play" || game.sky || !game.world || !game.dna) return;
      var s = this.state();
      var t = Number(game.time) || 0;
      var p = game.player;
      var mem = G.Memory || null;
      var sessions = mem ? Math.max(0, Math.floor(Number(mem.sessions) || 0)) : 0;
      var days = mem ? Math.max(0, Math.floor(Number(mem.days) || 0)) : 0;

      if (s.thread) {
        var ready = sessions > s.thread.createdSession &&
          (days > s.thread.createdDay || (mem && Number(mem.sleptHours) >= 6));
        if (ready) {
          var nodes0 = game.world.nodes || [];
          var continued = null;
          for (var ti = 0; ti < nodes0.length; ti++) {
            if (!nodes0[ti].dead && String(nodes0[ti].id) === String(s.thread.nodeId)) {
              continued = nodes0[ti];
              break;
            }
          }
          if (!continued) continued = near(p, nodes0, 280, function (n) { return n.memory || n.memoryAnchor; });
          if (continued) {
            continued.care = Math.max(Number(continued.care) || 0, 0.94);
            continued.roots = Math.max(Number(continued.roots) || 0, 0.76);
            continued.memory = true;
            continued.actTrace = true;
            continued.returnEcho = true;
            game.world.scatter(continued.x, continued.y, 1, 140);
            G.Voice.say("rememberYou", true);
            s.thread = null;
            save(s);
            return;
          }
        }
      }

      if (t - s.last < COOLDOWN) return;

      var life = G.Life && G.Life.profile ? G.Life.profile() : null;
      var rel = G.Relationships && G.Relationships.profile ? G.Relationships.profile() : null;
      var worldMem = G.WorldMemory && G.WorldMemory.profile ? G.WorldMemory.profile() : null;
      var act = G.Act && G.Act.profile ? G.Act.profile() : null;
      var beings = game.world.beings || [];
      var nodes = game.world.nodes || [];
      var wounds = game.world.wounds || [];
      var deep = 0, still = Number(p.stillT) || 0;
      for (var i = 0; i < G.TRAITS.length; i++) deep = Math.max(deep, Number(game.dna.get(G.TRAITS[i])) || 0);

      /* V5 feedback: a branch that already formed in the world is allowed to
         steer the next Director event. This is deliberately a tiny context,
         so the world cannot create unbounded content or UI state. */
      var v5 = G.V5World && G.V5World.futureContext ? G.V5World.futureContext() : null;
      if (v5 && v5.branches && v5.branches.length) {
        var branchKey = String(v5.branches[v5.branches.length - 1]);
        var worldEvent = "v5-world:" + branchKey;
        if (!has(s, worldEvent) && fire(s, worldEvent, game)) {
          game.world.directorFuture = {
            route: v5.route,
            season: v5.season,
            ecologyBand: v5.ecologyBand,
            law: v5.law,
            branch: branchKey
          };
          var voice = v5.ecologyBand === "low" ? "scar" :
            v5.ecologyBand === "high" ? "garden" :
            v5.route === "bond" ? "kind" :
            v5.route === "memory" ? "rememberYou" : "frontier";
          G.Voice.say(voice, true);
          return;
        }
      }

      if (!s.thread && life && life.skins >= 1 && sessions >= 1 && worldMem &&
          worldMem.memories && worldMem.memories.length >= 1) {
        var anchor = near(p, nodes, 260, function (n) {
          return !n.dead && (n.memory || n.memoryAnchor || n.actTrace);
        });
        if (anchor) {
          s.thread = {
            nodeId: anchor.id,
            createdSession: sessions,
            createdDay: days,
            life: life.life || 0
          };
          anchor.memory = true;
          anchor.actTrace = true;
          save(s);
          G.Voice.say("rememberYou", true);
          return;
        }
      }

      if (life && life.behavior && life.behavior.returns >= 4 && worldMem && worldMem.memories && worldMem.memories.length >= 2) {
        var remembered = near(p, nodes, 260, function (n) { return n.memory || n.memoryAnchor; });
        if (remembered && fire(s, "return-echo", game)) {
          remembered.care = Math.max(Number(remembered.care) || 0, 0.92);
          remembered.roots = Math.max(Number(remembered.roots) || 0, 0.72);
          remembered.actTrace = true;
          G.Voice.say("rememberYou", true);
          return;
        }
      }

      if (still > 70 && deep > 0.45 && !has(s, "quiet-bloom")) {
        var quietNode = near(p, nodes, 180, function (n) { return n.state === "alive" && !n.dead; });
        if (quietNode && fire(s, "quiet-bloom", game)) {
          quietNode.care = Math.max(Number(quietNode.care) || 0, 0.96);
          quietNode.roots = Math.max(Number(quietNode.roots) || 0, 0.78);
          quietNode.quietMemory = true;
          G.Voice.say("idle", true);
          return;
        }
      }

      if (rel && rel.trust > 0.58 && beings.length) {
        for (var b = 0; b < beings.length; b++) {
          var being = beings[b];
          if (!being.dead && being.bond > 0.6 && G.dist(p.x, p.y, being.x, being.y) < 240 && fire(s, "being-approach", game)) {
            being.actAffinity = Math.min(1, (Number(being.actAffinity) || 0) + 0.25);
            being.bond = Math.min(1, (Number(being.bond) || 0) + 0.05);
            G.Voice.say("kind", true);
            return;
          }
        }
      }

      if (wounds.length === 0 && rel && rel.debt > 0.35 && act && act.phase >= 2 && fire(s, "scar-memory", game)) {
        game.world.scatter(p.x, p.y, 1, 210);
        var scar = near(p, nodes, 240, function (n) { return n.state === "unformed"; });
        if (scar) { scar.hint = "scar"; scar.actTrace = true; }
        G.Voice.say("combat", true);
        return;
      }

      if (game.dna.get("harmony") > 0.62 && !has(s, "harmony-weather")) {
        var tone = near(p, nodes, 260, function (n) { return n.kind === "tone" && n.state === "alive"; });
        if (tone && fire(s, "harmony-weather", game)) {
          tone.care = Math.min(1, (Number(tone.care) || 0) + 0.2);
          tone.weather = true;
          G.Voice.say("music", true);
          return;
        }
      }

      if (act && act.phase >= 3 && (life && life.skins >= 1) && !has(s, "far-shore")) {
        if (fire(s, "far-shore", game)) {
          game.world.scatter(p.x + G.rand(-360, 360), p.y + G.rand(-360, 360), 2, 180);
          G.Voice.say("frontier", true);
        }
      }
    }
  };

  G.DirectorEvents = Events;
  if (G.Director && G.Director.observe) {
    var originalObserve = G.Director.observe;
    G.Director.observe = function (dt, game) {
      originalObserve.call(this, dt, game);
      if (G.DirectorEvents) G.DirectorEvents.observe(dt, game);
    };
  }
})(IGRA);
