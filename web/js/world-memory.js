var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var KEY = "igra.world-memory.v1";
  var MAX = 12;
  var cache = null;

  function fresh() {
    return { version: 1, visits: 0, memories: [] };
  }

  function state() {
    if (cache) return cache;
    var a = fresh();
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      var p = raw ? JSON.parse(raw) : null;
      if (p && typeof p === "object") {
        a.visits = Math.max(0, Number(p.visits) || 0);
        a.memories = Array.isArray(p.memories) ? p.memories.slice(-MAX) : [];
      }
    } catch (e) {}
    cache = a;
    return a;
  }

  function persist() {
    try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(state())); } catch (e) {}
  }

  function cleanKind(k) {
    return typeof k === "string" && k ? k : "memory";
  }

  function rememberNode(n, game, reason) {
    if (!n || !game || !game.world) return false;
    var w = game.world;
    var b = Math.max(1, Number(w.bounds) || 2200);
    var rec = {
      id: String(n.id || ""),
      x: G.clamp((Number(n.x) || 0) / b, -1, 1),
      y: G.clamp((Number(n.y) || 0) / b, -1, 1),
      kind: cleanKind(n.kind),
      verse: typeof n.verse === "string" ? n.verse.slice(0, 140) : "",
      roots: G.clamp(Number(n.roots) || 0, 0, 1),
      care: G.clamp(Number(n.care) || 0, 0, 1),
      reason: reason || "seen",
      life: G.Life && G.Life.profile ? Number(G.Life.profile().skins || 1) || 1 : 1,
      t: Date.now()
    };
    var a = state();
    var best = -1, bestD = 1e9;
    for (var i = 0; i < a.memories.length; i++) {
      var m = a.memories[i];
      var d = Math.abs((m.x || 0) - rec.x) + Math.abs((m.y || 0) - rec.y);
      if (m.kind === rec.kind && d < bestD) { bestD = d; best = i; }
    }
    if (best >= 0 && bestD < 0.08) {
      a.memories[best] = rec;
    } else {
      a.memories.push(rec);
      if (a.memories.length > MAX) a.memories.shift();
    }
    persist();
    return true;
  }

  function nearest(game) {
    var w = game && game.world;
    if (!w || !Array.isArray(w.nodes)) return null;
    var best = null, d2 = 1e18;
    for (var i = 0; i < w.nodes.length; i++) {
      var n = w.nodes[i];
      if (!n || n.dead || n.state !== "alive") continue;
      var d = G.dist2(game.player.x, game.player.y, n.x, n.y);
      if (d < d2) { d2 = d; best = n; }
    }
    return best && d2 < 130 * 130 ? best : null;
  }

  function restore(game) {
    var w = game && game.world, a = state();
    if (!w || !Array.isArray(w.nodes) || !a.memories.length) return 0;
    var limit = Math.min(4, a.memories.length);
    var made = 0;
    var b = Math.max(1, Number(w.bounds) || 2200);
    for (var i = 0; i < limit; i++) {
      var m = a.memories[a.memories.length - 1 - i];
      var x = G.clamp((m.x || 0) * b, -b * 0.92, b * 0.92);
      var y = G.clamp((m.y || 0) * b, -b * 0.92, b * 0.92);
      var duplicate = false;
      for (var j = 0; j < w.nodes.length; j++) {
        var n0 = w.nodes[j];
        if (n0 && G.dist2(n0.x, n0.y, x, y) < 80 * 80 && n0.kind === m.kind) { duplicate = true; break; }
      }
      if (duplicate) continue;
      var n = new G.Node(x, y, "memory");
      n.memoryOf = m.kind;
      n.memoryLife = m.life || 1;
      n.memoryReason = m.reason || "seen";
      n.state = "alive";
      n.growth = 1;
      n.care = Math.max(0.55, m.care || 0);
      n.roots = Math.max(0.45, m.roots || 0);
      n.verse = m.verse || "я помню это место";
      n.memoryAnchor = true;
      w.nodes.push(n);
      made++;
    }
    return made;
  }

  G.WorldMemory = {
    resetCache: function () { cache = null; },
    profile: function () {
      var a = state();
      return { visits: a.visits, memories: a.memories.slice() };
    },
    observe: function (dt, game) {
      var a = state();
      if (!game || !game.world) return;
      a.visits += Math.max(0, Number(dt) || 0) * 0.002;
      var n = nearest(game);
      if (n && ((n.roots || 0) >= 0.5 || (n.care || 0) >= 0.82)) {
        rememberNode(n, game, "returned");
      }
      persist();
    },
    remember: function (game, node, reason) {
      return rememberNode(node || nearest(game), game, reason || "chosen");
    },
    restore: restore
  };

  if (G.Director && G.Director.observe) {
    var originalObserve = G.Director.observe;
    G.Director.observe = function (dt, game) {
      originalObserve.call(this, dt, game);
      if (G.WorldMemory) G.WorldMemory.observe(dt, game);
    };
  }

  if (G.World && G.World.prototype && G.World.prototype.birthShore) {
    var originalBirth = G.World.prototype.birthShore;
    G.World.prototype.birthShore = function (player, dna) {
      originalBirth.call(this, player, dna);
      if (G.WorldMemory) G.WorldMemory.restore({ player: player, world: this, dna: dna });
    };
  }
})(IGRA);
