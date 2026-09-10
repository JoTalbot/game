var IGRA = IGRA || {};
(function(G){"use strict";
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function ensure(world){world.presentationV16=world.presentationV16||{detail:1,effects:0,floats:0,weather:"clear",season:"spring"};return world.presentationV16;}
function budget(world,detail,effects,floats){var s=ensure(world);s.detail=clamp(Number(detail)||s.detail,0.5,1);s.effects=Math.max(0,Math.min(24,Math.floor(effects==null?s.effects:effects)));s.floats=Math.max(0,Math.min(8,Math.floor(floats==null?s.floats:floats)));return s;}
G.V16Presentation={ensure:ensure,budget:budget};})(IGRA);
