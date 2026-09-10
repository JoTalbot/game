var IGRA = IGRA || {};
(function(G){"use strict";
function ensure(world){world.limitedReleaseV24=world.limitedReleaseV24||{enabled:false,crashes:0,anr:0,saveFailures:0,feedback:[]};return world.limitedReleaseV24;}
function gate(world){var s=ensure(world);return !!s.enabled&&s.crashes===0&&s.anr===0&&s.saveFailures===0;}
function feedback(world,kind,note){var s=ensure(world);s.feedback.push({kind:String(kind||"general"),note:String(note||"")});if(s.feedback.length>64)s.feedback.shift();return s.feedback[s.feedback.length-1];}
G.V24LimitedRelease={ensure:ensure,gate:gate,feedback:feedback};})(IGRA);
