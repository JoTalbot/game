#!/usr/bin/env node
const fs=require("fs"),vm=require("vm"),path=require("path"),H=require("./harness");
const ROOT=path.resolve(__dirname,"../.."),html=fs.readFileSync(path.join(ROOT,"web/index.html"),"utf8");
const files=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1]).filter(Boolean);
global.location={search:"",href:"https://igra.local/",protocol:"https:"};global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};
const G=H.boot(),ok=(v,l)=>{if(!v)throw new Error(l);console.log(`✓ ${l}`)};
for(const src of files)vm.runInThisContext(fs.readFileSync(path.join(ROOT,"web",src),"utf8"),{filename:src});
ok(!!G.V8Lineage,"V8 lineage layer loaded");ok(files.includes("js/v8-lineage.js"),"V8 lineage module is in browser shell");
G.Save.clear();G.V8Lineage.reset();if(G.ReleaseSystems&&G.ReleaseSystems.reset)G.ReleaseSystems.reset();if(G.V7Climax&&G.V7Climax.reset)G.V7Climax.reset();if(G.V6Body&&G.V6Body.reset)G.V6Body.reset();
function setTrait(g,trait,value){for(const k of G.TRAITS)g.dna.values[k]=k===trait?value:0.02;}
const g=H.makeWorld(G,7000);g.state="play";const rs=G.ReleaseSystems.state();rs.act=3;rs.ecology=0.82;setTrait(g,"empathy",0.9);G.V6Body.observe(g);G.V7Climax.choose("release",g);G.V8Lineage.capture("release",g);
let p=G.V8Lineage.profile();ok(p.generation===1&&p.lives===1&&p.finale==="release","release creates first lineage generation");ok(p.inherited.route&&p.inherited.trait==="empathy","release carries active trajectory into lineage");ok(p.inherited.fingerprint,"lineage has deterministic fingerprint");
const next=H.makeWorld(G,7000);next.state="play";ok(G.V8Lineage.apply(next),"lineage applies to next active life");ok(next.lineageContext&&next.lineageContext.generation===1,"next life receives generation context");ok(next.player.lineageTrait==="empathy","next life receives inherited trait context");ok(next.world.lineageTrace===p.inherited.fingerprint,"next world receives physical lineage trace");
const fp=p.inherited.fingerprint;G.V8Lineage.reset();G.V8Lineage.capture("release",g);const again=G.V8Lineage.profile();ok(again.generation===1&&again.inherited.fingerprint===fp,"same controlled release scenario is deterministic");
G.V8Lineage.reset();G.ReleaseSystems.state().act=3;G.ReleaseSystems.state().ecology=0.15;setTrait(g,"aggression",0.9);G.V6Body.reset();G.V6Body.observe(g);G.V7Climax.reset();G.V7Climax.choose("become",g);G.V8Lineage.capture("become",g);const become=G.V8Lineage.profile();ok(become.finale==="become"&&become.origin==="voice","become creates a voice-origin lineage");ok(become.inherited.trait==="aggression","become carries the active aggression trajectory");ok(become.inherited.worldState!==p.inherited.worldState,"release and become produce different inherited world states");
G.Save.set("igra.v8-lineage.v1",JSON.stringify({version:999,generation:999,lives:999,history:"bad",inherited:null}));G.V8Lineage._s=null;const migrated=G.V8Lineage.profile();ok(migrated.version===1&&migrated.generation===999&&migrated.history.length===0,"lineage migration keeps numeric history bounded and repairs arrays");ok(migrated.inherited&&typeof migrated.inherited==="object","lineage migration restores inherited envelope");
console.log("V8 lineage probe passed");
