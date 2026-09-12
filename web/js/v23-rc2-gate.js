var IGRA = IGRA || {};
(function(G){"use strict";
var REQUIRED=["probes","migration","replay","performance","accessibility","privacy","signing","android"];
var BLOCKERS=["crashes","anr","saveFailures","criticalVisual","criticalTouch","secretLeak","networkRequired"];
function ok(v){return v===true;}
function evaluate(results){
  var r=results||{},missing=[],blockers=[];
  REQUIRED.forEach(function(k){if(!ok(r[k]))missing.push(k);});
  BLOCKERS.forEach(function(k){if(ok(r[k]))blockers.push(k);});
  return {ready:missing.length===0&&blockers.length===0,missing:missing,blockers:blockers,checked:REQUIRED.length};
}
function evidence(results){
  var r=results||{},e=evaluate(r);
  return {required:e.checked,passed:e.checked-e.missing.length,missing:e.missing.slice(),blockers:e.blockers.slice(),releaseCandidate:ok(r.releaseCandidate),androidMatrix:ok(r.android),performance:ok(r.performance)&&!ok(r.anr),saveIntegrity:ok(r.migration)&&!ok(r.saveFailures),privacyReviewed:ok(r.privacy),signingVerified:ok(r.signing)};
}
function report(results){
  var e=evaluate(results);
  return {status:e.ready?"rc2-ready":"blocked",ready:e.ready,missing:e.missing,blockers:e.blockers,checked:e.checked,evidence:evidence(results)};
}
function isComplete(results){return evaluate(results).ready;}
G.V23RC2Gate={required:REQUIRED,blockers:BLOCKERS,evaluate:evaluate,evidence:evidence,report:report,isComplete:isComplete};
})(IGRA);
