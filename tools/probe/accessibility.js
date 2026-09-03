#!/usr/bin/env node
const fs=require("fs"),vm=require("vm"),path=require("path"),H=require("./harness");
const ROOT=path.resolve(__dirname,"../.."),html=fs.readFileSync(path.join(ROOT,"web/index.html"),"utf8");
const files=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1]).filter(Boolean);
global.location={search:"",href:"https://igra.local/",protocol:"https:"};global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};
const G=H.boot(),ok=(v,l)=>{if(!v)throw new Error(l);console.log(`✓ ${l}`)};
ok(files.includes("js/accessibility.js"),"accessibility module is in browser shell");
const source=fs.readFileSync(path.join(ROOT,"web/js/accessibility.js"),"utf8");
const fake={
  document:{readyState:"complete",documentElement:{setAttribute(){}},head:{appendChild(){}},getElementById(){return null},createElement(){return {id:"",textContent:""}}},
  window:{matchMedia(){return {matches:false,addEventListener(){},addListener(){}}}}
};
vm.runInNewContext(source,Object.assign({IGRA:G,console},fake));
const A=fake.IGRA.Accessibility;
ok(!!A&&A.version===1,"accessibility layer exposes stable version");
ok(A.reducedMotion()===false,"normal motion is not forced off");
const calls=[];fake.window.matchMedia=()=>({matches:true,addEventListener(){},addListener(){}});fake.document.documentElement.setAttribute=(k,v)=>calls.push([k,v]);fake.document.getElementById=()=>null;fake.document.createElement=()=>({id:"",textContent:""});fake.document.head.appendChild=()=>{};A.applyMotion();
ok(calls.some(x=>x[0]==="data-reduced-motion"&&x[1]==="true"),"reduced-motion preference is reflected in document state");
console.log("accessibility probe passed");
