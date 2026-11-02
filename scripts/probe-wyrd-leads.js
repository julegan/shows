#!/usr/bin/env node
"use strict";
/* Bounded first-party/secondary public source inspection. No ticket requests. */
const PAGES=[
 {id:"bandcamp-artist",url:"https://shadowhouse.bandcamp.com/"},
 {id:"bandslate-venue",url:"https://www.bandslate.com/venue/wyrd-hut-portland"},
 {id:"nearhear-venue",url:"https://nearhear.app/venues/4583"},
 {id:"wyrd-official",url:"https://wyrdhut.com/"}
];
const patterns=["Wyrd Hut","Shadowhouse","House of Warmth","Jan 9, 2027","Jan 9","December 21, 2026","Flying Whammy","Upcoming Shows","Launching Soon"];
async function main(){
 for(const p of PAGES){
  try{
   const response=await fetch(p.url,{redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-original-lead-review/0.1"},signal:AbortSignal.timeout(14000)});
   if(!response.ok)throw Error("HTTP "+response.status);
   if(!String(response.headers.get("content-type")||"").includes("text/html"))throw Error("not HTML");
   const body=await response.text();
   if(body.length>1100000)throw Error("body over limit");
   const found=Object.fromEntries(patterns.map(x=>[x,body.toLowerCase().indexOf(x.toLowerCase())]));
   const markers=patterns.filter(x=>found[x]>=0).slice(0,6).map(x=>({term:x,context:body.slice(Math.max(0,found[x]-850),found[x]+1150).slice(0,2000)}));
   console.log(JSON.stringify({id:p.id,url:p.url,bytes:body.length,found,markers,
     links:[...body.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)].slice(0,8).map(x=>x[1].slice(0,130))},null,2));
  }catch(e){console.error("SOURCE HOLD "+p.id+": "+String(e.message||e));process.exitCode=1;}
 }
}
if(require.main===module)main();
