var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var KEY = "igra.release.v1";
  var ROUTES = {
    empathy: "bonding",
    harmony: "steward",
    curiosity: "seeking",
    caution: "watching",
    solitude: "severing",
    resilience: "enduring"
  };

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  function canonicalTrajectory() {
    if (!G.Trajectory || typeof G.Trajectory.profile !== "function") return null;
    try { return G.Trajectory.profile(); } catch (e) { return null; }
  }

  function routeFromProfile(p, life, rel) {
    if (!p) return null;
    var dominant = String(p.dominant || "").toLowerCase();
    if (ROUTES[dominant]) return ROUTES[dominant];
    if (p.path) return String(p.path);
    if (rel && Number(rel.trust || 0) >= 0.6) return "bonding";
    if (life && life.behavior) {
      var b = life.behavior;
      if (Number(b.motion || 0) > Number(b.still || 0)) return "seeking";
      if (Number(b.still || 0) > Number(b.motion || 0)) return "watching";
    }
    return "enduring";
  }

  function apply() {
    var s = load();
    if (!s) return;
    var life = G.Life && typeof G.Life.get === "function" ? G.Life.get() : null;
    var rel = G.Relationships && typeof G.Relationships.get === "function" ? G.Relationships.get() : null;
    var p = canonicalTrajectory();
    var route = routeFromProfile(p, life, rel);
    if (!route) return;

    s.trajectories = s.trajectories || {};
    s.trajectoryProfile = s.trajectoryProfile || {};
    s.trajectoryProfile[route] = {
      path: p && p.path || route,
      dominant: p && p.dominant || null,
      secondary: p && p.secondary || null,
      turns: p && Number(p.turns || 0) || 0
    };
    s.trajectories[route] = Number(s.trajectories[route] || 0) + 1;

    if (life && life.behavior) {
      s.behavior = {
        born: Number(life.behavior.born || 0),
        returns: Number(life.behavior.returns || 0),
        pulses: Number(life.behavior.pulses || 0),
        still: Number(life.behavior.still || 0),
        motion: Number(life.behavior.motion || 0)
      };
    }
    s.lastCause = "trajectory:" + route;
    save(s);
  }

  G.ReleaseFixes = { apply: apply, routeFromProfile: routeFromProfile };
  apply();
})(IGRA);