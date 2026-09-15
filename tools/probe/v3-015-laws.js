"use strict";
var assert = require("assert");
var H = require("./harness");
var G = H.boot();
function law(id, ru, en, lasts) { var x={id:id,ru:ru,en:en,hint:"hint",enHint:"hint"}; if(lasts)x.lasts=lasts; return x; }
function apply(game, x) { G.Organs.applyLaw(game,{x:game.player.x,y:game.player.y,law:x,life:1}); }
var game=H.makeWorld(G,15015), w=game.world;
w.laws=[]; w.active=[]; w.cracks=[]; w.wounds=[]; w.blooms=[]; w.nodes=[]; w.beings=[];
w.anchorCap=3; w.tideFrozen=0; w.invertMove=0;
apply(game,law("tideSleep","прилив спит","the tide sleeps",32));
assert.strictEqual(w.tideFrozen,32,"tideSleep freezes oblivion for 32s");
assert.strictEqual(w.active[0].left,32,"tideSleep exposes active duration");
w.wounds.push({x:0,y:0,dead:false});
apply(game,law("woundsSing","раны поют","wounds sing"));
assert.strictEqual(w.wounds[0].dead,true,"woundsSing consumes the wound");
assert.strictEqual(w.nodes.length,1,"woundsSing creates a tone node");
assert.strictEqual(w.nodes[0].kind,"tone","woundsSing creates the tone organ");
apply(game,law("invert","тяжесть наоборот","weight inverted",11));
assert.strictEqual(w.invertMove,11,"invert changes movement for 11s");
assert.strictEqual(w.active.some(function(x){return x.id==="invert"&&x.left===11;}),true,"invert exposes active duration");
var b={x:0,y:0,named:true,temper:"shy",trueName:"Almost",name:"Almost"}; w.beings.push(b);
apply(game,law("rename","имена лгут","names lie"));
assert.notStrictEqual(b.temper,"shy","rename changes a being's nature");
assert.notStrictEqual(b.name,"Almost","rename changes the visible name");
var beforeCap=w.anchorCap; apply(game,law("moreAnchors","якорей больше","more anchors"));
assert.strictEqual(w.anchorCap,beforeCap+1,"moreAnchors increases capacity");
w.anchorCap=7; var crackCount=w.cracks.length; G.Organs.spawnCrack(w,10,10);
assert.strictEqual(w.cracks.length,crackCount+1,"crack still spawns at max anchor cap");
assert.notStrictEqual(w.cracks[w.cracks.length-1].law.id,"moreAnchors","moreAnchors is filtered at cap 7");
w.nodes=[{x:1,y:1,state:"alive",kind:"relic"},{x:2,y:2,state:"alive",kind:"thorn"},{x:3,y:3,state:"dead",kind:"echo"}];
var oldKinds=w.nodes.filter(function(n){return n.state==="alive";}).map(function(n){return n.kind;}).join(",");
apply(game,law("swapKinds","берег путает органы","the shore confuses organs"));
var newKinds=w.nodes.filter(function(n){return n.state==="alive";}).map(function(n){return n.kind;}).join(",");
assert.notStrictEqual(newKinds,oldKinds,"swapKinds changes live organ kinds");
assert.strictEqual(w.nodes[2].kind,"echo","swapKinds leaves dead nodes untouched");
w.blooms=[]; apply(game,law("bloom","сад без разрешения","a garden unasked"));
assert.strictEqual(w.blooms.length,6,"bloom creates six visible flowers");
w.nodes=[{x:game.player.x+10,y:game.player.y+10,care:0,state:"alive"},{x:game.player.x+500,y:game.player.y+500,care:0,state:"alive"}];
apply(game,law("reveal","туман признаётся","the fog confesses"));
assert.strictEqual(w.nodes[0].care,1,"reveal exposes a nearby node");
assert.strictEqual(w.nodes[1].care,0,"reveal does not expose distant nodes");
apply(game,law("stillHold","тишина держит","silence holds",23));
assert.strictEqual(w.active.some(function(x){return x.id==="stillHold"&&x.left===23;}),true,"stillHold exposes active duration");
// World law history is intentionally bounded to eight entries by organs.js.
// All nine laws above are exercised; the retained history must be bounded
// and keep the most recent expressive laws with stable bilingual metadata.
assert.strictEqual(w.laws.length,8,"law history stays within its bounded cap");
assert.strictEqual(w.laws[0].id,"woundsSing","bounded history drops the oldest law");
assert.strictEqual(w.laws[7].id,"stillHold","bounded history keeps the newest law");
assert(w.laws.every(function(x){return x.id&&x.ru&&x.en&&x.t!=null;}),"law history keeps stable ids and bilingual labels");
console.log("V3-015 expressive world laws probe: PASS");
