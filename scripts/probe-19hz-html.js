#!/usr/bin/env node
"use strict";
const SOURCE="https://19hz.info/eventlisting_ORE.php";
async function main(){
 const response=await fetch(SOURCE,{redirect:"error",signal:AbortSignal.timeout(15000),headers:{Accept:"text/html","User-Agent":"SHOWS-review-only-source-inspection/0.1"}});
 if(!response.ok||!response.headers.get("content-type")?.includes("text/html"))throw Error("Public 19hz HTML unavailable HTTP "+response.status);
 const html=await response.text();
 if(html.length>1400000)throw Error("Public secondary source exceeds read bound");
 const markers=["automatically generated","Republic Cafe","Ming Lounge","Headspace Circus","industrial","darkwave","goth","<table","<tr","<td"];
 const first=html.search(/<tr\b/i),firstT=html.search(/<table\b/i);
 console.log("PUBLIC_19HZ_SOURCE "+JSON.stringify({bytes:html.length,
  markers:Object.fromEntries(markers.map(s=>[s,html.toLowerCase().indexOf(s.toLowerCase())])),
  firstTable:firstT<0?null:html.slice(firstT,firstT+3000),
  firstRow:first<0?null:html.slice(first,first+6000),
  rows:[...html.matchAll(/<tr\b/gi)].length,
  links:[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].slice(0,12).map(m=>m[1])},null,2));
}
main().catch(e=>{console.error(String(e));process.exitCode=1});
