var IGRA = IGRA || {};
(function(G){"use strict";
function ensure(world){world.audioV17=world.audioV17||{ambience:0.5,motif:"silence",silence:0.2};return world.audioV17;}
function react(world,context){var s=ensure(world),c=context||{};s.ambience=Math.max(0,Math.min(1,Number(c.intensity==null?s.ambience:c.intensity)));s.motif=c.motif||s.motif;s.silence=Math.max(0,Math.min(1,Number(c.silence==null?s.silence:c.silence)));return s;}
G.V17AdaptiveAudio={ensure:ensure,react:react};})(IGRA);
