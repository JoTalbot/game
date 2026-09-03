#!/usr/bin/env node
const fs=require("fs"),vm=require("vm"),path=require("path"),H=require("./harness");
const ROOT=path.resolve(__dirname,"../.."),html=fs.readFileSync(path.join(ROOT,"web/index.html"),"utf8");
const files=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1]).filter(Boolean);
global.location={search:"",href:"https://igra.local/",protocol:"https:"};global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};
const G=H.boot(),ok=(v,l)=>{if(!v)throw new Error(l);console.log(`✓ ${l}`)};
for(const src of files)vm.runInThisContext(fs.readFileSync(path.join(ROOT,"web",src),"utf8"),{filename:src});
ok(!!G.SpawnDistribution,"spawn distribution layer loaded");ok(files.includes("js/spawn-distribution.js"),"spawn distribution is in browser shell");
const w=new G.World(424242);w.nodes=[];
for(let i=0;i<20;i++)w.spawnNode(0,0,"spark");
const live=w.nodes.filter(n=>!n.dead);
let min=Infinity,spread=0;
for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){
  const d=Math.hypot(live[i].x-live[j].x,live[i].y-live[j].y);
  min=Math.min(min,d);spread=Math.max(spread,Math.hypot(live[i].x,live[i].y),Math.hypot(live[j].x,live[j].y));
}
ok(live.length===20,"all requested procedural births are preserved");
ok(min>=G.SpawnDistribution.hardGap,"procedural births do not overlap into a visible pile");
ok(spread>=180,"repeated births at one source point fan out spatially");
const special=new G.World(424242);special.nodes=[];const s=special.spawnNode(40,50,"tone");const s2=special.spawnNode(40,50,"tone");ok(s.x===40&&s.y===50&&s2.x===40&&s2.y===50,"semantic non-spark anchors retain exact coordinates");
const w2=new G.World(424242);w2.nodes=[];for(let i=0;i<20;i++)w2.spawnNode(0,0,"spark");const coords=w2.nodes.map(n=>[n.x,n.y]);const w3=new G.World(424242);w3.nodes=[];for(let i=0;i<20;i++)w3.spawnNode(0,0,"spark");const coords2=w3.nodes.map(n=>[n.x,n.y]);ok(JSON.stringify(coords)===JSON.stringify(coords2),"spawn fan-out is deterministic for a fixed seed");
console.log("spawn distribution probe passed");
