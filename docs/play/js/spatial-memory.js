var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var KEY = "igra.spatial-memory.v1";
  var MAX = 16;
  var SAVE_EVERY = 8;
  var MIN_MOVE = 110;
  var RETURN_RADIUS = 125;
  var cache = null;

  function fresh() { return { version: 1, visits: 0, returns: 0, places: [], last: null }; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, Number(n) || 0)); }
  function state() {
    if (cache) return cache;
    var s = fresh();
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      var p = raw ? JSON.parse(raw) : null;
      if (p && typeof p === "object") {
        s.visits = Math.max(0, Number(p.visits) || 0);
        s.returns = Math.max(0, Number(p.returns) || 0);
        s.places = Array.isArray(p.places) ? p.places.slice(-MAX) : [];
        s.last = p.last && typeof p.last === "object" ? p.last : null;
      }
    } catch (e) {}
    cache = s;
    return s;
  }
  function save() { try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(state())); } catch (e) {} }
  function life() { return G.Life && G.Life.profile ? Number(G.Life.profile().skins || 0) + 1 : 1; }
  function nearestPlace(s, x, y) {
    var best = -1, bestD = 1e9;
    for (var i = 0; i < s.places.length; i++) {
      var p = s.places[i];
      var d = Math.hypot((p.x - x), (p.y - y));
      if (d < bestD) { bestD = d; best = i; }
    }
    return { index: best, distance: bestD };
  }
  function nearestLiving(game, radius) {
    var w = game && game.world;
    if (!w || !Array.isArray(w.nodes)) return null;
    var best = null, bestD = 1e9;
    for (var i = 0; i < w.nodes.length; i++) {
      var n = w.nodes[i];
      if (!n || n.dead || n.state !== "alive") continue;
      var d = Math.hypot(n.x - game.player.x, n.y - game.player.y);
      if (d < radius && d < bestD) { best = n; bestD = d; }
    }
    return best;
  }
  function record(game, reason) {
    var w = game && game.world, p = game && game.player;
    if (!w || !p) return false;
    var b = Math.max(1, Number(w.bounds) || 2200);
    var x = clamp(p.x / b, -1, 1), y = clamp(p.y / b, -1, 1);
    var n = nearestLiving(game, 170);
    var rec = {
      x: x, y: y,
      kind: n ? String(n.kind || "spark") : "shore",
      roots: n ? clamp(n.roots, 0, 1) : 0,
      care: n ? clamp(n.care, 0, 1) : 0,
      reason: reason || "passed",
      life: life(),
      visits: 1,
      t: Date.now()
    };
    var s = state(), hit = nearestPlace(s, x, y);
    if (hit.index >= 0 && hit.distance < 0.055) {
      var old = s.places[hit.index];
      old.visits = Math.max(1, Number(old.visits) || 1) + 1;
      old.kind = rec.kind;
      old.roots = Math.max(Number(old.roots) || 0, rec.roots);
      old.care = Math.max(Number(old.care) || 0, rec.care);
      old.reason = reason || old.reason;
      old.life = Math.max(Number(old.life) || 1, rec.life);
      old.t = rec.t;
      s.returns++;
      s.last = { x: x, y: y, place: hit.index, t: rec.t };
    } else {
      s.places.push(rec);
      if (s.places.length > MAX) s.places.shift();
      s.last = { x: x, y: y, place: s.places.length - 1, t: rec.t };
    }
    save();
    return true;
  }
  function restore(game) {
    var w = game && game.world, s = state();
    if (!w || !s.places.length) return 0;
    var b = Math.max(1, Number(w.bounds) || 2200), made = 0;
    var limit = Math.min(5, s.places.length);
    for (var i = 0; i < limit; i++) {
      var p = s.places[s.places.length - 1 - i];
      var x = clamp(Number(p.x) || 0, -0.92, 0.92) * b;
      var y = clamp(Number(p.y) || 0, -0.92, 0.92) * b;
      var duplicate = false;
      for (var j = 0; j < w.nodes.length; j++) {
        var n0 = w.nodes[j];
        if (n0 && !n0.dead && G.dist2(n0.x, n0.y, x, y) < 90 * 90 && n0.spatialMemory) { duplicate = true; break; }
      }
      if (duplicate) continue;
      var n = w.spawnNode(x, y, "memory");
      n.state = "alive";
      n.growth = 1;
      n.r = 17 + Math.min(8, (Number(p.visits) || 1) * 0.8);
      n.care = Math.max(0.55, Number(p.care) || 0);
      n.roots = Math.max(0.5, Number(p.roots) || 0);
      n.spatialMemory = true;
      n.spatialLife = Number(p.life) || 1;
      n.spatialVisits = Number(p.visits) || 1;
      n.spatialReason = p.reason || "returned";
      n.memoryOf = p.kind || "shore";
      n.verse = n.spatialVisits > 1 ? "ты уже был здесь" : "здесь осталось место твоего шага";
      made++;
    }
    return made;
  }

  G.SpatialMemory = {
    resetCache: function () { cache = null; },
    profile: function () {
      var s = state();
      return { version: 1, visits: s.visits, returns: s.returns, places: s.places.slice(), last: s.last };
    },
    remember: function (game, reason) { return record(game, reason || "chosen"); },
    restore: restore,
    observe: function (dt, game) {
      if (!game || !game.world || !game.player) return;
      var s = state(), p = game.player;
      s.visits += Math.max(0, Number(dt) || 0) * 0.001;
      var last = s.last;
      var b = Math.max(1, Number(game.world.bounds) || 2200);
      var x = clamp(p.x / b, -1, 1), y = clamp(p.y / b, -1, 1);
      var moved = !last || Math.hypot((x - last.x) * b, (y - last.y) * b) >= MIN_MOVE;
      var meaningful = nearestLiving(game, 150);
      if (moved && meaningful && ((meaningful.roots || 0) >= 0.55 || (meaningful.care || 0) >= 0.82)) record(game, "passed");
      if (Number(game.time) % SAVE_EVERY < Math.max(0.02, Number(dt) || 0)) save();
    }
  };

  if (G.Director && G.Director.observe) {
    var originalObserve = G.Director.observe;
    G.Director.observe = function (dt, game) {
      originalObserve.call(this, dt, game);
      if (G.SpatialMemory) G.SpatialMemory.observe(dt, game);
    };
  }
  if (G.World && G.World.prototype && G.World.prototype.birthShore) {
    var originalBirth = G.World.prototype.birthShore;
    G.World.prototype.birthShore = function (player, dna) {
      originalBirth.call(this, player, dna);
      if (G.SpatialMemory) G.SpatialMemory.restore({ player: player, world: this, dna: dna });
    };
  }
})(IGRA);
