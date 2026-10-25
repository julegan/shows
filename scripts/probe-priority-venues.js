"use strict";
/* Read-only first-party venue-source audit.
 * Never uses private ticketing APIs, widget keys, security bypasses, or credentials.
 * Do not print HTML wholesale; extract only public context and host-approved links.
 */
const SOURCES=[
 {name:"High Water Mark",url:"https://www.highwatermarklounge.com/"},
 {name:"High Limit Room shows",url:"https://highlimitroompdx.com/shows/"}
];
function decode(s){return String(s||"").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&nbsp;/gi," ").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();}
function host(raw){try{return new URL(raw).hostname}catch(_){return null}}
async function inspect(item){
 const response=await fetch(item.url,{redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-venue-review/0.1"},signal:AbortSignal.timeout(16000)});
 const body=await response.text();
 const result={name:item.name,url:item.url,status:response.status,contentType:response.headers.get("content-type"),bytes:body.length};
 if(response.status!==200||!result.contentType?.includes("text/html"))return result;
 if(body.length>1500000){result.error="HTML exceeds safe parser bounds";return result;}
 const iframes=[...body.matchAll(/<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
  .map(m=>{try{let u=new URL(m[1],item.url);return {origin:u.origin,path:u.pathname}}catch(_){return null}})
  .filter(Boolean).slice(0,8);
 result.iframes=iframes;
 const links=[...body.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
 const hosts=new Map();
 for(const href of links){try{const u=new URL(href,item.url);if(!/^https?:$/.test(u.protocol))continue;const n=hosts.get(u.hostname)||0;hosts.set(u.hostname,n+1)}catch(_){}}
 result.linkHosts=[...hosts].sort((a,b)=>b[1]-a[1]).slice(0,14);
 const likely=links.filter(s=>/afton|tickets|event|venuepilot|treetix|etix|dice\.fm|show/i.test(s))
 .map(s=>{try{const u=new URL(s,item.url);return u.origin+u.pathname}catch(_){return null}})
 .filter(Boolean);
 result.sampleEventLinks=[...new Set(likely)].slice(0,18);
 const clues=[...body.matchAll(/(?:OCTOBER|November|THE WELL|EVENTS?|AFTON|data-[a-z]+|tickets\.|calendar)/gi)].slice(0,25);
 result.contextSamples=clues.map(x=>decode(body.slice(Math.max(0,x.index-90),x.index+190))).filter(x=>x.length>=20).slice(0,12);
 result.hasStructuredEvents=/application\/ld\+json|schema\.org\/(?:Event|MusicEvent)/i.test(body);
 return result;
}
(async()=>{for(const source of SOURCES){try{console.log(JSON.stringify(await inspect(source),null,2))}catch(e){console.log(JSON.stringify({name:source.name,error:String(e.message||e)}))}}})().catch(e=>{console.error(e);process.exitCode=1});
