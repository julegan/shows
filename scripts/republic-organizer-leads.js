#!/usr/bin/env node
"use strict";
/* Eventbrite organizer-event evidence for Republic: REPORT ONLY. */
const fs=require("node:fs");
const path=require("node:path");
const conf=require("../discovery/republic-organizer-watch.json");
const REPORT=path.join(__dirname,"../discovery/republic-organizer-leads-review.md");
const MAX_BYTES=500000;
const EVENT_URL=/^https:\/\/www\.eventbrite\.com\/e\/[a-z0-9-]+-tickets-\d{10,16}\/?$/;
const clean=x=>String(x||"").replace(/[|\n\r\t]/g," ").replace(/[<>]/g,"").replace(/\s+/g," ").trim().slice(0,220);
function localDay(date){
 const d=new Date(date);if(!Number.isFinite(d.getTime()))return null;
 if(!/^20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d(?:Z|[+-]\d\d:\d\d)$/.test(String(date||"")))return null;
 const p=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(d);
 const get=k=>p.find(x=>x.type===k)?.value;
 return get("year")+"-"+get("month")+"-"+get("day")+" "+get("hour")+":"+get("minute")+" Pacific";
}
function parse(html,url,now=new Date()){
 if(typeof html!=="string"||html.length>MAX_BYTES)throw Error("Organizer event HTML absent or exceeds size limit");
 if(!EVENT_URL.test(url))throw Error("Original event-specific Eventbrite URL not allowlisted");
 const scripts=[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
 if(!scripts.length||scripts.length>30)throw Error("No bounded organizer structured data");
 const events=[];
 for(const m of scripts){
  try{
   const obj=JSON.parse(m[1]);
   for(const e of Array.isArray(obj)?obj:[obj]){
    const types=Array.isArray(e?.["@type"])?e["@type"]:[e?.["@type"]];
    if(types.includes("Event"))events.push(e);
   }
  }catch(_){}
 }
 if(events.length!==1)throw Error("Organizer page lacks a singular original event");
 const ev=events[0];
 if(ev.url!==url)throw Error("Eventbrite JSON-LD URL mismatch");
 if(ev.eventStatus!=="https://schema.org/EventScheduled")throw Error("Original event not currently scheduled");
 const addr=ev.location?.address||{};
 const street=String(addr.streetAddress||"").toLowerCase().replace(/[,.]/g," ").replace(/\s+/g," ");
 if(!/^222\s+(?:nw|northwest)\s+(?:4th|fourth)\s+(?:ave|avenue)\b/.test(street)||
   String(addr.addressLocality||"").toLowerCase()!=="portland"||
   !/^(?:OR|Oregon)$/i.test(String(addr.addressRegion||""))||
   !/republic\s*cafe.*ming\s*lounge|ming\s*lounge.*republic\s*cafe/i.test(String(ev.location?.name||"")))
  throw Error("Organizer venue address or identity differs from Republic/Ming");
 const name=clean(ev.name),org=clean(ev.organizer?.name),orgUrl=String(ev.organizer?.url||"");
 const expected=conf.organizers.find(x=>x.kind==="organizer-original-ticket"&&x.eventUrl===url);
 if(!name||!expected||org!==expected.name||orgUrl!==expected.url)
  throw Error("Original organizer or title mismatch");
 const local=localDay(ev.startDate),start=new Date(ev.startDate),end=new Date(ev.endDate);
 if(!local||!Number.isFinite(start.getTime())||start.getTime()<now.getTime()-86400000||
   start.getTime()>now.getTime()+366*86400000||
   !Number.isFinite(end.getTime())||end<=start)
  throw Error("Original event date expired, invalid or too far in future");
 const offers=Array.isArray(ev.offers)?ev.offers:[ev.offers];
 if(!offers.some(o=>o?.url===url))throw Error("Original organizer ticket offer mismatch");
 return {title:name,originalUrl:url,organizer:org,room:clean(ev.location.name),startsAt:local,
  utc:start.toISOString(),endsAt:localDay(ev.endDate),lineup:clean(ev.description),
  editorialStatus:"REVIEW ONLY: Verify genre, cancellation, doors and original artwork rights; not automatically published"};
}
async function read(url,request=fetch,now=new Date()){
 if(!EVENT_URL.test(url)||!conf.eventUrls.includes(url))throw Error("Unapproved original organizer ticket URL");
 const r=await request(url,{redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-review-only/0.1"},signal:AbortSignal.timeout(15000)});
 if(!r.ok||!String(r.headers.get("content-type")||"").toLowerCase().includes("text/html"))
  throw Error("Original organizer ticket unavailable HTTP "+r.status);
 const reader=r.body?.getReader();if(!reader)throw Error("Organizer page body unreadable");
 let size=0;const chunks=[];
 for(;;){
  const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
  if(size>MAX_BYTES){await reader.cancel();throw Error("Original ticket HTML exceeds size limit");}
  chunks.push(Buffer.from(value));
 }
 return parse(Buffer.concat(chunks).toString("utf8"),url,now);
}
function report(rows,holds){
 const lines=["# Republic Cafe / Ming Lounge — original organizer ticket leads (review-only)","",
 "This report monitors explicit public event-specific organizer ticket pages. It is NOT a venue feed. It never imports events, downloads images, or invents weekly Headspace Circus dates.","",
 "**"+rows.length+" verified original organizer leads; "+holds.length+" holds; 0 automatically approved.**","","| Original organizer ticket | Local event time | Organizer / venue | Next review |","| --- | --- | --- | --- |"];
 for(const x of rows)
  lines.push("| ["+clean(x.title)+"]("+x.originalUrl+") | "+clean(x.startsAt)+" | "+clean(x.organizer)+" / "+clean(x.room)+" | Validate genre relevance, doors (organizer ticket states 7:30 PM), event status, "+clean(x.lineup)+" and flyer permissions |");
 for(const x of holds)lines.push("","**Source hold:** "+clean(x.url)+" — "+clean(x.reason));
 lines.push("","Other promoter leads for research, not dated shows: Headspace Circus, Group Sound, Be Yourself PDX, Tarantella. Historical organizer pages are NOT evidence of ongoing dates.","",
 "Add future event-specific original ticket URLs only after independent verification. A changed or missing page cannot remove approved SHOWS events.","");
 return lines.join("\n")+"\n";
}
async function main(){
 const rows=[],holds=[];
 for(const url of conf.eventUrls)try{rows.push(await read(url));}
 catch(e){holds.push({url,reason:String(e.message||e)});}
 fs.writeFileSync(REPORT,report(rows,holds));
 console.log("Republic/Ming original tickets: "+rows.length+" verified leads, "+holds.length+" held, 0 published.");
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={EVENT_URL,MAX_BYTES,localDay,parse,read,report};
