#!/usr/bin/env node
"use strict";
/* Read-only first party source discovery; no event changes or publication. */
const targets=[
 {id:"starday",url:"https://stardaytavern.com/",terms:["FullCalendar","fullcalendar","The Events Calendar","calendar","eventClick","ics","eventSources","wp-json","event_date","2026-10-24"]},
 {id:"kenton",url:"https://www.kentonclub.com/",terms:["Friday October 23","Friday November 6","squarespace","2026","2027","datetime","json-ld","event-time","event-details"]},
 {id:"doomtown",url:"https://doomtownpdx.com/",terms:["November 20, 2026","entry-title","entry-date","wp-json","type=\"application/ld+json\"","updated","hentry","post-"]},
 {id:"doomtown-api",url:"https://doomtownpdx.com/wp-json/wp/v2/posts?per_page=4",json:true},
 {id:"starday-api",url:"https://stardaytavern.com/wp-json/wp/v2",json:true}
];
function around(s,word){const i=s.toLowerCase().indexOf(word.toLowerCase());return i<0?null:s.slice(Math.max(0,i-300),i+850).replace(/\s+/g," ").slice(0,1150)}
(async()=>{
 for(const t of targets){
  try{
   const response=await fetch(t.url,{headers:{Accept:t.json?"application/json":"text/html","User-Agent":"SHOWS-original-source-audit/0.1"},redirect:"error",signal:AbortSignal.timeout(18000)});
   if(!response.ok){console.log(JSON.stringify({id:t.id,status:response.status}));continue}
   const body=await response.text();if(body.length>2200000)throw Error("Too large");
   if(t.id==="starday"){
    const index=body.indexOf("2026-10-24T21:00:00-07:00");
    const matches=[...body.matchAll(/data-settings="([^"]*)"/gi)];
    const candidates=matches.filter(m=>m[1].includes("&quot;google_event_id&quot;"));
    const decode=x=>x.replace(/&quot;/g,'"').replace(/&amp;/g,"&").replace(/&#0?39;|&apos;/g,"'");
    const info=candidates.map(m=>{try{const x=JSON.parse(decode(m[1]));const keys=Object.keys(x);const result=Object.entries(x).filter(([,v])=>Array.isArray(v)).map(([k,v])=>({key:k,count:v.length,sample:v[0]}));return {length:m[1].length,keys,arrays:result}}catch(e){return {length:m[1].length,error:String(e),head:m[1].slice(0,150)}}});
    console.log(JSON.stringify({id:"starday-settings",attributes:matches.length,candidates:info.slice(0,3)}));
   }
   if(t.json){
    const o=JSON.parse(body);
    const arr=Array.isArray(o)?o:[o];
    console.log(JSON.stringify({id:t.id,bytes:body.length,keys:Object.keys(o),sample:arr.slice(0,2).map(x=>({id:x.id,date:x.date,modified:x.modified,link:x.link,title:x.title?.rendered||x.name,acf:x.acf,meta:x.meta,contentSample:x.content?.rendered?.slice(0,1000)}))}));
   }else{
    const contexts=Object.fromEntries(t.terms.map(term=>[term,around(body,term)]).filter(([,s])=>s));
    const links=[...new Set([...body.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(x=>x[1]).filter(u=>/calendar|event|shows|post|wordpress|2026/i.test(u)))].slice(0,18);
    console.log(JSON.stringify({id:t.id,bytes:body.length,contexts,links}));
   }
  }catch(e){console.log(JSON.stringify({id:t.id,error:String(e.message||e)}))}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
