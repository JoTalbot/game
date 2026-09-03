var IGRA = IGRA || {};
(function (G) {
  "use strict";

  /* V4-001..008: a real second act. The layer is compact, causal and physical:
     no quest log, no new meta UI. It reads existing signals and changes the shore. */
  var KEY = "igra.v4-second-act.v1";
  var MAX_EVENTS = 24;
  var MAX_CAUSES = 48;
  var EVENTS = [
    { id: "tide-memory", need: ["return", "memory"], place: "glass", route: "steward" },
    { id: "echo-answer", need: ["bond", "return"], place: "echo", route: "bonding" },
    { id: "root-keeps", need: ["care", "ecology"], place: "root", route: "steward" },
    { id: "scar-remembers", need: ["wound", "body"], place: "scar", route: "severing" },
    { id: "witness-turns", need: ["bond", "memory"], place: "echo", route: "bonding" },
    { id: "garden-opens", need: ["care", "return"], place: "root", route: "steward" },
    { id: "distance-sings", need: ["motion", "avoid"], place: "glass", route: "severing" },
    { id: "old-wound", need: ["wound", "return"], place: "scar", route: "enduring" },
    { id: "deep-listens", need: ["pulse", "memory"], place: "deep", route: "watching" },
    { id: "shore-recognizes", need: ["generation", "memory"], place: "threshold", route: "bonding" },
    { id: "quiet-choice", need: ["still", "care"], place: "quiet", route: "steward" },
    { id: "broken-path", need: ["sever", "scar"], place: "scar", route: "severing" }
  ];

  function fresh() {
    return { version: 1, act: 1, turns: 0, conflict: "", conflictScore: 0, events: [], causes: [], endings: [], route: "", active: false, complete: false };
  }
  function load() {
    var s = fresh();
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null, p = raw ? JSON.parse(raw) : null;
      if (p && typeof p === "object") {
        s.act = Math.max(1, Number(p.act) || 1);
        s.turns = Math.max(0, Number(p.turns) || 0);
        s.conflict = String(p.conflict || "");
        s.conflictScore = Number(p.conflictScore) || 0;
        s.events = Array.isArray(p.events) ? p.events.slice(-MAX_EVENTS) : [];
        s.causes = Array.isArray(p.causes) ? p.causes.slice(-MAX_CAUSES) : [];
        s.endings = Array.isArray(p.endings) ? p.endings.slice(-4) : [];
        s.route = String(p.route || ""); s.active = !!p.active; s.complete = !!p.complete;
      }
    } catch (e) {}
    return s;
  }
  function save(s) { try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(s)); } catch (e) {} }
  function state() { if (!SecondAct._state) SecondAct._state = load(); return SecondAct._state; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function cause(s, type, source, target, data) {
    var id = "v4c-" + type + "-" + source + "-" + target + "-" + s.causes.length;
    s.causes.push({ id: id, type: type, source: source, target: target, data: data || {} });
    while (s.causes.length > MAX_CAUSES) s.causes.shift();
    return id;
  }
  function signalMap(game) {
    var dna = game.dna || {}, p = game.player || {}, w = game.world || {}, life = G.Life && G.Life.profile ? G.Life.profile() : null;
    var beh = life && life.behavior ? life.behavior : {};
    var rel = G.Relationships && G.Relationships.profile ? G.Relationships.profile() : null;
    var places = G.V4History && G.V4History.profile ? G.V4History.profile() : null;
    var memory = G.WorldMemory && G.WorldMemory.profile ? G.WorldMemory.profile() : null;
    var wounds = Array.isArray(w.wounds) ? w.wounds.filter(function (x) { return x && !x.dead; }).length : 0;
    var care = 0, scars = 0, nodes = w.nodes || [];
    for (var i = 0; i < nodes.length; i++) { care += Number(nodes[i].care) > 0.65 ? 1 : 0; scars += Number(nodes[i].scars) > 0 ? 1 : 0; }
    return {
      return: Number(beh.returns || 0) > 0 || Number((places && places.returnCount) || 0) > 0,
      memory: !!(memory && Object.keys(memory).length) || !!(places && places.consequences && places.consequences.length),
      bond: !!(rel && (Number(rel.trust || 0) > 0.35 || Number(rel.bond || 0) > 0.35)) || (w.beings || []).some(function (b) { return Number(b.bond || 0) > 0.35; }),
      care: care > 0,
      ecology: Number(w.ecology || 0.5) !== 0.5 || care > 2,
      wound: wounds > 0 || scars > 0,
      body: !!(G.V6Body && G.V6Body.profile),
      motion: Number(beh.motion || 0) > 2,
      avoid: Number(beh.returns || 0) < 2 && Number(beh.motion || 0) > 3,
      pulse: Number(beh.pulses || 0) > 0 || Number(dna.pulses || 0) > 0,
      generation: Number((G.V8Lineage && G.V8Lineage.profile ? G.V8Lineage.profile().generation : 0) || 0) > 0,
      still: Number(beh.still || 0) > Number(beh.motion || 0),
      sever: Number(beh.motion || 0) > Number(beh.returns || 0) + 2,
      scar: scars > 0 || wounds > 0,
      playerX: Number(p.x) || 0
    };
  }
  function route(signals) {
    if (signals.bond && signals.return) return "bonding";
    if (signals.care && signals.return) return "steward";
    if (signals.sever || signals.avoid) return "severing";
    if (signals.still && signals.care) return "watching";
    return "enduring";
  }
  function applyPhysical(game, e, r) {
    var w = game.world, p = game.player, nodes = w.nodes || [], node = null;
    for (var i = 0; i < nodes.length; i++) {
      if (!nodes[i] || nodes[i].dead) continue;
      var d = G.dist ? G.dist(p.x, p.y, nodes[i].x, nodes[i].y) : 9999;
      if (d < 850) { node = nodes[i]; break; }
    }
    if (!node && nodes[0]) node = nodes[0];
    if (node) {
      node.act2Trace = true;
      node.memory = true;
      node.historyV4 = Math.min(1, Number(node.historyV4 || 0) + 0.025);
      if (r === "steward") node.care = Math.min(1, Number(node.care || 0) + 0.035);
      if (r === "bonding") node.bondTrace = true;
      if (r === "severing") node.scars = Number(node.scars || 0) + 1;
    }
    if (w.scatter) w.scatter(p.x, p.y, r === "severing" ? 1 : 2, r === "bonding" ? 300 : 420);
    if (G.V4History && G.V4History.state) {
      var hs = G.V4History.state();
      hs.lastCause = e.causeId || hs.lastCause;
    }
  }
  function pickEvent(s, signals) {
    for (var i = 0; i < EVENTS.length; i++) {
      var e = EVENTS[i];
      if (s.events.some(function (x) { return x.id === e.id; })) continue;
      var ok = e.need.every(function (n) { return !!signals[n]; });
      if (ok) return e;
    }
    return null;
  }
  function observe(dt, game) {
    if (!game || game.state !== "play") return;
    var s = state(), rs = G.ReleaseSystems && G.ReleaseSystems.state ? G.ReleaseSystems.state() : null;
    if (rs && rs.act < 2) return;
    s.active = true; s.act = 2; s.turns++;
    var signals = signalMap(game), r = route(signals);
    s.route = r;
    if (!s.conflict) s.conflict = signals.bond ? "memory-vs-distance" : signals.care ? "care-vs-change" : "return-vs-severance";
    s.conflictScore += (signals.bond ? 0.4 : 0) + (signals.care ? 0.3 : 0) + (signals.wound ? 0.25 : 0) + (signals.memory ? 0.15 : 0);
    if (s.turns % 30 === 0 && s.events.length < EVENTS.length) {
      var picked = pickEvent(s, signals);
      if (picked) {
        var cid = cause(s, "event", picked.id, picked.place, { route: r, signals: picked.need });
        picked = { id: picked.id, place: picked.place, route: r, causeId: cid };
        s.events.push(picked); applyPhysical(game, picked, r);
      }
    }
    // Two genuine second-act endings, based on accumulated causes rather than a menu choice.
    if (!s.complete && s.events.length >= 6 && s.turns % 60 === 0) {
      var ending = (r === "bonding" || r === "steward") ? "keep" : "let-go";
      if (s.endings.indexOf(ending) < 0) {
        s.endings.push(ending);
        var ec = cause(s, "ending", r, ending, { events: s.events.length, conflict: s.conflict });
        s.causes.push({ id: ec, type: "ending", source: r, target: ending, data: { events: s.events.length } });
        applyPhysical(game, { causeId: ec, place: "threshold" }, ending === "keep" ? "steward" : "severing");
      }
    }
    if (s.endings.length >= 2) s.complete = true;
    save(s);
  }
  var SecondAct = {
    _state: null,
    resetCache: function () { this._state = null; },
    reset: function () { this._state = fresh(); save(this._state); },
    profile: function () { return JSON.parse(JSON.stringify(state())); },
    events: function () { return EVENTS.map(function (e) { return e.id; }); },
    observe: observe
  };
  G.V4SecondAct = SecondAct;
  if (G.Director && G.Director.observe) {
    var prev = G.Director.observe;
    G.Director.observe = function (dt, game) { prev.call(this, dt, game); if (G.V4SecondAct) G.V4SecondAct.observe(dt, game); };
  }
})(IGRA);
