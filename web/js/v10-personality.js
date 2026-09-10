var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  function ensure(b) {
    if (!b.personality) {
      b.personality = { curiosity: 0.5, fear: 0.2, trust: 0.5, aggression: 0.2, attachment: 0.4, contemplation: 0.5, empathy: 0.5, volatility: 0.3 };
    }
    return b.personality;
  }
  function profile(b) {
    var p = ensure(b);
    var entries = Object.keys(p).sort(function (a, c) { return p[c] - p[a]; });
    return entries[0];
  }
  function observe(b, action, amount) {
    var p = ensure(b), d = clamp(amount == null ? 0.05 : amount, -0.2, 0.2);
    if (action === "care") { p.trust += d; p.attachment += d * 0.7; p.fear -= d * 0.4; }
    if (action === "harm") { p.fear += Math.abs(d); p.aggression += Math.abs(d) * 0.8; p.trust -= Math.abs(d); }
    if (action === "gaze") p.curiosity += d * 0.5;
    if (action === "still") p.contemplation += d;
    Object.keys(p).forEach(function (k) { p[k] = clamp(p[k], 0, 1); });
    return p;
  }
  function decide(b, context, rng) {
    var p = ensure(b), r = rng && rng.next ? rng.next() : 0.5;
    context = context || {};
    if (context.threat > 0.5 && p.fear > 0.6) return "retreat";
    if (context.social && p.attachment > 0.65 && p.trust > 0.55) return "approach";
    if (context.unknown && p.curiosity > 0.6 && r < p.curiosity) return "explore";
    if (context.conflict && p.aggression > 0.65 && r < p.aggression) return "confront";
    return p.contemplation > p.curiosity ? "observe" : "wander";
  }
  G.V10Personality = { ensure: ensure, profile: profile, observe: observe, decide: decide };
})(IGRA);
