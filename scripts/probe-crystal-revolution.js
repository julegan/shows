#!/usr/bin/env node
"use strict";
/* Read-only official venue discovery audit. Deliberately no event publication.
 * Outputs hosts/counts only, not arbitrary private page contents. */
const SOURCES=[
 {id:"crystal-ballroom",url:"https://www.mcmenamins.com/to-do/live-music-events"},
 {id:"crystal-specific",url:"https://www.mcmenamins.com/crystal-ballroom/music-events/"},
 {id:"revolution-hall",url:"https://www.revolutionhall.com/"}
];
const canonical=(candidate,base)=>{try{const u=new URL(candidate.replace(/&amp;/g,"&"),base);if(u.protocol!=="https:"||u.username||u.password)return null;return u;}catch(_){return null;}};
function audit(html,base,id){
 const links=[...String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m=>canonical(m[1],base)).filter(Boolean);
 const uniq=a=>[...new Set(a)];
 const mc=uniq(links.filter(u=>u.hostname==="www.mcmenamins.com"&&/^\/events\/\d+-/i.test(u.pathname)).map(u=>u.pathname));
 const et=uniq(links.filter(u=>/etix\.com$/.test(u.hostname)&&/ticket|event/i.test(u.pathname)).map(u=>u.hostname+u.pathname));
 const htmlText=String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ");
 return {id,bytes:html.length,primaryMcEvents:mc.length,mcExamples:mc.slice(0,5),etixLinks:et.length,etixExamples:et.slice(0,4),mentionsCrystal:(htmlText.match(/Crystal Ballroom/g)||[]).length,mentionsRevolution:(htmlText.match(/Revolution Hall/g)||[]).length,mentionsShowBar:(htmlText.match(/Show Bar/g)||[]).length,yearCount:(htmlText.match(/\b2026\b/g)||[]).length,hasSchema:/application\/ld\+json/i.test(html)};
}
async function main(){
 for(const entry of SOURCES){
  try{
   const r=await fetch(entry.url,{headers:{Accept:"text/html","User-Agent":"SHOWS-primary-venue-source-check/0.1"},redirect:"error",signal:AbortSignal.timeout(18000)});
   if(!r.ok){console.log(JSON.stringify({id:entry.id,status:r.status,sourceReady:false}));continue;}
   if(!r.headers.get("content-type")?.includes("text/html"))throw Error("Unexpected source content type");
   const html=await r.text();if(html.length>3500000)throw Error("Source too large");
   console.log(JSON.stringify(audit(html,entry.url,entry.id)));
  }catch(e){console.log(JSON.stringify({id:entry.id,error:String(e.message||e),sourceReady:false}));}
 }
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={audit,main};
