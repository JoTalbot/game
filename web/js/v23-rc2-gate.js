var IGRA = IGRA || {};
(function(G){"use strict";
var REQUIRED=["probes","migration","replay","performance","accessibility","privacy","signing","android"];
function evaluate(results){var r=results||{},missing=[];REQUIRED.forEach(function(k){if(r[k]!==true)missing.push(k);});return {ready:missing.length===0,missing:missing};}
G.V23RC2Gate={required:REQUIRED,evaluate:evaluate};})(IGRA);
