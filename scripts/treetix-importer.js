#!/usr/bin/env node
"use strict";
/*
 * Provider-authorized public event listing feed, read-only and editorial review only.
 * TreeTix support supplied the non-proxied host on November 2, 2026.
 * Never delete/cancel a listed event based on absence from a snapshot.
 */
const {time24,wallToPacific}=require("./priority-importers");
const ENDPOINT="https://api.treetix.com/events.json";
const MAX_BYTES=8*1024*1024;
const VENUES={
  "High Water Mark Lounge":true,
  "Dante's":true,
  "Wonder Ballroom":true
};
function calendarFor(source){
  if(source.adapter!=="treetix-public-json")return null;
  return source.id==="high-water"?"highwatermark":source.id==="soundcontrol-pdx"?"soundcontrol":null;
}
const tidy=x=>String(x??"").replace(/<[^>]*>/g," ").replace(/[\r\n\t]+/g," ").replace(/\s+/g," ").trim().slice(0,200);
const eventCalendar=url=>{
  try{
    const u=new URL(url);
    if(u.protocol!=="https:"||u.hostname!=="www.treetix.com"||u.username||u.password||u.port||u.search||u.hash)return null;
    const m=/^\/event\/(\d{1,12})\/(highwatermark|soundcontrol)$/.exec(u.pathname);
    return m?{id:Number(m[1]),calendar:m[2],url:u.href}:null;
  }catch(_){return null;}
};
function artworkEvidence(url,calendar){
  try{
    const u=new URL(url);
    if(u.protocol!=="https:"||u.hostname!=="www.treetix.com"||u.username||u.password||u.port||u.search||u.hash)return null;
    if(!new RegExp("^/templates/"+calendar+"/images/events/[a-zA-Z0-9_./%-]+\\.(?:png|jpg|jpeg|webp)$","i").test(u.pathname)||u.pathname.includes(".."))return null;
    return u.href;
  }catch(_){return null;}
}
function parse(payload,source){
  if(!payload||typeof payload!=="object"||!Array.isArray(payload.events))throw Error("TreeTix events array missing");
  const calendar=calendarFor(source);
  if(!calendar)throw Error("Unrecognized TreeTix source");
  const rows=[],seen=new Set();
  for(const entry of payload.events){
    if(!entry||typeof entry!=="object")continue;
    const identity=eventCalendar(entry.event_url);
    // A multi-producer feed must not silently ingest Peacock or unrelated promoters.
    if(!identity||identity.calendar!==calendar)continue;
    const title=tidy(entry.event_title)||tidy(entry.talent);
    const venue=tidy(entry.venue_name);
    const base={title:title||"Untitled TreeTix event",url:identity.url,venue};
    if(!Number.isSafeInteger(entry.event_id)||entry.event_id<=0||identity.id!==entry.event_id){
      rows.push({...base,hold:"TreeTix ID does not match original ticket permalink"});continue;
    }
    if(seen.has(identity.id)){rows.push({...base,hold:"Duplicate TreeTix event ID in feed"});continue;}
    seen.add(identity.id);
    if(entry.city!=="Portland"||entry.state_abbr!=="OR"||!VENUES[venue]||(calendar==="highwatermark"&&venue!=="High Water Mark Lounge")){
      rows.push({...base,hold:"Unsupported or mismatched original Portland venue; verify manually"});continue;
    }
    if(!title){rows.push({...base,hold:"No verified event title or talent"});continue;}
    const date=entry.start_date,clock=time24(entry.start_time);
    if(typeof date!=="string"||!/^20\d\d-\d\d-\d\d$/.test(date)||!clock||entry.tz!=="US/Pacific"){
      rows.push({...base,hold:"Missing full source date, unambiguous start clock or US/Pacific timezone"});continue;
    }
    const [year,month,day]=date.split("-").map(Number);
    const startDate=wallToPacific(year,month,day,clock);
    if(!startDate){rows.push({...base,hold:"Invalid or DST-conflicting source date/time"});continue;}
    // No image is displayed or hotlinked at this stage; retain original evidence for later rights review.
    const sourceArtworkUrl=artworkEvidence(entry.image_url,calendar);
    rows.push({
      title,fullUrl:identity.url,venue,startDate,
      timeEvidence:"TreeTix published an event start clock; doors versus performance time still requires confirmation.",
      ...(sourceArtworkUrl?{sourceArtworkUrl}:{}),
      originalEventId:identity.id,originalCalendar:calendar,
      sourceMinimumAge:Number.isInteger(entry.minimum_age)?entry.minimum_age:null,
      sourceSoldOut:entry.sold_out===true
    });
  }
  if(!rows.length)throw Error("No target calendar entries; provider coverage needs investigation");
  return rows;
}
let cached;
async function fetchSnapshot(request=fetch){
  const response=await request(ENDPOINT,{method:"GET",redirect:"error",
    headers:{Accept:"application/json","User-Agent":"SHOWS-public-event-feed/1.0"},
    signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw Error("TreeTix feed HTTP "+response.status+"; source unavailable, not empty");
  const reader=response.body?.getReader();
  if(!reader)throw Error("TreeTix response body missing");
  let total=0;const blocks=[];
  while(true){
    const {done,value}=await reader.read();if(done)break;
    total+=value.byteLength;if(total>MAX_BYTES){await reader.cancel();throw Error("TreeTix feed exceeds 8 MiB");}
    blocks.push(Buffer.from(value));
  }
  let json;
  try{json=JSON.parse(Buffer.concat(blocks).toString("utf8"));}catch(_){throw Error("TreeTix response was not JSON");}
  return json;
}
async function fetchEvents(source,{request=fetch}={}){
  // Reuse one read for the two provider calendars in the same discovery run.
  if(request!==fetch)return parse(await fetchSnapshot(request),source);
  if(!cached)cached=fetchSnapshot().catch(e=>{cached=null;throw e;});
  return parse(await cached,source);
}
module.exports={ENDPOINT,MAX_BYTES,calendarFor,eventCalendar,artworkEvidence,parse,fetchSnapshot,fetchEvents};
