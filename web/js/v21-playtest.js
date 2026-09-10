var IGRA = IGRA || {};
(function(G){"use strict";
var MAX_SESSIONS=32;
function ensure(world){world=world||{};world.playtestV21=world.playtestV21||{schema:2,sessions:[],metrics:{touches:0,events:0,returns:0,abandons:0,minutes:0,repeatLives:0,multiGeneration:0,offline:0,recoveries:0},milestones:{5:false,15:false,30:false,60:false,120:false}};var s=world.playtestV21;if(!Array.isArray(s.sessions))s.sessions=[];if(!s.metrics)s.metrics={};if(!s.milestones)s.milestones={};return s;}
function session(world,minutes,mode){var s=ensure(world),m=Math.max(0,Number(minutes)||0),x={minutes:m,mode:String(mode||"standard"),completed:false,startedAtStep:world&&world.v9v25?Number(world.v9v25.stepCount)||0:0};s.sessions.push(x);if(s.sessions.length>MAX_SESSIONS)s.sessions.shift();s.metrics.minutes=(Number(s.metrics.minutes)||0)+m;[5,15,30,60,120].forEach(function(n){if(m>=n)s.milestones[n]=true;});return x;}
function complete(world,x,reason){if(!x)return false;x.completed=true;if(reason)x.endReason=String(reason);return true;}
function metric(world,key,amount){var s=ensure(world),n=Number(amount)||1;s.metrics[key]=(Number(s.metrics[key])||0)+n;return s.metrics[key];}
function suite(world,results){var s=ensure(world),r=results||{};Object.keys(r).forEach(function(k){if(r[k]===true)metric(world,k,1);});return {ready:["5m","15m","30m","60m","120m","repeat-life","multi-generation","offline","recovery"].every(function(k){return r[k]===true;}),metrics:s.metrics};}
G.V21Playtest={ensure:ensure,session:session,complete:complete,metric:metric,suite:suite};
})(IGRA);
