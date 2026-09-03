#!/usr/bin/env node
const fs=require("fs"),vm=require("vm"),path=require("path"),H=require("./harness");
const ROOT=path.resolve(__dirname,"../.."),html=fs.readFileSync(path.join(ROOT,"web/index.html"),"utf8");
const files=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1]).filter(Boolean);
global.location={search:"",href:"https://igra.local/",protocol:"https:"};global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};
const G=H.boot(),ok=(v,l)=>{if(!v)throw new Error(l);console.log(`✓ ${l}`)};
for(const src of files)vm.runInThisContext(fs.readFileSync(path.join(ROOT,"web",src),"utf8"),{filename:src});
ok(!!G.V6BodyVisual,"V6 body visual layer loaded");
ok(files.includes("js/v6-body-visual.js"),"V6 body visual module is in browser shell");
const g=H.makeWorld(G,7000);g.state="play";g.bodyIdentity={form:"scarred",depth:3,scars:6,signature:"aggression:scar:3"};
const a=G.V6BodyVisual.appearance(g);ok(a.depth===3&&a.scars===6,"body appearance reads bounded history");ok(a.base==="scar"&&a.arc>0,"body form changes visual signature");
let arcs=0,lines=0;const ctx={save(){},restore(){},beginPath(){},arc(){arcs++},moveTo(){},lineTo(){lines++},stroke(){},set globalCompositeOperation(v){},set strokeStyle(v){},set lineWidth(v){}};
G.Renderer.worldToScreen=function(){return{x:0,y:0}};G.V6BodyVisual.draw(ctx,g);ok(arcs>=2,"deep body history creates visible layered marks");ok(lines>=1,"scars create visible directional marks");
console.log("V6 body visual probe passed");
