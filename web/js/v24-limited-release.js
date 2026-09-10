var IGRA = IGRA || {};
(function(G){"use strict";
function ensure(world){
  world.limitedReleaseV24=world.limitedReleaseV24||{enabled:false,crashes:0,anr:0,saveFailures:0,feedback:[]};
  var s=world.limitedReleaseV24;
  s.enabled=!!s.enabled;
  s.crashes=Math.max(0,Number(s.crashes)||0);
  s.anr=Math.max(0,Number(s.anr)||0);
  s.saveFailures=Math.max(0,Number(s.saveFailures)||0);
  if(!Array.isArray(s.feedback))s.feedback=[];
  if(s.feedback.length>64)s.feedback=s.feedback.slice(-64);
  return s;
}
function gate(world){var s=ensure(world);return !!s.enabled&&s.crashes===0&&s.anr===0&&s.saveFailures===0;}
function feedback(world,kind,note){
  var s=ensure(world),entry={kind:String(kind||"general"),note:String(note||"")};
  s.feedback.push(entry);if(s.feedback.length>64)s.feedback.shift();return entry;
}
function disable(world){var s=ensure(world);s.enabled=false;return s;}
G.V24LimitedRelease={ensure:ensure,gate:gate,feedback:feedback,disable:disable};
})(IGRA);
