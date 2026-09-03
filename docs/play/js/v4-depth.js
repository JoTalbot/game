var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V4.3: второй акт должен не только помнить последствия, но и отвечать на них.
  // Это лёгкий адаптивный слой поверх V4SecondAct: он не создаёт новую
  // валюту и не ломает старые save, а превращает накопленную память в редкие
  // world-beats, которые меняют ближайшее пространство и следующий выбор.
  var KEY = "igra.v4-depth.v1", VERSION = 1, MAX_BEATS = 8;
  var ROUTE_TEXT = {
    steward: "берег держит то, что ты не бросил",
    bonding: "кто-то помнит твой путь",
    severing: "дистанция оставляет след",
    watching: "тишина тоже стала решением",
    enduring: "мир пережил твой выбор"
  };

  function fresh() {
    return {version: VERSION, beats: [], pressure: 0, lastRoute: "", lastBeat: "", generation: 0};
  }
  function load() {
    var s = fresh();
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null, p = raw ? JSON.parse(raw) : null;
      if (p && typeof p === "object") {
        s.beats = Array.isArray(p.beats) ? p.beats.filter(function (b) { return b && b.id; }).slice(-MAX_BEATS) : [];
        s.pressure = Math.max(0, Math.min(12, Number(p.pressure) || 0));
        s.lastRoute = String(p.lastRoute || "");
        s.lastBeat = String(p.lastBeat || "");
        s.generation = Math.max(0, Number(p.generation) || 0);
      }
    } catch (e) {}
    s.version = VERSION;
    return s;
  }
  function save(s) { try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(s)); } catch (e) {} }
  function state() { if (!Depth._state) Depth._state = load(); return Depth._state; }
  function nearestNode(game) {
    var nodes = game && game.world && game.world.nodes || [], p = game && game.player, best = null, bd = 1200;
    if (!p) return null;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i]; if (!n || n.dead) continue;
      var d = G.dist ? G.dist(p.x, p.y, n.x, n.y) : 9999;
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }
  function profile() { return JSON.parse(JSON.stringify(state())); }

  function observe(dt, game) {
    if (!game || game.state !== "play" || !G.V4SecondAct) return;
    var v = G.V4SecondAct.profile ? G.V4SecondAct.profile() : null;
    if (!v || !v.active || !v.route) return;
    var s = state(), route = String(v.route), generation = Number(v.generation) || 0;
    s.generation = Math.max(s.generation, generation);
    if (s.lastRoute && s.lastRoute !== route) s.pressure = Math.min(12, s.pressure + 1);
    s.lastRoute = route;

    // A beat requires accumulated evidence, not a single noisy frame.
    // This makes the second act feel authored without becoming deterministic.
    var cadence = 90, evidence = Math.min(12, Number(v.events && v.events.length || 0) + Number(v.chain || 0) / 3);
    if (v.turns > 0 && v.turns % cadence === 0 && evidence >= 3 && s.beats.length < MAX_BEATS) {
      var id = "v4b-" + generation + "-" + Math.floor(v.turns / cadence);
      if (!s.beats.some(function (b) { return b.id === id; })) {
        var place = v.handoff && v.handoff.place || (v.events.length ? v.events[v.events.length - 1].place : "threshold");
        var being = v.handoff && v.handoff.being || "";
        var beat = {id:id, route:route, place:place, being:being, cause:v.lastCause || "", generation:generation, text:ROUTE_TEXT[route] || ROUTE_TEXT.enduring, pressure:s.pressure};
        s.beats.push(beat);
        s.lastBeat = id;
        while (s.beats.length > MAX_BEATS) s.beats.shift();
        var n = nearestNode(game);
        if (n) {
          n.v4DepthBeat = id;
          n.v4DepthRoute = route;
          n.v4DepthPressure = s.pressure;
          n.memory = true;
          if (route === "steward") n.care = Math.min(1, Number(n.care || 0) + 0.02);
          if (route === "bonding") n.bondTrace = true;
          if (route === "severing") n.scars = Number(n.scars || 0) + 1;
        }
        if (game.player) {
          game.player.v4DepthBeat = id;
          game.player.v4DepthRoute = route;
        }
        save(s);
      }
    } else if (v.turns % 15 === 0) {
      save(s);
    }
  }

  var Depth = { _state:null, state:state, profile:profile, reset:function(){this._state=fresh();save(this._state);}, observe:observe };
  G.V4Depth = Depth;
  if (G.Director && G.Director.observe && !G.Director.__v4Depth) {
    var prev = G.Director.observe;
    G.Director.observe = function (dt, game) { prev.call(this, dt, game); if (G.V4Depth) G.V4Depth.observe(dt, game); };
    G.Director.__v4Depth = true;
  }
})(IGRA);
