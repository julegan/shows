#!/usr/bin/env node
"use strict";
const {parseStarday}=require("./starday-importer");
const src=require("../discovery/sources.json").sources.find(x=>x.id==="starday-tavern");
(async()=>{
 const r=await fetch(src.url,{headers:{Accept:"text/html","User-Agent":"SHOWS-venue-events-review/0.1"},redirect:"error",signal:AbortSignal.timeout(19000)});
 if(!r.ok||!r.headers.get("content-type")?.includes("text/html"))throw Error("Official Starday HTML unavailable");
 const html=await r.text(),rows=parseStarday(html,src);
 const future=rows.filter(x=>x.startDate&&Date.parse(x.startDate)>=Date.parse("2026-10-22T00:00:00-07:00"));
 const held=rows.filter(x=>x.hold);
 console.log(JSON.stringify({source:"starday-tavern",reviewOnly:true,examined:rows.length,verified:rows.filter(x=>x.startDate).length,
 future:future.length,held:held.length,examples:future.slice(0,8).map(x=>({title:x.title,at:x.startDate,url:x.fullUrl})),holdExamples:held.slice(0,6).map(x=>({title:x.title,reason:x.hold}))}));
 if(future.length<10)throw Error("Fewer than ten original Starday upcoming source records with Pacific dates and public links; do not enable");
 console.log("PASS — original Starday source-published public calendar events independently verified");
})().catch(e=>{console.error("STARDAY PROBE FAILED: "+String(e.message||e));process.exitCode=1});
