"use strict";
var assert=require("assert");
var fs=require("fs"),vm=require("vm");
var ctx={console:console,Math:Math};vm.createContext(ctx);
[
"v9-world.js","v10-personality.js","v11-social.js","v12-lineage.js","v13-knowledge.js","v14-director2.js","v15-finale.js","v16-presentation.js","v17-adaptive-audio.js","v18-experiments.js","v19-simulation.js","v20-hardening.js","v21-playtest.js","v22-optimization.js","v23-rc2-gate.js","v24-limited-release.js","v25-production.js"
].forEach(function(f){vm.runInContext(fs.readFileSync("web/js/"+f,"utf8"),ctx,{filename:f});});
var G=ctx.IGRA;
assert(G&&G.V9World&&G.V10Personality&&G.V11Social&&G.V12Lineage&&G.V13Knowledge&&G.V14Director2&&G.V15Finale&&G.V16Presentation&&G.V17AdaptiveAudio&&G.V18Experiments&&G.V19Simulation&&G.V20Hardening&&G.V21Playtest&&G.V22Optimization&&G.V23RC2Gate&&G.V24LimitedRelease&&G.V25Production);
var w=G.V9World.create(12345);
G.V10Personality.ensure({}); G.V11Social.ensure(w); G.V12Lineage.ensure(w); G.V13Knowledge.discover(w,"first-law",1); G.V14Director2.choose(w,[{id:"a",setup:.8,consequence:.4,rarity:.2}]); assert(["garden","ash","shore"].indexOf(G.V15Finale.route(w))>=0);
G.V16Presentation.budget(w,1,24,8); G.V17AdaptiveAudio.react(w,{intensity:.7,motif:"memory",silence:.3}); G.V18Experiments.record(w,"care changes trust","care","trust increased"); G.V19Simulation.tick(w,1); G.V20Hardening.check(w,"save",true); G.V20Hardening.migrate(w,1,2); G.V21Playtest.session(w,30,"repeat-life"); G.V21Playtest.metric(w,"events",3); G.V22Optimization.configure(w,16.7,8);
assert.strictEqual(G.V23RC2Gate.evaluate({probes:true,migration:true,replay:true,performance:true,accessibility:true,privacy:true,signing:true,android:true}).ready,true);
var lr=G.V24LimitedRelease.ensure(w); lr.enabled=true; assert.strictEqual(G.V24LimitedRelease.gate(w),true);
assert.strictEqual(G.V25Production.evaluate({v23:true,v24:true,save:true,migration:true,offline:true,performance:true,accessibility:true,privacy:true,signing:true,store:true}).ready,true);
console.log("V9-V25 systems probe: PASS");
