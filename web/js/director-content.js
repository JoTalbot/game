var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // Контент отделён от Director runtime. Это позволяет наращивать мир
  // событиями без копирования условий, сохранения и логики engine.
  var KEY = "igra.director-content.v1";
  var MAX_FIRED = 24;
  var COOLDOWN = 110;

  var POOLS = {
    secondAct: [
      { id: "shore-remembered", phase: 4, need: function (c) { return c.memories >= 2 && c.returns >= 2; }, apply: function (g) { var n = nearest(g, 260); if (!n) return false; n.memory = true; n.actTrace = true; n.care = Math.max(Number(n.care) || 0, 0.9); n.roots = Math.max(Number(n.roots) || 0, 0.72); scatter(g, n, 1, 150); return true; } },
      { id: "bond-leaves-mark", phase: 4, need: function (c) { return c.trust >= 0.45 && c.beings >= 1; }, apply: function (g) { var b = nearestBeing(g, 260); if (!b) return false; b.actAffinity = Math.min(1, (Number(b.actAffinity) || 0) + 0.2); b.bond = Math.min(1, (Number(b.bond) || 0) + 0.04); b.memoryMark = true; return true; } },
      { id: "ecology-turn", phase: 4, need: function (c) { return c.ecology >= 0.55 || c.ecology <= 0.25; }, apply: function (g) { var n = nearest(g, 300); if (!n) return false; n.ecologyTrace = true; n.care = Math.min(1, (Number(n.care) || 0) + 0.08); scatter(g, n, 1, 190); return true; } },
      { id: "old-wound-grows", phase: 5, need: function (c) { return c.wounds >= 1 && c.skins >= 2; }, apply: function (g) { var n = nearest(g, 240); if (!n) return false; n.scarMemory = true; n.actTrace = true; n.care = Math.max(Number(n.care) || 0, 0.7); return true; } },
      { id: "returning-becomes-place", phase: 5, need: function (c) { return c.returns >= 5 && c.places >= 1; }, apply: function (g) { var n = nearest(g, 280); if (!n) return false; n.placeMemory = true; n.returnEcho = true; n.roots = Math.max(Number(n.roots) || 0, 0.78); scatter(g, n, 1, 170); return true; } },
      { id: "quiet-companion", phase: 5, need: function (c) { return c.trust >= 0.6 && c.beings >= 1 && c.memories >= 3; }, apply: function (g) { var b = nearestBeing(g, 280); if (!b) return false; b.memoryMark = true; b.actAffinity = Math.min(1, (Number(b.actAffinity) || 0) + 0.15); return true; } }
    ]
  };

  function fresh() { return { version: 1, fired: [], total: 0, last: -999 }; }
  function load() {
    var s = fresh();
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      var p = raw ? JSON.parse(raw) : null;
      if (p && typeof p === "object") {
        if (Array.isArray(p.fired)) s.fired = p.fired.slice(-MAX_FIRED);
        s.total = Math.max(0, Math.floor(Number(p.total) || 0));
        s.last = Number(p.last);
      }
    } catch (e) {}
    if (!isFinite(s.last)) s.last = -999;
    return s;
  }
  function save(s) { try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(s)); } catch (e) {} }
  function state() { if (!Content._state) Content._state = load(); return Content._state; }
  function nearest(g, radius) {
    var nodes = g.world && g.world.nodes || [], p = g.player;
    var best = null, bd = radius;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i]; if (!n || n.dead) continue;
      var d = G.dist(p.x, p.y, n.x, n.y);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }
  function nearestBeing(g, radius) {
    var bs = g.world && g.world.beings || [], p = g.player;
    var best = null, bd = radius;
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i]; if (!b || b.dead) continue;
      var d = G.dist(p.x, p.y, b.x, b.y);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }
  function scatter(g, n, count, radius) {
    if (g.world && g.world.scatter) g.world.scatter(n.x, n.y, count, radius);
  }
  function context(g) {
    var life = G.Life && G.Life.profile ? G.Life.profile() : {};
    var rel = G.Relationships && G.Relationships.profile ? G.Relationships.profile() : {};
    var wm = G.WorldMemory && G.WorldMemory.profile ? G.WorldMemory.profile() : {};
    var sm = G.SpatialMemory && G.SpatialMemory.profile ? G.SpatialMemory.profile() : {};
    var act = G.Act && G.Act.profile ? G.Act.profile() : {};
    var eco = G.V3Depth && G.V3Depth.profile ? G.V3Depth.profile() : {};
    return {
      phase: Number(act.phase) || 0,
      skins: Number(life.skins) || 0,
      returns: Number(life.behavior && life.behavior.returns) || 0,
      trust: Number(rel.trust) || 0,
      memories: Array.isArray(wm.memories) ? wm.memories.length : 0,
      places: Array.isArray(sm.places) ? sm.places.length : 0,
      beings: (g.world.beings || []).filter(function (b) { return b && !b.dead; }).length,
      wounds: (g.world.wounds || []).filter(function (w) { return w && !w.dead; }).length,
      ecology: Number(eco.ecology && eco.ecology.value) || Number(eco.ecology) || 0
    };
  }

  var Content = {
    _state: null,
    resetCache: function () { this._state = null; },
    profile: function () { var s = state(); return { version: 1, fired: s.fired.slice(), total: s.total, last: s.last }; },
    pools: function () { return { secondAct: POOLS.secondAct.map(function (e) { return e.id; }) }; },
    observe: function (dt, game) {
      if (!game || game.state !== "play" || !game.world || !game.player) return;
      var s = state(), now = Number(game.time) || 0;
      if (now - s.last < COOLDOWN) return;
      var c = context(game);
      if (c.phase < 4) return;
      var pool = POOLS.secondAct;
      for (var i = 0; i < pool.length; i++) {
        var e = pool[i];
        if (s.fired.indexOf(e.id) >= 0 || c.phase < e.phase) continue;
        var ok = false; try { ok = !!e.need(c); } catch (x) { ok = false; }
        if (!ok) continue;
        var applied = false; try { applied = !!e.apply(game); } catch (x2) { applied = false; }
        if (!applied) continue;
        s.fired.push(e.id); if (s.fired.length > MAX_FIRED) s.fired.shift();
        s.total++; s.last = now; save(s);
        if (G.Voice && G.Voice.say) G.Voice.say("rememberYou", true);
        return;
      }
    }
  };

  G.DirectorContent = Content;
  if (G.DirectorEvents && G.DirectorEvents.observe) {
    var original = G.DirectorEvents.observe;
    G.DirectorEvents.observe = function (dt, game) {
      original.call(this, dt, game);
      if (G.DirectorContent) G.DirectorContent.observe(dt, game);
    };
  }
})(IGRA);
