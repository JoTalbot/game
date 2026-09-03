var IGRA = IGRA || {};
(function (G) {
  "use strict";
  var KEY = "igra.v6-body.v1", MAX = 9;
  var FORM = { harmony:"tender", empathy:"echo", contemplation:"still", curiosity:"seeking", aggression:"scar", chaos:"shard" };
  function fresh(){return {version:1, depth:0, form:"shoreborn", scars:0, habits:[], signatures:[], last:""};}
  function load(){var s=fresh();try{var r=G.Save&&G.Save.get?G.Save.get(KEY):null,p=r?JSON.parse(r):null;if(p&&typeof p==="object"){Object.keys(s).forEach(function(k){if(p[k]!=null)s[k]=p[k];});}}catch(e){}if(!Array.isArray(s.habits))s.habits=[];if(!Array.isArray(s.signatures))s.signatures=[];return s;}
  function save(s){try{if(G.Save&&G.Save.set)G.Save.set(KEY,JSON.stringify(s));}catch(e){}}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function state(){if(!G.V6Body._s)G.V6Body._s=load();return G.V6Body._s;}
  function dominant(game){var tr=G.Trajectory&&G.Trajectory.build?G.Trajectory.build(game):null;return tr&&tr.dominant?String(tr.dominant):"harmony";}
  function observe(game){if(!game||game.state!=="play"||!game.dna||!game.world)return;var s=state(),trait=dominant(game),form=FORM[trait]||"shoreborn", wounds=game.world.wounds?game.world.wounds.length:0, rs=G.ReleaseSystems&&G.ReleaseSystems.state?G.ReleaseSystems.state():null, act=rs?Number(rs.act||1):1;
    s.scars=Math.max(Number(s.scars)||0,wounds);s.depth=Math.max(s.depth,Math.min(3,Math.floor((act-1)+s.scars/2)));
    if(s.habits.indexOf(trait)<0)s.habits.push(trait);while(s.habits.length>MAX)s.habits.shift();
    if(form!==s.form||trait!==s.last){s.form=form;s.last=trait;var sig=trait+":"+form+":"+s.depth;if(s.signatures.indexOf(sig)<0)s.signatures.push(sig);while(s.signatures.length>MAX)s.signatures.shift();}
    if(s.scars>=2&&s.depth>=2)s.form=form+"-scarred";save(s); game.bodyIdentity={form:s.form,depth:s.depth,scars:s.scars,signature:s.signatures[s.signatures.length-1]||s.form};
    if(game.player){game.player.bodyForm=s.form;game.player.bodyDepth=s.depth;}
  }
  G.V6Body={_s:null,state:state,profile:function(){var s=state();return JSON.parse(JSON.stringify(s));},reset:function(){this._s=fresh();save(this._s);},observe:observe};
  if(G.Director&&G.Director.observe){var base=G.Director.observe;G.Director.observe=function(dt,game){base.call(this,dt,game);G.V6Body.observe(game);};}
})(IGRA);
