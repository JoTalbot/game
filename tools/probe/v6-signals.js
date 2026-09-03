#!/usr/bin/env node
const fs=require("fs"),vm=require("vm"),path=require("path"),H=require("./harness");
const ROOT=path.resolve(__dirname,"../.."),html=fs.readFileSync(path.join(ROOT,"web/index.html"),"utf8");
const files=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1]).filter(Boolean);
global.location={search:"",href:"https://igra.local/",protocol:"https:"};global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};
const G=H.boot(),ok=(v,l)=>{if(!v)throw new Error(l);console.log(`✓ ${l}`)};
for(const src of files)vm.runInThisContext(fs.readFileSync(path.join(ROOT,"web",src),"utf8"),{filename:src});
ok(!!G.V6Signals,"V6 presentation signal layer loaded");ok(files.includes("js/v6-signals.js"),"V6 signal module is in browser shell");
G.Save.clear();if(G.ReleaseSystems&&G.ReleaseSystems.reset)G.ReleaseSystems.reset();if(G.V6Body&&G.V6Body.reset)G.V6Body.reset();
function game(trait,depth,scars){const g=H.makeWorld(G,7000);g.state="play";if(G.ReleaseSystems&&G.ReleaseSystems.state)G.ReleaseSystems.state().act=Math.max(1,depth+1);for(const k of G.TRAITS)g.dna.set(k,k===trait?0.95:0.01);g.bodyIdentity={form:{harmony:"tender",empathy:"echo",contemplation:"still",curiosity:"seeking",aggression:"scar",chaos:"shard"}[trait],depth,scars};return g;}
const low=G.V6Signals.profile(game("harmony",0,0));const deep=G.V6Signals.profile(game("aggression",3,4));
ok(low.arc<deep.arc&&low.depth<deep.depth,"body depth and form alter presentation signal");ok(deep.scars===4&&deep.form==="scar","scar signal preserves body history");
const ctx=H.ctxStub();ctx.canvas={width:800,height:600};const g=game("curiosity",2,2);G.Renderer.drawPlayer(ctx,g.cam,g,1,[180,210,240]);ok(ctx.calls.filter(x=>x==="arc").length>0,"body presentation adds player arcs");
G.Save.set("igra.v6-body.v1",JSON.stringify({version:999,depth:999,scars:9999,form:{},last:[],habits:[1,"harmony",2],signatures:[null,"curiosity:seeking:3",3]}));G.V6Body._s=null;const migrated=G.V6Body.profile();ok(migrated.version===1&&migrated.depth===3&&migrated.scars===100,"V6 save migration clamps legacy state");ok(migrated.habits.length===1&&migrated.signatures.length===1,"V6 save migration removes invalid history entries");
console.log("V6 signals and migration probe passed");
