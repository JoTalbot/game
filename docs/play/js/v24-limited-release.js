var IGRA = IGRA || {};
(function(G){"use strict";
var MAX_FEEDBACK=64;
function num(v,f){return Number.isFinite(Number(v))?Number(v):f;}
function ensure(world){
  world=world||{};
  world.limitedReleaseV24=world.limitedReleaseV24||{schema:2,enabled:false,crashes:0,anr:0,saveFailures:0,feedback:[],sessions:0,offline:false,recoveries:0,repeatLives:0,multiGeneration:0};
  var s=world.limitedReleaseV24;
  s.schema=2;s.enabled=!!s.enabled;
  s.crashes=Math.max(0,num(s.crashes,0));s.anr=Math.max(0,num(s.anr,0));s.saveFailures=Math.max(0,num(s.saveFailures,0));
  s.sessions=Math.max(0,Math.floor(num(s.sessions,0)));s.recoveries=Math.max(0,Math.floor(num(s.recoveries,0)));
  s.repeatLives=Math.max(0,Math.floor(num(s.repeatLives,0)));s.multiGeneration=Math.max(0,Math.floor(num(s.multiGeneration,0)));
  s.offline=!!s.offline;if(!Array.isArray(s.feedback))s.feedback=[];if(s.feedback.length>MAX_FEEDBACK)s.feedback=s.feedback.slice(-MAX_FEEDBACK);
  return s;
}
function gate(world){var s=ensure(world);return !!s.enabled&&s.crashes===0&&s.anr===0&&s.saveFailures===0;}
function feedback(world,kind,note){var s=ensure(world),entry={kind:String(kind||"general"),note:String(note||"")};s.feedback.push(entry);if(s.feedback.length>MAX_FEEDBACK)s.feedback.shift();return entry;}
function metric(world,key,amount){var s=ensure(world),k=String(key||""),v=Math.max(0,num(amount,1));s[k]=Math.max(0,num(s[k],0)+v);return s[k];}
function evidence(world){var s=ensure(world);return{enabled:s.enabled,stable:s.crashes===0&&s.anr===0&&s.saveFailures===0,crashes:s.crashes,anr:s.anr,saveFailures:s.saveFailures,sessions:s.sessions,offline:s.offline,recoveries:s.recoveries,repeatLives:s.repeatLives,multiGeneration:s.multiGeneration,feedbackCount:s.feedback.length,feedbackBounded:s.feedback.length<=MAX_FEEDBACK};}
function report(world){var e=evidence(world);return{status:e.enabled&&e.stable?"limited-release-ready":"blocked",ready:e.enabled&&e.stable,evidence:e};}
function disable(world){var s=ensure(world);s.enabled=false;return s;}
G.V24LimitedRelease={ensure:ensure,gate:gate,feedback:feedback,metric:metric,evidence:evidence,report:report,disable:disable};
})(IGRA);
