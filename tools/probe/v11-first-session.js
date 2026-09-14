#!/usr/bin/env node
const fs=require("fs"),vm=require("vm"),path=require("path"),H=require("./harness");
const ROOT=path.resolve(__dirname,"../.."),source=fs.readFileSync(path.join(ROOT,"web/js/v11-first-session.js"),"utf8");
const G=H.boot(),ok=(v,l)=>{if(!v)throw new Error(l);console.log(`✓ ${l}`)};
const calls=[];
G.Lang={id:"ru"};
G.UI={hint(v){calls.push(v)}};
G.Game=function(){};
G.Game.prototype.startBirth=function(){this.state="birth"};
G.Game.prototype.onDown=function(){this.dna.taps++; this.player.gaze={};};
G.Game.prototype.onUp=function(){this.player.gaze=null};
const timers=[];
const fake={
  setTimeout(fn){timers.push(fn);return timers.length},
  clearTimeout(){},
  console
};
vm.runInNewContext(source,Object.assign({IGRA:G},fake));
const p=G.Game.prototype;
ok(!!G.FirstSession&&G.FirstSession.version===1,"V11 first-session layer exposes stable version");
ok(!!p.__v11FirstSession,"V11 layer installs without changing game construction");
const game={state:"title",dna:{taps:0,gazes:0},player:{gaze:null}};
p.startBirth.call(game);
ok(G.FirstSession.state().phase==="birth","birth starts first-session guidance");
p.onDown.call(game);
ok(G.FirstSession.state().phase==="gaze","first touch advances to gaze guidance");
p.onUp.call(game);
ok(G.FirstSession.state().phase==="done","first successful gaze completes guidance");
ok(calls.includes("коснись. задержись. или просто стой."),"Russian birth guidance is explicit");
console.log("v11 first-session probe passed");
