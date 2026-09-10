var IGRA = IGRA || {};
(function(G){"use strict";
var MAX=128, SCHEMA=2;
function ensure(world){
  world=world||{};
  var s=world.hardeningV20=world.hardeningV20||{schema:SCHEMA,checks:[],corruptions:0,migrations:0,recoveries:0,lifecycle:{foreground:0,background:0},budgets:{frameMs:33,simulation:32,memoryMB:256}};
  s.schema=Number(s.schema)||1;
  if(!Array.isArray(s.checks))s.checks=[];
  if(!s.lifecycle)s.lifecycle={foreground:0,background:0};
  if(!s.budgets)s.budgets={frameMs:33,simulation:32,memoryMB:256};
  if(typeof s.recoveries!=="number")s.recoveries=0;
  return s;
}
function check(world,name,ok,detail){var s=ensure(world);s.checks.push({name:String(name),ok:!!ok,detail:String(detail||"")});if(s.checks.length>MAX)s.checks.shift();return s.checks[s.checks.length-1];}
function migrate(world,from,to){var s=ensure(world),f=Number(from),t=Number(to);if(!isFinite(f)||!isFinite(t)||f>t)return false;s.migrations++;s.schema=Math.max(s.schema,t,SCHEMA);return true;}
function markCorrupt(world){var s=ensure(world);s.corruptions++;return s.corruptions;}
function recover(world,reason){var s=ensure(world);s.recoveries++;check(world,"recovery",true,reason||"corrupt-or-invalid-state");return s.recoveries;}
function lifecycle(world,state){var s=ensure(world),k=String(state)==="background"?"background":"foreground";s.lifecycle[k]++;return s.lifecycle[k];}
function budget(world,frameMs,simulation,memoryMB){var s=ensure(world);if(frameMs!=null)s.budgets.frameMs=Math.max(8,Math.min(33,Number(frameMs)||33));if(simulation!=null)s.budgets.simulation=Math.max(1,Math.min(32,Math.floor(Number(simulation)||32)));if(memoryMB!=null)s.budgets.memoryMB=Math.max(64,Math.min(512,Number(memoryMB)||256));return s.budgets;}
function validateSave(data){
  if(!data||typeof data!=="object"||Array.isArray(data))return {ok:false,reason:"not-object"};
  if(data.v9v25!=null&&(typeof data.v9v25!=="object"||Array.isArray(data.v9v25)))return {ok:false,reason:"v9v25-not-object"};
  return {ok:true,reason:"valid"};
}
function boundedArray(value,max){return Array.isArray(value)?value.filter(function(x){return x!=null;}).slice(-max):[];}
G.V20Hardening={ensure:ensure,check:check,migrate:migrate,markCorrupt:markCorrupt,recover:recover,lifecycle:lifecycle,budget:budget,validateSave:validateSave,boundedArray:boundedArray,schema:SCHEMA};
})(IGRA);
