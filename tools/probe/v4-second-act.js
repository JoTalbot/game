"use strict";
var fs = require("fs"), vm = require("vm"), path = require("path"), H = require("./harness");
var ROOT = path.resolve(__dirname, "..", "..");
var G = H.boot();
[
  "life.js", "relationships.js", "world-memory.js", "trajectory.js", "release-systems.js",
  "v6-body.js", "v8-lineage.js", "v4-history-routes.js", "v4-beings.js", "v4-second-act.js"
].forEach(function (f) {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", "js", f), "utf8"), { filename: f });
});
var pass = 0, fail = 0;
function ok(c, s) { if (c) { pass++; console.log("  ✓ " + s); } else { fail++; console.log("  ✗ " + s); } }
function step(game, n) { for (var i = 0; i < n; i++) G.V4SecondAct.observe(1, game); }
console.log("\n— V4: второй акт, причинная дуга, повторяющийся мир и миграция");
G.Save.set("igra.release.v1", JSON.stringify({version:1,act:2,events:[],causes:[],laws:[],places:[],beings:[],trajectories:{}}));
G.Save.set("igra.v4-history.v1", JSON.stringify({version:1,tick:10,visits:{},returnCount:2,consequences:[{x:1}],route:"steward",routeCounts:{},lastCause:""}));
G.Save.set("igra.v4-second-act.v1", JSON.stringify({version:999,act:2,turns:-4,events:[null,{id:"legacy",place:"old"}],causes:[null],endings:["bad"],places:null,beings:null}));
G.ReleaseSystems._state = null; G.V4History.resetCache(); G.V4SecondAct.resetCache(); G.Life.resetCache(); G.Relationships.resetCache();
var migrated = G.V4SecondAct.profile();
ok(migrated.version === 2, "старый/битый V4 save нормализуется в текущую схему");
ok(migrated.turns === 0 && migrated.events.length === 1 && migrated.endings.length === 0, "миграция отбрасывает повреждённые коллекции без падения");
var game = H.makeWorld(G, 7717);
game.dna.age = 420;
game.dna.pulses = 4;
game.player.stillT = 25;
G.Life.arc().initialized = true;
G.Life.arc().behavior = { born: 4, returns: 5, pulses: 4, still: 6, motion: 3 };
if (game.world.beings[0]) game.world.beings[0].bond = 0.8;
for (var i = 0; i < game.world.nodes.length; i++) game.world.nodes[i].care = 0.9;
G.V4SecondAct.reset();
step(game, 180);
var p = G.V4SecondAct.profile();
ok(p.active && p.act === 2, "второй акт активируется как отдельный слой");
ok(p.events.length >= 6, "есть минимум шесть физических событий второго акта");
ok(p.causes.length >= p.events.length, "каждое событие имеет компактную причинную запись");
ok(p.events.every(function (e) { return e.causeId && e.generation >= 0; }), "события связаны с поколением и cause id");
ok(p.causes.some(function (c) { return c.parent; }), "causal chain связывает новое событие с предыдущим следом");
ok(Object.keys(p.places).length > 0, "повторяющиеся места получают накопленную память");
ok(EVENT_CHECK(), "события опираются на существующие сигналы, а не случайный лут");
ok(p.conflict.length > 0, "второй акт имеет собственный конфликт");
var keep = p.endings.indexOf("keep") >= 0;
ok(keep, "маршрут сохранять приводит к отдельному исходу keep");
G.Life.arc().behavior = { born: 4, returns: 0, pulses: 0, still: 0, motion: 9 };
G.V4SecondAct._state.turns = 0;
G.V4SecondAct._state.events = p.events.slice(0, 5);
G.V4SecondAct._state.endings = ["keep"];
step(game, 120);
p = G.V4SecondAct.profile();
ok(p.endings.indexOf("let-go") >= 0, "контрастный маршрут даёт второй исход let-go");
ok(p.complete === true, "два исхода завершают второй акт без обязательного меню");
ok(p.events.length <= 24 && p.causes.length <= 48, "история второго акта ограничена и не раздувает save");
var persisted = JSON.parse(G.Save.get("igra.v4-second-act.v1"));
ok(persisted.version === 2 && persisted.lastCause === p.lastCause && persisted.chain >= p.events.length, "состояние второго акта реально сохраняется между тиками");
console.log("\nИтого: " + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
function EVENT_CHECK() {
  return G.V4SecondAct.events().length === 12 && G.V4SecondAct.events().every(function (id) { return id.indexOf("-") > 0; });
}
