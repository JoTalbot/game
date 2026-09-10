var IGRA = IGRA || {};
(function(G){"use strict";
var MAX_SAMPLES=240;
function ensure(world){world=world||{};world.optimizationV22=world.optimizationV22||{schema:3,frameBudget:16.7,simulationBudget:8,allocations:0,gcPressure:0,frameSamples:[],slowFrames:0,maxFrameMs:0,memorySamples:[],batterySamples:[]};var s=world.optimizationV22;if(!Array.isArray(s.frameSamples))s.frameSamples=[];if(!Array.isArray(s.memorySamples))s.memorySamples=[];if(!Array.isArray(s.batterySamples))s.batterySamples=[];return s;}
function configure(world,frameBudget,simulationBudget){var s=ensure(world);s.frameBudget=Math.max(8,Math.min(33,Number(frameBudget)||16.7));s.simulationBudget=Math.max(1,Math.min(32,Math.floor(simulationBudget||8)));return s;}
function sample(world,frameMs){var s=ensure(world),n=Math.max(0,Number(frameMs)||0);s.frameSamples.push(n);if(s.frameSamples.length>MAX_SAMPLES)s.frameSamples.shift();if(n>s.frameBudget)s.slowFrames++;if(n>s.maxFrameMs)s.maxFrameMs=n;return {frameMs:n,slow:n>s.frameBudget};}
function memory(world,memoryMB){var s=ensure(world),n=Math.max(0,Number(memoryMB)||0);s.memorySamples.push(n);if(s.memorySamples.length>MAX_SAMPLES)s.memorySamples.shift();return n;}
function allocation(world,count){var s=ensure(world);s.allocations=Math.max(0,(Number(s.allocations)||0)+(Number(count)||0));return s.allocations;}
function gc(world,pressure){var s=ensure(world);s.gcPressure=Math.max(0,Number(pressure)||0);return s.gcPressure;}
function percentile(a,p){if(!a.length)return 0;var b=a.slice().sort(function(x,y){return x-y;}),i=(b.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return lo===hi?b[lo]:b[lo]+(b[hi]-b[lo])*(i-lo);}
function resetSamples(world){var s=ensure(world);s.frameSamples=[];s.memorySamples=[];s.batterySamples=[];s.slowFrames=0;s.maxFrameMs=0;return s;}
function report(world){var s=ensure(world),a=s.frameSamples;return {samples:a.length,slowFrames:s.slowFrames,maxFrameMs:s.maxFrameMs,averageFrameMs:a.length?a.reduce(function(x,y){return x+y;},0)/a.length:0,p50FrameMs:percentile(a,.5),p95FrameMs:percentile(a,.95),p99FrameMs:percentile(a,.99),peakMemoryMB:s.memorySamples.length?Math.max.apply(null,s.memorySamples):0,withinBudget:s.slowFrames===0};}
G.V22Optimization={ensure:ensure,configure:configure,sample:sample,memory:memory,allocation:allocation,gc:gc,resetSamples:resetSamples,percentile:percentile,report:report};
})(IGRA);
