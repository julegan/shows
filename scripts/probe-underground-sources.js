#!/usr/bin/env node
"use strict";
/* Read-only analysis of TWO public venue landing pages; no scraping behind access restrictions. */
const targets=[
 {id:"coffin-club",url:"https://thecoffinclubpdx.com/"},
 {id:"high-limit-room",url:"https://highlimitroompdx.com/shows/"}
];
function summary(id,html){
 const text=String(html||"");
 const attrs=tag=>[...text.matchAll(new RegExp("<"+tag+"\\b[^>]*>","gi"))].map(x=>x[0]);
 const val=(tag,key)=>tag.match(new RegExp("\\b"+key+"\\s*=\\s*([\"'])(.*?)\\1","i"))?.[2]||"";
 const srcs=attrs("iframe").map(x=>val(x,"src")).filter(Boolean);
 const scripts=attrs("script").map(x=>({type:val(x,"type"),src:val(x,"src")})).filter(x=>x.type||x.src);
 const links=attrs("a").map(x=>val(x,"href")).filter(Boolean);
 const titles=[...text.matchAll(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/gi)].map(x=>x[1].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()).filter(Boolean);
 const hosts=x=>{try{const u=new URL(x,id==="coffin-club"?"https://thecoffinclubpdx.com/":"https://highlimitroompdx.com/");return {host:u.hostname,path:u.pathname.slice(0,100),queryKeys:[...u.searchParams.keys()]}}catch(_){return null}};
 const events=links.filter(s=>/event|ticket|shows|calendar|venuepilot|afton/i.test(s)).slice(0,18).map(hosts).filter(Boolean);
 const embed=srcs.slice(0,6).map(hosts).filter(Boolean);
 const ids=[...text.matchAll(/\b(?:widget|iframe|embed|venuepilot|aftontickets|aftonshows|ticketweb|calendar)\b/gi)].length;
 console.log(JSON.stringify({id,bytes:text.length,hasEventSchema:/application\/ld\+json/i.test(text),headingSample:titles.slice(0,12),iframes:embed,scriptSample:scripts.slice(0,8).map(x=>({type:x.type,source:x.src?hosts(x.src):null})),ticketAndEventLinks:events,markupKeywords:ids,contains2026:/\b2026\b/.test(text)}));
}
async function main(){
 for(const {id,url} of targets){
  try{
   const response=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-public-venue-source-audit/0.1"},redirect:"error",signal:AbortSignal.timeout(18000)});
   if(!response.ok){console.log(JSON.stringify({id,status:response.status,accessible:false}));continue;}
   const html=await response.text();
   if(html.length>4000000){console.log(JSON.stringify({id,status:200,oversize:true}));continue;}
   summary(id,html);
  }catch(e){console.log(JSON.stringify({id,error:String(e.message||e)}));}
 }
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={summary,main};
