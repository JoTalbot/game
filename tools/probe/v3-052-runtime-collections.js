// V3-052 regression: persisted collections may contain null/partial entries.
// The old world update path dereferenced blooms[bi].age without checking.
"use strict";
var fs = require("fs");
var vm = require("vm");
var path = require("path");
var H = require("./harness");
var G = H.boot();
var guard = fs.readFileSync(path.join(__dirname, "..", "..", "web", "js", "v3-being-cap.js"), "utf8");
vm.runInThisContext(guard, { filename: "v3-being-cap.js" });

function ok(cond, text) {
  if (!cond) { console.error("  ✗ " + text); process.exitCode = 1; return; }
  console.log("  ✓ " + text);
}

var game = H.makeWorld(G, 52052);
var w = game.world;
w.blooms = [null, undefined, { x: 1, y: 2 }, { x: 3, y: 4, age: NaN, phase: null }];
w.beings = [null, undefined, new G.Being(20, 20, "empathy")];
w.wounds = [null, { x: 0, y: 0, age: null, phase: null }];
w.cracks = [undefined, { x: 0, y: 0, phase: null }];

var updateErr = null;
try { H.step(G, game, 1 / 60, null, 0); } catch (e) { updateErr = e; }
ok(!updateErr, "malformed collections do not crash World.update" + (updateErr ? ": " + updateErr.message : ""));
ok(w.blooms.length === 2 && w.blooms.every(function (b) { return b && Number.isFinite(b.age) && Number.isFinite(b.phase); }), "bloom entries are compacted and normalized");
ok(w.beings.length === 1 && w.beings[0] && Number.isFinite(w.beings[0].age), "being entries remain valid");

var drawErr = null;
try { G.Renderer.draw(H.ctxStub(), game); } catch (e) { drawErr = e; }
ok(!drawErr, "malformed collections do not crash Renderer.draw" + (drawErr ? ": " + drawErr.message : ""));

console.log(process.exitCode ? "V3-052 runtime collection probe: FAIL" : "V3-052 runtime collection probe: PASS");
