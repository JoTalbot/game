var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V9 foundation: bounded, deterministic world simulation kept separate from
  // presentation. The module deliberately exposes compact state so later V10+
  // systems can consume it without coupling themselves to renderer internals.
  var MAX_REGIONS = 6;
  var MAX_EVENTS = 48;
  var MAX_HISTORY = 96;
  var WEATHER = ["clear", "mist", "rain", "storm", "dry"];

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function hashSeed(seed, salt) {
    var x = (seed | 0) ^ (salt | 0);
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x | 0;
  }

  function makeRegion(i, seed) {
    var h = hashSeed(seed, i * 0x45d9f3b);
    var climate = ((h >>> 0) % 1000) / 1000;
    return {
      id: "r" + i,
      index: i,
      climate: climate,
      moisture: clamp(0.25 + climate * 0.5, 0, 1),
      fertility: clamp(0.35 + ((h >>> 10) % 600) / 1000, 0, 1),
      population: 2 + ((h >>> 20) % 7),
      pressure: 0,
      season: (h >>> 3) % 4,
      weather: WEATHER[(h >>> 7) % WEATHER.length],
      recovery: 0,
      trace: 0,
      neighbors: [],
      rule: climate < 0.33 ? "silence" : climate < 0.66 ? "growth" : "change"
    };
  }

  function LivingWorld(seed) {
    this.version = 1;
    this.seed = seed | 0;
    this.tick = 0;
    this.time = 0;
    this.regions = [];
    this.events = [];
    this.history = [];
    this.lastCause = "birth";
    this.eventSeq = 0;
    for (var i = 0; i < MAX_REGIONS; i++) this.regions.push(makeRegion(i, this.seed));
    for (var j = 0; j < this.regions.length; j++) {
      this.regions[j].neighbors = [this.regions[(j + this.regions.length - 1) % this.regions.length].id,
        this.regions[(j + 1) % this.regions.length].id];
    }
  }

  LivingWorld.prototype.region = function (id) {
    for (var i = 0; i < this.regions.length; i++) if (this.regions[i].id === id) return this.regions[i];
    return null;
  };

  LivingWorld.prototype.record = function (type, region, cause, magnitude) {
    var event = {
      id: "e" + (++this.eventSeq),
      tick: this.tick,
      type: type,
      region: region.id,
      cause: cause || this.lastCause,
      magnitude: Number((magnitude || 0).toFixed(4))
    };
    this.events.push(event);
    this.history.push(event);
    if (this.events.length > MAX_EVENTS) this.events.splice(0, this.events.length - MAX_EVENTS);
    if (this.history.length > MAX_HISTORY) this.history.splice(0, this.history.length - MAX_HISTORY);
    this.lastCause = event.type + ":" + event.region;
    return event;
  };

  LivingWorld.prototype.observe = function (dt, action) {
    dt = clamp(Number(dt) || 0, 0, 10);
    action = action || null;
    this.time += dt;
    this.tick++;

    var focus = action && action.region ? this.region(action.region) : null;
    if (focus && action.type) {
      var amount = clamp(Number(action.amount) || 0.1, -1, 1);
      if (action.type === "care") focus.fertility = clamp(focus.fertility + amount * 0.08, 0, 1);
      if (action.type === "harm") focus.fertility = clamp(focus.fertility - Math.abs(amount) * 0.12, 0, 1);
      if (action.type === "visit") focus.trace = clamp(focus.trace + 0.05, 0, 1);
      focus.pressure = clamp(focus.pressure + Math.abs(amount) * 0.03, 0, 1);
      this.record("player:" + action.type, focus, "player", amount);
    }

    // One bounded world tick. No timers, promises or wall-clock dependence.
    for (var i = 0; i < this.regions.length; i++) {
      var r = this.regions[i];
      var phase = (this.tick + i + (this.seed & 31)) % 4;
      r.season = phase;
      var weatherIndex = (hashSeed(this.seed, this.tick * 31 + i) >>> 0) % WEATHER.length;
      r.weather = WEATHER[weatherIndex];
      var weatherDelta = r.weather === "rain" ? 0.012 : r.weather === "dry" ? -0.01 : r.weather === "storm" ? -0.02 : 0.002;
      r.moisture = clamp(r.moisture + weatherDelta * dt, 0, 1);
      var growth = (r.moisture * 0.012 + r.fertility * 0.008 - r.pressure * 0.01) * dt;
      r.population = Math.max(0, Math.min(99, Math.round(r.population + growth)));
      r.pressure = clamp(r.pressure - 0.004 * dt, 0, 1);
      r.trace = clamp(r.trace - 0.001 * dt, 0, 1);
      if (r.fertility < 0.2 && r.recovery === 0) {
        r.recovery = 1;
        this.record("degraded", r, "ecology", r.fertility);
      } else if (r.fertility > 0.65 && r.recovery > 0) {
        r.recovery = 0;
        this.record("recovered", r, "ecology", r.fertility);
      }
    }

    // Bounded cross-region causality: pressure in one region influences its
    // neighbors, making the map a system rather than six independent boxes.
    for (var n = 0; n < this.regions.length; n++) {
      var source = this.regions[n];
      if (source.pressure <= 0.55) continue;
      for (var q = 0; q < source.neighbors.length; q++) {
        var target = this.region(source.neighbors[q]);
        if (!target) continue;
        target.pressure = clamp(target.pressure + source.pressure * 0.002 * dt, 0, 1);
      }
    }
    return this.snapshot();
  };

  LivingWorld.prototype.apply = function (action) {
    return this.observe(0.1, action);
  };

  LivingWorld.prototype.snapshot = function () {
    return {
      version: this.version,
      seed: this.seed,
      tick: this.tick,
      time: Number(this.time.toFixed(4)),
      lastCause: this.lastCause,
      regions: this.regions.map(function (r) {
        return {
          id: r.id, climate: Number(r.climate.toFixed(4)), moisture: Number(r.moisture.toFixed(4)),
          fertility: Number(r.fertility.toFixed(4)), population: r.population, pressure: Number(r.pressure.toFixed(4)),
          season: r.season, weather: r.weather, recovery: r.recovery, trace: Number(r.trace.toFixed(4)),
          rule: r.rule, neighbors: r.neighbors.slice()
        };
      }),
      events: this.events.map(function (e) { return Object.assign({}, e); }),
      history: this.history.map(function (e) { return Object.assign({}, e); })
    };
  };

  LivingWorld.fromSnapshot = function (snapshot) {
    var w = new LivingWorld(snapshot && snapshot.seed || 1);
    if (!snapshot) return w;
    w.tick = Number(snapshot.tick) || 0;
    w.time = Number(snapshot.time) || 0;
    w.lastCause = snapshot.lastCause || "birth";
    if (Array.isArray(snapshot.regions)) {
      for (var i = 0; i < snapshot.regions.length && i < w.regions.length; i++) {
        var src = snapshot.regions[i], dst = w.regions[i];
        ["climate", "moisture", "fertility", "population", "pressure", "season", "recovery", "trace"].forEach(function (k) {
          if (src[k] !== undefined && Number.isFinite(Number(src[k]))) dst[k] = Number(src[k]);
        });
        if (typeof src.weather === "string" && WEATHER.indexOf(src.weather) >= 0) dst.weather = src.weather;
        if (typeof src.rule === "string") dst.rule = src.rule;
      }
    }
    w.events = Array.isArray(snapshot.events) ? snapshot.events.slice(-MAX_EVENTS) : [];
    w.history = Array.isArray(snapshot.history) ? snapshot.history.slice(-MAX_HISTORY) : [];
    w.eventSeq = w.history.reduce(function (m, e) {
      var n = parseInt(String(e.id || "").replace(/^e/, ""), 10);
      return Math.max(m, Number.isFinite(n) ? n : 0);
    }, 0);
    return w;
  };

  G.V9World = {
    LivingWorld: LivingWorld,
    create: function (seed) { return new LivingWorld(seed); },
    constants: { maxRegions: MAX_REGIONS, maxEvents: MAX_EVENTS, maxHistory: MAX_HISTORY }
  };
})(IGRA);
