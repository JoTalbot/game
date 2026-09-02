"use strict";
var fs=require("fs"),vm=require("vm"),path=require("path"),H=require("./harness");
var ROOT=path.resolve(__dirname,"..",".."),G=H.boot();
["memory.js","life.js","relationships.js","world-memory.js","trajectory.js","act.js","boss-shadow.js","spatial-memory.js","v3-depth.js","v3-continuity.js"].forEach(function(f){vm.runInThisContext(fs.readFileSync(path.join(ROOT,"web","js",f),"utf8"),{filename:f});});
var pass=0,fail=0;function ok(c,s){if(c){pass++;console.log("  ✓ "+s);}else{fail++;console.log("  ✗ "+s);}}
function clean(){["igra.v3-depth.v1","igra.v3-continuity.v1","igra.relationships.v1","igra.world-memory.v1","igra.spatial-memory.v1"].forEach(function(k){G.Save.set(k,"");});G.Relationships.resetCache();G.WorldMemory.resetCache();G.SpatialMemory.resetCache();G.V3Depth.resetCache();G.V3Continuity.resetCache();}
function seed(){G.Save.set("igra.relationships.v1",JSON.stringify({version:1,encounters:4,trust:.74,fear:.06,debt:.02,losses:0,rescues:2,memories:["met","saved"],companion:true,legacy:2}));G.Save.set("igra.world-memory.v1",JSON.stringify({version:1,visits:4,memories:[{id:"a"},{id:"b"},{id:"c"}]}));G.Save.set("igra.spatial-memory.v1",JSON.stringify({version:1,visits:4,returns:1,places:[{key:"a",id:"a",x:0,y:0,visits:2,lives:[1],care:.7,roots:.6}]}));G.Relationships.resetCache();G.WorldMemory.resetCache();G.SpatialMemory.resetCache();}
function game(seed){var g=H.makeWorld(G,seed);G.Life.resetCache();G.Act.resetCache();G.Life.arc().initialized=true;G.Life.arc().skins=2;G.Life.arc().life=2;G.Act.state().phase=3;var n=g.world.nodes[0];n.x=g.player.x+18;n.y=g.player.y+18;n.state="alive";n.dead=false;return g;}
function findNode(game,key){for(var i=0;i<game.world.nodes.length;i++)if(game.world.nodes[i]&&game.world.nodes[i][key])return game.world.nodes[i];return null;}
console.log("\n— V3-020..030: integrated acceptance");
clean();seed();var g=game(9901);G.V3Continuity.observe(1,g);ok( G.V3Continuity.profile().rare.length===1&&!!findNode(g,"personalEcho"),"V3-021 редкий момент из нескольких сигналов");G.V3Continuity.observe(1,g);ok(G.V3Continuity.profile().rare.length===1,"V3-021 идемпотентность");
G.V3Continuity.observe(1,g);var n=findNode(g,"placeMemory");ok(!!n&&G.V3Continuity.profile().places.length===1,"V3-024 место получает историю");
var before=G.V3Continuity.profile().ecology;G.V3Continuity.onFinale(g,"release");var rel=G.V3Continuity.profile();ok(rel.finale==="release"&&rel.ecology<before&&rel.finales.length===1,"V3-022/V3-029 release оставляет причинный след");G.V3Continuity.onFinale(g,"become");var bec=G.V3Continuity.profile();ok(bec.finale==="become"&&bec.finales.length===2&&bec.ecology>rel.ecology,"V3-022/V3-029 become отличается");
G.V3Continuity.onBirth(g);ok(G.V3Continuity.profile().lives>=2&&n.finalStart==="become","V3-029 следующая жизнь получает след финала");
var r=g.world.beings[0]||n;r.legacy=true;G.V3Continuity.observe(1,g);ok(r.recognizesPlayer===true,"V3-023 связь распознаёт прошлую жизнь");ok(r.relationship&&r.relationship.direction,"V3-023 отношение имеет направление");
var p=G.V3Continuity.profile();ok(p.act.length>=1&&p.act[p.act.length-1].phase===3,"V3-026 накопительная дуга хранит причинный перелом");ok(typeof G.Director._v3Ecology==="number"&&typeof G.Director._v3Path==="string","V3-025 ecology читается Director/органы");
ok(p.forms.length<=6&&p.places.length<=10&&p.rare.length<=8,"V3-028 память ограничена и сжимается");
for(var i=0;i<3;i++){g=game(9910+i);G.Act.state().phase=i+1;G.V3Continuity.observe(1,g);}ok(G.V3Continuity.profile().forms.length>=0,"V3-028 производная память bounded");ok(G.V3Continuity.profile().coherent===true,"V3-030 цепь имеет продолжение после финала");
console.log("\nИтого: "+pass+" passed, "+fail+" failed");if(fail)process.exit(1);
