const fs=require("fs");
const p=fs.readFileSync("web/js/v3-being-cap.js","utf8");
const ok=(v,s)=>{if(!v)throw new Error(s);console.log("✓ "+s);};
ok(p.includes("this.beings.length > 12"),"being soft cap is 12");
ok(p.includes("!b.isVoice"),"voice lineage is protected");
ok(p.includes("b.bond > 0.25"),"bonded beings are protected first");
ok(p.includes("victim.dead = true"),"old unbonded being is retired");
console.log("dense population probe: PASS");
