#!/usr/bin/env node
"use strict";
/* First-party event organizer detail probe. Never request checkout APIs. */
const SOURCES=[
 {id:"heady-dec19",url:"https://www.eventbrite.com/e/bigbababygucci-in-portland-before-the-paint-dries-tour-tickets-2003364987607"},
 {id:"groupsound-archive",url:"https://ra.co/events/2405955"}
];
async function run(){
 for(const p of SOURCES){
  try {
   const resp=await fetch(p.url,{redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-review-only/0.1"},signal:AbortSignal.timeout(14000)});
   if(!resp.ok||!resp.headers.get("content-type")?.includes("text/html"))throw Error("official event page HTTP "+resp.status);
   const raw=await resp.text();if(raw.length>1700000)throw Error("HTML above bound");
   const slices=["application/ld+json","startDate","BIGBABABYGUCCI","Republic Cafe","doors","7:30","8:00","212"];
   const excerpts=slices.map(token=>{
    const at=raw.toLowerCase().indexOf(token.toLowerCase());
    return {token,found:at!==-1,context:at!==-1?raw.slice(Math.max(0,at-160),at+1250).slice(0,1400):null};
   });
   const scripts=[...raw.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1].slice(0,2500)).slice(0,5);
   console.log("PROBE "+JSON.stringify({id:p.id,url:p.url,bytes:raw.length,excerpts,scripts},null,2));
  }catch(e){console.error("SOURCE_HOLD "+p.id+" "+String(e.message||e));}
 }
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1});
