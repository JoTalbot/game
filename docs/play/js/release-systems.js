var IGRA = IGRA || {};
(function (G) {
  "use strict";

  /*
   * Release Systems is the integration layer for V4..RC. It deliberately
   * stores only compact, causal summaries. The world remains the UI: there
   * is no quest journal, map, streak, daily reward or meta-progression wall.
   */
  var KEY = "igra.release.v1";
  var MAX = 64;
  var MAX_CAUSES = 96;
  var MAX_EVENTS = 32;
  var MAX_HIST = 48;

  function fresh() {
    return {
      version: 1, act: 1, actTurns: 0, season: 0, ecology: 0.5,
      laws: [], places: [], beings: [], causes: [], events: [], rare: [],
      trajectories: {}, body: { scars: 0, habits: [], identity: "shoreborn", carried: 0 },
      finals: [], nextLife: { origin: "shore", inherited: [], generation: 0 },
      director: { fired: 0, last: -999, budget: 0 }, compressed: 0,
      migratedFrom: 0, lastChoice: "", lastCause: "", ready: false
    };
  }
  function read() {
    var s = fresh();
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      var p = raw ? JSON.parse(raw) : null;
      if (p && typeof p === "object") {
        Object.keys(s).forEach(function (k) { if (p[k] != null) s[k] = p[k]; });
        if (!Array.isArray(s.laws)) s.laws = [];
        if (!Array.isArray(s.places)) s.places = [];
        if (!Array.isArray(s.beings)) s.beings = [];
        if (!Array.isArray(s.causes)) s.causes = [];
        if (!Array.isArray(s.events)) s.events = [];
        if (!Array.isArray(s.rare)) s.rare = [];
        if (!s.trajectories || typeof s.trajectories !== "object") s.trajectories = {};
        if (!s.body || typeof s.body !== "object") s.body = fresh().body;
        if (!s.nextLife || typeof s.nextLife !== "object") s.nextLife = fresh().nextLife;
      }
    } catch (e) {}
    return s;
  }
  function save(s) { try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(s)); } catch (e) {} }
  function trim(a, n) { while (a.length > n) a.shift(); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hash(text) { var h = 2166136261; text = String(text); for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  function cause(s, type, source, target, data) {
    var id = "c-" + hash(type + ":" + source + ":" + target + ":" + s.causes.length);
    s.causes.push({ id: id, type: type, source: source || "world", target: target || "world", data: data || {}, t: Date.now() });
    trim(s.causes, MAX_CAUSES); s.lastCause = id; return id;
  }
  function event(s, id, causeId, act, physical) {
    if (s.events.some(function (e) { return e.id === id; })) return false;
    s.events.push({ id: id, causeId: causeId, act: act, physical: physical || "", t: Date.now() });
    trim(s.events, MAX_EVENTS); return true;
  }
  var PLACE_SEEDS = [["mouth", "Устье", "shore"], ["glass", "Стеклянная отмель", "shore"], ["quiet", "Тихая впадина", "memory"], ["scar", "Полоса шрамов", "body"], ["echo", "Долина эха", "bond"], ["root", "Сад корней", "ecology"], ["threshold", "Порог возвращения", "return"], ["deep", "Глубокая вода", "finale"]];
  var BEING_SEEDS = ["Первый", "Свидетель", "Тот-кто-вернулся", "Садовник", "Хранитель-раны", "Последний голос"];
  var RARE_SEEDS = ["личный прилив", "узнавание", "оставленный след", "неожиданный союз", "тихое спасение", "возвращённая рана", "живое место", "чужая память", "обратная метаморфоза", "голос после финала"];
  function ensurePlaces(s) { for (var i = 0; i < PLACE_SEEDS.length; i++) if (!s.places.some(function (p) { return p.id === PLACE_SEEDS[i][0]; })) s.places.push({ id: PLACE_SEEDS[i][0], name: PLACE_SEEDS[i][1], kind: PLACE_SEEDS[i][2], visits: 0, state: 0, causeId: "" }); }
  function ensureBeings(s) { for (var i = 0; i < BEING_SEEDS.length; i++) if (!s.beings.some(function (b) { return b.id === "being-" + i; })) s.beings.push({ id: "being-" + i, name: BEING_SEEDS[i], trust: 0, fear: 0, memories: 0, alive: true, causeId: "" }); }
  function physical(game, s, kind, idx) {
    if (!game || !game.world) return;
    var w = game.world, p = game.player || { x: 0, y: 0 }, node = null;
    if (w.nearestNode) node = w.nearestNode(p.x, p.y, 900);
    if (!node && w.nodes && w.nodes[0]) node = w.nodes[0];
    if (node) { node.memory = true; node.actTrace = true; node.care = Math.max(Number(node.care) || 0, 0.65); if (kind === "scar") node.scars = (node.scars || 0) + 1; if (kind === "ecology") node.ecologyTrace = clamp((node.ecologyTrace || 0) + 0.18, 0, 1); if (kind === "place") node.placeTrace = idx || 1; if (kind === "finale") node.finalTrace = true; }
    if (kind === "birth" && w.scatter) w.scatter(p.x, p.y, 2, 420);
    if (kind === "return" && w.scatter) w.scatter(p.x, p.y, 1, 260);
    if (kind === "scar" && w.wounds && w.wounds.length === 0 && G.Wound) w.wounds.push(new G.Wound(p.x + 80, p.y - 50, "thorn"));
  }
  function advanceAct(s, game, next, why) { if (next <= s.act) return false; s.act = clamp(next, 1, 3); s.actTurns = 0; var c = cause(s, "act-transition", why, "act-" + s.act, { act: s.act }); event(s, "act-" + s.act, c, s.act, "world density changed"); physical(game, s, "birth", s.act); return true; }

  // Build the canonical profile from the active game. Trajectory.profile() is
  // a persisted cache and can describe a different test/life after a reset.
  function chooseTrajectory(s, game) {
    var life = G.Life && G.Life.profile ? G.Life.profile() : null;
    var rel = G.Relationships && G.Relationships.profile ? G.Relationships.profile() : null;
    var tr = G.Trajectory && G.Trajectory.build ? G.Trajectory.build(game) : (G.Trajectory && G.Trajectory.profile ? G.Trajectory.profile() : null);
    var key = tr && tr.path ? String(tr.path) : "balanced";
    if (key === "balanced" && rel && (rel.trust || 0) >= 0.55) key = "bonding";
    var b = life && life.behavior ? life.behavior : {};
    var care = Number(b.still || 0) + Number(b.pulses || 0);
    var motion = Number(b.motion || 0) + Number(b.returns || 0);
    if (key === "balanced" && motion > care + 2) key = "severing";
    else if (key === "balanced" && care > motion + 2) key = "steward";
    s.trajectories[key] = (s.trajectories[key] || 0) + 1;
    return key;
  }
  function evolveBody(s, game) {
    var dna = game && game.dna, life = G.Life && G.Life.profile ? G.Life.profile() : null, behavior = life && life.behavior ? life.behavior : {};
    var scars = game && game.world && game.world.wounds ? game.world.wounds.length : 0;
    s.body.scars = Math.max(Number(s.body.scars) || 0, scars);
    var still = Number(behavior.still || 0), motion = Number(behavior.motion || 0), pulses = Number(behavior.pulses || 0);
    var habit = still > motion + 2 ? "still" : motion > still + 2 ? "motion" : pulses > 3 ? "pulse" : "balanced";
    if (dna && dna.dominant) habit = dna.dominant();
    if (s.body.habits.indexOf(habit) < 0) s.body.habits.push(habit);
    trim(s.body.habits, 6);
    if (s.body.scars >= 2) s.body.identity = "scarred";
    if (s.body.habits.indexOf("empathy") >= 0) s.body.identity = "remembering";
  }
  function ecologyAndLaw(s, game) { var world = game.world, care = 0, harm = 0, nodes = world.nodes || []; for (var i = 0; i < nodes.length; i++) { if (nodes[i].care > 0.8) care++; if (nodes[i].dead) harm++; } var target = clamp(0.5 + (care - harm) * 0.012, 0, 1); s.ecology += (target - s.ecology) * 0.08; var law = s.ecology > 0.68 ? "care-reinforces-return" : (s.ecology < 0.32 ? "wounds-attract-echo" : "balance-remembers"); if (s.laws.indexOf(law) < 0) s.laws.push(law); trim(s.laws, 6); world.ecology = s.ecology; world.lawTrace = law; }
  function visitHistory(s, game) { if (!game.player || !s.places.length) return; var idx = Math.floor((Math.abs(game.player.x) + Math.abs(game.player.y)) / 380) % s.places.length, p = s.places[idx]; p.visits++; p.state = clamp(p.state + 0.01 + s.ecology * 0.002, 0, 1); if (p.visits === 1 || p.visits % 7 === 0) p.causeId = cause(s, "place-return", "player", p.id, { visits: p.visits }); if (p.visits > 1) physical(game, s, "place", idx); }
  function recurringBeings(s, game) { if (!game.world.beings) return; for (var i = 0; i < s.beings.length; i++) { var b = s.beings[i]; if (b.memories > 0 && game.world.beings[i]) game.world.beings[i].bond = clamp((game.world.beings[i].bond || 0) + b.trust * 0.001, 0, 1); } }
  function rarePersonal(s, game) { if (s.rare.length >= 10) return; var age = game.dna ? Number(game.dna.age) || 0 : 0, returns = G.Life && G.Life.profile ? Number((G.Life.profile().behavior || {}).returns) || 0 : 0; if (age < 120 || returns < 1) return; var idx = (s.rare.length + Math.floor(age / 120)) % RARE_SEEDS.length, name = RARE_SEEDS[idx]; if (s.rare.some(function (r) { return r.name === name; })) return; var c = cause(s, "rare-personal", "life", name, { age: age, returns: returns }); s.rare.push({ id: "rare-" + idx, name: name, causeId: c, physical: true }); physical(game, s, "scar", idx); }
  function compress(s) { if (s.causes.length > MAX_CAUSES || s.events.length > MAX_EVENTS) { var before = s.causes.length + s.events.length; trim(s.causes, MAX_CAUSES); trim(s.events, MAX_EVENTS); s.compressed += Math.max(0, before - s.causes.length - s.events.length); } trim(s.laws, 6); trim(s.places, 8); trim(s.beings, 6); trim(s.rare, 10); trim(s.body.habits, 6); }
  function observe(dt, game) {
    if (!game || !game.world || !game.player || game.state === "title") return;
    var s = this.state(); s.actTurns++; var t = Number(game.time) || 0, maturity = (game.world.meta || 0) + (game.world.discovered || 0) * 0.012 + t / 900;
    if (s.act < 2 && maturity >= 2.5) advanceAct(s, game, 2, "first-act-history");
    if (s.act < 3 && maturity >= 5.5 && s.events.length >= 7) advanceAct(s, game, 3, "second-act-consequences");
    ecologyAndLaw(s, game); evolveBody(s, game); visitHistory(s, game); recurringBeings(s, game); rarePersonal(s, game);
    if (s.act >= 2 && s.actTurns % 90 === 0) { var trajectory = chooseTrajectory(s, game), cid = cause(s, "trajectory-turn", trajectory, "act-" + s.act, { ecology: s.ecology, dominant: (G.Trajectory && G.Trajectory.profile ? G.Trajectory.profile().dominant : "") }); event(s, "turn-" + s.act + "-" + s.actTurns, cid, s.act, "trajectory:" + trajectory); physical(game, s, trajectory === "severing" ? "scar" : "place", s.actTurns); }
    if (s.act >= 3 && s.actTurns % 120 === 0) { var c = cause(s, "third-act-conflict", "world", "deep-water", { law: s.laws[s.laws.length - 1] || "balance-remembers" }); event(s, "climax-" + s.actTurns, c, 3, "central conflict shifts world law"); physical(game, s, "finale", s.actTurns); }
    s.director.budget = clamp(s.director.budget + Math.max(0, dt || 0), 0, 120); if (s.director.budget > 30) s.director.budget -= 30; s.director.fired = G.DirectorEvents && G.DirectorEvents.profile ? (G.DirectorEvents.profile().fired || 0) : s.director.fired; s.director.last = t;
    if (s.act >= 2 && game.world.beings && game.world.beings.length < 6 && G.Being) { var n = game.world.beings.length, b = new G.Being(game.player.x + 40 + n * 14, game.player.y - 40, "empathy"); b.memory = []; b.releaseId = s.beings[n] ? s.beings[n].id : "being-" + n; game.world.beings.push(b); }
    compress(s); s.ready = s.act >= 3 && Object.keys(s.trajectories).length >= 3 && s.places.length >= 8 && s.beings.length >= 6 && s.rare.length >= 10; if (s.actTurns % 20 === 0) save(s);
  }
  G.ReleaseSystems = {
    _state: null,
    state: function () { if (!this._state) { this._state = read(); ensurePlaces(this._state); ensureBeings(this._state); save(this._state); } return this._state; },
    reset: function () { this._state = fresh(); ensurePlaces(this._state); ensureBeings(this._state); save(this._state); },
    profile: function () { var s = this.state(); return { version: 1, act: s.act, ecology: s.ecology, laws: s.laws.slice(), places: s.places.slice(), beings: s.beings.slice(), causes: s.causes.slice(), events: s.events.slice(), rare: s.rare.slice(), trajectories: Object.keys(s.trajectories), body: JSON.parse(JSON.stringify(s.body)), finals: s.finals.slice(), nextLife: JSON.parse(JSON.stringify(s.nextLife)), compressed: s.compressed, ready: !!s.ready }; },
    observe: observe,
    recordAction: function (type, source, target, data, game) { var s = this.state(), cid = cause(s, type, source, target, data); event(s, type + "-" + cid, cid, s.act, "physical trace"); physical(game, s, type === "harm" ? "scar" : "place", 1); save(s); return cid; },
    chooseFinale: function (choice, game) { var s = this.state(), cid = cause(s, "final-choice", "player", choice, { act: s.act, ecology: s.ecology }); s.lastChoice = choice; s.finals.push({ choice: choice, causeId: cid, act: s.act, ecology: s.ecology, identity: s.body.identity }); trim(s.finals, 6); s.nextLife.generation = (Number(s.nextLife.generation) || 0) + 1; s.nextLife.origin = choice === "become" ? "voice" : "shore"; s.nextLife.inherited = ["c:" + cid, "law:" + (s.laws[s.laws.length - 1] || "balance-remembers"), "body:" + s.body.identity]; physical(game, s, "finale", choice === "become" ? 2 : 1); save(s); },
    migrate: function (legacy) { var s = this.state(); if (!legacy || typeof legacy !== "object") return s; if (legacy.version && Number(legacy.version) < 1) s.migratedFrom = Number(legacy.version); if (legacy.world && legacy.world.discovered) s.events.push({ id: "legacy-discovered", causeId: "legacy", act: 1, physical: "migrated", t: Date.now() }); if (legacy.dna && legacy.dna.age) s.body.habits.push("legacy-age"); trim(s.body.habits, 6); save(s); return s; },
    validate: function () { var s = this.state(); return { bounded: s.causes.length <= MAX_CAUSES && s.events.length <= MAX_EVENTS && s.places.length <= 8 && s.beings.length <= 6 && s.rare.length <= 10, serializable: (function () { try { JSON.stringify(s); return true; } catch (e) { return false; } })(), causal: s.causes.every(function (c) { return !!c.id && !!c.type; }), distinctFinales: (new Set(s.finals.map(function (f) { return f.choice; }))).size >= 2, acts: s.act >= 3, places: s.places.length >= 8, beings: s.beings.length >= 6, rare: s.rare.length >= 10, trajectories: Object.keys(s.trajectories).length >= 3, ready: !!s.ready }; }
  };
  ensurePlaces(G.ReleaseSystems.state()); ensureBeings(G.ReleaseSystems.state());

  if (G.Director && G.Director.observe) {
    var prevObserve = G.Director.observe;
    G.Director.observe = function (dt, game) { prevObserve.call(this, dt, game); if (G.ReleaseSystems) G.ReleaseSystems.observe(dt, game); };
  }
  if (G.Fate) {
    var oldRelease = G.Fate.release, oldBecome = G.Fate.become;
    if (oldRelease) G.Fate.release = function (game) { if (G.ReleaseSystems) G.ReleaseSystems.chooseFinale("release", game); return oldRelease.apply(this, arguments); };
    if (oldBecome) G.Fate.become = function (game) { if (G.ReleaseSystems) G.ReleaseSystems.chooseFinale("become", game); return oldBecome.apply(this, arguments); };
  }
})(IGRA);
