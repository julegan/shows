#!/usr/bin/env node
"use strict";
const targets=[
 {id:"coffin-home",url:"https://thecoffinclubpdx.com/"},
 {id:"coffin-json",url:"https://thecoffinclubpdx.com/?format=json-pretty"},
 {id:"high-shows",url:"https://highlimitroompdx.com/shows/"},
 {id:"high-home",url:"https://highlimitroompdx.com/"}
];
function around(html,re,limit=5){
 const result=[];
 for(const m of String(html).matchAll(re)){
  if(result.length>=limit)break;
  result.push(html.slice(Math.max(0,m.index-85),Math.min(html.length,m.index+200)).replace(/\s+/g," ").slice(0,260));
 }
 return result;
}
function safeSummary(id,body,type){
 const out={id,bytes:body.length,type};
 if(type.includes("json")||body.trimStart().startsWith("{")){
  try{
   const d=JSON.parse(body);out.parsedJson=true;out.rootKeys=Object.keys(d).slice(0,20);
   out.collectionKeys=Object.keys(d.collection||{}).slice(0,18);
   out.itemCount=[d.upcoming?.length,d.items?.length,d.collection?.items?.length].filter(Number.isInteger);
   out.itemTitles=(d.items||d.collection?.items||[]).slice(0,4).map(x=>x.title||x.name||Object.keys(x).slice(0,10));
  }catch(e){out.parsedJson=false;out.jsonError=String(e.message).slice(0,90);}
 }else{
  out.embedSnippets=around(body,/iframe|afton(?:tickets|shows)?|venuepilot|(?:event|ticket)(?:s)?-widget|google\.com\/calendar/gi,12);
  out.dateSnippets=around(body,/2026|2027|oct(?:ober)?\s+2[0-9]|nov(?:ember)?\s+[0-9]/gi,3);
  out.externalScriptHosts=[...new Set([...body.matchAll(/<script\b[^>]*\bsrc=["'](https?:\/\/[^"']+)/gi)].map(m=>{try{return new URL(m[1]).hostname}catch(_){return ""}}))].slice(0,12);
 }
 console.log(JSON.stringify(out));
}
async function main(){
 for(const t of targets){
  try{
   const r=await fetch(t.url,{headers:{Accept:"text/html,application/json","User-Agent":"SHOWS-venue-source-audit/0.1"},redirect:"error",signal:AbortSignal.timeout(16000)});
   if(!r.ok){console.log(JSON.stringify({id:t.id,status:r.status}));continue;}
   const body=await r.text();if(body.length>4000000)throw Error("Response size cap exceeded");
   safeSummary(t.id,body,r.headers.get("content-type")||"unknown");
  }catch(e){console.log(JSON.stringify({id:t.id,error:String(e.message||e)}))}
 }
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={main,safeSummary};
