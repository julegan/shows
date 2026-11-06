#!/usr/bin/env node
"use strict";
// Temporary bounded read-only source structure review.
(async()=>{
 for(const url of ["https://www.jacklondonrevue.com/","https://www.jacklondonrevue.com/tm-event/lila-forde/","https://www.jacklondonrevue.com/calendar/"]){
 try{
  const r=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-calendar-source-probe/0.1"},redirect:"error",signal:AbortSignal.timeout(15000)});
  const html=await r.text();if(html.length>900000)throw Error("Too large");
  console.log("JLR SOURCE",JSON.stringify({url,status:r.status,type:r.headers.get("content-type"),size:html.length}));
  if(!r.ok)continue;
  for(const term of ["<div id=\"tw-responsive\" class=\"event-list\">","<div class=\"tw-section\">","<div class=\"tw-name\">","<div class=\"tw-date-time\">","<div class=\"tw-date\">","<div class=\"tw-showtime\">","<div class=\"tw-venue-name\">","<span class=\"tw-date-time\">","<time ","event-start-date","<meta property=\"og:title\"","application/ld+json","<h1","tw-plugin-upcoming-event-list","tw-plugin-calendar-list","tw-plugin-calendar"]){
   const at=html.indexOf(term);
   if(at>=0)console.log("JLR BLOCK",term,at,html.slice(Math.max(0,at-200),at+(term.includes("tw-section")?4600:1050)).replace(/\s+/g," ").slice(0,5200));
  }
  if(url.endsWith("/")){
   const region=html.slice(html.indexOf("<div id=\"tw-responsive\" class=\"event-list\">"));
   const chunks=region.split(/<div class="tw-section">/);
   console.log("JLR CHUNKS",chunks.length);
   for(const chunk of chunks.slice(1,4))console.log("JLR LIST CARD",chunk.slice(0,9200).replace(/\s+/g," ").slice(0,9200));
  }else if(url.includes("tm-event")){
   const parts=[...html.matchAll(/<meta\s+[^>]*content="([^"]+)"[^>]*>/gi)].map(x=>x[0]).filter(x=>/time|date|event|ticket/i.test(x)).slice(0,14);
   console.log("JLR DETAIL META",JSON.stringify(parts).slice(0,4000));
   const near=html.indexOf("tw-plugin-event");
   if(near>=0)console.log("JLR DETAIL VIEW",html.slice(near,near+8500).replace(/\s+/g," ").slice(0,8500));
  }
 }catch(e){console.log("JLR ERR "+url+" "+String(e.message||e));}
 }
})();