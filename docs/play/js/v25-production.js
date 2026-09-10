var IGRA = IGRA || {};
(function(G){"use strict";
var REQUIRED=["v23","v24","save","migration","offline","performance","accessibility","privacy","signing","store"];
function evaluate(results){var r=results||{},missing=[];REQUIRED.forEach(function(k){if(r[k]!==true)missing.push(k);});return {ready:missing.length===0,missing:missing};}
function report(results){var e=evaluate(results);return {status:e.ready?"production-ready":"blocked",missing:e.missing};}
G.V25Production={required:REQUIRED,evaluate:evaluate,report:report};})(IGRA);
