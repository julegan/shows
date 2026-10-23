#!/usr/bin/env node
"use strict";
// Temporary read-only source inspection; no event writes or publication.
const sites=[
 {id:"mississippi",url:"https://mississippistudios.com/calendar",needles:["REZN","The Fourth Wall","event-wrapper","data-event-id","data-venue-id","event-doors-showtime","event-date","show-bar","event--grid-style"]},
 {id:"holocene",url:"https://www.holocene.org/events/",needles:["CRIMEWAVE","tribe-events","eventitem","event-start","event-card","calendar-event","Doors:","datetime","data-venue-id"]}
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
   console.log(JSON.stringify({id:site.id,bytes:html.length,links,contexts}));
  }catch(e){console.log(JSON.stringify({id:site.id,error:String(e.message||e)}))}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
