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
    // 126..140 is grace: only sustained outward movement beyond 140
    // tears the gesture. Returning inward keeps the hold alive.
    if (slip < 0) throw new Error("negative slip");
    if (slip <= GRACE_LIMIT) state = "holding";
  }
  return state;
}

function ok(condition, message) {
  if (!condition) throw new Error(message);
}

// Normal region remains a hold.
ok(outcome([{ type: "move", slip: 80 }]) === "holding", "normal hold failed");

// Grace-zone excursion followed by recovery must survive.
ok(outcome([
  { type: "move", slip: HOLD_LIMIT + 1 },
  { type: "move", slip: 139 },
  { type: "move", slip: 121 }
]) === "holding", "grace recovery tears hold");

// Exact upper boundary is still grace, not cancellation.
ok(outcome([{ type: "move", slip: GRACE_LIMIT }]) === "holding", "140px must remain grace");

// Beyond the grace zone cancels as slip.
ok(outcome([{ type: "move", slip: GRACE_LIMIT + 1 }]) === "slip", ">140px must cancel as slip");

// Explicit release remains a distinct outcome even after grace movement.
ok(outcome([
  { type: "move", slip: 134 },
  { type: "release" }
]) === "release", "explicit release changed");

// System cancellation remains distinct from slip.
ok(outcome([
  { type: "move", slip: 130 },
  { type: "system-cancel" }
]) === "system", "touchcancel became slip");

console.log("touch-hysteresis probe: PASS");
