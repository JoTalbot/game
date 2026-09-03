"use strict";
var fs = require("fs");
var path = require("path");
var root = path.resolve(__dirname, "..", "..");
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }
function ok(v, m) { if (!v) { console.error("  ✗ " + m); process.exitCode = 1; } else console.log("  ✓ " + m); }
var html = read("web/index.html");
var sw = read("web/sw.js");
var density = read("web/js/v3-density.js");
var cap = read("web/js/v3-being-cap.js");
ok(html.indexOf("js/v3-density.js") >= 0, "density script is in the app shell");
ok(html.indexOf("js/v3-being-cap.js") >= 0, "being cap is in the app shell");
ok(density.indexOf("__v3033Density") >= 0, "density renderer guard is installed");
ok(cap.indexOf("__v3034BeingCap") >= 0, "being population guard is installed");
ok(sw.indexOf("v3-density.js") >= 0, "density script is cached");
ok(sw.indexOf("v3-being-cap.js") >= 0, "being cap is cached");
if (!process.exitCode) console.log("Dense release contract: PASS");
