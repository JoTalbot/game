"use strict";
var fs = require("fs"), vm = require("vm"), path = require("path"), H = require("./harness");
var ROOT = path.resolve(__dirname, "..", "..");
var G = H.boot();
["memory.js", "life.js", "relationships.js", "world-memory.js", "trajectory.js", "act.js", "boss-shadow.js", "spatial-memory.js", "v3-depth.js"].forEach(function (f) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", "js", f), "utf8"), { filename: f }); });
var pass=0,fail=0;
function ok(c,s){if(c){pass++;console.log("  ✓ "+s);}else{fail++;console.log("  ✗ "+s);}}
function clean(){
  G.Save.set("igra.v3-depth.v1",JSON.stringify({version:1,rare:[],places:[],ecology:0,act:0,lives:0,finale:"",finaleCount:0,lastSignature:"",lastLife:-1,lastPlaceId:"",lastPlaceLife:-1}));
  G.Save.set("igra.relationships.v1",JSON.stringify({version:1,encounters:0,trust:0,fear:0,debt:0,losses:0,rescues:0,memories:[],companion:false,legacy:0}));
  G.Save.set("igra.world-memory.v1",JSON.stringify({version:1,visits:0,memories:[]}));
  G.Save.set("igra.spatial-memory.v1",JSON.stringify({version:1,visits:0,places:[]}));
  G.Relationships.resetCache();G.WorldMemory.resetCache();G.SpatialMemory.resetCache();G.V3Depth.resetCache();
}
function seedSignals(){
  G.Save.set("igra.relationships.v1",JSON.stringify({version:1,encounters:3,trust:0.72,fear:0.08,debt:0.05,losses:1,rescues:1,memories:["a"],companion:true,legacy:1}));
  G.Save.set("igra.world-memory.v1",JSON.stringify({version:1,visits:3,memories:[{id:"a"},{id:"b"}]}));
  G.Save.set("igra.spatial-memory.v1",JSON.stringify({version:1,visits:3,places:[{id:"a"},{id:"b"}]}));
  G.Relationships.resetCache();G.WorldMemory.resetCache();G.SpatialMemory.resetCache();G.V3Depth.resetCache();
}
console.log("\n— V3-021..030: deep continuity");
clean();seedSignals();
var game=H.makeWorld(G,8810);G.Life.resetCache();G.Act.resetCache();G.Life.arc().initialized=true;G.Life.arc().skins=1;G.Life.arc().life=1;G.Act.state().phase=3;
var node=game.world.nodes[0];node.x=game.player.x+20;node.y=game.player.y+20;node.state="alive";node.dead=false;
G.V3Depth.observe(1,game);ok(G.V3Depth.profile().rare.length===1&&node.personalEcho===true,"V3-021 создаёт персональный редкий след из нескольких систем");G.V3Depth.observe(1,game);ok(G.V3Depth.profile().rare.length===1,"V3-021 не спамит одинаковым моментом");
clean();seedSignals();game=H.makeWorld(G,8811);node=game.world.nodes[0];node.x=game.player.x+20;node.y=game.player.y+20;node.state="alive";node.dead=false;G.Life.resetCache();G.Act.resetCache();G.Life.arc().initialized=true;G.Life.arc().life=1;G.Act.state().phase=2;G.V3Depth.observe(1,game);G.V3Depth.observe(1,game);var p=G.V3Depth.profile();ok(p.places.length===1&&p.places[0].visits===1,"V3-024 одно посещение места не считается каждый кадр");ok(node.placeMemory===true,"V3-024 материализует историю места в самом берегу");
clean();game=H.makeWorld(G,8812);G.V3Depth.onFinale(game,"release");var ar=G.V3Depth.profile();ok(ar.finale==="release"&&ar.finaleCount===1&&ar.ecology<0,"V3-022/V3-029 сохраняют след release");G.V3Depth.onFinale(game,"become");var ab=G.V3Depth.profile();ok(ab.finale==="become"&&ab.finaleCount===2&&ab.ecology>0,"V3-022/V3-029 различают become и release");G.V3Depth.resetCache();ok(G.V3Depth.profile().finale==="become"&&G.V3Depth.profile().finaleCount===2,"финальный след переживает перезагрузку состояния");var before=G.V3Depth.profile().ecology;G.V3Depth.onBirth(game);ok(G.V3Depth.profile().lives>=2&&G.V3Depth.profile().ecology>before,"V3-022 продолжает историю после новой жизни");
var sigA=G.V3Depth.signature(game);game.dna.get=function(k){return k==="harmony"?0.99:0.01;};var sigB=G.V3Depth.signature(game);ok(sigA!==sigB,"V3-027 разные жизненные пути получают разные сигнатуры");ok(G.V3Depth.profile().act>=1,"V3-026 сохраняет накопительную дугу акта");ok(G.V3Depth.profile().rare.length<=12&&G.V3Depth.profile().places.length<=10,"V3-028 ограничивает долгую память");ok(typeof G.V3Depth.profile().ecology==="number","V3-025 экологический след хранится как причинное состояние");ok(G.V3Depth.profile().finale==="become","V3-030 оставляет единый результат первого акта");
console.log("\nИтого: "+pass+" passed, "+fail+" failed");if(fail)process.exit(1);
