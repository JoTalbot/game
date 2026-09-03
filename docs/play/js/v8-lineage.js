var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // V8: межжизненная линия. Это не XP и не NG+ меню. Это компактная
  // причинная память, которая получает форму только когда начинается
  // следующая жизнь.
  var KEY="igra.v8-lineage.v1", MAX=6, TRAITS=["curiosity","aggression","contemplation","empathy","chaos","harmony"];
  var ROUTE_TRAIT={steward:"harmony",bonding:"empathy",seeking:"curiosity",severing:"aggression",watching:"contemplation",enduring:"chaos"};
  function fresh(){return {version:1,generation:0,lives:0,finale:"",origin:"shore",history:[],inherited:{route:"",trait:"",worldState:"balanced",body:"shoreborn",scar:0,place:"",being:"",fingerprint:""}};}
  function read(){
    var s=fresh();
    try{
      var raw=G.Save&&G.Save.get?G.Save.get(KEY):null,p=raw?JSON.parse(raw):null;
      if(p&&typeof p==="object")Object.keys(s).forEach(function(k){if(p[k]!=null)s[k]=p[k];});
    }catch(e){}
    // Migration is deliberately conservative: the lineage envelope has one
    // supported schema, malformed collections are discarded, and unknown
    // version numbers are normalized instead of becoming a new schema by accident.
    s.version=1;
    if(!Array.isArray(s.history))s.history=[];
    s.history=s.history.filter(function(v){return v&&typeof v==="object";}).slice(-MAX);
    if(!s.inherited||typeof s.inherited!=="object")s.inherited=fresh().inherited;
    s.generation=Math.max(0,Number(s.generation)||0);
    s.lives=Math.max(0,Number(s.lives)||0);
    return s;
  }
  function save(s){try{if(G.Save&&G.Save.set)G.Save.set(KEY,JSON.stringify(s));}catch(e){}}
  function state(){if(!G.V8Lineage._s)G.V8Lineage._s=read();return G.V8Lineage._s;}
  function hash(text){var h=2166136261;text=String(text);for(var i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
  function trajectory(game){try{var t=G.Trajectory&&G.Trajectory.build?G.Trajectory.build(game):null;return t&&t.dominant?String(t.dominant).toLowerCase():"";}catch(e){return "";}}
  function capture(choice,game){var s=state(),rs=G.ReleaseSystems&&G.ReleaseSystems.state?G.ReleaseSystems.state():null,v7=G.V7Climax&&G.V7Climax.profile?G.V7Climax.profile():null,b=G.V6Body&&G.V6Body.profile?G.V6Body.profile():null,r=trajectory(game),trait=ROUTE_TRAIT[r]||r||"harmony",world=v7&&v7.worldState?v7.worldState:(rs&&rs.ecology>=0.67?"flourishing":rs&&rs.ecology<=0.2?"hollow":"balanced"),body=b&&b.form||"shoreborn",scar=b?Number(b.scars||0):0,places=rs&&rs.places&&rs.places.length?rs.places[rs.places.length-1].id:"",beings=rs&&rs.beings&&rs.beings.length?rs.beings[rs.beings.length-1].id:"",generation=s.generation+1,fp=hash(choice+":"+r+":"+world+":"+body+":"+scar+":"+places+":"+beings+":"+generation);
    s.generation=generation;s.lives++;s.finale=choice;s.origin=choice==="become"?"voice":"shore";s.inherited={route:r,trait:trait,worldState:world,body:body,scar:Math.min(3,scar),place:places,being:beings,fingerprint:fp};s.history.push({generation:generation,finale:choice,route:r,worldState:world,body:body,fingerprint:fp});while(s.history.length>MAX)s.history.shift();save(s);return s;}
  function apply(game){if(!game)return;var s=state();if(!s.generation||!s.inherited)return false;var i=s.inherited,trait=i.trait;if(game.dna&&trait&&game.dna.values&&game.dna.values[trait]!=null){game.dna.values[trait]=Math.max(game.dna.values[trait],0.16);}
    game.lineageContext={generation:s.generation,finale:s.finale,origin:s.origin,route:i.route,trait:trait,worldState:i.worldState,body:i.body,scar:i.scar,place:i.place,being:i.being,fingerprint:i.fingerprint};
    if(game.world){game.world.lineageState=i.worldState;game.world.lineageOrigin=s.origin;game.world.lineageTrace=i.fingerprint;if(game.world.nodes&&game.world.nodes.length){var n=game.world.nodes[0];n.memory=true;n.lineageTrace=i.fingerprint;n.lineageState=i.worldState;if(i.scar>0)n.scars=Math.max(Number(n.scars)||0,i.scar);}}
    if(game.player){game.player.lineageGeneration=s.generation;game.player.lineageTrait=trait||"";game.player.lineageOrigin=s.origin;}
    return true;
  }
  G.V8Lineage={_s:null,state:state,profile:function(){return JSON.parse(JSON.stringify(state()));},capture:capture,apply:apply,reset:function(){this._s=fresh();save(this._s);}};
  if(G.Game&&G.Game.prototype&&G.Game.prototype.startBirth&&!G.Game.prototype.__v8Lineage){var baseBirth=G.Game.prototype.startBirth;G.Game.prototype.startBirth=function(){baseBirth.apply(this,arguments);G.V8Lineage.apply(this);};G.Game.prototype.__v8Lineage=true;}
  if(G.Fate&&!G.Fate.__v8Lineage){var oldRelease=G.Fate.release,oldBecome=G.Fate.become;if(oldRelease){G.Fate.release=function(game){G.V8Lineage.capture("release",game);return oldRelease.apply(this,arguments);};}if(oldBecome){G.Fate.become=function(game){G.V8Lineage.capture("become",game);return oldBecome.apply(this,arguments);};}G.Fate.__v8Lineage=true;}
})(IGRA);
