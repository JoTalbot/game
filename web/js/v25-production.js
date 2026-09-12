var IGRA = IGRA || {};
(function(G){"use strict";
var REQUIRED=["v23","v24","save","migration","offline","performance","accessibility","privacy","signing","store"];
var BLOCKERS=["crashes","anr","saveFailures","criticalVisual","criticalTouch","secretLeak","networkRequired"];
function bool(v){return v===true;}
function evaluate(results){var r=results||{},missing=[],blockers=[];REQUIRED.forEach(function(k){if(!bool(r[k]))missing.push(k);});BLOCKERS.forEach(function(k){if(r[k]===true)blockers.push(k);});return{ready:missing.length===0&&blockers.length===0,missing:missing,blockers:blockers,checked:REQUIRED.length};}
function evidence(results){var r=results||{},e=evaluate(r);return{required:e.checked,passed:e.checked-e.missing.length,missing:e.missing.slice(),blockers:e.blockers.slice(),releaseCandidate:bool(r.v23),limitedRelease:bool(r.v24),stability:bool(r.performance)&&r.crashes!==true&&r.anr!==true,saveIntegrity:bool(r.save)&&bool(r.migration),privacyReviewed:bool(r.privacy),storeReady:bool(r.store)};}
function report(results){var e=evaluate(results),x=evidence(results);return{status:e.ready?"production-ready":"blocked",ready:e.ready,missing:e.missing,blockers:e.blockers,checked:e.checked,evidence:x};}
function isComplete(results){return evaluate(results).ready;}
G.V25Production={required:REQUIRED,blockers:BLOCKERS,evaluate:evaluate,evidence:evidence,report:report,isComplete:isComplete};
})(IGRA);
