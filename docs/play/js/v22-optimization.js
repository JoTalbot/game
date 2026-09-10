var IGRA = IGRA || {};
(function(G){"use strict";
function ensure(world){world=world||{};world.optimizationV22=world.optimizationV22||{schema:2,frameBudget:16.7,simulationBudget:8,allocations:0,gcPressure:0,frameSamples:[],slowFrames:0,maxFrameMs:0};var s=world.optimizationV22;if(!Array.isArray(s.frameSamples))s.frameSamples=[];return s;}
function configure(world,frameBudget,simulationBudget){var s=ensure(world);s.frameBudget=Math.max(8,Math.min(33,Number(frameBudget)||16.7));s.simulationBudget=Math.max(1,Math.min(32,Math.floor(simulationBudget||8)));return s;}
function sample(world,frameMs){var s=ensure(world),n=Math.max(0,Number(frameMs)||0);s.frameSamples.push(n);if(s.frameSamples.length>120)s.frameSamples.shift();if(n>s.frameBudget)s.slowFrames++;if(n>s.maxFrameMs)s.maxFrameMs=n;return {frameMs:n,slow:n>s.frameBudget};}
function resetSamples(world){var s=ensure(world);s.frameSamples=[];s.slowFrames=0;s.maxFrameMs=0;return s;}
function report(world){var s=ensure(world),a=s.frameSamples;return {samples:a.length,slowFrames:s.slowFrames,maxFrameMs:s.maxFrameMs,averageFrameMs:a.length?a.reduce(function(x,y){return x+y;},0)/a.length:0,withinBudget:s.slowFrames===0};}
G.V22Optimization={ensure:ensure,configure:configure,sample:sample,resetSamples:resetSamples,report:report};
})(IGRA);
