var IGRA = IGRA || {};
(function(G){"use strict";
var MAX_SAMPLES=240;
function n(v,f){return Number.isFinite(Number(v))?Number(v):f;}
function ensure(world){world=world||{};world.optimizationV22=world.optimizationV22||{schema:4,frameBudget:16.7,simulationBudget:8,allocations:0,gcPressure:0,frameSamples:[],slowFrames:0,maxFrameMs:0,memorySamples:[],batterySamples:[],simSamples:[],regressions:0};var s=world.optimizationV22;if(!Array.isArray(s.frameSamples))s.frameSamples=[];if(!Array.isArray(s.memorySamples))s.memorySamples=[];if(!Array.isArray(s.batterySamples))s.batterySamples=[];if(!Array.isArray(s.simSamples))s.simSamples=[];return s;}
function push(a,x){a.push(x);if(a.length>MAX_SAMPLES)a.shift();}
function configure(world,frameBudget,simulationBudget){var s=ensure(world);s.frameBudget=Math.max(8,Math.min(33,n(frameBudget,16.7)));s.simulationBudget=Math.max(1,Math.min(32,Math.floor(n(simulationBudget,8))));return s;}
function sample(world,frameMs){var s=ensure(world),v=Math.max(0,n(frameMs,0)),slow=v>s.frameBudget;push(s.frameSamples,v);if(slow)s.slowFrames++;if(v>s.maxFrameMs)s.maxFrameMs=v;return {frameMs:v,slow:slow,budget:s.frameBudget};}
function simulation(world,ms){var s=ensure(world),v=Math.max(0,n(ms,0));push(s.simSamples,v);return {simulationMs:v,budget:s.simulationBudget,withinBudget:v<=s.simulationBudget};}
function memory(world,memoryMB){var s=ensure(world),v=Math.max(0,n(memoryMB,0));push(s.memorySamples,v);return v;}
function battery(world,level){var s=ensure(world),v=Math.max(0,Math.min(100,n(level,0)));push(s.batterySamples,v);return v;}
function allocation(world,count){var s=ensure(world);s.allocations=Math.max(0,n(s.allocations,0)+n(count,0));return s.allocations;}
function gc(world,pressure){var s=ensure(world);s.gcPressure=Math.max(0,n(pressure,0));return s.gcPressure;}
function percentile(a,p){if(!a.length)return 0;var b=a.slice().sort(function(x,y){return x-y;}),i=(b.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return lo===hi?b[lo]:b[lo]+(b[hi]-b[lo])*(i-lo);}
function resetSamples(world){var s=ensure(world);s.frameSamples=[];s.memorySamples=[];s.batterySamples=[];s.simSamples=[];s.slowFrames=0;s.maxFrameMs=0;return s;}
function compare(world,baseline){var s=ensure(world),b=baseline||{},current=report(world),delta=current.p95FrameMs-n(b.p95FrameMs,0),regressed=b.p95FrameMs>0&&delta>2;s.regressions+=regressed?1:0;return {regressed:regressed,deltaP95Ms:delta,current:current,baseline:b};}
function report(world){var s=ensure(world),a=s.frameSamples,sim=s.simSamples;return {samples:a.length,slowFrames:s.slowFrames,maxFrameMs:s.maxFrameMs,averageFrameMs:a.length?a.reduce(function(x,y){return x+y;},0)/a.length:0,p50FrameMs:percentile(a,.5),p95FrameMs:percentile(a,.95),p99FrameMs:percentile(a,.99),peakMemoryMB:s.memorySamples.length?Math.max.apply(null,s.memorySamples):0,averageSimulationMs:sim.length?sim.reduce(function(x,y){return x+y;},0)/sim.length:0,p95SimulationMs:percentile(sim,.95),withinBudget:s.slowFrames===0,regressions:s.regressions};}
G.V22Optimization={ensure:ensure,configure:configure,sample:sample,simulation:simulation,memory:memory,battery:battery,allocation:allocation,gc:gc,resetSamples:resetSamples,percentile:percentile,compare:compare,report:report};
})(IGRA);
