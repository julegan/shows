#!/usr/bin/env node
"use strict";
// Temporary read-only source inspection; no event writes or publication.
const sites=[
 {id:"mississippi",url:"https://mississippistudios.com/calendar",needles:["Bedouine","Polaris Hall Presents","The Fourth Wall","event-wrapper","data-event-id","data-venue-id","event-doors-showtime","event-date","show-bar","event--grid-style"]},
 {id:"holocene",url:"https://www.holocene.org/events/",needles:["CRIMEWAVE","tribe-events","eventitem","event-start","event-card","calendar-event","Doors:","datetime","data-venue-id"]},
 {id:"holocene-detail",url:"https://www.holocene.org/event/crimewave-a-goth-post-punk-darkwave-party-21-2/holocene/portland/",needles:["startDate","eventStart","2026-10-22","Doors:","rhp-event","schema.org/Event","Holocene","event-title","rhp_event_start"]}
];
const cut=(html,i)=>html.slice(Math.max(0,i-1100),i+1250).replace(/\s+/g," ").slice(0,2250);
(async()=>{
 for(const site of sites){
  try{
   const r=await fetch(site.url,{headers:{"Accept":"text/html","User-Agent":"SHOWS-community-calendar/0.1"},redirect:"error",signal:AbortSignal.timeout(15000)});
   if(!r.ok)throw Error("HTTP "+r.status);
   const html=await r.text();if(html.length>3500000)throw Error("too large");
   const contexts={};
   for(const needle of site.needles){const index=html.toLowerCase().indexOf(needle.toLowerCase());if(index>=0)contexts[needle]=cut(html,index)}
   const links=[...new Set([...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(x=>x[1]).filter(x=>/etix\.com\/ticket\/p|holocene\.org\/event\/|mississippistudios\.com\/show/i.test(x)))].slice(0,7);
   const dateSignals=site.id==="holocene-detail"?{
    fullYearEventStrings:[...html.matchAll(/2026[-\/](?:10|11|12)[-\/]\d\d/g)].slice(0,12).map(x=>({raw:x[0],near:cut(html,x.index).slice(0,260)})),
    eventAttrs:[...html.matchAll(/(?:data-[a-z-]*(?:date|start|time)|(?:eventstart|rhp[_-]start)[-_a-z]*)=["'][^"']+["']/gi)].slice(0,22).map(x=>x[0]),
    schemaTypes:[...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap(m=>{try{let j=JSON.parse(m[1]);return [j].flatMap(v=>v["@graph"]||[v]).map(v=>({type:v["@type"],startDate:v.startDate,location:v.location}))}catch(e){return []}}).slice(0,9)
   }:null;
   console.log(JSON.stringify({id:site.id,bytes:html.length,links,contexts,dateSignals}));
  }catch(e){console.log(JSON.stringify({id:site.id,error:String(e.message||e)}))}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
