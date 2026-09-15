var IGRA = IGRA || {};
(function(G){"use strict";
function clamp(v,fallback){var n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(1,n)):fallback;}
function ensure(world){if(!world||typeof world!=="object")return null;world.audioV17=world.audioV17&&typeof world.audioV17==="object"&&!Array.isArray(world.audioV17)?world.audioV17:{ambience:0.5,motif:"silence",silence:0.2};var s=world.audioV17;s.ambience=clamp(s.ambience,0.5);s.silence=clamp(s.silence,0.2);s.motif=String(s.motif==null?"silence":s.motif).slice(0,32);return s;}
function react(world,context){var s=ensure(world),c=context||{};if(!s)return null;s.ambience=clamp(c.intensity==null?s.ambience:c.intensity,s.ambience);s.motif=String(c.motif==null?s.motif:c.motif).slice(0,32);s.silence=clamp(c.silence==null?s.silence:c.silence,s.silence);return s;}
G.V17AdaptiveAudio={ensure:ensure,react:react};})(IGRA);
