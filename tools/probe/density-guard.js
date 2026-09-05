"use strict";
var fs = require("fs");
function read(p) { return fs.readFileSync(p, "utf8"); }
var patch = read("web/js/v3-045-density-guard.js");
var html = read("web/index.html");
var sw = read("web/sw.js");
function ok(v, m) { if (!v) throw new Error("density-guard probe failed: " + m); console.log("  ✓ " + m); }
ok(html.indexOf("js/v3-045-density-guard.js") >= 0, "density guard is loaded");
ok(sw.indexOf("./js/v3-045-density-guard.js") >= 0, "density guard is cached offline");
ok(patch.indexOf("__v3045DensityGuard") >= 0, "guard is idempotent");
ok(patch.indexOf("MAX_NODES = 24") >= 0, "node population has a hard mobile ceiling");
ok(patch.indexOf("MAX_BEINGS = 8") >= 0, "being population has a hard mobile ceiling");
ok(patch.indexOf("MAX_BLOOMS = 24") >= 0, "bloom population is bounded");
ok(patch.indexOf("MAX_WOUNDS = 12") >= 0, "wound population is bounded");
ok(patch.indexOf("if (!(this.__v3044StartGrace > 0))") >= 0, "steady-state cap does not fight the authored opening grace");
ok(patch.indexOf("world.nodes = keep.concat(candidates.slice(0, room))") >= 0, "node pruning preserves nearby meaningful nodes first");
console.log("density-guard probe: PASS");
