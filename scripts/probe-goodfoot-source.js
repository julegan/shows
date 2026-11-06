#!/usr/bin/env node
"use strict";
const targets=[
 "https://the1905.turntabletickets.com/",
 "https://the1905.turntabletickets.com/calendar",
 "https://the1905.turntabletickets.com/shows/13202/2026-11-07",
 "https://www.jacklondonrevue.com/calendar/"
];
const needles={
 "https://the1905.turntabletickets.com/":["/shows/13202","Dmitri Matheny","__NUXT_DATA__","data-page","data-react","showlist","data-v-"],
 "https://the1905.turntabletickets.com/calendar":["showlist","events","calendar","date","show_id","showId","__NUXT_DATA__","showtimes"],
 "https://the1905.turntabletickets.com/shows/13202/2026-11-07":["Nicole","6:30","06:30","08:30","showtime","__NUXT_DATA__","data-page","tickets"],
 "https://www.jacklondonrevue.com/calendar/":["CHUCK ISRAELS","MEL BROWN","tw-events","tw_event","ticketweb","event-date","date_time","event_date","2026-11-12","eventid","tw-plugin-calendar-list","tw-cal-event"]
};
(async()=>{
for(const url of targets){
 try{
 const r=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-original-source-review/0.1"},signal:AbortSignal.timeout(16000),redirect:"error"});
 const html=await r.text();if(html.length>3000000)throw Error("oversize");
 console.log("SOURCE DEEP",JSON.stringify({url,status:r.status,len:html.length,bodyEnding:html.slice(-700).replace(/\s+/g," ")}));
 if(!r.ok)continue;
 for(const needle of needles[url]){
   let i=html.indexOf(needle);
   console.log("SOURCE TEXT",needle,i,i<0?"":html.slice(Math.max(0,i-480),Math.min(html.length,i+950)).replace(/\s+/g," ").slice(0,1350));
 }
 const scripts=[...html.matchAll(/<script\b([^>]*)>/gi)].map(x=>x[1]).filter(x=>/src=|type=|id=/.test(x)).slice(-16);
 console.log("SOURCE SCRIPTS",JSON.stringify(scripts).slice(0,2800));
 }catch(e){console.log("SOURCE DEEP ERR "+url+" "+String(e.message||e));}
}
})();