#!/usr/bin/env node
"use strict";
/* Pull-request-only live probe. No publishing and no repository edits.
 * It verifies the publicly reachable venue pages still conform to the strict parser.
 */
const assert=require("node:assert/strict");
const {parseHostedLinks,parseHostedDetail}=require("./hosted-venue-importers");
const sources=require("../discovery/sources.json").sources;
async function get(url){
 const response=await fetch(url,{redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(16000)});
 if(!response.ok)throw Error(url+" returned HTTP "+response.status);
 if(!response.headers.get("content-type")?.includes("text/html"))throw Error(url+" returned unexpected content type");
 const body=await response.text();
 if(body.length>3000000)throw Error("Page exceeds source size limit");
 return body;
}
async function probe(){
 for(const id of ["roseland","hawthorne-theatre"]){
  const src=sources.find(s=>s.id===id);
  assert(src&&src.adapter==="hosted-venue-html");
  const links=parseHostedLinks(await get(src.url),src);
  const samples=await Promise.all(links.slice(0,8).map(async url=>{
   try{return parseHostedDetail(await get(url),url,src);}
   catch(e){return {hold:String(e.message||e),url};}
  }));
  const accepted=samples.filter(s=>!!s.startDate),held=samples.filter(s=>!!s.hold);
  console.log(JSON.stringify({source:id,officialPagesFound:links.length,sampled:samples.length,valid:accepted.length,held:held.length,examples:accepted.slice(0,3).map(x=>({title:x.title,startsAt:x.startDate,venue:x.venue})),holds:held.slice(0,3).map(x=>x.hold)}));
  if(links.length<2||accepted.length<2)throw Error(id+" source did not produce two verified dated show listings; do not enable scheduled adapter");
 }
 console.log("PASS — live Roseland and Hawthorne primary venue details have explicit dates, performance times and correct venue identity");
}
if(require.main===module)probe().catch(e=>{console.error("LIVE PROBE FAILED: "+e.message);process.exitCode=1});
module.exports={probe};
