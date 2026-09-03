#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const ok=(v,s,d)=>{if(!v)throw new Error(s+(d?": "+d:""));console.log("✓ "+s+(d?" ("+d+")":""));};
const html=read("web/index.html"), sw=read("web/sw.js"), lang=read("web/js/lang.js"), a11y=read("web/js/accessibility.js");
const scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1]);
const cached=[...sw.matchAll(/"\.\/([^"\\]+)"/g)].map(m=>m[1]);
const cacheSet=new Set(cached);
ok(html.includes('lang="ru"'),"browser shell declares Russian base locale");
ok(scripts.includes("js/lang.js")&&scripts.includes("js/accessibility.js"),"localization and accessibility are in browser shell");
const uncached=scripts.filter(s=>s.startsWith("js/")&&!cacheSet.has(s));
ok(uncached.length===0,"every browser script is present in offline cache",uncached.join(", "));
ok(sw.includes("igra-shell-v17"),"offline cache has an explicit version");

const sandbox={IGRA:{},console,window:{matchMedia(){return {matches:false};}},document:{readyState:"loading",addEventListener(){},documentElement:{setAttribute(){}},getElementById(){return null},createElement(){return {}}},localStorage:{getItem(){return null},setItem(){},removeItem(){}}};
vm.createContext(sandbox);
vm.runInContext(lang,sandbox,{filename:"lang.js"});
const ru=sandbox.IGRA.UI_STR.ru,en=sandbox.IGRA.UI_STR.en;
const missing=Object.keys(ru).filter(k=>!Object.prototype.hasOwnProperty.call(en,k));
ok(Object.keys(ru).length>40,"Russian UI dictionary is substantive",Object.keys(ru).length+" keys");
ok(Object.keys(en).length===Object.keys(ru).length,"RU/EN UI dictionaries have equal key coverage");
ok(missing.length===0,"English UI has every Russian UI key",missing.join(", "));

vm.runInContext(a11y,sandbox,{filename:"accessibility.js"});
ok(!!sandbox.IGRA.Accessibility&&sandbox.IGRA.Accessibility.version===1,"accessibility API is stable");

const touch=read("web/js/touch-hysteresis.js"),v8=read("web/js/v8-lineage.js"),v4=read("web/js/v4-history-routes.js"),v4d=read("web/js/v4-depth.js");
ok(touch.includes("HOLD_LIMIT = 126")&&touch.includes("GRACE_LIMIT = 140"),"touch hysteresis keeps validated 126/140 boundaries");
ok(touch.includes("touchend")===false,"touch policy remains separated from explicit touchend handling");
ok(v8.includes("MAX=6")&&v8.includes("slice(-MAX)"),"lineage history is bounded");
ok(v4.includes("slice(-12)")&&v4.includes("length > 96"),"V4 consequences and causal history are bounded");
ok(v4d.includes("MAX_BEATS = 8"),"V4.3 beat history is bounded");

const android=read("android/app/src/main/java/world/igra/app/MainActivity.java"),manifest=read("android/app/src/main/AndroidManifest.xml"),save=read("web/js/save.js");
ok(android.includes("AndroidSave")&&android.includes("SharedPreferences"),"Android persistence bridge is present");
ok(android.includes("onPause")&&android.includes("onResume"),"Android lifecycle hooks are present");
ok(android.includes("onBackPressed"),"Android back handling is present");
ok(android.includes("setAllowFileAccess(false)")&&android.includes("setAllowUniversalAccessFromFileURLs(false)"),"WebView file-origin access is disabled");
ok(manifest.includes('android:usesCleartextTraffic="false"'),"Android cleartext traffic is disabled");
ok(save.includes("AndroidSave")&&save.includes("localStorage"),"save layer has native backend with browser fallback");

const renderer=read("web/js/renderer.js"),engine=read("web/js/engine.js");
ok(renderer.includes("G.Quality")&&renderer.includes("decor"),"renderer has weak-device quality gating");
ok(engine.includes("requestAnimationFrame")&&engine.includes("update(dt)"),"engine uses frame-driven update loop");

if(global.gc){const Long=require("./long.js");const r=Long.live(120,[60,120],7);const s0=r.at[0],s1=r.at[120];ok(r.errors===0,"120-second real-engine soak has no update exceptions",String(r.errors));ok(s1.nodes<64&&s1.beings<64,"world population remains bounded after soak",`nodes=${s1.nodes} beings=${s1.beings}`);ok(s1.fx<2000&&s1.floaters<2000&&s1.trail<5000&&s1.taps<256,"transient collections remain bounded after soak",`fx=${s1.fx} floaters=${s1.floaters} trail=${s1.trail} taps=${s1.taps}`);ok(s1.heap>=0&&s0.heap>=0,"heap measurements are available after GC",`${s0.heap}→${s1.heap} KB`);}else{console.log("ℹ GC unavailable: static hardening checks remain active; CI invokes this probe with --expose-gc");}

console.log("RC HARDENING PROBE PASS");
