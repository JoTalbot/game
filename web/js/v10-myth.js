var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var MAX_MEMORY = 24;
  var MAX_LIVES = 3;
  var MAX_SIGNALS = 12;
  var MAX_RELATIONSHIPS = 8;
  var FINALES = ["release", "become", "unknown"];
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function finite(v, f) { return Number.isFinite(Number(v)) ? Number(v) : f; }
  function cleanId(v, fallback) { var s = String(v == null ? "" : v); return s.length ? s.slice(0, 32) : fallback; }
  function ensure(world) {
    if (!world) return null;
    if (!world.mythV10 || typeof world.mythV10 !== "object") {
      world.mythV10 = { version: 1, generation: 0, lives: [], memories: [], signals: {}, relationships: [], current: null };
    }
    var s = world.mythV10;
    s.version = 1;
    s.generation = clamp(Math.floor(finite(s.generation, 0)), 0, 999);
    if (!Array.isArray(s.lives)) s.lives = [];
    if (!Array.isArray(s.memories)) s.memories = [];
    if (!s.signals || typeof s.signals !== "object" || Array.isArray(s.signals)) s.signals = {};
    if (!Array.isArray(s.relationships)) s.relationships = [];
    s.lives = s.lives.slice(-MAX_LIVES);
    s.memories = s.memories.slice(-MAX_MEMORY);
    s.relationships = s.relationships.slice(-MAX_RELATIONSHIPS);
    var keys = Object.keys(s.signals);
    if (keys.length > MAX_SIGNALS) keys.slice(0, keys.length - MAX_SIGNALS).forEach(function (k) { delete s.signals[k]; });
    return s;
  }
  function finaleVector(finale) {
    finale = FINALES.indexOf(finale) >= 0 ? finale : "unknown";
    if (finale === "release") return { freedom: 0.85, bond: 0.35, change: 0.2 };
    if (finale === "become") return { freedom: 0.25, bond: 0.55, change: 0.9 };
    return { freedom: 0.4, bond: 0.4, change: 0.45 };
  }
  function strongestRelationship(s) {
    var best = null;
    for (var i = 0; i < s.relationships.length; i++) {
      var r = s.relationships[i];
      if (!r) continue;
      var score = finite(r.trust, 0) - finite(r.fear, 0) + finite(r.legacy, 0) * 0.1;
      if (!best || score > best.score) best = { score: score, relationship: r };
    }
    return best ? best.relationship : null;
  }
  function absorb(world, finale, profile, region) {
    var s = ensure(world), v = finaleVector(finale), p = profile || {};
    if (!s) return null;
    s.generation = Math.min(999, s.generation + 1);
    var dominant = cleanId(p.dominant || p.profile || "unknown", "unknown");
    var memory = {
      generation: s.generation,
      finale: FINALES.indexOf(finale) >= 0 ? finale : "unknown",
      dominant: dominant,
      region: cleanId(region || "r0", "r0"),
      freedom: Number(clamp(finite(p.freedom, v.freedom), 0, 1).toFixed(3)),
      bond: Number(clamp(finite(p.bond, v.bond), 0, 1).toFixed(3)),
      change: Number(clamp(finite(p.change, v.change), 0, 1).toFixed(3)),
      relationship: strongestRelationship(s) ? cleanId(strongestRelationship(s).id, "none") : "none"
    };
    s.lives.push(memory);
    s.memories.push({ generation: s.generation, type: "finale", value: memory.finale, dominant: dominant, region: memory.region, relationship: memory.relationship });
    s.signals["finale:" + memory.finale] = Math.min(1, finite(s.signals["finale:" + memory.finale], 0) + 0.35);
    s.signals["dominant:" + dominant] = Math.min(1, finite(s.signals["dominant:" + dominant], 0) + 0.25);
    s.current = memory;
    return memory;
  }
  function start(world) {
    var s = ensure(world);
    if (!s) return null;
    var last = s.lives.length ? s.lives[s.lives.length - 1] : null;
    var prior = last || { finale: "unknown", dominant: "unknown", freedom: 0.4, bond: 0.4, change: 0.45, region: "r0", relationship: "none" };
    var remembered = strongestRelationship(s);
    var conditions = {
      generation: s.generation,
      echo: prior.finale,
      inheritedDominant: cleanId(prior.dominant, "unknown"),
      familiarity: Number(clamp(0.12 + s.generation * 0.08, 0, 0.48).toFixed(3)),
      worldMemory: Number(clamp(0.18 + s.generation * 0.1, 0, 0.65).toFixed(3)),
      inheritedFreedom: Number(clamp(prior.freedom, 0, 1).toFixed(3)),
      inheritedBond: Number(clamp(prior.bond, 0, 1).toFixed(3)),
      inheritedChange: Number(clamp(prior.change, 0, 1).toFixed(3)),
      rememberedRegion: cleanId(prior.region, "r0"),
      rememberedRelationship: remembered ? cleanId(remembered.id, "none") : cleanId(prior.relationship, "none"),
      relationshipTrust: remembered ? Number(clamp(finite(remembered.trust, 0), 0, 1).toFixed(3)) : 0,
      relationshipFear: remembered ? Number(clamp(finite(remembered.fear, 0), 0, 1).toFixed(3)) : 0
    };
    if (prior.finale === "release") conditions.rule = "open";
    else if (prior.finale === "become") conditions.rule = "transform";
    else conditions.rule = "quiet";
    s.current = conditions;
    return conditions;
  }
  function touch(world, region, kind, amount) {
    var s = ensure(world); if (!s) return null;
    var regionId = cleanId(region, "r0"), key = cleanId(kind || "unknown", "unknown");
    var delta = clamp(Math.abs(finite(amount, 0.05)), 0, 0.2);
    s.signals[key] = clamp(finite(s.signals[key], 0) + delta, 0, 1);
    var id = regionId + ":" + key, relationship = null;
    for (var i = 0; i < s.relationships.length; i++) if (s.relationships[i] && s.relationships[i].id === id) relationship = s.relationships[i];
    if (!relationship) {
      relationship = { id: id, region: regionId, kind: key, encounters: 0, trust: 0, fear: 0, legacy: 0 };
      s.relationships.push(relationship);
    }
    relationship.encounters = Math.min(999, relationship.encounters + 1);
    if (key === "care") relationship.trust = clamp(relationship.trust + delta * 0.9, 0, 1);
    else if (key === "harm") relationship.fear = clamp(relationship.fear + delta * 0.9, 0, 1);
    else relationship.trust = clamp(relationship.trust + delta * 0.25, 0, 1);
    if (relationship.trust >= 0.6) relationship.legacy = Math.min(1, relationship.legacy + delta * 0.35);
    s.relationships.sort(function (a, b) { return (finite(a.encounters, 0) - finite(b.encounters, 0)) || String(a.id).localeCompare(String(b.id)); });
    if (s.relationships.length > MAX_RELATIONSHIPS) s.relationships = s.relationships.slice(-MAX_RELATIONSHIPS);
    if (s.signals[key] >= 0.7) {
      s.memories.push({ generation: s.generation, type: "signal", value: key, region: regionId, relationship: id });
      s.memories = s.memories.slice(-MAX_MEMORY);
    }
    return s.signals[key];
  }
  function rare(world) {
    var s = ensure(world); if (!s || s.generation < 2) return null;
    var echo = s.current && s.current.echo || "unknown";
    var dominant = s.current && s.current.inheritedDominant || "unknown";
    var finale = s.signals["finale:" + echo] || 0;
    var memory = s.signals["dominant:" + dominant] || 0;
    if (finale >= 0.7 && memory >= 0.5) return "generational:echo";
    if (s.generation >= 3 && Object.keys(s.signals).length >= 2) return "generational:awakening";
    return null;
  }
  function snapshot(world) {
    var s = ensure(world); if (!s) return null;
    return JSON.parse(JSON.stringify({ version: 1, generation: s.generation, lives: s.lives.slice(-MAX_LIVES), memories: s.memories.slice(-MAX_MEMORY), signals: s.signals, relationships: s.relationships.slice(-MAX_RELATIONSHIPS), current: s.current }));
  }
  function restore(world, raw) {
    var s = ensure(world); if (!s || !raw || typeof raw !== "object") return false;
    s.generation = clamp(Math.floor(finite(raw.generation, 0)), 0, 999);
    s.lives = Array.isArray(raw.lives) ? raw.lives.slice(-MAX_LIVES) : [];
    s.memories = Array.isArray(raw.memories) ? raw.memories.slice(-MAX_MEMORY) : [];
    s.signals = raw.signals && typeof raw.signals === "object" && !Array.isArray(raw.signals) ? raw.signals : {};
    s.relationships = Array.isArray(raw.relationships) ? raw.relationships.slice(-MAX_RELATIONSHIPS) : [];
    s.current = raw.current && typeof raw.current === "object" ? raw.current : null;
    ensure(world);
    return true;
  }
  G.V10Myth = { ensure: ensure, absorb: absorb, start: start, touch: touch, rare: rare, snapshot: snapshot, restore: restore, constants: { maxMemory: MAX_MEMORY, maxLives: MAX_LIVES, maxSignals: MAX_SIGNALS, maxRelationships: MAX_RELATIONSHIPS } };
})(IGRA);
