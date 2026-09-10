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
ok(a.regions[0].fertility > 0, 'care affects ecology');
ok(a.regions[2].fertility < b.regions[2].fertility || a.regions[2].pressure > 0, 'harm leaves an observable causal state');

const restored = IGRA.V9World.LivingWorld.fromSnapshot(a).snapshot();
ok(JSON.stringify(restored) === JSON.stringify(a), 'snapshot round-trip is stable');

const longRun = IGRA.V9World.create(7);
for (let i = 0; i < 400; i++) longRun.observe(1, i % 20 === 0 ? { type: 'visit', region: 'r1', amount: 1 } : null);
const longState = longRun.snapshot();
ok(longState.history.length <= 96, 'long simulation remains bounded');
ok(longState.events.length <= 48, 'long simulation events remain bounded');

console.log('V9 world probe passed');
