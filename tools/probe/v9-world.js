#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
global.IGRA = {};
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'web/js/v9-world.js'), 'utf8'), { filename: 'v9-world.js' });

function ok(value, message) {
  if (!value) throw new Error(message);
}

ok(IGRA.V9World, 'V9 world layer loaded');
ok(IGRA.V9World.constants.maxHistory === 96, 'history bound is explicit');
ok(IGRA.V9World.constants.beatCooldown === 8, 'causal beat cooldown is explicit');

function run(seed, actions) {
  const world = IGRA.V9World.create(seed);
  for (const action of actions) world.observe(1, action);
  return world.snapshot();
}

const actions = [
  { type: 'visit', region: 'r0', amount: 1 },
  { type: 'care', region: 'r0', amount: 0.8 },
  { type: 'harm', region: 'r2', amount: 0.6 },
  { type: 'visit', region: 'r4', amount: 1 }
];

const a = run(123456, actions);
const b = run(123456, actions);
ok(JSON.stringify(a) === JSON.stringify(b), 'same seed/action history is deterministic');
ok(a.regions.length === 6, 'bounded region count');
ok(a.history.length <= 96, 'bounded history');
ok(a.events.length <= 48, 'bounded active events');
ok(a.regions[0].trace > 0, 'player visit leaves a trace');
ok(a.regions[0].familiarity > 0, 'visits create place familiarity');
ok(a.regions[0].care > 0, 'care is retained as local memory');
ok(a.regions[2].harm > 0, 'harm is retained as local memory');
ok(a.regions[2].fertility < b.regions[2].fertility || a.regions[2].pressure > 0, 'harm leaves an observable causal state');

const contrastCare = run(2468, Array.from({ length: 16 }, () => ({ type: 'care', region: 'r1', amount: 1 })));
const contrastHarm = run(2468, Array.from({ length: 16 }, () => ({ type: 'harm', region: 'r1', amount: 1 })));
ok(contrastCare.regions[1].care > contrastHarm.regions[1].care, 'contrasting profiles produce distinct place memory');
ok(contrastCare.regions[1].fertility > contrastHarm.regions[1].fertility, 'contrasting profiles produce distinct ecology');
ok(contrastCare.history.some(e => e.type === 'place:remembered-care'), 'sustained care creates a rare causal place beat');
ok(contrastHarm.history.some(e => e.type === 'place:scarred'), 'sustained harm creates a rare causal place beat');

const restored = IGRA.V9World.LivingWorld.fromSnapshot(a).snapshot();
ok(JSON.stringify(restored) === JSON.stringify(a), 'snapshot round-trip is stable');

const repeated = IGRA.V9World.create(99);
for (let i = 0; i < 80; i++) repeated.observe(1, { type: 'visit', region: 'r0', amount: 1 });
const repeatedBeats = repeated.snapshot().history.filter(e => e.type === 'place:familiar').length;
ok(repeatedBeats > 0, 'repeated visits eventually create a place beat');
ok(repeatedBeats <= 10, 'repeated identical actions do not spam place beats');

const pressure = IGRA.V9World.create(11);
for (let i = 0; i < 40; i++) pressure.observe(1, { type: 'harm', region: 'r0', amount: 1 });
const pressureState = pressure.snapshot();
ok(pressureState.regions[1].pressure > 0, 'cross-region pressure propagates');

const longRun = IGRA.V9World.create(7);
for (let i = 0; i < 400; i++) longRun.observe(1, i % 20 === 0 ? { type: 'visit', region: 'r1', amount: 1 } : null);
const longState = longRun.snapshot();
ok(longState.history.length <= 96, 'long simulation remains bounded');
ok(longState.events.length <= 48, 'long simulation events remain bounded');

console.log('V9 world probe passed');
