#!/usr/bin/env node
const fs = require("fs"), vm = require("vm"), path = require("path"), H = require("./harness");
const ROOT = path.resolve(__dirname, "../..");
const html = fs.readFileSync(path.join(ROOT, "web/index.html"), "utf8");
const files = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m => m[1]).filter(Boolean);
global.location = { search: "", href: "https://igra.local/", protocol: "https:" };
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};
const G = H.boot();
const ok = (v, label) => { if (!v) throw new Error(label); console.log(`✓ ${label}`); };
for (const src of files) vm.runInThisContext(fs.readFileSync(path.join(ROOT, "web", src), "utf8"), { filename: src });
ok(!!G.V5World, "V5 world layer loaded");
ok(files.includes("js/v5-world.js"), "V5 world module is in browser shell");
G.Save.clear();
if (G.ReleaseSystems && G.ReleaseSystems.reset) G.ReleaseSystems.reset();
G.V5World.reset();
const game = H.makeWorld(G, 5501);
game.state = "play";
game.time = 2400;
game.world.meta = 3;
game.world.discovered = 10;
for (let i = 0; i < game.world.nodes.length; i++) { game.world.nodes[i].care = i % 2 ? 0.9 : 0.2; game.world.nodes[i].dead = i === game.world.nodes.length - 1; }
for (let i = 0; i < 240; i++) { game.time = 2400 + i; G.V5World.observe(1, game); }
const s = G.V5World.profile();
ok(s.tick === 240, "V5 observer advances deterministically");
ok(s.season > 0, "seasonal state changes over time");
ok(s.ecology >= 0 && s.ecology <= 1, "ecology remains bounded");
ok(Object.keys(s.places).length >= 3, "historical place feedback is retained");
ok(Object.keys(s.beings).length >= 3, "recurring-being feedback is retained");
ok(s.branches.length >= 2, "world state creates distinct future branches");
ok(s.events.length <= 24, "V5 event history is bounded");
ok(s.branches.length <= 12, "V5 branch history is bounded");
console.log("V5 world probe passed");
