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
ok(patch.indexOf("__v3036StartDensity") >= 0, "calm-start guard exists");
ok(patch.indexOf("first.slice(0, 3)") >= 0, "initial shore is capped at three meaningful nodes");
ok(patch.indexOf("__v3036BirthGrace") >= 0, "birth grace guard exists");
ok(patch.indexOf("age < 25") >= 0, "first 25 seconds are protected");
ok(patch.indexOf("world.scatter = function () {}") >= 0, "automatic frontier scatter is suppressed during grace");
ok(world.indexOf("this.scatter(player.x, player.y, 7, r + 80)") >= 0, "probe sees original seven-node scatter");
ok(sw.indexOf("./js/v3-start-density.js") >= 0, "service worker caches start-density patch");

console.log("start-density probe passed");
