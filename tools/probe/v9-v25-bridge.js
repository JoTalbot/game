"use strict";
var assert = require("assert");
var fs = require("fs"), vm = require("vm");
var ctx = { console: console, Math: Math };
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
  dna: { dominant: function () { return "empathy"; } },
  world: { seed: 4242, beings: [], history: [] },
  gazeTarget: null
};
assert(G.V9V25Bridge, "live bridge loads");
G.V9V25Bridge.step(game, 0.1);
assert(game.world.v9v25, "bridge attaches bounded state to live world");
assert(game.world.v9v25.world && game.world.v9v25.world.regions.length === 6, "live V9 world has bounded regions");
assert(game.world.v9v25.stepCount === 1, "one live integration step recorded");
assert(game.world.v9v25.lastAction.type === "care", "dominant empathy drives care action");
assert(game.world.v9v25.world.history.length > 0, "player action becomes causal world history");
assert(game.world.social && game.world.knowledge, "social and knowledge layers attach to live world");
assert(game.world.presentationV16 && game.world.presentationV16.floats <= 3, "weak-device presentation budget is enforced");
assert(game.world.simulationV19 && game.world.simulationV19.tick >= 0, "deep simulation is attached");
console.log("V9-V25 live bridge probe: PASS");
