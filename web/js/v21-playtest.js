var IGRA = IGRA || {};
(function(G){"use strict";
function ensure(world){world.playtestV21=world.playtestV21||{sessions:[],metrics:{touches:0,events:0,returns:0,abandons:0}};return world.playtestV21;}
function session(world,minutes,mode){var s=ensure(world);var x={minutes:Math.max(0,Number(minutes)||0),mode:String(mode||"standard"),completed:false};s.sessions.push(x);if(s.sessions.length>32)s.sessions.shift();return x;}
function metric(world,key,amount){var s=ensure(world),n=Number(amount)||1;s.metrics[key]=(s.metrics[key]||0)+n;return s.metrics[key];}
G.V21Playtest={ensure:ensure,session:session,metric:metric};})(IGRA);
