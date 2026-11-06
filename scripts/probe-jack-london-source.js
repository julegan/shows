#!/usr/bin/env node
"use strict";
// Temporary bounded read-only source inspection; remove after adapter verification.
(async()=>{
 const targets=["https://www.jacklondonrevue.com/calendar/","https://www.jacklondonrevue.com/"];
 for(const url of targets){
  try{
   const r=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-original-calendar-probe/0.1"},redirect:"error",signal:AbortSignal.timeout(16000)});
   const body=await r.text();
   if(body.length>1600000)throw Error("HTML exceeds 1.6MB");
   console.log("JLR SOURCE",JSON.stringify({url,status:r.status,type:r.headers.get("content-type"),length:body.length,redirect:r.url}));
   if(!r.ok)continue;
   const needles=["tw-plugin-calendar","tw-widget","tw-responsive","ticketweb","api.ticketweb","ticketweb-widget","tw-calendar","calendar-list","event-list","ticketwebApi","tw-calendar-event-title","wp-json","data-event","data-tw","tw-plugin-calendar-list"];
   for(const key of needles){
    const pos=body.toLowerCase().indexOf(key.toLowerCase());
    if(pos>=0)console.log("JLR MARKER",key,pos,body.slice(Math.max(0,pos-220),pos+850).replace(/\s+/g," ").slice(0,1080));
   }
   const scripts=[...body.matchAll(/<script\b[^>]*src=['"]([^'"]+)['"][^>]*>/gi)].map(m=>m[1]);
   console.log("JLR SCRIPTS",JSON.stringify(scripts.filter(x=>/ticket|widget|tw-|plugin|calendar|revue|jquery|events/i.test(x)).slice(0,30)).slice(0,4500));
   const rawLinks=[...body.matchAll(/<a\b[^>]*href=['"]([^'"]+)['"][^>]*>/gi)].map(m=>m[1]);
   console.log("JLR LINKS",JSON.stringify(rawLinks.filter(x=>/ticketweb|event|show|calendar/i.test(x)).slice(0,22)).slice(0,4400));
   const config=body.match(/<div\b[^>]*id=['"]tw-responsive['"][^>]*>/i);
   console.log("JLR CONFIG",config?.[0]?.slice(0,1300)||"none");
   for(const m of [...body.matchAll(/<script\b[^>]*>([\s\S]{100,40000}?)<\/script>/gi)].slice(0,35)){
     const inside=m[1],k=/ticketweb|tw-calendar|tw-responsive|tw-widget|eventApi|calendarEvents/i.exec(inside);
     if(k) console.log("JLR INLINE",k[0],inside.slice(Math.max(0,k.index-300),k.index+1700).replace(/\s+/g," ").slice(0,2300));
   }
  }catch(e){console.log("JLR ERROR "+url+" "+String(e.message||e));}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
