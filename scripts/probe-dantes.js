#!/usr/bin/env node
"use strict";
/* Read-only Dante's calendar health probe. No files written and no event publication. */
const assert=require("node:assert/strict");
const {parseDantesLinks,parseDantesDetail}=require("./dantes-importer");
const source=require("../discovery/sources.json").sources.find(s=>s.id==="dantes");
async function fetchPage(url){
 const res=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},redirect:"error",signal:AbortSignal.timeout(16000)});
 if(!res.ok)throw Error("Official Dante's site HTTP "+res.status);
 if(!res.headers.get("content-type")?.includes("text/html"))throw Error("Official Dante's site did not return HTML");
 const body=await res.text();
 if(body.length>2200000)throw Error("Page exceeded size limit");
 return body;
}
async function main(){
 assert(source&&source.adapter==="dantes-live-html");
 const links=parseDantesLinks(await fetchPage(source.url),source);
 const rows=await Promise.all(links.slice(0,12).map(async url=>{
  try{return parseDantesDetail(await fetchPage(url),url,source)}
  catch(e){return {url,hold:String(e.message||e)}}
 }));
 const valid=rows.filter(x=>x.startDate);
 const held=rows.filter(x=>x.hold);
 console.log(JSON.stringify({source:source.id,eventLinks:links.length,sampled:rows.length,valid:valid.length,held:held.length,samples:valid.slice(0,5).map(x=>({title:x.title,when:x.startDate,venue:x.venue})),holds:held.slice(0,5).map(x=>({url:x.url,reason:x.hold}))}));
 if(links.length<8||valid.length<4)throw Error("Dante's importer did not verify enough primary event detail showtimes; leave source disabled");
 console.log("PASS — live Dante's showtime and event-detail source verified");
}
if(require.main===module)main().catch(e=>{console.error("LIVE SOURCE PROBE FAILED: "+e.message);process.exitCode=1});
module.exports={main};
