"use strict";
var assert = require("assert");
var fs = require("fs"), vm = require("vm");
var ctx = { console: console, Math: Math, performance: { now: function () { return 100; } } };
vm.createContext(ctx);
[
  "v9-world.js", "v10-personality.js", "v11-social.js", "v12-lineage.js",
  "v13-knowledge.js", "v14-director2.js", "v15-finale.js",
  "v16-presentation.js", "v17-adaptive-audio.js", "v18-experiments.js",
  "v19-simulation.js", "v20-hardening.js", "v21-playtest.js",
  "v22-optimization.js", "v23-rc2-gate.js", "v24-limited-release.js",
  "v25-production.js", "v9-v25-bridge.js"
].forEach(function (f) {
  vm.runInContext(fs.readFileSync("web/js/" + f, "utf8"), ctx, { filename: f });
});
var G = ctx.IGRA;
var game = {
  w: 427,
  state: "play",
  player: { x: 10, y: 20 },
  dna: { dominant: function () { return "empathy"; }, taps: 0, gazes: 0, pulses: 0 },
  world: { seed: 4242, beings: [], history: [] },
  gazeTarget: null,
  __v9v25Action: { type: "care", amount: 0.1 }
};
assert(G.V9V25Bridge, "live bridge loads");
G.V9V25Bridge.step(game, 0.1);
assert(game.world.v9v25, "bridge attaches bounded state to live world");
assert(game.world.v9v25.world && game.world.v9v25.world.regions.length === 6, "live V9 world has bounded regions");
assert(game.world.v9v25.stepCount === 1, "one live integration step recorded");
assert(game.world.v9v25.lastAction.type === "care", "real action signal drives care action");
assert(game.world.v9v25.world.history.length > 0, "real action becomes causal world history");
assert(game.world.v9v25.metrics.actions === 1, "action is counted once");
assert(game.world.v9v25.metrics.idleSteps === 0, "action step is not misclassified as idle");
assert(game.world.social && game.world.knowledge, "social and knowledge layers attach to live world");
assert(game.world.presentationV16 && game.world.presentationV16.floats <= 3, "weak-device presentation budget is enforced");
assert(game.world.simulationV19 && game.world.simulationV19.tick >= 0, "deep simulation is attached");
assert(game.world.playtestV21 && game.world.playtestV21.active, "live playtest session is attached");
assert(game.world.playtestV21.metrics.minutes > 0, "playtest clock advances from runtime dt");
assert(game.world.playtestV21.evidence.length > 0, "playtest evidence is recorded from runtime");
assert(game.world.optimizationV22 && game.world.optimizationV22.frameSamples.length === 1, "optimization frame sample is attached");
assert(game.world.optimizationV22.simSamples.length === 1, "optimization simulation sample is attached");
assert(game.world.optimizationV22.frameBudget === 20, "weak-device frame budget is configured");

// V11-003: presentation and ambience must react to world context without
// exceeding the bounded weak-device budget or collapsing every context into
// the same mechanical motif.
assert(G.V16Presentation && G.V16Presentation.ensure && G.V16Presentation.budget, "V16 presentation layer loads");
var presentation = G.V16Presentation.ensure(game.world);
G.V16Presentation.budget(game.world, 1, 24, 8);
assert(presentation.detail === 1, "presentation detail remains bounded");
assert(presentation.effects === 24 && presentation.floats === 8, "presentation upper budgets are explicit");
G.V16Presentation.budget(game.world, 9, 99, 99);
assert(presentation.detail === 1 && presentation.effects === 24 && presentation.floats === 8, "presentation budget clamps pathological input");

assert(G.V17AdaptiveAudio && G.V17AdaptiveAudio.ensure && G.V17AdaptiveAudio.react, "V17 adaptive audio layer loads");
var audio = G.V17AdaptiveAudio.ensure(game.world);
G.V17AdaptiveAudio.react(game.world, { intensity: 0.15, motif: "silence", silence: 0.9 });
var quietMotif = audio.motif;
G.V17AdaptiveAudio.react(game.world, { intensity: 0.85, motif: "garden", silence: 0.1 });
assert(audio.motif !== quietMotif, "audio motif changes with context");
assert(audio.ambience === 0.85 && audio.silence === 0.1, "audio context is applied deterministically");
G.V17AdaptiveAudio.react(game.world, { intensity: 9, motif: "storm", silence: -9 });
assert(audio.ambience === 1 && audio.silence === 0, "audio levels clamp pathological input");

// A quiet frame must remain quiet: no synthetic player action or causal event.
var eventsBeforeIdle = game.world.v9v25.world.history.length;
var actionsBeforeIdle = game.world.v9v25.metrics.actions;
G.V9V25Bridge.step(game, 0.1);
assert(game.world.v9v25.metrics.actions === actionsBeforeIdle, "idle frame does not invent an action");
assert(game.world.v9v25.metrics.idleSteps === 1, "quiet frame is classified as idle");
assert(game.world.v9v25.world.history.length === eventsBeforeIdle, "idle frame does not create causal player history");
assert(game.world.v9v25.lastAction.type === "idle", "last action becomes explicit idle state");
console.log("V9-V25 live bridge + V11 presentation/audio probe: PASS");
