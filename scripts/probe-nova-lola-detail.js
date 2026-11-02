#!/usr/bin/env node
"use strict";
/* Field-level read-only schema preview on original venue pages.
 * No personal information, entire bodies, tracking parameters or credentials.
 */
const {PAGES}=require("./probe-nova-lolas");
const URLS=[
 {id:"nova-calendar-schema",url:PAGES[0].url},
 {id:"lolas-nov14",url:"https://www.mcmenamins.com/events/278429-2000s-dance-flashback"},
 {id:"lolas-nov21",url:"https://www.mcmenamins.com/events/278428-2010s-dance-flashback"}
];
const {URL}=require("node:url");
function safeUrl(str){
 try {const u=new URL(str);return u.protocol==="https:"&&!u.username&&!u.password?u.origin+u.pathname:null;}
 catch(_){return null;}
}
async function read(url){
 const r=await fetch(url,{headers:{"User-Agent":"SHOWS-event-review/0.1",Accept:"text/html"},redirect:"error",signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error("Official source unavailable HTTP "+r.status);
 const contentType=r.headers.get("content-type")||"";
 if(!contentType.includes("text/html"))throw Error("Official source not HTML");
 const buf=await r.arrayBuffer();if(buf.byteLength>350_000)throw Error("Official source exceeds bounded review page");
 return new TextDecoder().decode(buf);
}
function sample(html,id){
 const clean=x=>String(x||"").replace(/<[^>]*>/g," ").replace(/&(?:nbsp|amp|quot|#39);/g," ").replace(/\s+/g," ").trim();
 const yearDate=/\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+20\d{2}\b/i;
 if(id.startsWith("nova")){
  const events=[];
  for(const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
   try{
    const item=JSON.parse(m[1]);const nodes=Array.isArray(item)?item:Array.isArray(item["@graph"])?item["@graph"]:[item];
    for(const n of nodes){
     const types=Array.isArray(n["@type"])?n["@type"]:[n["@type"]];
     if(!types.some(t=>/Event$/.test(String(t||""))))continue;
     events.push({name:String(n.name||"").slice(0,125),startDate:n.startDate||null,endDate:n.endDate||null,url:safeUrl(n.url),eventStatus:n.eventStatus||null,
      venueName:n.location?.name||null,venueAddress:typeof n.location?.address==="object"?{streetAddress:n.location.address.streetAddress,addressLocality:n.location.address.addressLocality}:null,
      offersUrl:safeUrl(n.offers?.url),image:typeof n.image==="string"?safeUrl(n.image):null,keys:Object.keys(n).slice(0,25)});
    }
   }catch(_){}
  }
  return {id,eventsCount:events.length,events:events.slice(0,5)};
 }
 const stripped=clean(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," "));
 const date=yearDate.exec(stripped),idx=date?.index??-1;
 const context=idx<0?null:stripped.slice(Math.max(0,idx-130),idx+380);
 const headers=[...html.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map(x=>clean(x[1])).filter(Boolean).slice(0,15);
 return {id,dateEvidence:date?.[0]||null,context,headers,
  lolaMentions:(stripped.match(/Lola(?:'|’)?s Room/gi)||[]).length,
  roomWording:stripped.match(/Crystal Ballroom\s*[-–]\s*Lola(?:'|’)?s Room/i)?.[0]||null};
}
async function main(){
 for(const x of URLS){
  try{console.log(JSON.stringify(sample(await read(x.url),x.id),null,2));}
  catch(e){console.error("READ-ONLY DETAIL HOLD "+x.id+": "+String(e.message||e));process.exitCode=1;}
 }
}
if(require.main===module)main();
module.exports={sample,safeUrl};
