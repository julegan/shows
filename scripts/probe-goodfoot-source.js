#!/usr/bin/env node
"use strict";
// Temporary bounded, read-only source-shape check. Removed once parser is verified.
const targets=[
 "https://thegoodfoot.com/wp-json/tribe/events/v1/events?per_page=3",
 "https://thegoodfoot.com/music/",
 "https://thegoodfoot.com/events/greaterkind-8pm-doors-4/"
];
(async()=>{
 for (const url of targets){
  try{
   const r=await fetch(url,{headers:{Accept:"application/json, text/html","User-Agent":"SHOWS-goodfoot-source-review/0.1"},redirect:"error",signal:AbortSignal.timeout(15000)});
   const contentType=r.headers.get("content-type")||"";
   const text=await r.text();if(text.length>2600000)throw Error("source too large");
   console.log("GOODFOOT PROBE",JSON.stringify({url,status:r.status,type:contentType,length:text.length}));
   if(contentType.includes("json")){
    const data=JSON.parse(text);console.log("GOODFOOT JSON",JSON.stringify({keys:Object.keys(data).slice(0,20),total:data.total,events:data.events?.slice(0,3).map(e=>({keys:Object.keys(e).slice(0,38),title:e.title,url:e.url,start_date:e.start_date,utc_start_date:e.utc_start_date,timezone:e.timezone,venue:e.venue?.venue,category:e.categories?.map(c=>c.name),image:e.image?.url}))}).slice(0,5500));
   }else{
    for(const key of ["tribe-events-calendar-list__event-row","tribe-events-calendar-list__event-details","tribe-events-calendar-list__event-title","tribe-events-calendar-list__event-datetime","tribe-events-calendar-list__event-date-tag","application/ld+json","tribe-events-start-date","tribe-events-schedule","datetime=","event-date-start"]){
     const pos=text.indexOf(key);console.log("GOODFOOT MARKER",key,pos,pos>=0?text.slice(Math.max(0,pos-240),pos+400).replace(/\s+/g," ").slice(0,650):"");
    }
   }
  }catch(e){console.log("GOODFOOT PROBE ERROR "+url+" "+String(e.message||e));}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
