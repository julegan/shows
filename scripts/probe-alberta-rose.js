#!/usr/bin/env node
"use strict";
// Temporary bounded original-site research, removed after source validation.
const urls=[
 "https://albertarosetheatre.com/calendar/",
 "https://albertarosetheatre.com/",
 "https://www.keyspdx.com/"
];
const markers=[
 "event-list","event-card","event-date","event-time","data-event","tribe-events",
 "eventlist","concert","art-event","showtime","show-time","event-item",
 "upcoming","calendar__","ticket","<time","startDate","eventURL","event-title",
 "data-date","Show:","Doors:","\"@type\":\"Event\"","calendar-event",
 "wp-json","etix.com","ticketweb.com"
];
async function run(url){
 try{
 const r=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(16000),
 headers:{Accept:"text/html","User-Agent":"SHOWS-original-source-research/0.1"}});
 const html=await r.text();
 console.log("SOURCE RESPONSE",JSON.stringify({url,status:r.status,ct:r.headers.get("content-type"),bytes:html.length,redirect:r.url}));
 if(!r.ok||html.length>2400000)throw Error("Original public source failed/oversized");
 for(const needle of markers){
  const i=html.toLowerCase().indexOf(needle.toLowerCase());
  if(i>=0)console.log("SOURCE MARKER",needle,i,html.slice(Math.max(0,i-210),i+620).replace(/\s+/g," ").slice(0,790));
 }
 const links=[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)]
   .map(m=>m[1]).filter(h=>/\/event\/|\/calendar\/|\/shows\/|\/events\/|etix|ticketweb/.test(h)).slice(0,24);
 console.log("SOURCE LINKS",url,JSON.stringify(links).slice(0,3700));
 const imgs=[...html.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi)]
   .map(m=>m[1]).filter(h=>/event|theat|rose|flyer|poster|ticket/i.test(h)).slice(0,10);
 console.log("SOURCE IMGS",url,JSON.stringify(imgs).slice(0,1000));
 }catch(e){console.log("SOURCE ERROR",url,String(e.message||e));}
}
(async()=>{for(const url of urls)await run(url)})().catch(e=>{console.error(e);process.exitCode=1});
