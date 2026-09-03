"use strict";
var fs = require("fs");
var path = require("path");
var root = path.resolve(__dirname, "..", "..");
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }
function ok(v, m) { if (!v) { console.error("FAIL: " + m); process.exit(1); } console.log("OK: " + m); }

var html = read("web/index.html");
var patch = read("web/js/v3-start-density.js");
var world = read("web/js/world.js");
var sw = read("web/sw.js");

ok(html.indexOf("js/v3-start-density.js") >= 0, "start-density patch is loaded");
ok(patch.indexOf("__v3035StartDensity") >= 0, "start-density guard exists");
ok(patch.indexOf("first.slice(0, 5)") >= 0, "initial shore is capped at five meaningful nodes");
ok(world.indexOf("this.scatter(player.x, player.y, 7, r + 80)") >= 0, "probe sees original seven-node scatter");
ok(sw.indexOf("./js/v3-start-density.js") >= 0, "service worker caches start-density patch");

console.log("start-density probe passed");
