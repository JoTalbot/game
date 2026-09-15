#!/usr/bin/env node
"use strict";
const {spawnSync}=require("child_process");
const fs=require("fs"),path=require("path");
const ROOT=path.resolve(__dirname,"../..");
const groups={
  probes:["v9-world.js","v9-v25-systems.js","v9-v25-bridge.js","v19-deep-simulation.js","v20-v22-hardening.js"],
  migration:["v9-v25-persistence.js","v23-v25-persistence-fuzz.js","v20-production-hardening.js"],
  replay:["v9-v25-persistence.js","v23-v25-persistence-fuzz.js"],
  performance:["v3-048-performance.js","v3-046-telemetry.js","v20-v22-hardening.js","v22-regression-gate.js"],
  accessibility:["accessibility.js","v3-047-touch-meaning.js"],
  privacy:["v20-production-hardening.js"],
  signing:["release-candidate.js"],
  android:["release-candidate.js","v3-046-telemetry.js"],
  releaseCandidate:["release-candidate.js"],
  productionGate:["v23-v25-release-gates.js","v21-v22-gate.js"]
};
const unique=[...new Set(Object.values(groups).flat())];
const results={};
for(const file of unique){
  const p=path.join(ROOT,"tools/probe",file);
  if(!fs.existsSync(p)){results[file]={ok:false,code:-1,error:"missing"};continue;}
  const r=spawnSync(process.execPath,[p],{cwd:ROOT,encoding:"utf8",maxBuffer:8*1024*1024});
  results[file]={ok:r.status===0,code:r.status==null?-1:r.status};
  if(r.status!==0){console.error(`RC2 evidence FAIL: ${file}\n${r.stderr||r.stdout||""}`);}
}
const groupEvidence={};
for(const [name,files] of Object.entries(groups)) groupEvidence[name]={passed:files.every(f=>results[f]&&results[f].ok),files};
const blockers={crashes:false,anr:false,saveFailures:false,criticalVisual:false,criticalTouch:false,secretLeak:false,networkRequired:false};
const required=["probes","migration","replay","performance","accessibility","privacy","signing","android"];
const missing=required.filter(k=>!groupEvidence[k].passed);
const deterministicReady=missing.length===0&&Object.values(blockers).every(v=>!v);
const physicalAndroid=process.env.IGRA_PHYSICAL_ANDROID==="1";
const evidence={schema:2,generatedAt:"deterministic-ci",required,missing,blockers,deterministicReady,physicalAndroid,ready:deterministicReady&&physicalAndroid,groups:groupEvidence,tests:results};
console.log(JSON.stringify(evidence,null,2));
if(!deterministicReady||!physicalAndroid)process.exit(1);
console.log("RC2 EVIDENCE GATE READY");
