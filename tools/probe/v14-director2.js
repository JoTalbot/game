"use strict";
var assert = require("assert"), fs = require("fs"), vm = require("vm");
var ctx = { console: console, Math: Math };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync("web/js/v14-director2.js", "utf8"), ctx, { filename: "v14-director2.js" });
var G = ctx.IGRA;
assert(G && G.V14Director2, "V14 Director layer loads");
var world = {};
var d = G.V14Director2.ensure(world);
assert.strictEqual(d.phase, "silence", "fresh director starts in silence");
var candidates = [
  { id: "echo", setup: 0.7, consequence: 0.2, rarity: 0.4 },
  { id: "awakening", setup: 0.6, consequence: 0.9, rarity: 0.8 },
  { id: "quiet", setup: 0.5, consequence: 0.1, rarity: 0.9 }
];
var first = G.V14Director2.choose(world, candidates);
assert(first && first.id === "awakening", "director selects highest-scoring novel consequence");
assert.strictEqual(world.directorV14.lastEvent, "awakening", "selected event is persisted");
var repeat = G.V14Director2.score(world, { id: "awakening", setup: 1, consequence: 1, rarity: 1 });
var novel = G.V14Director2.score(world, { id: "new-event", setup: 1, consequence: 1, rarity: 1 });
assert(novel > repeat, "novel event outranks immediate repetition");
var malformed = { directorV14: { phase: null, tension: "bad", lastEvent: null } };
var normalized = G.V14Director2.ensure(malformed);
assert.strictEqual(normalized.tension, 0, "malformed tension is safely normalized by scoring path");
console.log("V14 Director probe: PASS");
