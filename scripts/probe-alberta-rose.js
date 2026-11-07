#!/usr/bin/env node
"use strict";
(async()=>{
 const url="https://albertarosetheatre.com/calendar/";
 const r=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-source-review/0.1"},redirect:"error",signal:AbortSignal.timeout(17000)});
 const html=await r.text();if(!r.ok||html.length>2000000)throw Error("Original source unreachable/oversized");
 const markers=["rhp-mobile-list","rhp-desktop-list","generalView rhp","rhp-events-list-separator-month","eventWrapper rhpSingleEvent","rhpEventSeries rhp-event__single-series--list",
 "rhp-event-series-individual","<!-- end event list wrapper -->","rhp-events-pg-template","viewAsDiv","rhp-event-row","RhpEventsSingle","rhp-events-page-title"];
 for(const marker of markers){
  const arr=[];let i=-1;while((i=html.indexOf(marker,i+1))>=0){arr.push(i);if(arr.length>200)break;}
  console.log("ROSE STATS",marker,arr.length,arr.slice(0,8));
  if(arr.length&&["rhp-mobile-list","rhp-events-list-separator-month","rhpEventSeries rhp-event__single-series--list","eventWrapper rhpSingleEvent"].includes(marker))
   console.log("ROSE SAMPLE",marker,html.slice(Math.max(0,arr[0]-150),arr[0]+300).replace(/\s+/g," ").slice(0,460));
 }
 const start=html.indexOf('rhp-mobile-list');
 const end=html.indexOf('rhp-desktop-list',start+1);
 console.log("ROSE REGION",JSON.stringify({start,end,htmlLength:html.length,partEnd:html.slice(start+180000,start+180500).replace(/\s+/g," ")}));
 const separators=[...html.matchAll(/<span class=['"]rhp-events-list-separator-month[^>]*><span>([^<]+)<\/span><\/span>/gi)].map(x=>({text:x[1],at:x.index}));
 console.log("ROSE HEADERS",JSON.stringify(separators.slice(0,26)));
 const divCount=[...html.matchAll(/<div class\s*=\s*["'][^"']*eventWrapper[^"']*["']/gi)].map(x=>({at:x.index,tag:x[0].slice(0,180)}));
 console.log("ROSE WRAPPERS",JSON.stringify(divCount.slice(0,8)));
 console.log("ROSE WRAPPER COUNT",divCount.length);
 const series=html.indexOf('rhpEventSeries rhp-event__single-series--list');
 console.log("ROSE SERIES TAIL",html.slice(series,series+14500).replace(/\s+/g," ").slice(0,12500));
})();