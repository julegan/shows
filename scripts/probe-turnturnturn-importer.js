"use strict";
const importer=require("./turnturnturn-opendate");
const {extract,reconcile,parseFile}=require("./discover-events");
const fs=require("node:fs");
const path=require("node:path");
const src=require("../discovery/sources.json").sources.find(x=>x.id==="turn-turn-turn");
async function request(url){
 const r=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(14000),redirect:"error"});
 if(!r.ok||!r.headers.get("content-type")?.includes("text/html"))throw Error("Original OpenDate source unavailable "+r.status);
 const txt=await r.text();if(txt.length>1400000)throw Error("OpenDate document too large");
 return txt;
}
async function run(){
 const page=await request(importer.CALENDAR_URL);
 const raw=importer.parseRoster(page);
 const incoming=[];
 for(let i=0;i<raw.length;i+=4){
  const batch=await Promise.all(raw.slice(i,i+4).map(async item=>{
   if(item.hold)return item;
   try{return importer.parseDetail(await request(item.fullUrl),item)}
   catch(e){return {hold:"First-party event detail fetch failed: "+String(e.message||e),url:item.fullUrl,title:item.title}}
  }));
  incoming.push(...batch);
 }
 const now=new Date(),found=incoming.map(x=>x.hold?x:extract(x,src,now));
 const existing=parseFile(fs.readFileSync(path.resolve(__dirname,"../events.js"),"utf8")).events;
 const result=reconcile(existing,found);
 const summary={source:"Official embedded Turn Turn Turn OpenDate calendar",rosterEvents:raw.filter(x=>!x.hold).length,
  detailVerified:incoming.filter(x=>!x.hold).length,held:result.held.length,newCandidates:result.accepted.length,
  alreadyPresent:result.skipped.length,
  categoryCounts:result.accepted.reduce((a,e)=>(a[e.category]=(a[e.category]||0)+1,a),{}),
  withArtwork:result.accepted.filter(e=>e.artwork?.url).length,
  candidates:result.accepted.slice(0,15).map(e=>({title:e.title,date:e.startsAt.slice(0,10),showtime:e.startsAt.slice(11,16),category:e.category,art:!!e.artwork?.url}))};
 console.log(JSON.stringify(summary,null,2));
 if(!summary.detailVerified)throw Error("No safely verified original OpenDate entries. Do not activate importer");
}
run().catch(e=>{console.error("Turn Turn Turn probe failed: "+e.message);process.exitCode=1});
