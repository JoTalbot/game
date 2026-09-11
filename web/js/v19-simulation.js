var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var MAX_MIGRATION = 32, MAX_MEMORY = 64, MAX_CAUSAL = 48;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function num(v, fallback) { return Number.isFinite(Number(v)) ? Number(v) : fallback; }
  function ensure(world) {
    if (!world.simulationV19) world.simulationV19 = {
      tick: 0, budget: 8, accumulator: 0, cursor: 0,
      migration: [], memory: [], causalEvents: [], historyCursor: 0,
      lastRegion: "r0"
    };
    var s = world.simulationV19;
    if (!Array.isArray(s.migration)) s.migration = [];
    if (!Array.isArray(s.memory)) s.memory = [];
    if (!Array.isArray(s.causalEvents)) s.causalEvents = [];
    s.budget = clamp(Math.floor(num(s.budget, 8)), 1, 8);
    s.cursor = Math.max(0, Math.floor(num(s.cursor, 0)));
    s.historyCursor = Math.max(0, Math.floor(num(s.historyCursor, 0)));
    return s;
  }
  function pushBounded(list, item, max) {
    list.push(item);
    if (list.length > max) list.splice(0, list.length - max);
  }
  function regionPressure(r) {
    return clamp(num(r && r.pressure, 0.5), 0, 1);
  }
  function simulateRegion(world, s, region, index) {
    if (!region) return;
    var pressure = regionPressure(region);
    var population = clamp(num(region.population, 0), 0, 1);
    var moisture = clamp(num(region.moisture, 0), 0, 1);
    var fertility = clamp(num(region.fertility, 0), 0, 1);
    var next = (index + 1) % world.regions.length;
    var neighbor = world.regions[next];
    var targetPressure = regionPressure(neighbor);
    var drift = clamp((pressure - targetPressure) * 0.05 + (fertility - population) * 0.01, -0.08, 0.08);
    if (Math.abs(drift) > 0.01) {
      pushBounded(s.migration, { tick: s.tick, from: region.id || ("r" + index), to: neighbor && (neighbor.id || ("r" + next)), amount: Number(Math.abs(drift).toFixed(4)) }, MAX_MIGRATION);
    }
    if (region.id) s.lastRegion = region.id;
    if (moisture < 0.2 || pressure > 0.85) {
      pushBounded(s.causalEvents, { tick: s.tick, type: "pressure", region: region.id || ("r" + index), value: Number(Math.max(pressure, 1 - moisture).toFixed(4)) }, MAX_CAUSAL);
    }
  }
  function tick(world, dt) {
    var s = ensure(world), step = clamp(num(dt, 0), 0, 0.25);
    s.accumulator += step;
    var n = 0, regions = Array.isArray(world.regions) ? world.regions : [];
    while (s.accumulator >= 0.05 && n < s.budget) {
      s.accumulator -= 0.05;
      s.tick++;
      if (regions.length) {
        var index = s.cursor % regions.length;
        simulateRegion(world, s, regions[index], index);
        s.cursor = (index + 1) % regions.length;
      }
      var history = Array.isArray(world.history) ? world.history : [];
      if (history.length > s.historyCursor) {
        var latest = history[history.length - 1];
        if (latest && latest.id != null) {
          pushBounded(s.memory, { id: latest.id, tick: s.tick, type: latest.type || "event", region: latest.region || s.lastRegion }, MAX_MEMORY);
          s.historyCursor = history.length;
        }
      }
      n++;
    }
    return n;
  }
  function snapshot(world) {
    var s = ensure(world);
    return JSON.parse(JSON.stringify({ tick: s.tick, budget: s.budget, accumulator: s.accumulator, cursor: s.cursor, migration: s.migration, memory: s.memory, causalEvents: s.causalEvents, historyCursor: s.historyCursor, lastRegion: s.lastRegion }));
  }
  function restore(world, data) {
    var s = ensure(world), d = data && typeof data === "object" ? data : {};
    s.tick = Math.max(0, Math.floor(num(d.tick, 0)));
    s.budget = clamp(Math.floor(num(d.budget, 8)), 1, 8);
    s.accumulator = clamp(num(d.accumulator, 0), 0, 0.25);
    s.cursor = Math.max(0, Math.floor(num(d.cursor, 0)));
    s.historyCursor = Math.max(0, Math.floor(num(d.historyCursor, 0)));
    s.lastRegion = typeof d.lastRegion === "string" ? d.lastRegion : "r0";
    s.migration = Array.isArray(d.migration) ? d.migration.slice(-MAX_MIGRATION) : [];
    s.memory = Array.isArray(d.memory) ? d.memory.slice(-MAX_MEMORY) : [];
    s.causalEvents = Array.isArray(d.causalEvents) ? d.causalEvents.slice(-MAX_CAUSAL) : [];
    return s;
  }
  G.V19Simulation = { ensure: ensure, tick: tick, snapshot: snapshot, restore: restore };
})(IGRA);
