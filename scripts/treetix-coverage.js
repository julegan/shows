#!/usr/bin/env node
"use strict";
/*
 * Reconcile the whole provider-authorized TreeTix snapshot, not only the
 * producer calendars the existing importer accepts.
 *
 * This is evidence/review output only: it never writes events.js or approves
 * records from newly encountered producers or venues.
 */
const fs=require("node:fs");
const path=require("node:path");
const treetix=require("./treetix-importer");
const root=path.resolve(__dirname,"..");
const ENDPOINT=treetix.ENDPOINT;
const norm=x=>String(x??"").toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const clean=x=>String(x??"").replace(/<[^>]+>/g," ").replace(/[\r\n\t]+/g," ")
  .replace(/\s+/g," ").trim().slice(0,180);
const markdown=x=>clean(x).replace(/[|[\]*_]/g," ").replace(/\s+/g," ");
function dayValid(day){
 if(typeof day!=="string"||!/^20\d\d-\d\d-\d\d$/.test(day))return false;
 const d=new Date(day+"T12:00:00Z");
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===day;
}
function addDays(day,n){
 if(!dayValid(day))throw Error("Invalid reporting day");
 const d=new Date(day+"T12:00:00Z");
 d.setUTCDate(d.getUTCDate()+n);
 return d.toISOString().slice(0,10);
}
function providerIdentity(link){
 try{
  const u=new URL(link);
  if(u.origin!=="https://www.treetix.com"||u.username||u.password||u.port||u.search||u.hash)return null;
  const m=/^\/event\/([1-9]\d{0,11})\/([a-z0-9][a-z0-9_-]{0,80})$/i.exec(u.pathname);
  return m?{id:Number(m[1]),calendar:m[2].toLowerCase(),url:u.href}:null;
 }catch(_){return null;}
}
function indexed(events){
 const byKey=new Map(),byTitle=new Map();
 for(const event of events){
  const keys=new Set();
  if(event.sourceCalendar&&Number.isSafeInteger(Number(event.sourceEventId))&&Number(event.sourceEventId)>0)
   keys.add(String(event.sourceCalendar).toLowerCase()+":"+Number(event.sourceEventId));
  for(const url of [event.url,...(event.sources||[]).map(s=>s.url)]){
   const ident=providerIdentity(url);
   if(ident)keys.add(ident.calendar+":"+ident.id);
  }
  for(const key of keys){
   if(!byKey.has(key))byKey.set(key,[]);
   byKey.get(key).push(event);
  }
  const key=[norm(event.venue),String(event.startsAt||"").slice(0,10),norm(event.title)].join("|");
  if(!byTitle.has(key))byTitle.set(key,[]);
  byTitle.get(key).push(event);
 }
 return {byKey,byTitle};
}
function analyze({feed,approved=[],proposed=[],venueRegistry={},connectedCalendars=["highwatermark","soundcontrol"],today,horizonDays=400}){
 if(!dayValid(today))throw Error("Reporting date must be a Portland-local YYYY-MM-DD");
 if(!feed||!Array.isArray(feed.events)||feed.events.length>10000)
  throw Error("TreeTix snapshot missing a bounded events array; inventory is unknown");
 const cutoff=addDays(today,horizonDays);
 const connected=new Set(connectedCalendars.map(x=>String(x).toLowerCase()));
 const aliases=new Set();
 for(const v of venueRegistry.venues||[])for(const s of [v.name,...(v.aliases||[])])aliases.add(norm(s));
 const base=indexed(approved),draft=indexed(proposed),seen=new Set(),rows=[];
 for(const [index,entry] of feed.events.entries()){
  const event=entry&&typeof entry==="object"?entry:{};
  const ident=providerIdentity(event.event_url);
  const eventId=Number(event.event_id),date=event.start_date;
  const calendar=ident?.calendar||"unverified";
  const row={index,eventId:Number.isSafeInteger(eventId)&&eventId>0?eventId:null,
   calendar,venue:clean(event.venue_name),title:clean(event.event_title||event.talent)||"Untitled TreeTix listing",
   date:dayValid(date)?date:null,url:ident?.url||null,disposition:null,reason:""};
  if(!ident||!row.eventId||ident.id!==row.eventId){
   row.disposition="invalid-identity";
   row.reason="Original provider URL and event ID do not establish a matching event identity";
  }else if(seen.has(calendar+":"+eventId)){
   row.disposition="duplicate-provider-id";
   row.reason="Repeated event ID/calendar in one provider snapshot needs review";
  }else if(!dayValid(date)){
   row.disposition="invalid-date";
   row.reason="No verified complete source start date";
  }else if(date<today||date>cutoff){
   row.disposition="outside-horizon";
   row.reason=date<today?"Past listing":"Beyond SHOWS' current "+horizonDays+"-day collection horizon";
  }else if(norm(event.city)!=="portland"||String(event.state_abbr||"").toUpperCase()!=="OR"){
   row.disposition="outside-geography";
   row.reason="Provider city/state is outside Portland, OR";
  }else{
   const key=calendar+":"+eventId;
   const approvedMatches=base.byKey.get(key)||[],proposedMatches=draft.byKey.get(key)||[];
   const sourceTitle=[norm(row.venue),date,norm(row.title)].join("|");
   const possible=(base.byTitle.get(sourceTitle)||[]).length+(draft.byTitle.get(sourceTitle)||[]).length;
   if(approvedMatches.length){
    row.disposition=approvedMatches.some(e=>String(e.startsAt||"").slice(0,10)===date)?"approved":"date-conflict";
    row.reason=row.disposition==="approved"?"Exact original TreeTix event identity in approved SHOWS data":
     "Same original provider ID appears on a different approved SHOWS date; investigate reschedule";
   }else if(proposedMatches.length){
    row.disposition=proposedMatches.some(e=>String(e.startsAt||"").slice(0,10)===date)?"proposed":"date-conflict";
    row.reason=row.disposition==="proposed"?"Present in pending discovery dataset, not yet approved":
     "Original provider ID/date differs in pending data; investigate before publication";
   }else if(!connected.has(calendar)){
    row.disposition="unconnected-producer";
    row.reason="Portland-labeled original event from a provider calendar not connected to SHOWS; check actual venue and source scope";
   }else if(!aliases.has(norm(row.venue))){
    row.disposition="venue-needs-verification";
    row.reason="Connected producer, but venue is not verified in SHOWS' Portland venue registry";
   }else if(event.tz!=="US/Pacific"||!clean(event.start_time)){
    row.disposition="time-needs-verification";
    row.reason="Connected original event missing an unambiguous Pacific source time";
   }else if(possible){
    row.disposition="possible-cross-source-match";
    row.reason="Same title, venue and date in SHOWS, but no shared original provider ID; compare before asserting coverage";
   }else{
    row.disposition="unaccounted-connected";
    row.reason="Connected original provider event absent from approved/proposed dataset; investigate importer holds and matching";
   }
  }
  if(ident)seen.add(calendar+":"+eventId);
  rows.push(row);
 }
 const counts={};
 for(const r of rows)counts[r.disposition]=(counts[r.disposition]||0)+1;
 const inScope=rows.filter(r=>!["outside-horizon","outside-geography"].includes(r.disposition));
 const producerCounts=new Map();
 for(const r of inScope){
  const group=producerCounts.get(r.calendar)||{calendar:r.calendar,total:0,approved:0,proposed:0,review:0};
  group.total++;
  if(r.disposition==="approved")group.approved++;
  else if(r.disposition==="proposed")group.proposed++;
  else group.review++;
  producerCounts.set(r.calendar,group);
 }
 return {today,cutoff,endpoint:ENDPOINT,sourceRecords:rows.length,
  inScope:inScope.length,counts,rows,producers:[...producerCounts.values()].sort((a,b)=>a.calendar.localeCompare(b.calendar))};
}
function report(a){
 const lines=[
  "# TreeTix provider-wide source reconciliation — "+a.today,"",
  "**Evidence:** one observed public TreeTix feed response at "+a.endpoint+" (not a guarantee of provider or venue completeness).",
  "**Scope:** publicly listed events with source dates from "+a.today+" through "+a.cutoff+
   " and provider-labeled Portland, OR locations; unverified/new producer venues require investigation before publication.",
  "**Safety:** this report does not import new producers, approve events, infer genres, or delete missing/rescheduled listings. Every source format is considered; unknown type is not an exclusion.",
  "",
  "## Snapshot dispositions","",
  "- Raw provider records: **"+a.sourceRecords+"**; records not excluded for time/geography: **"+a.inScope+"**.",
  "- Disposition is source-specific; a possible duplicate is **not** proof of an approved matching event.","",
  "| Disposition | Records |","| --- | ---: |"];
 for(const [key,count] of Object.entries(a.counts).sort((a,b)=>a[0].localeCompare(b[0])))
  lines.push("| "+key+" | "+count+" |");
 lines.push("","## Original producer calendars","",
  "| Producer calendar | Source records in reporting scope | Approved by ID | Proposed by ID | Needs review |",
  "| --- | ---: | ---: | ---: | ---: |");
 for(const p of a.producers)lines.push("| "+markdown(p.calendar)+" | "+p.total+" | "+p.approved+" | "+p.proposed+" | "+p.review+" |");
 lines.push("","## Event-by-event exceptions","",
  "Every observed source row not confidently matched by original provider identity is shown below. Out-of-Portland and historical/distant events appear only in disposition totals. This is a **review queue**, not a list of confirmed missing shows.","");
 const pending=a.rows.filter(r=>!["approved","outside-geography","outside-horizon"].includes(r.disposition));
 if(!pending.length)lines.push("No source-specific exceptions in this response; this does not establish complete upstream coverage.");
 for(const r of pending){
  const link=r.url?"["+markdown(r.title)+"]("+r.url+")":markdown(r.title)+" (unverified permalink)";
  lines.push("- "+(r.date||"Date unverified")+" — "+link+" · "+markdown(r.venue||"Venue unverified")+
   " · producer "+markdown(r.calendar)+" · **"+r.disposition+"**: "+markdown(r.reason));
 }
 lines.push("","## Next actions","",
  "1. Resolve connected-source unaccounted records and original-ID/date conflicts first, prioritizing near-term events.",
  "2. Investigate additional Portland producer calendars and venues; source inclusion is an editorial/source decision, **not** a per-event genre filter.",
  "3. Treat malformed IDs/dates, unverified venues, and possible duplicates as explicit holds; never assume a blank or inaccessible feed means zero shows.",
  "4. Recheck cancellations and reschedules against original ticket pages. TreeTix does not provide a cancellation roster; disappearance alone never cancels an event.",
  "5. Keep additions, source configuration, and any venue-map expansion under the normal owner-reviewed SHOWS PR and separate Portfolio sync.","");
 return lines.join("\n")+"\n";
}
function errorReport(today,error){
 return "# TreeTix provider-wide source reconciliation — "+today+"\n\n"+
  "**Source status: unavailable/unknown.** The provider inventory could not be verified this run; do not interpret this as zero events or complete coverage.\n\n"+
  "Failure: "+markdown(String(error?.message||error))+"\n\n"+
  "Previously approved SHOWS records are unchanged; retry source collection and investigate provider health.\n";
}
function readEvents(file){
 const raw=fs.readFileSync(file,"utf8");
 const match=raw.match(/window\.SHOWS_EVENTS\s*=\s*(\[[\s\S]*?\]);\s*$/);
 if(!match)throw Error("Cannot read approved SHOWS events baseline");
 const events=JSON.parse(match[1]);
 if(!Array.isArray(events))throw Error("SHOWS events must be an array");
 return events;
}
function pacificToday(now=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-US",{
  timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"
 }).formatToParts(now).map(p=>[p.type,p.value]));
 return parts.year+"-"+parts.month+"-"+parts.day;
}
async function run({baselineFile=path.join(root,"events.js"),proposedFile=path.join(root,"events.js"),
 outputFile=path.join(root,"discovery/treetix-coverage-review.md"),feed,now=new Date()}={}){
 const approved=readEvents(baselineFile),proposed=readEvents(proposedFile);
 const venues=JSON.parse(fs.readFileSync(path.join(root,"discovery/venues.json"),"utf8"));
 const registry=JSON.parse(fs.readFileSync(path.join(root,"discovery/sources.json"),"utf8"));
 const connectedCalendars=registry.sources.filter(s=>s.status==="pilot-enabled"&&s.adapter==="treetix-public-json")
  .map(s=>s.id==="high-water"?"highwatermark":s.id==="soundcontrol-pdx"?"soundcontrol":null).filter(Boolean);
 const today=pacificToday(now);
 let output,result;
 try{
  const snapshot=feed??await treetix.fetchSnapshot();
  result=analyze({feed:snapshot,approved,proposed,venueRegistry:venues,connectedCalendars,today});
  output=report(result);
 }catch(error){
  result={error:String(error?.message||error),today,counts:null};
  output=errorReport(today,error);
 }
 fs.writeFileSync(outputFile,output);
 process.stdout.write("TreeTix reconciliation: "+(result.error?"source unavailable: "+result.error:
  result.sourceRecords+" records; "+result.inScope+" in reporting scope; "+
  (result.counts["unaccounted-connected"]||0)+" unaccounted connected; "+
  (result.counts["unconnected-producer"]||0)+" from unconnected producers")+"\n");
 return result;
}
if(require.main===module){
 const args=process.argv.slice(2);
 const option=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
 run({baselineFile:option("--baseline"),proposedFile:option("--proposed"),
  outputFile:option("--output")}).catch(e=>{console.error(e);process.exitCode=1;});
}
module.exports={providerIdentity,dayValid,addDays,indexed,analyze,report,errorReport,readEvents,pacificToday,run};
