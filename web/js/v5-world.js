var IGRA = IGRA || {};
(function (G) {
  "use strict";

  /* V5: the world is a bounded feedback loop, not a statistics panel. */
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
  var LAWS = {
    care: "living-things-follow-care",
    bond: "memory-follows-bond",
    change: "change-leaves-new-paths",
    scar: "distance-leaves-scars",
    memory: "places-remember-attention",
    endure: "traces-outlast-bodies"
  };

  function fresh() {
    return {
      version: 2, tick: 0, season: 0, ecology: 0.5,
      places: {}, beings: {}, branches: [], events: [],
      cooldown: 0, lastCause: "", lastRoute: "endure",
      future: { route: "endure", season: "tide", ecologyBand: "middle", law: LAWS.endure }
    };
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
    if (!s.future || typeof s.future !== "object") s.future = fresh().future;
    return s;
  }
  function save(s) { try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(s)); } catch (e) {} }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hash(x) {
    var h = 2166136261; x = String(x);
    for (var i = 0; i < x.length; i++) { h ^= x.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }
  function route(game) {
    var tr = G.Trajectory && G.Trajectory.build ? G.Trajectory.build(game) : null;
    var d = tr && tr.dominant ? String(tr.dominant).toLowerCase() : "";
    return ROUTES[d] || "endure";
  }
  function releaseState() { return G.ReleaseSystems && G.ReleaseSystems.state ? G.ReleaseSystems.state() : null; }
  function cause(s, type, source, target, data) {
    var rs = releaseState();
    /* Deterministic by construction: no wall-clock value in provenance. */
    var id = "v5-" + hash(type + ":" + source + ":" + target + ":" + s.tick + ":" + (data && data.act || 0));
    if (rs && Array.isArray(rs.causes)) {
      rs.causes.push({ id: id, type: type, source: source, target: target, data: data || {}, t: s.tick });
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
  function law(s, game, r, act) {
    var rs = releaseState();
    var next = LAWS[r] || LAWS.endure;
    if (rs && Array.isArray(rs.laws)) {
      var exists = rs.laws.some(function (x) { return x && x.id === next; });
      if (!exists) rs.laws.push({ id: next, act: act, causeId: s.lastCause || "v5-law" });
      while (rs.laws.length > 12) rs.laws.shift();
    }
    if (game.world) game.world.v5Law = next;
    return next;
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
    var routeLaw = law(s, game, r, releaseState() ? Number(releaseState().act || 1) : 1);
    for (var n = 0; n < nodes.length; n++) {
      if (r === "care") nodes[n].care = clamp(Number(nodes[n].care || 0) + 0.0015, 0, 1);
      if (r === "scar" && s.tick % 90 === 0) nodes[n].scars = Math.min(9, Number(nodes[n].scars || 0) + 1);
      if (r === "memory") nodes[n].memory = true;
      if (r === "change") nodes[n].ecologyTrace = clamp(Number(nodes[n].ecologyTrace || 0) + 0.001, 0, 1);
      if (r === "bond") nodes[n].bondTrace = clamp(Number(nodes[n].bondTrace || 0) + 0.0008, 0, 1);
    }
    var band = s.ecology < 0.34 ? "low" : s.ecology > 0.66 ? "high" : "middle";
    s.lastRoute = r;
    s.future = { route: r, season: SEASONS[s.season], ecologyBand: band, law: routeLaw };
    w.v5Future = s.future;
  }
  function places(s, game, r) {
    var rs = releaseState();
    if (!rs || !Array.isArray(rs.places)) return;
    for (var i = 0; i < rs.places.length; i++) {
      var p = rs.places[i];
      if (!p || !p.id) continue;
      var v = s.places[p.id] || { visits: 0, pressure: 0, route: "", lastCause: "" };
      v.visits = Number(p.visits || 0);
      var kind = String(p.kind || "");
      v.pressure = clamp(Number(v.pressure || 0) + (r === ROUTES[kind] ? 0.02 : 0.004), 0, 1);
      v.route = r;
      if (v.visits > 0) v.lastCause = s.lastCause || v.lastCause;
      s.places[p.id] = v;
    }
    if (game.player && rs.places.length) {
      var idx = Math.floor((Math.abs(game.player.x) + Math.abs(game.player.y)) / 500) % rs.places.length;
      var p2 = rs.places[idx];
      if (p2 && s.places[p2.id]) {
        s.places[p2.id].pressure = clamp(s.places[p2.id].pressure + 0.01, 0, 1);
        s.places[p2.id].lastCause = s.lastCause || s.places[p2.id].lastCause;
      }
    }
  }
  function beings(s, game, r) {
    var rs = releaseState();
    if (!rs || !Array.isArray(rs.beings)) return;
    for (var i = 0; i < rs.beings.length; i++) {
      var b = rs.beings[i];
      if (!b || !b.id) continue;
      var v = s.beings[b.id] || { encounters: 0, affinity: 0, route: "", response: "" };
      v.encounters = Number(b.memories || 0) + Number(b.trust || 0) * 2;
      v.affinity = clamp(Number(v.affinity || 0) + (r === "bond" ? 0.01 : r === "scar" ? -0.004 : 0.002), -1, 1);
      v.route = r;
      v.response = v.affinity > 0.35 ? "approach" : v.affinity < -0.2 ? "withdraw" : "watch";
      s.beings[b.id] = v;
    }
  }
  function branch(s, game, r) {
    if (s.cooldown > 0) { s.cooldown--; return; }
    if (s.tick < 60 || s.tick % 60 !== 0) return;
    var rs = releaseState(), act = rs ? Number(rs.act || 1) : 1;
    if (act < 2) return;
    var band = s.ecology < 0.34 ? "low" : s.ecology > 0.66 ? "high" : "middle";
    var key = r + ":" + SEASONS[s.season] + ":" + band;
    var prior = s.branches.some(function (b) { return b.key === key; });
    if (prior) return;
    var c = cause(s, "world-branch", r, key, { season: SEASONS[s.season], ecology: s.ecology, act: act });
    s.branches.push({ key: key, route: r, season: SEASONS[s.season], ecologyBand: band, act: act, law: LAWS[r] || LAWS.endure, causeId: c });
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
  function futureContext() {
    var s = read();
    return {
      route: s.future.route,
      season: s.future.season,
      ecologyBand: s.future.ecologyBand,
      law: s.future.law,
      branches: s.branches.slice(-3).map(function (b) { return b.key; })
    };
  }

  G.V5World = {
    observe: observe,
    profile: profile,
    futureContext: futureContext,
    reset: function () { save(fresh()); }
  };

  if (G.ReleaseSystems && typeof G.ReleaseSystems.observe === "function") {
    var base = G.ReleaseSystems.observe;
    G.ReleaseSystems.observe = function (dt, game) {
      var out = base.call(G.ReleaseSystems, dt, game);
      try { G.V5World.observe(dt, game); } catch (e) {}
      return out;
    };
  }
})(IGRA);
