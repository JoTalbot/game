var IGRA = IGRA || {};
(function (G) {
  "use strict";

  /* V5 turns existing release traces into a living feedback loop. It is
     intentionally invisible: no quests, streaks or mandatory meta UI. */
  var KEY = "igra.v5-world.v1";
  var MAX_EVENTS = 24;
  var MAX_BRANCHES = 12;
  var SEASONS = ["tide", "bloom", "dry", "storm"];
  var ROUTES = {
    steward: "care",
    bonding: "bond",
    seeking: "change",
    severing: "scar",
    watching: "memory",
    enduring: "endure"
  };

  function fresh() {
    return { version: 1, tick: 0, season: 0, ecology: 0.5, places: {}, beings: {}, branches: [], events: [], cooldown: 0, lastCause: "" };
  }
  function read() {
    var s = fresh();
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      var p = raw ? JSON.parse(raw) : null;
      if (p && typeof p === "object") Object.keys(s).forEach(function (k) { if (p[k] != null) s[k] = p[k]; });
    } catch (e) {}
    if (!s.places || typeof s.places !== "object") s.places = {};
    if (!s.beings || typeof s.beings !== "object") s.beings = {};
    if (!Array.isArray(s.branches)) s.branches = [];
    if (!Array.isArray(s.events)) s.events = [];
    return s;
  }
  function save(s) { try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(s)); } catch (e) {} }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hash(x) { var h = 2166136261; x = String(x); for (var i = 0; i < x.length; i++) { h ^= x.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  function route(game) {
    var tr = G.Trajectory && G.Trajectory.build ? G.Trajectory.build(game) : null;
    var d = tr && tr.dominant ? String(tr.dominant).toLowerCase() : "";
    return ROUTES[d] || "endure";
  }
  function releaseState() { return G.ReleaseSystems && G.ReleaseSystems.state ? G.ReleaseSystems.state() : null; }
  function cause(s, type, source, target, data) {
    var rs = releaseState();
    var id = "v5-" + hash(type + ":" + source + ":" + target + ":" + s.tick);
    if (rs && Array.isArray(rs.causes)) {
      rs.causes.push({ id: id, type: type, source: source, target: target, data: data || {}, t: Date.now() });
      while (rs.causes.length > 96) rs.causes.shift();
      rs.lastCause = id;
    }
    s.lastCause = id;
    return id;
  }
  function event(s, id, causeId, act, text) {
    if (s.events.some(function (e) { return e.id === id; })) return false;
    s.events.push({ id: id, causeId: causeId, act: act, text: text });
    while (s.events.length > MAX_EVENTS) s.events.shift();
    return true;
  }
  function worldFeedback(s, game, r) {
    var w = game.world, nodes = w.nodes || [], care = 0, harm = 0;
    for (var i = 0; i < nodes.length; i++) {
      care += Number(nodes[i].care || 0);
      harm += nodes[i].dead ? 1 : 0;
    }
    var signal = nodes.length ? (care / nodes.length) - harm * 0.01 : 0;
    s.ecology = clamp(s.ecology * 0.92 + (0.5 + signal * 0.08) * 0.08, 0, 1);
    w.ecology = s.ecology;
    w.season = SEASONS[s.season];
    w.v5Route = r;
    for (var n = 0; n < nodes.length; n++) {
      if (r === "care") nodes[n].care = clamp(Number(nodes[n].care || 0) + 0.0015, 0, 1);
      if (r === "scar") nodes[n].scars = Math.min(9, Number(nodes[n].scars || 0) + (s.tick % 90 === 0 ? 1 : 0));
      if (r === "memory") nodes[n].memory = true;
      if (r === "change") nodes[n].ecologyTrace = clamp(Number(nodes[n].ecologyTrace || 0) + 0.001, 0, 1);
    }
  }
  function places(s, game, r) {
    var rs = releaseState();
    if (!rs || !Array.isArray(rs.places)) return;
    for (var i = 0; i < rs.places.length; i++) {
      var p = rs.places[i];
      if (!p || !p.id) continue;
      var v = s.places[p.id] || { visits: 0, pressure: 0, route: "" };
      v.visits = Number(p.visits || 0);
      v.pressure = clamp(Number(v.pressure || 0) + (r === ROUTES[p.kind] ? 0.02 : 0.004), 0, 1);
      v.route = r;
      s.places[p.id] = v;
    }
    if (game.player && rs.places.length) {
      var idx = Math.floor((Math.abs(game.player.x) + Math.abs(game.player.y)) / 500) % rs.places.length;
      var p2 = rs.places[idx];
      if (p2 && s.places[p2.id]) s.places[p2.id].pressure = clamp(s.places[p2.id].pressure + 0.01, 0, 1);
    }
  }
  function beings(s, game, r) {
    var rs = releaseState();
    if (!rs || !Array.isArray(rs.beings)) return;
    for (var i = 0; i < rs.beings.length; i++) {
      var b = rs.beings[i];
      if (!b || !b.id) continue;
      var v = s.beings[b.id] || { encounters: 0, affinity: 0, route: "" };
      v.encounters = Number(b.memories || 0) + Number(b.trust || 0) * 2;
      v.affinity = clamp(Number(v.affinity || 0) + (r === "bond" ? 0.01 : r === "scar" ? -0.004 : 0.002), -1, 1);
      v.route = r;
      s.beings[b.id] = v;
    }
  }
  function branch(s, game, r) {
    if (s.cooldown > 0) { s.cooldown--; return; }
    if (s.tick < 60 || s.tick % 60 !== 0) return;
    var rs = releaseState(), act = rs ? Number(rs.act || 1) : 1;
    if (act < 2) return;
    var key = r + ":" + SEASONS[s.season];
    var prior = s.branches.some(function (b) { return b.key === key; });
    if (prior) return;
    var c = cause(s, "world-branch", r, key, { season: SEASONS[s.season], ecology: s.ecology, act: act });
    s.branches.push({ key: key, route: r, season: SEASONS[s.season], act: act, causeId: c });
    while (s.branches.length > MAX_BRANCHES) s.branches.shift();
    event(s, "branch-" + hash(key), c, act, "future event pool shifted by world state");
    s.cooldown = 30;
  }
  function observe(dt, game) {
    if (!game || !game.world || !game.player || game.state === "title") return;
    var s = read();
    s.tick++;
    if (s.tick % 180 === 0) s.season = (s.season + 1) % SEASONS.length;
    var r = route(game);
    worldFeedback(s, game, r);
    places(s, game, r);
    beings(s, game, r);
    branch(s, game, r);
    save(s);
  }
  function profile() { return read(); }

  G.V5World = { observe: observe, profile: profile, reset: function () { save(fresh()); } };

  if (G.ReleaseSystems && typeof G.ReleaseSystems.observe === "function") {
    var base = G.ReleaseSystems.observe;
    G.ReleaseSystems.observe = function (dt, game) {
      var out = base.call(G.ReleaseSystems, dt, game);
      try { G.V5World.observe(dt, game); } catch (e) {}
      return out;
    };
  }
})(IGRA);
