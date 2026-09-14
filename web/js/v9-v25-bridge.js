var IGRA = IGRA || {};
(function (G) {
  "use strict";
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function finite(v,f){return Number.isFinite(Number(v))?Number(v):f;}
  function ensure(game){
    if(!game||!game.world)return null;
    if(!game.world.v9v25){var seed=finite(game.world.seed,1)|0;game.world.v9v25={version:2,seed:seed,clock:0,world:G.V9World?G.V9World.create(seed):null,lastAction:null,lastRegion:"r0",stepCount:0,eventCount:0,lastExperimentEvent:0,lastEventSeq:0,metrics:{actions:0,idleSteps:0,moves:0,gazes:0,pulses:0}};}
    var s=game.world.v9v25;
    if(!s.world&&G.V9World)s.world=G.V9World.create(s.seed||1);
    if(!s.metrics)s.metrics={actions:0,idleSteps:0,moves:0,gazes:0,pulses:0};
    if(G.V10Myth)G.V10Myth.ensure(game.world);if(G.V11Social)G.V11Social.ensure(game.world);if(G.V13Knowledge)G.V13Knowledge.ensure(game.world);if(G.V18Experiments)G.V18Experiments.ensure(game.world);if(G.V19Simulation)G.V19Simulation.ensure(game.world);if(G.V16Presentation)G.V16Presentation.ensure(game.world);if(G.V17AdaptiveAudio)G.V17AdaptiveAudio.ensure(game.world);if(G.V21Playtest)G.V21Playtest.ensure(game.world);if(G.V22Optimization)G.V22Optimization.configure(game.world,game.w<=480?20:16.7,game.w<=480?6:8);return s;
  }
  function regionFor(game){var s=ensure(game);if(!s||!s.world||!game.player)return"r0";var x=finite(game.player.x,0),y=finite(game.player.y,0),count=s.world.regions.length||1,index=Math.abs((Math.floor(x/320)+Math.floor(y/240))|0)%count;return"r"+index;}
  function counters(game){var d=game.dna||{};return{taps:finite(d.taps,0),gazes:finite(d.gazes,0),pulses:finite(d.pulses,0)};}
  function actualAction(game,region,s){
    var c=counters(game),prev=s._counters||{taps:0,gazes:0,pulses:0},action=game.__v9v25Action||null;
    if(action&&typeof action==="object"&&action.type){return{type:String(action.type),region:region,amount:clamp(finite(action.amount,0.1),-1,1)};}
    if(c.pulses>prev.pulses)return{type:"pulse",region:region,amount:0.16};
    if(c.gazes>prev.gazes)return{type:game.dna&&typeof game.dna.dominant==="function"&&game.dna.dominant()==="aggression"?"harm":"care",region:region,amount:0.1};
    var dx=finite(game.player&&game.player.x,0)-finite(s._px,finite(game.player&&game.player.x,0));
    var dy=finite(game.player&&game.player.y,0)-finite(s._py,finite(game.player&&game.player.y,0));
    if(dx*dx+dy*dy>0.25)return{type:"visit",region:region,amount:0.1};
    return null;
  }
  function touchPersonality(game,active){if(!active||!G.V10Personality||!game.world||!Array.isArray(game.world.beings))return;var p=game.player||{};for(var i=0;i<game.world.beings.length&&i<12;i++){var b=game.world.beings[i];if(!b||typeof b!=="object")continue;var dx=finite(b.x,0)-finite(p.x,0),dy=finite(b.y,0)-finite(p.y,0);if(dx*dx+dy*dy<180*180)G.V10Personality.observe(b,game.gazeTarget===b?"care":"gaze",0.01);}}
  function social(game,action){if(!G.V11Social||!game.world||!action)return;var t=game.gazeTarget;if(!t||!t.id)return;G.V11Social.record(game.world,"player",t.id,"bond",0.01);G.V11Social.record(game.world,"player",t.id,"trust",0.005);}
  function myth(game,action,region){if(!G.V10Myth||!game.world)return;if(action&&action.type!=="idle")G.V10Myth.touch(game.world,region&&region.id||"r0",action.type,Math.abs(finite(action.amount,0.05))*0.5);}
  function knowledge(game,a){if(G.V13Knowledge&&game.world&&a&&a.type!=="idle")G.V13Knowledge.discover(game.world,"region:"+a.region+":"+a.type,clamp(Math.abs(a.amount),0,1));}
  function director(game,action){if(!G.V14Director2||!game.world||!action)return;G.V14Director2.ensure(game.world);G.V14Director2.choose(game.world,[{id:"quiet",setup:0.3,consequence:0.2,rarity:0.9},{id:"memory",setup:0.6,consequence:0.5,rarity:0.5},{id:"change",setup:0.8,consequence:0.7,rarity:0.25}]);}
  function presentationAudio(game,r,a){if(!game.world||!r)return;if(G.V16Presentation){var low=game.w<=480;G.V16Presentation.budget(game.world,low?0.7:1,low?10:24,low?3:8);var p=G.V16Presentation.ensure(game.world);p.weather=r.weather||p.weather;p.season=r.season==null?p.season:r.season;}if(G.V17AdaptiveAudio&&G.V17AdaptiveAudio.react){var storm=r.weather==="storm",rain=r.weather==="rain",intensity=a?(a.type==="harm"?0.72:a.type==="care"?0.48:0.34):0.18;if(storm)intensity+=0.16;G.V17AdaptiveAudio.react(game.world,{intensity:clamp(intensity,0,1),motif:storm?"storm":rain?"rain":a?a.type:"silence",silence:a&&a.type==="visit"?0.34:0.24});}}
  function experiment(game,a,before){if(!G.V18Experiments||!game.world||!a)return;var h=game.world.history||[];if(h.length<=before)return;var latest=h[h.length-1],s=game.world.v9v25;if(!latest||latest.id===s.lastExperimentEvent)return;s.lastExperimentEvent=latest.id;G.V18Experiments.record(game.world,"what follows "+a.type+" in "+a.region,a.type,latest.type+":"+latest.region);}
  function step(game,dt){var s=ensure(game);if(!s||!s.world)return;var d=clamp(finite(dt,0),0,0.25),before=s.world.history.length,start=typeof performance!=="undefined"&&performance.now?performance.now():0;s.clock+=d;var regionId=regionFor(game),action=actualAction(game,regionId,s),region=s.world.region(regionId);s.lastRegion=regionId;s.lastAction=action||{type:"idle",region:regionId,amount:0};
    if(action){s.metrics.actions++;if(action.type==="visit")s.metrics.moves++;if(action.type==="care"||action.type==="harm")s.metrics.gazes++;if(action.type==="pulse")s.metrics.pulses++;if(s.world.observe)s.world.observe(d,action);if(G.V9V25Persistence&&G.V9V25Persistence.record)G.V9V25Persistence.record(game,action);}else{s.metrics.idleSteps++;if(s.world.observe)s.world.observe(d,null);}
    var c=counters(game);s._counters=c;s._px=finite(game.player&&game.player.x,0);s._py=finite(game.player&&game.player.y,0);touchPersonality(game,!!action&&!!game.gazeTarget);myth(game,action,region);social(game,action);knowledge(game,action);if(action||s.clock-s._lastDirector>=2){director(game,action||{type:"idle",region:regionId,amount:0});s._lastDirector=s.clock;}presentationAudio(game,region,action);experiment(game,action,before);s.stepCount++;s.eventCount=s.world.history.length;
    if(G.V21Playtest){G.V21Playtest.tick(game.world,d,s.eventCount-before,game.gazeTarget?1:0);G.V21Playtest.evidence(game.world,"runtime-step",true,"steps:"+s.stepCount);}
    if(G.V22Optimization){var now=typeof performance!=="undefined"&&performance.now?performance.now():start;var elapsed=Math.max(0,now-start);G.V22Optimization.sample(game.world,elapsed>0?elapsed:d*1000);G.V22Optimization.simulation(game.world,action?1:0);}
    if(game.__v9v25Action)game.__v9v25Action=null;
  }
  G.V9V25Bridge={ensure:ensure,step:step};
  function install(){if(!G.Game||!G.Game.prototype||!G.Game.prototype.update||G.Game.prototype.__v9v25Bridge)return;var original=G.Game.prototype.update;G.Game.prototype.update=function(dt){var result=original.apply(this,arguments);if(this.state==="play"||this.state==="birth")step(this,dt);return result;};G.Game.prototype.__v9v25Bridge=true;}
  install();
})(IGRA);
