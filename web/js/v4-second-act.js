var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var KEY = "igra.v4-second-act.v1";
  var VERSION = 2, MAX_EVENTS = 24, MAX_CAUSES = 48, MAX_ENDINGS = 4;
  var EVENTS = [
    { id:"tide-memory", need:["return","memory"], place:"glass", route:"steward" },
    { id:"echo-answer", need:["bond","return"], place:"echo", route:"bonding" },
    { id:"root-keeps", need:["care","ecology"], place:"root", route:"steward" },
    { id:"scar-remembers", need:["wound","body"], place:"scar", route:"severing" },
    { id:"witness-turns", need:["bond","memory"], place:"echo", route:"bonding" },
    { id:"garden-opens", need:["care","return"], place:"root", route:"steward" },
    { id:"distance-sings", need:["motion","avoid"], place:"glass", route:"severing" },
    { id:"old-wound", need:["wound","return"], place:"scar", route:"enduring" },
    { id:"deep-listens", need:["pulse","memory"], place:"deep", route:"watching" },
    { id:"shore-recognizes", need:["generation","memory"], place:"threshold", route:"bonding" },
    { id:"quiet-choice", need:["still","care"], place:"quiet", route:"steward" },
    { id:"broken-path", need:["sever","scar"], place:"scar", route:"severing" }
  ];
  function fresh(){return {version:VERSION,act:1,turns:0,conflict:"",conflictScore:0,events:[],causes:[],endings:[],route:"",active:false,complete:false,chain:0,lastCause:"",lastEvent:"",generation:0,places:{},beings:{}};}
  function load(){var s=fresh();try{var raw=G.Save&&G.Save.get?G.Save.get(KEY):null,p=raw?JSON.parse(raw):null;if(p&&typeof p==="object"){
    s.act=Math.max(1,Number(p.act)||1);s.turns=Math.max(0,Number(p.turns)||0);s.conflict=String(p.conflict||"");s.conflictScore=Number(p.conflictScore)||0;
    s.events=Array.isArray(p.events)?p.events.filter(function(v){return v&&typeof v==="object"&&v.id;}).slice(-MAX_EVENTS):[];
    s.causes=Array.isArray(p.causes)?p.causes.filter(function(v){return v&&typeof v==="object"&&v.id;}).slice(-MAX_CAUSES):[];
    s.endings=Array.isArray(p.endings)?p.endings.filter(function(v){return v==="keep"||v==="let-go";}).slice(-MAX_ENDINGS):[];
    s.route=String(p.route||"");s.active=!!p.active;s.complete=!!p.complete;s.chain=Math.max(0,Number(p.chain)||0);s.lastCause=String(p.lastCause||"");s.lastEvent=String(p.lastEvent||"");s.generation=Math.max(0,Number(p.generation)||0);
    s.places=p.places&&typeof p.places==="object"?p.places:{};s.beings=p.beings&&typeof p.beings==="object"?p.beings:{};
  }}catch(e){}s.version=VERSION;return s;}
  function save(s){try{if(G.Save&&G.Save.set)G.Save.set(KEY,JSON.stringify(s));}catch(e){}}
  function state(){if(!SecondAct._state)SecondAct._state=load();return SecondAct._state;}
  function signalMap(game){var dna=game.dna||{},p=game.player||{},w=game.world||{},life=G.Life&&G.Life.profile?G.Life.profile():null,beh=life&&life.behavior?life.behavior:{},rel=G.Relationships&&G.Relationships.profile?G.Relationships.profile():null,places=G.V4History&&G.V4History.profile?G.V4History.profile():null,memory=G.WorldMemory&&G.WorldMemory.profile?G.WorldMemory.profile():null,wounds=Array.isArray(w.wounds)?w.wounds.filter(function(x){return x&&!x.dead;}).length:0,care=0,scars=0,nodes=w.nodes||[];for(var i=0;i<nodes.length;i++){care+=Number(nodes[i].care)>0.65?1:0;scars+=Number(nodes[i].scars)>0?1:0;}return {return:Number(beh.returns||0)>0||Number(places&&places.returnCount||0)>0,memory:!!(memory&&Object.keys(memory).length)||!!(places&&places.consequences&&places.consequences.length),bond:!!(rel&&(Number(rel.trust||0)>0.35||Number(rel.bond||0)>0.35))||(w.beings||[]).some(function(b){return Number(b.bond||0)>0.35;}),care:care>0,ecology:Number(w.ecology||0.5)!==0.5||care>2,wound:wounds>0||scars>0,body:!!(G.V6Body&&G.V6Body.profile),motion:Number(beh.motion||0)>2,avoid:Number(beh.returns||0)<2&&Number(beh.motion||0)>3,pulse:Number(beh.pulses||0)>0||Number(dna.pulses||0)>0,generation:Number((G.V8Lineage&&G.V8Lineage.profile?G.V8Lineage.profile().generation:0)||0)>0,still:Number(beh.still||0)>Number(beh.motion||0),sever:Number(beh.motion||0)>Number(beh.returns||0)+2,scar:scars>0||wounds>0,playerX:Number(p.x)||0};}
  function route(sig){if(sig.sever||sig.avoid)return "severing";if(sig.bond&&sig.return)return "bonding";if(sig.care&&sig.return)return "steward";if(sig.still&&sig.care)return "watching";return "enduring";}
  function nearestNode(game){var nodes=(game.world&&game.world.nodes)||[],p=game.player,best=null,bd=900;for(var i=0;i<nodes.length;i++){var n=nodes[i];if(!n||n.dead)continue;var d=G.dist?G.dist(p.x,p.y,n.x,n.y):9999;if(d<bd){bd=d;best=n;}}return best;}
  function recurringBeing(game){var list=(game.world&&game.world.beings)||[],best=null,bd=720;for(var i=0;i<list.length;i++){var b=list[i];if(!b||b.dead)continue;var d=G.dist?G.dist(game.player.x,game.player.y,b.x,b.y):9999;if(d<bd){bd=d;best=b;}}return best;}
  function applyPhysical(game,e,r){var w=game.world,p=game.player,node=nearestNode(game),s=state();if(node){node.act2Trace=true;node.memory=true;node.historyV4=Math.min(1,Number(node.historyV4||0)+0.025);node.v4PlaceId=e.place;node.v4ChainId=e.causeId;if(r==="steward")node.care=Math.min(1,Number(node.care||0)+0.035);if(r==="bonding")node.bondTrace=true;if(r==="severing")node.scars=Number(node.scars||0)+1;s.places[e.place]=(Number(s.places[e.place])||0)+1;}var being=recurringBeing(game);if(being){var bid=String(being.v4Id||being.identity||"being");s.beings[bid]=(Number(s.beings[bid])||0)+1;being.v4SecondActChain=e.causeId;being.v4SecondActEvent=e.id;being.v4SecondActRoute=r;}if(w.scatter)w.scatter(p.x,p.y,r==="severing"?1:2,r==="bonding"?300:420);if(G.V4History&&G.V4History.state){var hs=G.V4History.state();hs.lastCause=e.causeId||hs.lastCause;}}
  function cause(s,type,source,target,data){var parent=s.lastCause||"root";var id="v4c-"+type+"-"+source+"-"+target+"-"+s.chain;s.chain++;s.causes.push({id:id,type:type,source:source,target:target,parent:parent,chain:s.chain,data:data||{}});while(s.causes.length>MAX_CAUSES)s.causes.shift();s.lastCause=id;return id;}
  function pickEvent(s,sig,r){var fallback=null;for(var i=0;i<EVENTS.length;i++){var e=EVENTS[i];if(s.events.some(function(x){return x.id===e.id;}))continue;var matched=e.need.filter(function(n){return !!sig[n];}).length;if(matched===e.need.length&&e.route===r)return e;if(!fallback&&matched>0&&e.route===r)fallback=e;}if(fallback)return fallback;for(var j=0;j<EVENTS.length;j++){var x=EVENTS[j];if(s.events.some(function(y){return y.id===x.id;}))continue;if(x.need.some(function(n){return !!sig[n];}))return x;}for(var k=0;k<EVENTS.length;k++){var any=EVENTS[k];if(!s.events.some(function(z){return z.id===any.id;}))return any;}return null;}
  function addEnding(s,game,r,ending){if(s.endings.indexOf(ending)>=0)return false;var ec=cause(s,"ending",r,ending,{events:s.events.length,conflict:s.conflict});s.endings.push(ending);applyPhysical(game,{id:"ending-"+ending,place:"threshold",causeId:ec},ending==="keep"?"steward":"severing");return true;}
  function observe(dt,game){if(!game||game.state!=="play")return;var s=state(),rs=G.ReleaseSystems&&G.ReleaseSystems.state?G.ReleaseSystems.state():null;if(rs&&rs.act<2)return;s.active=true;s.act=2;s.turns++;var sig=signalMap(game),r=route(sig);s.route=r;s.generation=Math.max(s.generation,Number((G.V8Lineage&&G.V8Lineage.profile?G.V8Lineage.profile().generation:0)||0));if(!s.conflict)s.conflict=sig.bond?"memory-vs-distance":sig.care?"care-vs-change":"return-vs-severance";s.conflictScore+=(sig.bond?0.4:0)+(sig.care?0.3:0)+(sig.wound?0.25:0)+(sig.memory?0.15:0);if(s.turns%30===0&&s.events.length<EVENTS.length){var picked=pickEvent(s,sig,r);if(picked){var cid=cause(s,"event",picked.id,picked.place,{route:r,signals:picked.need,generation:s.generation});var recorded={id:picked.id,place:picked.place,route:r,causeId:cid,parentCause:s.causes.length>1?s.causes[s.causes.length-2].id:"root",generation:s.generation};s.events.push(recorded);s.lastEvent=picked.id;applyPhysical(game,recorded,r);}}
    if(!s.complete&&s.events.length>=6){var desired=(r==="bonding"||r==="steward")?"keep":"let-go";if(s.endings.length===0)addEnding(s,game,r,desired);else if(s.endings.length===1&&s.endings[0]!==desired&&s.turns%60===0)addEnding(s,game,r,desired);}if(s.endings.length>=2)s.complete=true;save(s);}
  var SecondAct={_state:null,resetCache:function(){this._state=null;},reset:function(){this._state=fresh();save(this._state);},profile:function(){return JSON.parse(JSON.stringify(state()));},events:function(){return EVENTS.map(function(e){return e.id;});},observe:observe};
  G.V4SecondAct=SecondAct;
  if(G.Director&&G.Director.observe){var prev=G.Director.observe;G.Director.observe=function(dt,game){prev.call(this,dt,game);if(G.V4SecondAct)G.V4SecondAct.observe(dt,game);};}
})(IGRA);
