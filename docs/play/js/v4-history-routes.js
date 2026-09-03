var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V4-006..008: historical places, second-act consequences and contrasting
  // routes. The layer is deliberately invisible: it changes the shore,
  // relationships and laws instead of adding quest UI.
  var KEY = "igra.v4-history.v1";
  var PLACES = [
    { id: "glass", kind: "return", name: "Стеклянная отмель" },
    { id: "echo", kind: "bond", name: "Долина эха" },
    { id: "root", kind: "ecology", name: "Сад корней" },
    { id: "scar", kind: "body", name: "Полоса шрамов" }
  ];

  function fresh() {
    return { version: 1, tick: 0, visits: {}, returnCount: 0, consequences: [], route: "", routeCounts: {}, lastCause: "" };
  }
  function load() {
    var s = fresh();
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      var p = raw ? JSON.parse(raw) : null;
      if (p && typeof p === "object") {
        s.tick = Math.max(0, Number(p.tick) || 0);
        s.visits = p.visits && typeof p.visits === "object" ? p.visits : {};
        s.returnCount = Math.max(0, Number(p.returnCount) || 0);
        s.consequences = Array.isArray(p.consequences) ? p.consequences.slice(-12) : [];
        s.route = String(p.route || "");
        s.routeCounts = p.routeCounts && typeof p.routeCounts === "object" ? p.routeCounts : {};
        s.lastCause = String(p.lastCause || "");
      }
    } catch (e) {}
    return s;
  }
  function save(s) { try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(s)); } catch (e) {} }
  var State = { _state: null, state: function () { if (!this._state) this._state = load(); return this._state; }, resetCache: function () { this._state = null; }, reset: function () { this._state = fresh(); save(this._state); }, profile: function () { return JSON.parse(JSON.stringify(this.state())); } };
  G.V4History = State;

  function cause(type, place, route) {
    var rs = G.ReleaseSystems;
    if (!rs || !rs.state) return "";
    var s = rs.state(), id = "v4-" + type + "-" + place.id + "-" + (s.act || 1) + "-" + (s.causes || []).length;
    if (s.causes && !s.causes.some(function (c) { return c.id === id; })) s.causes.push({ id: id, type: type, source: route || "player", target: place.id, data: { act: s.act || 1, route: route || "" }, t: Date.now() });
    if (s.causes && s.causes.length > 96) s.causes.shift();
    return id;
  }
  function canonicalRoute(game) {
    var tr = G.Trajectory && G.Trajectory.build ? G.Trajectory.build(game) : null;
    var path = tr && tr.dominant && tr.secondary ? String(tr.dominant) + ":" + String(tr.secondary) : (tr && tr.path ? String(tr.path) : "balanced");
    // A strong live DNA profile is the primary route signal. Historical
    // behavior and relationship state remain useful as fallback context, but
    // must not mask a deliberate change in the active game's trajectory.
    var dominant = tr && tr.dominant ? String(tr.dominant).toLowerCase() : "";
    var ROUTES = {
      harmony: "steward",
      empathy: "bonding",
      curiosity: "seeking",
      aggression: "severing",
      contemplation: "watching",
      solitude: "severing",
      resilience: "enduring"
    };
    if (ROUTES[dominant]) return ROUTES[dominant];
    var rel = G.Relationships && G.Relationships.profile ? G.Relationships.profile() : null;
    var life = G.Life && G.Life.profile ? G.Life.profile() : null;
    var b = life && life.behavior ? life.behavior : {};
    if (rel && Number(rel.trust || 0) >= 0.6) return "bonding";
    if (Number(b.motion || 0) + Number(b.returns || 0) > Number(b.still || 0) + Number(b.pulses || 0) + 2) return "seeking";
    if (Number(b.still || 0) + Number(b.pulses || 0) > Number(b.motion || 0) + Number(b.returns || 0) + 2) return "steward";
    return path;
  }
  function applyPlace(game, s, place, route) {
    var rs = G.ReleaseSystems, r = rs && rs.state ? rs.state() : null;
    var count = (s.visits[place.id] || 0) + 1;
    s.visits[place.id] = count;
    if (count > 1) s.returnCount++;
    var cid = cause(count > 1 ? "place-return" : "place-first", place, route);
    s.lastCause = cid;

    var nodes = game.world.nodes || [], node = nodes.length ? nodes[s.tick % nodes.length] : null;
    if (node) {
      node.memory = true;
      node.historyV4 = Math.min(1, (Number(node.historyV4) || 0) + (count > 1 ? 0.08 : 0.04));
      if (place.kind === "ecology") node.care = Math.min(1, (Number(node.care) || 0) + 0.025);
      if (place.kind === "body") node.scars = (Number(node.scars) || 0) + (route === "severing" ? 1 : 0);
      if (place.kind === "bond") node.bondTrace = true;
    }

    // V4-007: second-act consequences touch two independent layers.
    if (r && r.act >= 2) {
      var layer = place.kind === "bond" ? "relationship" : place.kind === "body" ? "body" : "ecology";
      if (place.kind === "ecology") {
        game.world.ecology = Math.max(0, Math.min(1, (Number(game.world.ecology) || 0.5) + (route === "steward" ? 0.018 : -0.004)));
      } else if (place.kind === "bond") {
        var beings = game.world.beings || [];
        if (beings[1]) beings[1].bond = Math.max(0, Math.min(1, (Number(beings[1].bond) || 0) + (route === "bonding" ? 0.025 : -0.006)));
      } else if (place.kind === "body") {
        game.world.woundTraceV4 = Math.min(1, (Number(game.world.woundTraceV4) || 0) + (route === "severing" ? 0.03 : 0.006));
      }
      var law = route === "steward" ? "return-follows-care" : route === "bonding" ? "memory-follows-bond" : route === "severing" ? "distance-leaves-scars" : "paths-keep-traces";
      game.world.lawTrace = law;
      if (r.laws && r.laws.indexOf(law) < 0) r.laws.push(law);
      if (r.laws && r.laws.length > 6) r.laws.shift();
      s.consequences.push({ act: r.act, place: place.id, route: route, causeId: cid, layers: ["place", layer] });
      if (s.consequences.length > 12) s.consequences.shift();
    }
  }
  function observe(game) {
    if (!game || game.state !== "play" || !game.world || !game.player) return;
    var s = State.state(), route = canonicalRoute(game), r = G.ReleaseSystems && G.ReleaseSystems.state ? G.ReleaseSystems.state() : null;
    if (r && r.act < 2 && (game.time || 0) < 900) return;
    s.tick++;
    // A new historical contact is sampled at a coarse cadence, not every frame.
    if (s.tick === 1 || s.tick % 45 === 0) {
      var place = PLACES[(s.tick - 1) % PLACES.length];
      applyPlace(game, s, place, route);
    }
    s.route = route;
    s.routeCounts[route] = Number(s.routeCounts[route] || 0) + 1;
    save(s);
  }

  G.V4History.observe = observe;
  if (G.Director && G.Director.observe) {
    var previous = G.Director.observe;
    G.Director.observe = function (dt, game) { previous.call(this, dt, game); if (G.V4History) G.V4History.observe(game); };
  }
})(IGRA);
