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
 const portland=eventUrls.filter(u=>new URL(u).pathname.endsWith("/portland-oregon/"));
 const rooms={};for(const u of portland){const room=new URL(u).pathname.split("/")[3];rooms[room]=(rooms[room]||0)+1;}
 console.log("PORTLAND ROOMS "+JSON.stringify({count:portland.length,rooms}));
 for(const room of ["hawthorne-theatre-lounge","peters-room-roseland-theatre","high-limit-room","roseland-theater"]){
  const sample=portland.find(u=>new URL(u).pathname.split("/")[3]===room);
  if(!sample)continue;
  try{
   const detail=await load(sample);
   const plain=detail.replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/gi," ").replace(/&#8217;/gi,"'").replace(/\s+/g," ");
   const hit=plain.search(/\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+20\d\d/);
   console.log("ROOM DETAIL "+JSON.stringify({room,path:new URL(sample).pathname,heading:(detail.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||"").replace(/<[^>]+>/g," ").trim().slice(0,140),date:hit>=0?plain.slice(hit,hit+180):null,containsDoor:/Doors:\s*\d/.test(plain),containsShow:/Show:\s*\d/.test(plain)}));
  }catch(e){console.log("ROOM DETAIL ERROR "+room+" "+e.message);}
 }
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
 const mammoth=require("./mammoth-importer");
 const parsed=await mammoth.fetchEvents();
 console.log("MAMMOTH ADAPTER "+JSON.stringify({total:parsed.length,verified:parsed.filter(x=>x.startDate).length,held:parsed.filter(x=>x.hold).length,
  verifiedItems:parsed.filter(x=>x.startDate).map(x=>({title:x.title,venue:x.venue,date:x.startDate,url:x.fullUrl})),
  holds:parsed.filter(x=>x.hold).map(x=>({url:x.url,reason:x.hold}))}));
 if(parsed.filter(x=>x.startDate).length<3)throw Error("Not enough original room-specific event records verified to enable importer");
 console.log("PASS — Mammoth original room events have validated full-year show dates and exact Portland venue identity");
}
if(require.main===module)main().catch(e=>{console.error("MAMMOTH PROBE FAILED: "+e.message);process.exitCode=1;});
module.exports={main};
