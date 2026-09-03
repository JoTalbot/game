var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V7: третий акт должен быть не просто числом act=3. Здесь появляется
  // кульминационный контур: мир отвечает на накопленную причинность, затем
  // финальный выбор оставляет различимый отпечаток и открывает продолжение.
  var KEY = "igra.v7-climax.v1", MAX = 12;
  function fresh(){return {version:1,tick:0,phase:"approach",chain:[],worldState:"balanced",finale:"",post:false,generation:0,lastCause:""};}
  function load(){var s=fresh();try{var r=G.Save&&G.Save.get?G.Save.get(KEY):null,p=r?JSON.parse(r):null;if(p&&typeof p==="object")Object.keys(s).forEach(function(k){if(p[k]!=null)s[k]=p[k]);}catch(e){}if(!Array.isArray(s.chain))s.chain=[];s.chain=s.chain.filter(function(v){return typeof v==="object"&&v;}).slice(-MAX);return s;}
  function save(s){try{if(G.Save&&G.Save.set)G.Save.set(KEY,JSON.stringify(s));}catch(e){}}
  function state(){if(!G.V7Climax._s)G.V7Climax._s=load();return G.V7Climax._s;}
  function route(game){var p=G.V6Signals&&G.V6Signals.profile?G.V6Signals.profile(game):null;return p?p.form:"shoreborn";}
  function causeId(s,game,label){var rs=G.ReleaseSystems&&G.ReleaseSystems.state?G.ReleaseSystems.state():null;var base=(rs&&rs.lastCause)||"v7";var text=base+":"+label+":"+(game&&game.time||0)+":"+s.tick;var h=2166136261;for(var i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return "v7-"+(h>>>0).toString(36);}
  function worldState(game){var rs=G.ReleaseSystems&&G.ReleaseSystems.state?G.ReleaseSystems.state():null;var e=rs?Number(rs.ecology||0.5):0.5;var p=route(game);if(p==="scar"||p==="shard")return "scarred";if(e>=0.67)return "flourishing";if(e<=0.33)return "hollow";return "balanced";}
  function observe(game){if(!game||game.state!=="play")return;var rs=G.ReleaseSystems&&G.ReleaseSystems.state?G.ReleaseSystems.state():null;if(!rs||Number(rs.act||1)<3)return;var s=state();s.tick++;var ws=worldState(game);s.worldState=ws;
    if(s.tick%60===0){var ph=s.tick<120?"approach":s.tick<240?"confrontation":"choice";s.phase=ph;var cid=causeId(s,game,"phase-"+ph);s.lastCause=cid;s.chain.push({tick:s.tick,phase:ph,state:ws,route:route(game),causeId:cid});if(s.chain.length>MAX)s.chain.shift();if(G.ReleaseSystems&&G.ReleaseSystems.state){var r=G.ReleaseSystems.state();r.lastCause=cid;r.events=r.events||[];r.events.push({id:"v7-"+s.tick,causeId:cid,act:3,kind:"climax:"+ph});if(r.events.length>32)r.events.splice(0,r.events.length-32);}}
    game.climax={phase:s.phase,worldState:s.worldState,chain:s.chain.length};
    save(s);
  }
  function choose(choice,game){var s=state();s.finale=choice==="become"?"become":"release";s.worldState=worldState(game);s.post=true;s.generation=Math.max(s.generation,(G.ReleaseSystems&&G.ReleaseSystems.state?G.ReleaseSystems.state().nextLife||{}:{generation:0}).generation||0);var cid=causeId(s,game,"finale-"+s.finale);s.lastCause=cid;s.chain.push({tick:s.tick,phase:"finale",state:s.worldState,route:route(game),causeId:cid});if(s.chain.length>MAX)s.chain.shift();save(s);if(game){game.finalWorldState=s.worldState;game.postFinale=true;}}
  G.V7Climax={_s:null,state:state,profile:function(){return JSON.parse(JSON.stringify(state()));},observe:observe,choose:choose,reset:function(){this._s=fresh();save(this._s);}};
  if(G.ReleaseSystems&&G.ReleaseSystems.observe&&!G.ReleaseSystems.__v7Climax){var baseObserve=G.ReleaseSystems.observe;G.ReleaseSystems.observe=function(dt,game){baseObserve.call(this,dt,game);G.V7Climax.observe(game);};G.ReleaseSystems.__v7Climax=true;}
  if(G.Fate){var oldRelease=G.Fate.release,oldBecome=G.Fate.become;if(oldRelease&&!G.Fate.__v7Climax){G.Fate.release=function(game){G.V7Climax.choose("release",game);return oldRelease.apply(this,arguments);};G.Fate.become=function(game){G.V7Climax.choose("become",game);return oldBecome.apply(this,arguments);};G.Fate.__v7Climax=true;}}
})(IGRA);
