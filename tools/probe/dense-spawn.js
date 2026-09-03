const fs=require("fs");
const p=fs.readFileSync("web/js/world.js","utf8");
const ok=(v,s)=>{if(!v)throw new Error(s);console.log("✓ "+s);};
ok(p.includes('if (kind === "echo")'),"echo remains the explicit being-producing kind");
ok(p.includes("this.beings.push(b)"),"echo-born beings enter the world explicitly");
console.log("dense spawn probe: PASS");
