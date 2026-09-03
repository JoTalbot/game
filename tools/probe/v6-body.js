#!/usr/bin/env node
const fs=require("fs"),vm=require("vm"),path=require("path"),H=require("./harness");
const ROOT=path.resolve(__dirname,"../.."),html=fs.readFileSync(path.join(ROOT,"web/index.html"),"utf8");
const files=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1]).filter(Boolean);
global.location={search:"",href:"https://igra.local/",protocol:"https:"};global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};
const G=H.boot(),ok=(v,l)=>{if(!v)throw new Error(l);console.log(`✓ ${l}`)};
for(const src of files)vm.runInThisContext(fs.readFileSync(path.join(ROOT,"web",src),"utf8"),{filename:src});
ok(!!G.V6Body,"V6 body layer loaded");ok(files.includes("js/v6-body.js"),"V6 body module is in browser shell");
G.Save.clear();if(G.ReleaseSystems&&G.ReleaseSystems.reset)G.ReleaseSystems.reset();G.V6Body.reset();
function scenario(trait){const g=H.makeWorld(G,7000);g.state="play";if(G.ReleaseSystems&&G.ReleaseSystems.state)G.ReleaseSystems.state().act=3;const traits=G.TRAITS||["curiosity","aggression","contemplation","empathy","chaos","harmony"];for(const k of traits)g.dna.values[k]=k===trait?0.92:0.04;g.world.wounds=[];G.V6Body.observe(g);return g.bodyIdentity;}
const a=scenario("harmony"),b=scenario("aggression"),c=scenario("curiosity");
ok(a&&a.form!==b.form,"contrasting DNA produces different body forms");ok(b&&b.form.indexOf("scar")>=0||b.form==="scarred","aggression leaves a scar-oriented body identity");ok(c&&c.form!==a.form,"third trajectory produces a third body form");
const p=G.V6Body.profile();ok(p.depth>=2,"third-act body depth is reached");ok(p.habits.length<=9&&p.signatures.length<=9,"body history remains bounded");ok(p.scars>=0&&p.scars<=100,"scar state remains bounded");
const g=H.makeWorld(G,7000);g.state="play";if(G.ReleaseSystems&&G.ReleaseSystems.state)G.ReleaseSystems.state().act=3;for(const k of G.TRAITS)g.dna.values[k]=k==="empathy"?0.95:0.01;g.world.wounds=[{x:0,y:0}];G.V6Body.reset();G.V6Body.observe(g);ok(g.player.bodyForm&&g.player.bodyDepth>=2,"body identity is exposed to active gameplay context");
console.log("V6 body probe passed");
