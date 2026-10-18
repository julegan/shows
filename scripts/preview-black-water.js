#!/usr/bin/env node
"use strict";
// Read-only preview of actual future entries on the venue's published calendar.
// Never pushes an event or publishes a flyer; review proposed dates and time status.
const fs=require("node:fs");
const path=require("node:path");
const {parseBlackWaterIcs}=require("./priority-importers");
const {extract,reconcile,parseFile,localDay}=require("./discover-events");
const source=require("../discovery/sources.json").sources.find(x=>x.id==="black-water");
(async()=>{
 const r=await fetch(source.url,{headers:{Accept:"text/calendar","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(16000),redirect:"follow"});
 if(!r.ok||new URL(r.url).hostname!=="calendar.google.com")throw Error("Black Water published Google iCalendar not accessible on approved host");
 const records=parseBlackWaterIcs((await r.text()).slice(0,2000000),source,localDay(new Date()));
 const now=new Date();
 const candidates=records.map(x=>x.hold?x:extract(x,source,now));
 const data=parseFile(fs.readFileSync(path.join(__dirname,"../events.js"),"utf8"));
 const merged=reconcile(data.events,candidates);
 const report={calendarRecords:records.length,proposals:merged.accepted.length,held:merged.held.map(x=>({title:x.title,reason:x.hold,date:x.date})),skipped:merged.skipped.length,
  preview:merged.accepted.map(x=>({id:x.id,date:x.startsAt.slice(0,10),time:x.startTimeKind,title:x.title,source:x.url}))};
 console.log("BLACKWATER_REVIEW_SUMMARY "+JSON.stringify(report));
 // The following is consumed only by review tooling, never rendered as a public listing.
 if(process.env.SHOWS_CANDIDATE_DATA==="1")console.log("BLACKWATER_EVENT_DATA "+JSON.stringify(merged.accepted));
})().catch(e=>{console.error("Black Water live source preview failed: "+String(e.message||e));process.exitCode=1});
