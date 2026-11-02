#!/usr/bin/env node
"use strict";
const URL="https://www.redcubepresents.com/events/";
async function main(){
 const response=await fetch(URL,{redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-event-source-review/0.1"},signal:AbortSignal.timeout(16000)});
 if(!response.ok||!String(response.headers.get("content-type")||"").includes("text/html"))throw Error("Official Red Cube promoter source unavailable HTTP "+response.status);
 const s=await response.text();
 if(s.length>1300000)throw Error("Official page unexpectedly large");
 for(const term of ["ELY OAKS","45 EAST - PORTLAND","FREE BASS: WHALES","COSTA"]){
  const p=s.indexOf(term);
  console.log(JSON.stringify({term,index:p,html:p===-1?null:s.slice(Math.max(0,p-1400),p+1650)},null,2));
 }
 const links=[...new Set([...s.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(m=>m[1]))];
 const meta={bytes:s.length,redCubeEventHeaders:(s.match(/45 EAST - PORTLAND/gi)||[]).length,
  tixrLinks:links.filter(x=>/tixr\.com/i.test(x)).slice(0,20),
  dateHeaders:[...new Set(s.match(/(?:FRIDAY|SATURDAY|SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY)\s+[A-Z]+\s+\d{1,2}\s+20\d\d/g)||[])].slice(0,22),
  pageTitles:[...s.matchAll(/<title[^>]*>([^<]+)</gi)].map(x=>x[1]).slice(0,3)};
 console.log("PROBE_SUMMARY "+JSON.stringify(meta));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
