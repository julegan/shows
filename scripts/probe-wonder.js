#!/usr/bin/env node
"use strict";
/* Read-only primary venue probe: extracts official Wonder Ballroom page titles,
   date/year/showtime and confirms the event links are still accessible. */
const assert=require("node:assert/strict");
const {parseWonderLinks,parseWonderDetail}=require("./wonder-importer");
const source=require("../discovery/sources.json").sources.find(s=>s.id==="wonder-ballroom");
async function get(url){
 const res=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(16000),redirect:"error"});
 if(!res.ok)throw Error("Official Wonder Ballroom HTTP "+res.status);
 if(!res.headers.get("content-type")?.includes("text/html"))throw Error("Expected primary venue HTML");
 const html=await res.text();
 if(html.length>3000000)throw Error("Source exceeds 3MB limit");
 return html;
}
async function main(){
 assert(source?.adapter==="wonder-ballroom-html","Wonder source must register reviewed parser");
 const links=parseWonderLinks(await get(source.url),source);
 const sample=await Promise.all(links.slice(0,12).map(async url=>{
  try{return parseWonderDetail(await get(url),url,source)}
  catch(e){return {url,hold:String(e.message||e)}}
 }));
 const valid=sample.filter(x=>x.startDate),held=sample.filter(x=>x.hold);
 console.log(JSON.stringify({source:source.id,eventLinks:links.length,sampled:sample.length,valid:valid.length,held:held.length,samples:valid.slice(0,5).map(x=>({title:x.title,when:x.startDate})),holds:held.slice(0,5).map(x=>({url:x.url,reason:x.hold}))}));
 if(links.length<8||valid.length<5)throw Error("Not enough verified Wonder Ballroom events to enable the scheduled adapter");
 console.log("PASS — Wonder Ballroom official event pages contain independent dated-year and showtime evidence");
}
if(require.main===module)main().catch(e=>{console.error("LIVE WONDER SOURCE PROBE FAILED: "+e.message);process.exitCode=1});
module.exports={main};
