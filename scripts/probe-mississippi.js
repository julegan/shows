#!/usr/bin/env node
"use strict";
const {parseMississippi}=require("./mississippi-polaris-importer");
const src=require("../discovery/sources.json").sources.find(x=>x.id==="mississippi-polaris");
(async()=>{
 const r=await fetch(src.url,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(18000),redirect:"error"});
 if(!r.ok||!r.headers.get("content-type")?.includes("text/html"))throw Error("Original venue source unavailable");
 const html=await r.text();if(html.length>2500000)throw Error("Source unexpectedly large");
 const rows=parseMississippi(html,src),ok=rows.filter(x=>x.startDate);
 const byRoom=Object.fromEntries(["Mississippi Studios","Polaris Hall"].map(v=>[v,ok.filter(x=>x.venue===v).length]));
 console.log(JSON.stringify({reviewOnly:true,examined:rows.length,verified:ok.length,held:rows.length-ok.length,byRoom,
  samples:ok.slice(0,5).map(x=>({title:x.title,venue:x.venue,startDate:x.startDate,url:x.fullUrl})),
  holds:rows.filter(x=>x.hold).slice(0,5).map(x=>({title:x.title,hold:x.hold}))}));
 if(ok.length<15||byRoom["Mississippi Studios"]<5||byRoom["Polaris Hall"]<5)throw Error("Insufficient original independently dated venue events; do not activate");
 console.log("PASS — Original Mississippi and Polaris venue cards separately verified");
})().catch(e=>{console.error("INDIE LIVE FAILED: "+e.message);process.exitCode=1});
