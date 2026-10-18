#!/usr/bin/env node
"use strict";
// Read-only source inspection for connecting venue calendars. No bypass, no auth, no PII.
const urls=[
 "https://highlimitroompdx.com/",
 "https://highlimitroompdx.com/shows/",
 "https://thecoffinclubpdx.com/",
 "https://www.highwatermarklounge.com/",
 "https://bar.blackwaterpdx.com/",
 "https://www.soundcontrolpdx.com/",
 "https://doomtownpdx.com/"
];
const safeUrl=(raw,base)=>{try{const u=new URL(raw,base);if(u.protocol!=="https:")return null;return u.origin+u.pathname;}catch{return null;}};

(async()=>{
 // Public iCal export advertised through the venue's calendar integration, no API key needed.
 const feed="https://calendar.google.com/calendar/ical/blackwater.venue.calendar%40gmail.com/public/basic.ics";
 try{
  const r=await fetch(feed,{headers:{Accept:"text/calendar","User-Agent":"SHOWS-public-calendar/0.1"},signal:AbortSignal.timeout(16000),redirect:"follow"});
  const t=r.ok?(await r.text()).slice(0,2000000):"";
  const lines=t.replace(/\r\n[ \t]/g,"").split(/\r?\n/);
  const counts={events:(t.match(/BEGIN:VEVENT/g)||[]).length,dtstart:(t.match(/DTSTART/g)||[]).length,recurrence:(t.match(/^RRULE:/gm)||[]).length};
  const first=lines.filter(x=>/^(SUMMARY|DTSTART|DTEND|URL):/.test(x)).slice(0,12);
  console.log(JSON.stringify({calendar:"Black Water official Google iCal",status:r.status,mime:r.headers.get("content-type"),chars:t.length,counts,first}));
  const vevents=t.split("BEGIN:VEVENT").slice(1).map(x=>x.split("END:VEVENT")[0].replace(/\r?\n[ \t]/g,"")).map(x=>({summary:x.match(/^SUMMARY:(.*)$/m)?.[1],start:x.match(/^DTSTART[^:]*:(.*)$/m)?.[1],end:x.match(/^DTEND[^:]*:(.*)$/m)?.[1],dateParams:x.match(/^DTSTART([^:]*):/m)?.[1],recur:/^RRULE:/m.test(x),status:x.match(/^STATUS:(.*)$/m)?.[1]}));
  const upcoming=vevents.filter(x=>x.start?.slice(0,8)>="20261018").slice(0,25);
  const futureTotal=vevents.filter(x=>x.start?.slice(0,8)>="20261018").length;
  console.log(JSON.stringify({calendar:"Black Water future event diagnostics",futureTotal,upcoming}));
 }catch(e){console.log(JSON.stringify({calendar:"Black Water official Google iCal",error:String(e.message||e)}));}
 for(const page of ["https://highlimitroompdx.com/shows/","https://thecoffinclubpdx.com/"]){
  try{
   const r=await fetch(page,{signal:AbortSignal.timeout(12000),redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-public-calendar/0.1"}});
   const html=r.ok?(await r.text()).slice(0,650000):"";
   const snippets=[];
   const keys=page.includes("highlimit")?["afton-tickets-checkout","_aft('init'"]:["vp-widget","venuepilot.com","vp-config","venuepilot-widget"];
   for(const key of keys){
    const pos=html.indexOf(key);
    if(pos<0)continue;
    let value=html.slice(Math.max(0,pos-110),Math.min(html.length,pos+750))
       .replace(/(apiKey\s*:\s*['"])[^'"]+(['"])/g,"$1[REDACTED]$2")
       .replace(/(token\s*[:=]\s*['"])[^'"]+(['"])/gi,"$1[REDACTED]$2")
       .replace(/\s+/g," ");
    snippets.push({key,value});
   }
   console.log(JSON.stringify({page,status:r.status,snippets}));
  }catch(e){console.log(JSON.stringify({page,error:String(e.message||e)}));}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
