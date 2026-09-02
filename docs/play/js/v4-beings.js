var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V4 recurring beings: three recognizable subjects whose behavior and
  // memory persist independently of the current body's generation.
  var KEY = "igra.v4-beings.v1";
  var DEFINITIONS = [
    { id: "witness", name: "Свидетель", role: "witness" },
    { id: "gardener", name: "Садовник", role: "gardener" },
    { id: "woundkeeper", name: "Хранитель-раны", role: "woundkeeper" }
  ];

  function fresh() {
    return { version: 1, beings: DEFINITIONS.map(function (d) {
      return { id: d.id, encounters: 0, memories: [], affinity: 0, fear: 0, last: "" };
    }) };
  }
  function load() {
    var s = fresh();
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      var p = raw ? JSON.parse(raw) : null;
      if (p && Array.isArray(p.beings)) {
        p.beings.forEach(function (b) {
          var target = s.beings.find(function (x) { return x.id === b.id; });
          if (!target) return;
          target.encounters = Math.max(0, Number(b.encounters) || 0);
          target.affinity = Math.max(0, Math.min(1, Number(b.affinity) || 0));
          target.fear = Math.max(0, Math.min(1, Number(b.fear) || 0));
          target.last = String(b.last || "");
          target.memories = Array.isArray(b.memories) ? b.memories.slice(-6) : [];
        });
      }
    } catch (e) {}
    return s;
  }
  function save(s) { try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(s)); } catch (e) {} }
  function state() { if (!Beings._state) Beings._state = load(); return Beings._state; }
  function dist(a, b) { return G.dist ? G.dist(a.x, a.y, b.x, b.y) : Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)); }
  function remember(s, text) {
    if (s.memories.indexOf(text) < 0) s.memories.push(text);
    if (s.memories.length > 6) s.memories.shift();
  }
  function nearestNode(game) {
    var nodes = game.world.nodes || [], p = game.player, best = null, bd = 520;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i]; if (!n || n.dead) continue;
      var d = dist(p, n); if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  function applyDefinition(b, def) {
    b.v4Id = def.id;
    b.v4Name = def.name;
    b.v4Role = def.role;
    b.releaseId = "being-" + DEFINITIONS.findIndex(function (d) { return d.id === def.id; });
    b.identity = def.id;
  }

  function observe(game) {
    if (!game || game.state !== "play" || !game.world || !game.player || !Array.isArray(game.world.beings)) return;
    var s = state(), changed = false;
    for (var i = 0; i < DEFINITIONS.length; i++) {
      var def = DEFINITIONS[i], b = game.world.beings[i];
      if (!b || b.dead) continue;
      var bs = s.beings[i];
      applyDefinition(b, def);
      var d = dist(game.player, b);
      if (d < 360) {
        bs.encounters += 1;
        bs.affinity = Math.min(1, bs.affinity + (d < 100 ? 0.003 : 0.001));
        b.v4Encounters = bs.encounters;
        b.v4Affinity = bs.affinity;
        if (d < 110 && bs.encounters % 20 === 0) {
          remember(bs, def.id + ":approach");
          b.memory = Array.isArray(b.memory) ? b.memory : [];
          b.memory.push({ t: Date.now(), ev: "v4-remember", id: def.id });
          if (b.memory.length > 8) b.memory.shift();
          changed = true;
        }
      }

      if (def.role === "witness" && d < 260) {
        b.v4Behavior = "keeps-near";
        b.vx += (game.player.x - b.x) * 0.00012;
        b.vy += (game.player.y - b.y) * 0.00012;
      } else if (def.role === "gardener" && d < 300) {
        b.v4Behavior = "tends-place";
        var node = nearestNode(game);
        if (node) {
          node.care = Math.min(1, (Number(node.care) || 0) + 0.0007);
          node.gardenerTrace = true;
        }
      } else if (def.role === "woundkeeper") {
        var wounds = (game.world.wounds || []).filter(function (w) { return w && !w.dead; }).length;
        b.v4Behavior = wounds ? "guards-wound" : "waits-for-history";
        if (wounds) {
          bs.fear = Math.max(0, bs.fear - 0.0005);
          b.v4WoundSense = wounds;
        }
      }
      b.v4MemoryCount = bs.memories.length;
    }
    if (changed || ((Number(game.time) || 0) % 30) < 1) save(s);
  }

  var Beings = {
    _state: null,
    resetCache: function () { this._state = null; },
    profile: function () { return JSON.parse(JSON.stringify(state())); },
    definitions: function () { return DEFINITIONS.map(function (d) { return d.id; }); },
    observe: observe
  };
  G.V4Beings = Beings;

  if (G.Director && G.Director.observe) {
    var previous = G.Director.observe;
    G.Director.observe = function (dt, game) {
      previous.call(this, dt, game);
      if (G.V4Beings) G.V4Beings.observe(game);
    };
  }
})(IGRA);
