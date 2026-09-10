var IGRA = IGRA || {};
(function(G){"use strict";
var MAX=128;
function ensure(world){world.hardeningV20=world.hardeningV20||{schema:1,checks:[],corruptions:0,migrations:0};return world.hardeningV20;}
function check(world,name,ok,detail){var s=ensure(world);s.checks.push({name:String(name),ok:!!ok,detail:String(detail||"")});if(s.checks.length>MAX)s.checks.shift();return s.checks[s.checks.length-1];}
function migrate(world,from,to){var s=ensure(world);if(Number(from)>Number(to))return false;s.migrations++;s.schema=Number(to)||s.schema;return true;}
function markCorrupt(world){var s=ensure(world);s.corruptions++;return s.corruptions;}
G.V20Hardening={ensure:ensure,check:check,migrate:migrate,markCorrupt:markCorrupt};})(IGRA);
