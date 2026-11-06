#!/usr/bin/env node
"use strict";
const urls=["https://www.albertastreetpub.com/music?format=json",
 "https://www.albertastreetpub.com/music","https://www.albertastreetpub.com/"];
(async()=>{
 for(const url of urls){
 try{
  const r=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(16000),
   headers:{Accept:"application/json, text/html","User-Agent":"SHOWS-original-source-review/0.1"}});
  const body=await r.text();
  console.log("ALBERTA SOURCE",JSON.stringify({url,status:r.status,type:r.headers.get("content-type"),length:body.length,redirect:r.url}));
  if(body.length>3000000)throw Error("Too large for bounded research");
  if(body.trim().startsWith("{")){
   const data=JSON.parse(body);
   console.log("ALBERTA DETAIL",JSON.stringify({pagination:data.pagination,calendarView:data.calendarView,collectionItemCount:data.collection?.itemCount,upcomingCount:data.upcoming?.length,examples:(data.upcoming||[]).slice(0,7).map(e=>({title:e.title,location:e.location,customContent:e.customContent,startDate:e.startDate,endDate:e.endDate,sourceUrl:e.sourceUrl,assetUrl:e.assetUrl,fullUrl:e.fullUrl,categories:e.categories,tags:e.tags,excerpt:e.excerpt?.slice(0,150)}))}).slice(0,11500));
   console.log("ALBERTA JSON",JSON.stringify({keys:Object.keys(data),upcomingKeys:Object.keys(data.upcoming||{}),upcomingSample:(data.upcoming||[]).slice(0,2).map(x=>({keys:Object.keys(x),title:x.title,startDate:x.startDate,startTime:x.startTime,fullUrl:x.fullUrl,assetUrl:x.assetUrl,urlId:x.urlId,body:x.body?.slice(0,300)})),collection:Object.keys(data.collection||{}),items:(data.items||[]).slice(0,3).map(x=>({keys:Object.keys(x),title:x.title,startDate:x.startDate,fullUrl:x.fullUrl,urlId:x.urlId,assetUrl:x.assetUrl,body:x.body?.slice(0,300)}))}).slice(0,12000));
  }else if(r.ok){
   for(const key of ["eventlist-event","eventlist-datetag","eventlist-title","eventlist-meta","eventlist-time","data-start-date","data-end-date","sqs-block-calendar","application/ld+json","/music/2026"]){
    const p=body.indexOf(key);
    if(p>=0)console.log("ALBERTA MARKER",key,p,body.slice(Math.max(0,p-200),p+650).replace(/\s+/g," ").slice(0,850));
   }
   console.log("ALBERTA LINKS",JSON.stringify([...body.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(x=>x[1]).filter(x=>/\/music\//.test(x)).slice(0,16)));
  }
 }catch(e){console.log("ALBERTA ERROR "+url+" "+String(e.message||e));}
 }
})();
