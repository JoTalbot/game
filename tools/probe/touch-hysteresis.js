#!/usr/bin/env node
"use strict";

// Deterministic contract for the RC1 touch cancellation policy.
// This probe intentionally models the policy without depending on DOM/WebView.
// Gameplay code must preserve the same boundary semantics.

var HOLD_LIMIT = 126;
var GRACE_LIMIT = 140;

function outcome(sequence) {
  var state = "holding";
  for (var i = 0; i < sequence.length; i++) {
    var event = sequence[i];
    if (event.type === "release") return "release";
    if (event.type === "system-cancel") return "system";
    if (event.type !== "move") continue;

    var slip = event.slip;
    if (slip > GRACE_LIMIT) return "slip";
    if (slip < 0) throw new Error("negative slip");
    if (slip <= GRACE_LIMIT) state = "holding";
  }
  return state;
}

function ok(condition, message) {
  if (!condition) throw new Error(message);
}

ok(outcome([{ type: "move", slip: 80 }]) === "holding", "normal hold failed");
ok(outcome([
  { type: "move", slip: HOLD_LIMIT + 1 },
  { type: "move", slip: 139 },
  { type: "move", slip: 121 }
]) === "holding", "grace recovery tears hold");
ok(outcome([{ type: "move", slip: GRACE_LIMIT }]) === "holding", "140px must remain grace");
ok(outcome([{ type: "move", slip: GRACE_LIMIT + 1 }]) === "slip", ">140px must cancel as slip");
ok(outcome([
  { type: "move", slip: 134 },
  { type: "release" }
]) === "release", "explicit release changed");
ok(outcome([
  { type: "move", slip: 130 },
  { type: "system-cancel" }
]) === "system", "touchcancel became slip");

// V3-039/V3-040 regression contract: deliberate stationary interaction must
// restore node gaze after V3-032 removed instant node capture. Walking must
// remain gated. V3-041 widens only the initial node touch target.
var fs = require("fs");
var src = fs.readFileSync("web/js/touch-hysteresis.js", "utf8");
ok(src.indexOf("var node = this.world.nearestNode") >= 0, "node lookup missing");
ok(src.indexOf("this.player.gaze = node") >= 0, "node gaze assignment missing");
ok(src.indexOf("node.state === \"alive\"") >= 0, "dead-node guard missing");
ok(src.indexOf("G.Report.act(\"gazes\")") >= 0, "gaze report missing");
ok(src.indexOf("this.dna.feed(\"contemplation\", 0.01)") >= 0, "contemplation feed missing");
ok(src.indexOf("fingerSlip > 18") >= 0, "walking gesture guard missing");
ok(src.indexOf("G.World.prototype.nearestNode = function () { return null; }") >= 0, "movement node suppression missing");
ok(src.indexOf("NODE_TAP_MULTIPLIER = 1.35") >= 0, "node tap widening missing");
ok(src.indexOf("NODE_TAP_MIN = 76") >= 0, "node tap minimum missing");
ok(src.indexOf("var oldNode = G.World.prototype.nearestNode") >= 0, "node wrapper missing");
ok(src.indexOf("oldNode.call(this, x, y, widened)") >= 0, "widened node lookup missing");

console.log("touch-hysteresis probe: PASS");
