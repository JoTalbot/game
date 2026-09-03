"use strict";
var fs = require("fs");
var path = require("path");

var root = path.resolve(__dirname, "..", "..");
var source = fs.readFileSync(path.join(root, "web", "js", "touch-hysteresis.js"), "utf8");

function ok(condition, message) {
  if (!condition) {
    console.error("  ✗ " + message);
    process.exitCode = 1;
    return;
  }
  console.log("  ✓ " + message);
}

console.log("Dense interaction contract");
ok(source.indexOf("__v3032Patched") >= 0, "dense interaction patch is installed");
ok(source.indexOf("proto.onDown") >= 0, "touch-down wrapper exists");
ok(source.indexOf("G.Organs.nearestBeing = function () { return null; }") >= 0, "being is not claimed on touch-down");
ok(source.indexOf("G.World.prototype.nearestNode = function () { return null; }") >= 0, "node is not claimed on touch-down");
ok(source.indexOf("var moving = speed > 10") >= 0, "movement guard disables auto-capture while travelling");
ok(source.indexOf("(this.input.hold || 0) > 0.38") >= 0, "being interaction requires a deliberate stationary hold");
ok(source.indexOf("this.aimRadius(30)") >= 0, "being interaction uses a tighter finger radius");
ok(source.indexOf("< 170") >= 0, "being interaction stays close to the player");

if (!process.exitCode) console.log("Dense interaction contract: PASS");
