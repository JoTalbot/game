var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var CURRENT = 2, MAX_REPLAY = 128;
  function finite(v, fallback) { return Number.isFinite(Number(v)) ? Number(v) : fallback; }
  function clone(v) { try { return JSON.parse(JSON.stringify(v)); } catch (e) { return null; } }
  function ensure(game) {
    if (!game || !game.world) return null;
    var bridge = G.V9V25Bridge; if (!bridge || !bridge.ensure) return null;
    var s = bridge.ensure(game); if (!s) return null;
    if (!Array.isArray(s.replay)) s.replay = [];
    if (s.schema == null) s.schema = CURRENT;
    return s;
  }
  function record(game, action) {
    var s = ensure(game); if (!s || !action) return false;
    var item = {tick:finite(s.world&&s.world.tick,0),type:String(action.type||""),region:String(action.region||"r0"),amount:finite(action.amount,0)};
    var last=s.replay.length?s.replay[s.replay.length-1]:null;
    if(last&&last.type===item.type&&last.region===item.region&&last.amount===item.amount)return false;
    s.replay.push(item); if(s.replay.length>MAX_REPLAY)s.replay.splice(0,s.replay.length-MAX_REPLAY); return true;
  }
  function pack(game) {
    var s=ensure(game); if(!s||!s.world)return null;
    var packed={schema:CURRENT,seed:finite(s.seed,1)|0,clock:finite(s.clock,0),lastAction:clone(s.lastAction),lastRegion:String(s.lastRegion||"r0"),stepCount:finite(s.stepCount,0),eventCount:finite(s.eventCount,0),replay:clone(s.replay||[]).slice(-MAX_REPLAY),world:s.world.snapshot?s.world.snapshot():null};
    if(G.V20Hardening&&G.V20Hardening.sanitizeSave){var checked=G.V20Hardening.sanitizeSave({v9v25:packed});if(!checked.ok)return null;packed=checked.data.v9v25;}
    return packed;
  }
  function migrate(raw) {
    if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
    var src=raw,schema=finite(src.schema,1); if(schema<2){src=clone(src)||{};src.schema=2;src.replay=Array.isArray(src.replay)?src.replay.slice(-MAX_REPLAY):[];src.lastRegion=src.lastRegion||"r0";src.stepCount=finite(src.stepCount,0);src.eventCount=finite(src.eventCount,src.world&&Array.isArray(src.world.history)?src.world.history.length:0);} if(schema>CURRENT)return null; return src;
  }
  function restore(game,raw){
    var s=ensure(game),data=migrate(raw); if(!s||!data)return false;
    if(G.V20Hardening&&G.V20Hardening.validateSave){var checked=G.V20Hardening.validateSave({v9v25:data});if(!checked.ok){G.V20Hardening.markCorrupt(s.world);G.V20Hardening.recover(s.world,checked.reason);return false;}}
    s.schema=CURRENT;s.seed=finite(data.seed,s.seed)|0;s.clock=Math.max(0,finite(data.clock,0));s.lastAction=clone(data.lastAction);s.lastRegion=String(data.lastRegion||"r0");s.stepCount=Math.max(0,Math.floor(finite(data.stepCount,0)));s.eventCount=Math.max(0,Math.floor(finite(data.eventCount,0)));s.replay=Array.isArray(data.replay)?data.replay.slice(-MAX_REPLAY):[];
    if(G.V9World&&data.world){try{s.world=G.V9World.LivingWorld.fromSnapshot(data.world);}catch(e){if(G.V20Hardening){G.V20Hardening.markCorrupt(s.world);G.V20Hardening.recover(s.world,"world-snapshot");}return false;}}
    return !!s.world;
  }
  function deterministic(seed,actions){if(!G.V9World)return null;var a=Array.isArray(actions)?actions:[];function run(){var w=G.V9World.create(seed|0);for(var i=0;i<a.length;i++)w.apply(a[i]);return JSON.stringify(w.snapshot());}var first=run(),second=run();return {equal:first===second,snapshot:first};}
  G.V9V25Persistence={ensure:ensure,record:record,pack:pack,migrate:migrate,restore:restore,deterministic:deterministic,currentSchema:CURRENT,maxReplay:MAX_REPLAY};
  if(G.Game&&G.Game.prototype&&!G.Game.prototype.__v9v25Persistence){
    var save=G.Game.prototype.save;G.Game.prototype.save=function(){var result=save.apply(this,arguments);try{var data=G.Save&&G.Save.load?G.Save.load():null,packed=G.V9V25Persistence.pack(this);if(data&&packed){data.v9v25=packed;G.Save.write(data);}}catch(e){}return result;};
    var load=G.Game.prototype.load;G.Game.prototype.load=function(){var result=load.apply(this,arguments);try{var data=G.Save&&G.Save.load?G.Save.load():null;if(data&&data.v9v25)G.V9V25Persistence.restore(this,data.v9v25);}catch(e){}return result;};
    G.Game.prototype.__v9v25Persistence=true;
  }
})(IGRA);
