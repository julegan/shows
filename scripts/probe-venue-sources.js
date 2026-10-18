#!/usr/bin/env node
"use strict";
// Read-only source inspection for connecting venue calendars. No bypass, no auth, no PII.
const urls=[
 "https://highlimitroompdx.com/",
 "https://highlimitroompdx.com/shows/",
 "https://thecoffinclubpdx.com/",
 "https://www.highwatermarklounge.com/",
 "https://bar.blackwaterpdx.com/",
 "https://www.soundcontrolpdx.com/",
 "https://doomtownpdx.com/"
];
const safeUrl=(raw,base)=>{try{const u=new URL(raw,base);if(u.protocol!=="https:")return null;return u.origin+u.pathname;}catch{return null;}};
(async()=>{
 for(const page of urls){
  try{
   const res=await fetch(page,{headers:{"Accept":"text/html","User-Agent":"SHOWS-source-review/0.1"},signal:AbortSignal.timeout(12000),redirect:"error"});
   const html=res.ok?(await res.text()).slice(0,500000):"";
   const attrs=(tag,attr)=>[...html.matchAll(new RegExp("<"+tag+"\\b[^>]*\\b"+attr+"=[\"']([^\"']+)[\"'][^>]*>","gi"))].map(x=>safeUrl(x[1],page)).filter(Boolean);
   const srcs=attrs("iframe","src");
   const links=attrs("a","href").filter(x=>/event|ticket|afton|calendar|show|venuepilot|tree|wp-json|feed/i.test(x));
   const scripts=attrs("script","src").filter(x=>/afton|calendar|event|ticket|widget|wp-content/i.test(x));
   const rawEventLinks=attrs("a","href").filter(x=>x.startsWith(new URL(page).origin)&&!x.endsWith("/")).slice(0,35);
   const highlights=[...html.matchAll(/(venuepilot|afton|iframe|eventbrite|calendar|tickets|show-list|upcoming.shows|bandsintown)/ig)].slice(0,12).map(x=>html.slice(Math.max(0,x.index-90),Math.min(html.length,x.index+125)).replace(/<[^>]*>/g," ").replace(/\\s+/g," ").trim()).filter(x=>x.length>4);
   const jsonld=[...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].slice(0,4).map(x=>{try{const o=JSON.parse(x[1]);return (Array.isArray(o)?o:[o]).map(y=>y["@type"]||"unknown").join(",")}catch{return "unparsable"}});
   console.log(JSON.stringify({page,status:res.status,bytes:html.length,iframes:[...new Set(srcs)].slice(0,15),links:[...new Set(links)].slice(0,18),scripts:[...new Set(scripts)].slice(0,12),rawEventLinks,highlights,jsonld}));
  }catch(err){console.log(JSON.stringify({page,error:String(err.message||err)}));}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
