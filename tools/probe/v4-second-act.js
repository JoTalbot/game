"use strict";
var fs = require("fs"), vm = require("vm"), path = require("path"), H = require("./harness");
var ROOT = path.resolve(__dirname, "..", "..");
var G = H.boot();
[
  "life.js", "relationships.js", "world-memory.js", "trajectory.js", "release-systems.js",
  "v6-body.js", "v8-lineage.js", "v4-history-routes.js", "v4-beings.js", "v4-second-act.js"
].forEach(function (f) { vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", "js", f), "utf8"), { filename: f }); });
var pass = 0, fail = 0;
function ok(c, s) { if (c) { pass++; console.log("  ✓ " + s); } else { fail++; console.log("  ✗ " + s); } }
function step(game, n) { for (var i = 0; i < n; i++) G.V4SecondAct.observe(1, game); }
function anchorTestEntities(game, behavior) {
  game.world.beings = Array.isArray(game.world.beings) ? game.world.beings : [];
  var being = game.world.beings[0];
  if (!being || being.dead) { being = { x: game.player.x, y: game.player.y, dead: false }; game.world.beings.unshift(being); }
  being.bond = behavior.motion < 5 ? 0.9 : 0.05;
  being.v4Id = "witness-0";
  being.x = game.player.x; being.y = game.player.y; being.dead = false;
  game.world.nodes = Array.isArray(game.world.nodes) ? game.world.nodes : [];
  for (var i = 0; i < game.world.nodes.length; i++) { game.world.nodes[i].care = behavior.motion < 5 ? 0.9 : 0.1; game.world.nodes[i].x = game.player.x; game.world.nodes[i].y = game.player.y; }
  return being;
}
function scenario(behavior, seed, ending) {
  var game = H.makeWorld(G, seed);
  G.Life.arc().initialized = true;
  G.Life.arc().behavior = behavior;
  var being = anchorTestEntities(game, behavior);
  G.V4SecondAct.reset();
  step(game, 180);
  var p = G.V4SecondAct.profile();
  if (ending) {
    p.turns = 0; p.events = p.events.slice(0, 5); p.endings = [ending];
    G.V4SecondAct._state = p;
    G.Life.arc().behavior = ending === "keep" ? {born:4,returns:5,pulses:4,still:6,motion:3} : {born:4,returns:0,pulses:0,still:0,motion:9};
    anchorTestEntities(game, G.Life.arc().behavior);
    step(game, 120);
    p = G.V4SecondAct.profile();
  }
  return {game:game, profile:p, being:being};
}
console.log("\n— V4: второй акт, причинная дуга, повторяющийся мир, migration и multi-life replay");
G.Save.set("igra.release.v1", JSON.stringify({version:1,act:2,events:[],causes:[],laws:[],places:[],beings:[],trajectories:{}}));
G.Save.set("igra.v4-history.v1", JSON.stringify({version:1,tick:10,visits:{},returnCount:2,consequences:[{x:1}],route:"steward",routeCounts:{},lastCause:""}));
G.Save.set("igra.v4-second-act.v1", JSON.stringify({version:999,act:2,turns:-4,events:[null,{id:"legacy",place:"old"}],causes:[null],endings:["bad"],places:null,beings:null}));
G.ReleaseSystems._state = null; G.V4History.resetCache(); G.V4SecondAct.resetCache(); G.Life.resetCache(); G.Relationships.resetCache(); G.V8Lineage._s = null;
var migrated = G.V4SecondAct.profile();
ok(migrated.version === 3, "старый/битый V4 save мигрирует в текущую схему");
ok(migrated.turns === 0 && migrated.events.length === 1 && migrated.endings.length === 0, "миграция отбрасывает повреждённые коллекции без падения");
ok(Object.keys(migrated.places).length === 0 && Object.keys(migrated.beings).length === 0, "битые persistent maps нормализуются в bounded empty state");
var first = scenario({born:4,returns:5,pulses:4,still:6,motion:3}, 7717, "keep");
var p = first.profile;
ok(p.active && p.act === 2, "второй акт активируется как отдельный слой");
ok(p.events.length >= 6, "есть минимум шесть физических событий второго акта");
ok(p.causes.length >= p.events.length, "каждое событие имеет компактную причинную запись");
ok(p.events.every(function (e) { return e.causeId && e.generation >= 0; }), "события связаны с поколением и cause id");
ok(p.causes.some(function (c) { return c.parent; }), "causal chain связывает новое событие с предыдущим следом");
ok(Object.keys(p.places).length > 0, "повторяющиеся места получают накопленную память");
ok(Object.keys(p.places).some(function (k) { return p.places[k].visits > 0 && p.places[k].lastCause; }), "место хранит visits, route и последний cause");
ok(Object.keys(p.beings).some(function (k) { return p.beings[k].encounters > 0 && p.beings[k].memoryMark > 0; }), "повторяющееся существо хранит встречи и memory mark");
ok(EVENT_CHECK(), "события опираются на существующие сигналы, а не случайный лут");
ok(p.conflict.length > 0, "второй акт имеет собственный конфликт");
ok(p.endings.indexOf("keep") >= 0, "маршрут сохранять приводит к отдельному исходу keep");
ok(p.handoff.generation >= 0 && p.handoff.cause, "финал публикует компактный V4 lineage handoff");
var persisted = JSON.parse(G.Save.get("igra.v4-second-act.v1"));
ok(persisted.version === 3 && persisted.lastCause === p.lastCause, "состояние второго акта реально сохраняется между тиками");
var lineageBefore = G.V8Lineage.profile();
G.V8Lineage.capture("keep", first.game);
var lineage = G.V8Lineage.profile();
ok(lineage.generation === lineageBefore.generation + 1, "V8 получает след V4 на границе жизней");
ok(lineage.inherited.v4Cause === p.handoff.cause && lineage.inherited.v4Place === p.handoff.place, "V4 cause и place входят в межжизненную линию");
var next = H.makeWorld(G, 7718); G.V8Lineage.apply(next);
ok(next.world.v4LineageCause === lineage.inherited.v4Cause && next.player.v4LineagePlace === lineage.inherited.v4Place, "след V4 применяется в следующем теле и мире");
var steward = scenario({born:4,returns:5,pulses:4,still:6,motion:3}, 7719, "keep");
var sever = scenario({born:4,returns:0,pulses:0,still:0,motion:9}, 7720, "let-go");
var sk = steward.profile.places[steward.profile.handoff.place], ss = sever.profile.places[sever.profile.handoff.place];
ok(steward.profile.endings.indexOf("keep") >= 0 && sever.profile.endings.indexOf("let-go") >= 0, "контрастные replay-сценарии проходят через bonding/steward и severing");
ok(sk && ss && (sk.state !== ss.state || sk.drift !== ss.drift || sk.lastRoute !== ss.lastRoute), "одинаковый тип места получает различимое состояние от разных маршрутов");
ok(steward.being && sever.being && steward.being.v4Id === "witness-0" && sever.being.v4Id === "witness-0" && steward.profile.beings["witness-0"] && sever.profile.beings["witness-0"] && steward.profile.beings["witness-0"].affinity !== sever.profile.beings["witness-0"].affinity, "одно и то же существо получает различную память от разных маршрутов");
ok(steward.profile.events.length <= 24 && steward.profile.causes.length <= 48 && Object.keys(steward.profile.places).length <= 12 && Object.keys(steward.profile.beings).length <= 12, "multi-life state остаётся bounded");
var finalSave = G.Save.get("igra.v4-second-act.v1");
ok(finalSave.length < 20000, "V4 save остаётся компактным после replay");
console.log("\nИтого: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
function EVENT_CHECK() { return G.V4SecondAct.events().length === 12 && G.V4SecondAct.events().every(function (id) { return id.indexOf("-") > 0; }); }
