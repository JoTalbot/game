var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V9-V25 integration seam. The feature modules stay deterministic and
  // bounded; this adapter gives them a real home in the running game without
  // teaching the renderer about meta-systems.
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function finite(v, fallback) { return Number.isFinite(Number(v)) ? Number(v) : fallback; }

  function ensure(game) {
    if (!game || !game.world) return null;
    if (!game.world.v9v25) {
      var seed = finite(game.world.seed, 1) | 0;
      game.world.v9v25 = {
        version: 1,
        seed: seed,
        clock: 0,
        world: G.V9World ? G.V9World.create(seed) : null,
        lastAction: null,
        lastRegion: "r0",
        stepCount: 0,
        eventCount: 0
      };
    }
    var s = game.world.v9v25;
    if (!s.world && G.V9World) s.world = G.V9World.create(s.seed || 1);
    return s;
  }

  function regionFor(game) {
    var s = ensure(game);
    if (!s || !s.world || !game.player) return "r0";
    var x = finite(game.player.x, 0), y = finite(game.player.y, 0);
    var index = Math.abs((Math.floor(x / 320) + Math.floor(y / 240)) | 0) % s.world.regions.length;
    return "r" + index;
  }

  function actionFor(game, region) {
    var dna = game.dna || {};
    var dominant = typeof dna.dominant === "function" ? dna.dominant() : "contemplation";
    var action = dominant === "aggression" ? "harm" : dominant === "empathy" ? "care" : "visit";
    return { type: action, region: region, amount: 0.1 };
  }

  function touchPersonality(game) {
    if (!G.V10Personality || !game.world || !Array.isArray(game.world.beings)) return;
    var player = game.player || {};
    for (var i = 0; i < game.world.beings.length && i < 12; i++) {
      var b = game.world.beings[i];
      if (!b || typeof b !== "object") continue;
      var dx = finite(b.x, 0) - finite(player.x, 0);
      var dy = finite(b.y, 0) - finite(player.y, 0);
      var near = (dx * dx + dy * dy) < 180 * 180;
      if (near) G.V10Personality.observe(b, game.gazeTarget === b ? "care" : "gaze", 0.01);
    }
  }

  function social(game) {
    if (!G.V11Social || !game.world) return;
    G.V11Social.ensure(game.world);
    var target = game.gazeTarget;
    if (!target || !target.id) return;
    G.V11Social.record(game.world, "player", target.id, "bond", 0.01);
    G.V11Social.record(game.world, "player", target.id, "trust", 0.005);
  }

  function knowledge(game, action) {
    if (!G.V13Knowledge || !game.world || !action) return;
    G.V13Knowledge.ensure(game.world);
    var key = "region:" + action.region + ":" + action.type;
    G.V13Knowledge.discover(game.world, key, clamp(action.amount, 0, 1));
  }

  function director(game) {
    if (!G.V14Director2 || !game.world) return;
    G.V14Director2.ensure(game.world);
    var candidates = [
      { id: "quiet", setup: 0.3, consequence: 0.2, rarity: 0.9 },
      { id: "memory", setup: 0.6, consequence: 0.5, rarity: 0.5 },
      { id: "change", setup: 0.8, consequence: 0.7, rarity: 0.25 }
    ];
    G.V14Director2.choose(game.world, candidates);
  }

  function step(game, dt) {
    var s = ensure(game);
    if (!s || !s.world) return;
    var stepDt = clamp(finite(dt, 0), 0, 0.25);
    s.clock += stepDt;
    var region = regionFor(game);
    var action = actionFor(game, region);
    s.lastRegion = region;
    s.lastAction = action;
    if (G.V9World && s.world.observe) s.world.observe(stepDt, action);
    if (G.V19Simulation) G.V19Simulation.tick(s.world, stepDt);
    touchPersonality(game);
    social(game);
    knowledge(game, action);
    director(game);
    if (G.V18Experiments) G.V18Experiments.ensure(game.world);
    if (G.V16Presentation) G.V16Presentation.budget(game.world, game.w <= 480 ? 0.7 : 1, game.w <= 480 ? 10 : 24, game.w <= 480 ? 3 : 8);
    if (G.V17AdaptiveAudio) G.V17AdaptiveAudio.ensure(game.world);
    s.stepCount++;
    s.eventCount = s.world.history.length;
  }

  // Expose the bridge API even in probe/VM environments where the full Game
  // constructor is intentionally absent. Runtime installation remains opt-in.
  G.V9V25Bridge = { ensure: ensure, step: step };

  function install() {
    if (!G.Game || !G.Game.prototype || !G.Game.prototype.update || G.Game.prototype.__v9v25Bridge) return;
    var original = G.Game.prototype.update;
    G.Game.prototype.update = function (dt) {
      var result = original.apply(this, arguments);
      if (this.state === "play" || this.state === "birth") {
        step(this, dt);
      }
      return result;
    };
    G.Game.prototype.__v9v25Bridge = true;
  }

  install();
})(IGRA);
