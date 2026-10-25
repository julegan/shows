"use strict";
// Read-only runner integration probe. No published data or PRs are created.
const {parseKenton,SOURCE_URL}=require("./kenton-importer");
const {extract,reconcile,parseFile}=require("./discover-events");
const fs=require("node:fs");
const path=require("node:path");
async function run(){
 const res=await fetch(SOURCE_URL,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(18000),redirect:"error"});
 if(!res.ok)throw Error("Official Kenton page HTTP "+res.status+"; access must be resolved without bypassing restrictions");
 if(!res.headers.get("content-type")?.includes("text/html"))throw Error("Official Kenton source is not HTML");
 const html=await res.text();
 if(html.length>1200000)throw Error("Official Kenton page too large");
 const src=require("../discovery/sources.json").sources.find(x=>x.id==="kenton-club");
 const items=parseKenton(html);
 const dates=items.filter(x=>x.dateOnly);
 const now=new Date();
 const checked=dates.map(x=>extract(x,src,now));
 const existing=parseFile(fs.readFileSync(path.resolve(__dirname,"../events.js"),"utf8")).events;
 const result=reconcile(existing,checked);
 const info={source:"Kenton Club official",observed:dates.length,newCandidates:result.accepted.length,held:result.held.length,alreadyPresent:result.skipped.length,
  candidateDates:result.accepted.slice(0,15).map(x=>({date:x.startsAt.slice(0,10),title:x.title,kind:x.startTimeKind,category:x.category}))};
 console.log(JSON.stringify(info,null,2));
 if(!dates.length)throw Error("No upcoming date-confirmed official Kenton entries; do not enable importer blindly");
}
run().catch(e=>{console.error("Kenton probe failed: "+e.message);process.exitCode=1});
