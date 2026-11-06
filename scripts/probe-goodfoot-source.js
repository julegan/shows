#!/usr/bin/env node
"use strict";
// Temporary bounded read-only original venue-source inspection.
const targets=[
 "https://the1905.turntabletickets.com/",
 "https://the1905.turntabletickets.com/calendar",
 "https://www.jacklondonrevue.com/calendar/"
];
const markers=["__NEXT_DATA__","__nuxt","application/ld+json","/events/","/event/","ticket","showId","startTime","event-date-start","calendar-event","data-event","evcal","fc-event","shows","07:30","20:00"];
(async()=>{
 for(const url of targets){
  try{
   const r=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-original-music-source-review/0.1"},redirect:"error",signal:AbortSignal.timeout(15000)});
   const contentType=r.headers.get("content-type")||"";
   const body=await r.text();
   if(body.length>3000000)throw Error("Original HTML exceeds bounded 3MB inspection");
   console.log("MUSIC SOURCE PROBE",JSON.stringify({url,status:r.status,type:contentType,len:body.length,final:r.url}));
   if(r.ok&&contentType.includes("html")){
    for(const key of markers){
     const pos=body.indexOf(key); if(pos<0)continue;
     console.log("MUSIC MARKER",key,pos,body.slice(Math.max(0,pos-220),pos+650).replace(/\s+/g," ").slice(0,850));
    }
    const links=[...body.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]).filter(x=>/event|show|ticket|turntable|jazz/i.test(x)).slice(0,15);
    console.log("MUSIC LINKS "+JSON.stringify(links));
    console.log("MUSIC HEAD "+body.slice(0,250).replace(/\s+/g," "));
   }
  }catch(e){console.log("MUSIC PROBE ERROR "+url+" "+String(e.message||e));}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
