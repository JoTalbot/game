var IGRA = IGRA || {};
(function(G){"use strict";
function ensure(world){world.optimizationV22=world.optimizationV22||{frameBudget:16.7,simulationBudget:8,allocations:0,gcPressure:0};return world.optimizationV22;}
function configure(world,frameBudget,simulationBudget){var s=ensure(world);s.frameBudget=Math.max(8,Math.min(33,Number(frameBudget)||16.7));s.simulationBudget=Math.max(1,Math.min(32,Math.floor(simulationBudget||8)));return s;}
G.V22Optimization={ensure:ensure,configure:configure};})(IGRA);
