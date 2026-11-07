#!/usr/bin/env node
"use strict";
const urls=[
 "https://albertarosetheatre.com/calendar/",
 "https://albertarosetheatre.com/event/chris-smither-2/alberta-rose-theatre/portland-oregon/",
 "https://albertarosetheatre.com/event/the-next-waltz-15/alberta-rose-theatre/portland-oregon/",
 "https://albertarosetheatre.com/event/mortified-15/alberta-rose-theatre/portland-oregon/"
];
(async()=>{
for(const url of urls){
 try{
  const r=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-original-source-research/0.1"},redirect:"error",signal:AbortSignal.timeout(18000)});
  const html=await r.text();
  console.log("ROSE URL",JSON.stringify({url,status:r.status,size:html.length,ct:r.headers.get("content-type")}));
  if(!r.ok||html.length>1900000)continue;
  for(const needle of ['rhp-event', 'rhp-event__date--list','rhp-event__time-text--list','rhp-event__info--list','rhp-event-list-cta','rhp-event-series','rhp-events-pg-template','rhp-event__title--list','rhp-event__title','rhp-event__category','eventStDate','eventDateList','event-series','rhp-event-sched','eventStDate','eventShowTime','eventDoorStartDate']){
   const i=html.indexOf(needle,html.indexOf("<body"));
   if(i>=0)console.log("ROSE FIELD",needle,i,html.slice(Math.max(0,i-260),i+750).replace(/\s+/g," ").slice(0,1000));
  }
  const base=url.endsWith("/calendar/");
  if(base){
   for(const needle of ['href="https://albertarosetheatre.com/event/chris-smither','href="https://albertarosetheatre.com/event/live-wire','href="https://albertarosetheatre.com/calendar/category/series/','rhp-event-list','rhp-event-series','rhp-event__series']){
    let idx=html.indexOf(needle,html.indexOf("<body"));
    console.log("ROSE ANCHOR",needle,idx,idx>0?html.slice(idx-1100,idx+2700).replace(/\s+/g," ").slice(0,3800):"");
   }
   const possible=[...html.matchAll(/<div\b[^>]*class="[^"]*(?:rhp-event|eventWrapper|eventBlock)[^"]*"[^>]*>/gi)].slice(0,28);
   console.log("ROSE DIVS",JSON.stringify(possible.map(x=>x[0].slice(0,250))));
   console.log("ROSE EVENT LINKS",JSON.stringify([...new Set([...html.matchAll(/<a[^>]+href="(https:\/\/albertarosetheatre\.com\/event\/[^"]+)"/gi)].map(x=>x[1]))].slice(0,45)));
  }else{
   for(const needle of ['application/ld+json','rhp-event-single','event-details','eventVenue','eventStDate','eventDoorStartDate','rhp-event-series-list','rhp-event-series-individual','showTime','Show:','Doors:','event-detail','eventDescription']){
    const i=html.indexOf(needle,html.indexOf("<body"));
    if(i>=0)console.log("ROSE DETAIL",needle,i,html.slice(Math.max(i-250,0),i+1000).replace(/\s+/g," ").slice(0,1200));
   }
  }
 }catch(e){console.log("ROSE ERR",url,e.message);}
}
})();