#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("assert");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const ctx={console,Math};vm.createContext(ctx);
["v23-rc2-gate.js","v24-limited-release.js","v25-production.js"].forEach(f=>vm.runInContext(read("web/js/"+f),ctx,{filename:f}));
const G=ctx.IGRA;
assert(G.V23RC2Gate&&G.V24LimitedRelease&&G.V25Production,"release gate modules loaded");
const base={probes:true,migration:true,replay:true,performance:true,accessibility:true,privacy:true,signing:true,android:true};
const rc2=G.V23RC2Gate.report(base); assert.strictEqual(rc2.ready,true,"V23 RC2 gate is ready");
const world={}; const v24=G.V24LimitedRelease.ensure(world); v24.enabled=true; v24.offline=true; v24.sessions=8; v24.recoveries=3; v24.repeatLives=2; v24.multiGeneration=2;
const limited=G.V24LimitedRelease.report(world); assert.strictEqual(limited.ready,true,"V24 limited release gate is ready");
const input={v23:rc2.ready,v24:limited.ready,save:true,migration:true,offline:true,performance:true,accessibility:true,privacy:true,signing:true,store:true,android:true,physicalAndroid:true,crashes:false,anr:false,saveFailures:false,criticalVisual:false,criticalTouch:false,secretLeak:false,networkRequired:false};
const production=G.V25Production.report(input); assert.strictEqual(production.ready,true,"V25 production gate is ready with explicit physical Android evidence");
assert.strictEqual(production.evidence.passed,12,"V25 evidence passes all required gates");
assert.strictEqual(production.missing.length,0,"production evidence has no missing gates"); assert.strictEqual(production.blockers.length,0,"production evidence has no blockers"); assert.strictEqual(production.evidence.androidMatrix,true); assert.strictEqual(production.evidence.physicalAndroidVerified,true);
const noPhysical=G.V25Production.report(Object.assign({},input,{physicalAndroid:false})); assert.strictEqual(noPhysical.ready,false,"production must block without physical Android evidence"); assert(noPhysical.missing.includes("physicalAndroid"));
for(const key of ["privacy","signing","store","android"]){const bad=Object.assign({},input,{[key]:false});const r=G.V25Production.report(bad);assert.strictEqual(r.ready,false,key+" gate must block production");assert(r.missing.includes(key));}
for(const key of ["crashes","anr","saveFailures","criticalVisual","criticalTouch","secretLeak","networkRequired"]){const bad=Object.assign({},input,{[key]:true});const r=G.V25Production.report(bad);assert.strictEqual(r.ready,false,key+" blocker must block production");assert(r.blockers.includes(key));}
console.log(JSON.stringify({schema:"evidence-v2",source:"synthetic-fixture",status:"fixture-ready",rc2:rc2.ready,limitedRelease:limited.ready,productionGateSimulation:production.ready,passed:production.evidence.passed,missing:production.missing,blockers:production.blockers,physicalAndroidVerifiedInFixture:production.evidence.physicalAndroidVerified,actualPhysicalAndroid:false,actualProduction:false}));
console.error("V23-V25 evidence aggregation probe: PASS (synthetic fixture; not physical acceptance)");
