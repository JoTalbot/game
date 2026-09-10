var IGRA = IGRA || {};
(function(G){"use strict";
var MAX_SESSIONS=32, DURATIONS=[5,15,30,60,120];
function ensure(world){world=world||{};world.playtestV21=world.playtestV21||{schema:3,sessions:[],metrics:{touches:0,events:0,returns:0,abandons:0,minutes:0,repeatLives:0,multiGeneration:0,offline:0,recoveries:0},milestones:{5:false,15:false,30:false,60:false,120:false},gates:{understood:false,confusion:false,boredom:false,memorable:false,ignoredSystems:false,repeatedBehavior:false,abandonment:false,performance:false}};var s=world.playtestV21;if(!Array.isArray(s.sessions))s.sessions=[];if(!s.metrics||typeof s.metrics!=="object")s.metrics={};if(!s.milestones||typeof s.milestones!=="object")s.milestones={};if(!s.gates||typeof s.gates!=="object")s.gates={};return s;}
function session(world,minutes,mode){var s=ensure(world),m=Math.max(0,Number(minutes)||0),x={minutes:m,mode:String(mode||"standard"),completed:false,startedAtStep:(world&&world.v9v25)?(Number(world.v9v25.stepCount)||0):0};s.sessions.push(x);if(s.sessions.length>MAX_SESSIONS)s.sessions.shift();s.metrics.minutes=(Number(s.metrics.minutes)||0)+m;DURATIONS.forEach(function(n){if(m>=n)s.milestones[n]=true;});return x;}
function complete(world,x,reason){if(!x)return false;x.completed=true;if(reason)x.endReason=String(reason);return true;}
function metric(world,key,amount){var s=ensure(world),n=Number(amount)||1;s.metrics[key]=(Number(s.metrics[key])||0)+n;return s.metrics[key];}
function gate(world,key,value){var s=ensure(world);s.gates[String(key)]=!!value;return s.gates[String(key)];}
function observe(world,results){var s=ensure(world),r=results||{};Object.keys(s.gates).forEach(function(k){if(Object.prototype.hasOwnProperty.call(r,k))s.gates[k]=!!r[k];});Object.keys(r).forEach(function(k){if(["5m","15m","30m","60m","120m","repeat-life","multi-generation","offline","recovery"].indexOf(k)>=0&&r[k]===true)metric(world,k,1);});return s.gates;}
function suite(world,results){var s=ensure(world),r=results||{};observe(world,r);var required=["5m","15m","30m","60m","120m","repeat-life","multi-generation","offline","recovery"];return {ready:required.every(function(k){return r[k]===true;}),required:required,metrics:s.metrics,gates:s.gates};}
G.V21Playtest={ensure:ensure,session:session,complete:complete,metric:metric,gate:gate,observe:observe,suite:suite};
})(IGRA);
