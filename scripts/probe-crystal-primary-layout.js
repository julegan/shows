#!/usr/bin/env node
"use strict";
/* One-time read-only study of OFFICIAL Crystal Ballroom website. No publishing. */
const urls=[
 ["home","https://www.crystalballroompdx.com/"],
 ["events","https://www.crystalballroompdx.com/events/"],
 ["prior-official-show","https://www.crystalballroompdx.com/events/269053-magdalena-bay/"]
];
function excerpt(s,i,size=340){return s.slice(Math.max(0,i-100),Math.min(s.length,i+size)).replace(/\s+/g," ").slice(0,size+100)}
function inspect(html,url,id){
 const links=[...html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)].map(x=>x[1]);
 const originals=[...new Set(links.map(x=>{try{return new URL(x,url).href}catch(_){return null}}).filter(x=>/^https:\/\/www\.crystalballroompdx\.com\/events\/\d+-[a-z0-9-]+\/?(?:[#?].*)?$/i.test(x)))];
 const contexts={};
 for(const key of ["October","November","2026","2027","event-card","event-list","event-date","doors","show","datetime","startDate","Lola","Ringlers","venueid","event-item"]){
  const i=html.toLowerCase().indexOf(key.toLowerCase());
  if(i!==-1)contexts[key]=excerpt(html,i,300);
 }
 const scripts=[...new Set([...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map(x=>x[1]))].slice(0,12);
 return {id,bytes:html.length,eventLinks:originals.length,sample:originals.slice(0,8),contexts,scripts,structured:html.includes("application/ld+json")};
}
(async()=>{
 for(const [id,url] of urls){
  try{
   const response=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-venue-discovery/0.1"},redirect:"error",signal:AbortSignal.timeout(18000)});
   if(!response.ok){console.log(JSON.stringify({id,url,status:response.status}));continue;}
   const html=await response.text();if(html.length>4000000)throw Error("Source over size limit");
   console.log(JSON.stringify(inspect(html,url,id)));
  }catch(e){console.log(JSON.stringify({id,url,error:String(e.message||e)}));}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
