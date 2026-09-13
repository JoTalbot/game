"use strict";
var H=require("./harness");
var fs=require("fs"),vm=require("vm"),path=require("path");
var G=H.boot();
vm.runInThisContext(fs.readFileSync(path.join(__dirname,"../../web/js/v22-optimization.js"),"utf8"),{filename:"v22-optimization.js"});
var w={};
var s=G.V22Optimization.configure(w,16.7,8);
function ok(c,m){if(!c){console.error("✗ "+m);process.exitCode=1;}else console.log("✓ "+m);}

// Deterministic synthetic acceptance fixture. This is deliberately independent
// of wall-clock/device noise: it protects the regression contract itself.
var fixture=[12.1,13.0,13.8,14.2,15.0,15.4,15.8,16.0,16.2,16.4];
fixture.forEach(function(ms){G.V22Optimization.sample(w,ms);});
var report=G.V22Optimization.report(w);
ok(report.samples===fixture.length,"в отчёте сохранены все fixture samples");
ok(report.p95FrameMs<=16.7,"p95 frame укладывается в 16.7 ms");
ok(report.slowFrames===0,"fixture не содержит slow frames");
ok(report.withinBudget===true,"frame budget gate PASS");

// Baseline is intentionally >2 ms faster than the fixture p95 so the
// regression branch is exercised deterministically, rather than merely
// asserting a true value against an incompatible baseline.
var baseline={p95FrameMs:14.0};
var comparison=G.V22Optimization.compare(w,baseline);
ok(comparison.regressed===true,"регрессия >2 ms корректно обнаруживается");
ok(comparison.deltaP95Ms>2,"delta p95 корректно вычисляется");

// Low-end profile must retain the stricter 20 ms budget used by the live bridge.
var low={};
G.V22Optimization.configure(low,20,6);
ok(low.optimizationV22.frameBudget===20,"low-end frame budget = 20 ms");
ok(low.optimizationV22.simulationBudget===6,"low-end simulation budget = 6 ms");

console.log("V22 regression gate завершён");
