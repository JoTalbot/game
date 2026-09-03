#!/usr/bin/env node
const fs=require("fs"),vm=require("vm"),path=require("path"),H=require("./harness");
const ROOT=path.resolve(__dirname,"../.."),html=fs.readFileSync(path.join(ROOT,"web/index.html"),"utf8");
const files=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1]).filter(Boolean);
global.location={search:"",href:"https://igra.local/",protocol:"https:"};global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};
const G=H.boot(),ok=(v,l)=>{if(!v)throw new Error(l);console.log(`✓ ${l}`)};
for(const src of files)vm.runInThisContext(fs.readFileSync(path.join(ROOT,"web",src),"utf8"),{filename:src});
ok(!!G.V7Climax,"third-act climax layer loaded");ok(files.includes("js/v7-climax.js"),"V7 climax module is in browser shell");
G.Save.clear();if(G.ReleaseSystems&&G.ReleaseSystems.reset)G.ReleaseSystems.reset();if(G.V6Body&&G.V6Body.reset)G.V6Body.reset();if(G.V7Climax&&G.V7Climax.reset)G.V7Climax.reset();
function setTrait(g,trait,value){for(const k of G.TRAITS)g.dna.values[k]=k===trait?value:0.02;}
const g=H.makeWorld(G,7000);g.state="play";const rs=G.ReleaseSystems.state();rs.act=3;rs.actTurns=0;rs.ecology=0.78;setTrait(g,"harmony",0.9);for(let i=0;i<240;i++){g.time=3000+i;G.ReleaseSystems.observe(1,g);}
const p=G.V7Climax.profile();ok(p.phase==="confrontation"||p.phase==="choice","third act advances through climax phases");ok(p.chain.length>=4,"climax builds a multi-step causal chain");ok(["flourishing","balanced","hollow","scarred"].includes(p.worldState),"climax derives a bounded world state");ok(p.chain.every(x=>x.causeId),"every climax step has provenance");
G.V7Climax.reset();G.ReleaseSystems.state().act=3;G.ReleaseSystems.state().ecology=0.82;setTrait(g,"empathy",0.9);G.V7Climax.observe(g);G.V7Climax.choose("release",g);const release=G.V7Climax.profile();ok(release.finale==="release"&&release.post===true,"release leaves a post-finale state");const releaseState=release.worldState;
G.V7Climax.reset();G.ReleaseSystems.state().act=3;G.ReleaseSystems.state().ecology=0.15;setTrait(g,"aggression",0.9);G.V7Climax.choose("become",g);const become=G.V7Climax.profile();ok(become.finale==="become"&&become.post===true,"become leaves a post-finale state");ok(releaseState!==become.worldState,"finale routes remain distinguishable");ok(g.finalWorldState===become.worldState&&g.postFinale===true,"active game receives post-finale context");
console.log("V7 climax probe passed");
