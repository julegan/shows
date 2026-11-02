#!/usr/bin/env node
"use strict";
const PAGES=[
 {id:"homepage",url:"https://www.showdownpdx.com/"},
 {id:"page2",url:"https://www.showdownpdx.com/page/2/"},
 {id:"event",url:"https://www.showdownpdx.com/tm-event/"}
];
const safe=(x,base)=>{
 try {const u=new URL(x,base);return u.protocol==="https:"&&u.hostname==="www.showdownpdx.com"&&!u.username&&!u.password&&!u.port?u.origin+u.pathname:null;}
 catch{return null}
};
async function get(url){
 const r=await fetch(url,{redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(12000)});
 if(!r.ok||!r.headers.get("content-type")?.includes("text/html"))throw Error("official page HTTP "+r.status);
 const t=await r.text();if(t.length>1400000)throw Error("source larger than bounded 1.4 MB");
 return t;
}
async function main(){
 for(const page of PAGES) {
  try{
   const raw=await get(page.url);
   const links=[...new Set([...raw.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m=>safe(m[1],page.url)).filter(Boolean))];
   const original=links.filter(x=>/\/tm-event\//.test(x)).slice(0,20);
   const pagination=links.filter(x=>/\/(?:page\/\d+|events\/page\/\d+|event\/page\/\d+)\/?$/.test(x)).slice(0,15);
   const nodes=Object.fromEntries(["tw-section","tw-name","tw-event-date","tw-event-time","event-card","event-list","tw-event"].map(x=>[x,(raw.match(new RegExp(x,"g"))||[]).length]));
   const first=raw.search(/<div class="tw-section\b/);
   const jsonld=[...raw.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].slice(0,3).map(m=>m[1].slice(0,700));
   console.log(JSON.stringify({id:page.id,url:page.url,bytes:raw.length,
    nodes,original,pagination,firstEventHtml:first<0?null:raw.slice(first,first+4300),
    jsonld,allEventUrlCount:links.filter(x=>x.includes("/tm-event/")).length},null,2));
  }catch(e){console.error(page.id+": "+String(e.message||e));process.exitCode=1;}
 }
}
if(require.main===module)main();
module.exports={PAGES,get,safe};
