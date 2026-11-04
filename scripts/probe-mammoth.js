#!/usr/bin/env node
"use strict";
/* Read-only HTML shape probe for an owner-requested original promoter calendar.
 * This workflow is not an importer and must never publish event data.
 */
const url="https://mammothnw.com/events/";
async function load(addr){
 const r=await fetch(addr,{headers:{Accept:"text/html", "User-Agent":"SHOWS-source-research/0.1"},signal:AbortSignal.timeout(18000)});
 if(!r.ok||!r.headers.get("content-type")?.includes("text/html"))throw Error("HTML source unavailable: "+r.status);
 const html=await r.text();
 if(html.length>3_000_000)throw Error("Unbounded HTML response");
 return html;
}
async function main(){
 const html=await load(url);
 const hrefs=[...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1].replace(/&amp;/g,"&"));
 const eventUrls=[...new Set(hrefs.map(raw=>{
  try {
   const u=new URL(raw,url);
   if(u.protocol!=="https:"||!["mammothnw.com","www.mammothnw.com"].includes(u.hostname))return null;
   return /^\/event\/[^/]+\/[^/]+\/[^/]+\/?$/i.test(u.pathname)?u.href:null;
  }catch(_){return null;}
 }).filter(Boolean))];
 console.log("MAMMOTH SHAPE "+JSON.stringify({
  htmlBytes:html.length,officialEventLinks:eventUrls.length,
  paths:eventUrls.slice(0,10).map(u=>new URL(u).pathname),
  scriptTypes:[...new Set([...html.matchAll(/<script\b[^>]*type=["']([^"']+)/gi)].map(m=>m[1]))].slice(0,10)
 }));
 const first=html.search(/\/event\/[^"'\s<>]+\/[^"'\s<>]+\/portland-oregon\//i);
 if(first>=0)console.log("CALENDAR LINK CONTEXT "+html.slice(Math.max(0,first-900),first+900).replace(/\s+/g," ").slice(0,1800));
 const detail=eventUrls.find(u=>u.endsWith("/portland-oregon/"));
 if(!detail)throw Error("No original Portland-specific event permalink");
 const body=await load(detail);
 const h=body.search(/<h1\b/i);
 const date=body.search(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)/i);
 console.log("DETAIL SHAPE "+JSON.stringify({path:new URL(detail).pathname,bytes:body.length,h1At:h,dateAt:date,
   h1Snippet:h>=0?body.slice(h,h+500).replace(/\s+/g," "):null,
   dateSnippet:date>=0?body.slice(Math.max(0,date-190),date+420).replace(/\s+/g," "):null}));
 console.log("PASS — Mammoth live HTML accessible from GitHub runner, original Portland event permalink present");
}
if(require.main===module)main().catch(e=>{console.error("MAMMOTH PROBE FAILED: "+e.message);process.exitCode=1;});
module.exports={main};
