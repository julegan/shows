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
const markdown=x=>clean(x).replace(/[|[\]*_`]/g," ").replace(/\s+/g," ");
const identityKey=({calendar,id})=>calendar+":"+id;
// Conservative artist/bill overlap is a review lead, never a verified
// provider-ID match. Two distinct headliner words are required to avoid
// collapsing unrelated shows that share "live", "music", or "festival".
const stopWords=new Set(["with","from","show","tour","live","music","night","festival","presents",
 "room","party","guest","guests","special","performance","tickets","2026","2027","2028"]);
function distinctive(title){
 return new Set(norm(title).split(" ").filter(word=>word.length>=4&&!stopWords.has(word)));
}
function likelySameBill(a,b){
 if(norm(a)===norm(b)&&norm(a))return true;
 const aa=distinctive(a),bb=distinctive(b);
 if(aa.size<2||bb.size<2)return false;
 const common=[...aa].filter(t=>bb.has(t)).length;
 return common>=2&&common/Math.min(aa.size,bb.size)>=0.7;
}
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
 const byKey=new Map(),byVenueDay=new Map();
 for(const event of events){
  const keys=new Set();
  if(event.sourceCalendar&&Number.isSafeInteger(Number(event.sourceEventId))&&Number(event.sourceEventId)>0)
   keys.add(String(event.sourceCalendar).toLowerCase()+":"+Number(event.sourceEventId));
  for(const url of [event.url,...(event.sources||[]).map(s=>s.url)]){
   const ident=providerIdentity(url);
   if(ident)keys.add(identityKey(ident));
  }
  for(const key of keys){
   if(!byKey.has(key))byKey.set(key,[]);
   byKey.get(key).push(event);
  }
  const venueDay=[norm(event.venue),String(event.startsAt||"").slice(0,10)].join("|");
  if(!byVenueDay.has(venueDay))byVenueDay.set(venueDay,[]);
  byVenueDay.get(venueDay).push(event);
 }
 return {byKey,byVenueDay};
}
function analyze({feed,approved=[],proposed=[],venueRegistry={},connectedCalendars=["highwatermark","soundcontrol"],
 intakeOutcomes=[],today,horizonDays=400}){
 if(!dayValid(today))throw Error("Reporting date must be a Portland-local YYYY-MM-DD");
 if(!feed||!Array.isArray(feed.events)||feed.events.length>10000)
  throw Error("TreeTix snapshot missing a bounded events array; inventory is unknown");
 const cutoff=addDays(today,horizonDays);
 const connected=new Set(connectedCalendars.map(x=>String(x).toLowerCase()));
 const aliases=new Set();
 for(const v of venueRegistry.venues||[])for(const s of [v.name,...(v.aliases||[])])aliases.add(norm(s));
 const base=indexed(approved),draft=indexed(proposed),seen=new Set(),rows=[];
 const outcomes=new Map();
 for(const record of intakeOutcomes){
  const ident=providerIdentity(record.url);
  if(ident&&!outcomes.has(identityKey(ident)))outcomes.set(identityKey(ident),record.hold||record.skip);
 }
 for(const [index,entry] of feed.events.entries()){
  const event=entry&&typeof entry==="object"?entry:{};
  const ident=providerIdentity(event.event_url);
  const eventId=event.event_id,date=event.start_date;
  const calendar=ident?.calendar||"unverified";
  const key=ident?identityKey(ident):null;
  const city=norm(event.city),state=norm(event.state_abbr);
  const row={index,eventId:Number.isSafeInteger(eventId)&&eventId>0?eventId:null,
   calendar,venue:clean(event.venue_name),title:clean(event.event_title)||clean(event.talent)||"Untitled TreeTix listing",
   date:dayValid(date)?date:null,url:ident?.url||null,location:[clean(event.city),clean(event.state_abbr)].filter(Boolean).join(", "),
   disposition:null,reason:"",matchIds:[]};
  if(!ident||!row.eventId||ident.id!==row.eventId){
   row.disposition="invalid-identity";
   row.reason="Original provider URL and event ID do not establish a matching event identity";
  }else if(seen.has(key)){
   row.disposition="duplicate-provider-id";
   row.reason="Repeated event ID/calendar in one provider snapshot needs review";
  }else if(!dayValid(date)){
   row.disposition="invalid-date";
   row.reason="No verified complete source start date";
  }else if(date<today||date>cutoff){
   row.disposition="outside-horizon";
   row.reason=date<today?"Past listing":"Beyond SHOWS' current "+horizonDays+"-day collection horizon";
  }else if(!city||!state){
   row.disposition="geography-needs-verification";
   row.reason="Provider city or state is missing; verify the original venue location";
  }else if(city!=="portland"||state!=="or"){
   row.disposition="outside-geography";
   row.reason="Provider city/state is outside Portland, OR";
  }else{
   const approvedMatches=base.byKey.get(key)||[],proposedMatches=draft.byKey.get(key)||[];
   const venueDay=[norm(row.venue),date].join("|");
   const inRoom=[...(base.byVenueDay.get(venueDay)||[]),...(draft.byVenueDay.get(venueDay)||[])];
   const possible=inRoom.filter(other=>likelySameBill(row.title,other.title));
   const intakeReason=outcomes.get(key);
   if(approvedMatches.length){
    row.matchIds=approvedMatches.map(e=>e.id);
    row.disposition=approvedMatches.some(e=>String(e.startsAt||"").slice(0,10)===date)?"approved":"date-conflict";
    row.reason=row.disposition==="approved"?"Exact original TreeTix event identity in approved SHOWS data":
     "Same original provider ID appears on a different approved SHOWS date; investigate reschedule";
   }else if(proposedMatches.length){
    row.matchIds=proposedMatches.map(e=>e.id);
    row.disposition=proposedMatches.some(e=>String(e.startsAt||"").slice(0,10)===date)?"proposed":"date-conflict";
    row.reason=row.disposition==="proposed"?"Present in pending discovery dataset, not yet approved":
     "Original provider ID/date differs in pending data; investigate before publication";
   }else if(!connected.has(calendar)){
    row.disposition="unconnected-producer";
    row.reason="Portland-labeled original event from a provider calendar not connected to SHOWS; check actual venue and source scope";
   }else if(possible.length){
    row.disposition="possible-cross-source-match";
    row.matchIds=possible.map(e=>e.id);
    row.reason="Likely same bill at the same venue/date based on distinctive title words, but no shared original provider ID; verify before asserting coverage";
   }else if(intakeReason){
    row.disposition="held-in-intake";
    row.reason="Discovery did not stage this event; resolve the recorded intake decision";
   }else if(!aliases.has(norm(row.venue))){
    row.disposition="venue-needs-verification";
    row.reason="Connected producer, but venue is not verified in SHOWS' Portland venue registry";
   }else if(event.tz!=="US/Pacific"||!clean(event.start_time)){
    row.disposition="time-needs-verification";
    row.reason="Connected original event missing an unambiguous Pacific source time";
   }else{
    row.disposition="unaccounted-connected";
    row.reason="Connected original provider event absent from approved/proposed dataset; investigate importer holds and matching";
   }
   if(intakeReason&&!["approved","proposed"].includes(row.disposition))row.intakeReason=intakeReason;
  }
  if(ident?.id===row.eventId)seen.add(key);
  row.matchIds=[...new Set(row.matchIds.filter(Boolean))].sort();
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
 return {today,cutoff,endpoint:ENDPOINT,updated:typeof feed.updated==="string"?clean(feed.updated):null,sourceRecords:rows.length,
  inScope:inScope.length,counts,rows,producers:[...producerCounts.values()].sort((a,b)=>a.calendar.localeCompare(b.calendar))};
}
function report(a){
 const lines=[
  "# TreeTix provider-wide source reconciliation — "+a.today,"",
  "**Evidence:** one observed public TreeTix feed response at "+a.endpoint+". "+
   (a.updated?"Provider updated: "+markdown(a.updated)+". ":"")+"No verified pagination or upstream total; coverage is limited to this response.",
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
  "This review queue shows pending and unresolved rows, with the nearest dated events first. Geographic and date exclusions are in the full inventory.","");
 const pending=a.rows.filter(r=>!["approved","outside-geography","outside-horizon"].includes(r.disposition))
  .sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999")||a.index-b.index);
 if(!a.sourceRecords)lines.push("The provider returned an empty events array; upstream coverage is unverified.");
 else if(!pending.length)lines.push("No source-specific exceptions in this response; upstream coverage is unverified.");
 for(const r of pending){
  const link=r.url?"["+markdown(r.title)+"]("+r.url+")":markdown(r.title)+" (unverified permalink)";
  lines.push("- "+(r.date||"Date unverified")+" — "+link+" · "+markdown(r.venue||"Venue unverified")+
   " · producer "+markdown(r.calendar)+" · **"+r.disposition+"**: "+markdown(r.reason)+
   (r.intakeReason?". Intake: "+markdown(r.intakeReason):"")+
   (r.matchIds.length?". SHOWS ID(s): "+r.matchIds.map(markdown).join(", "):""));
 }
 lines.push("","## Full source inventory","",
  "Each feed row appears once below. Matching SHOWS IDs are references for investigation; tentative matches still need verification.","",
  "| Feed row | Producer | TreeTix ID | Source date | Event | Location | Disposition | SHOWS ID(s) | Reason |",
  "| ---: | --- | --- | --- | --- | --- | --- | --- | --- |");
 for(const r of a.rows){
  const title=markdown(r.title),event=r.url?"["+title+"]("+r.url+")":title;
  lines.push("| "+[r.index+1,markdown(r.calendar),r.eventId??"Unverified",r.date??"Unverified",event,
   markdown([r.venue,r.location].filter(Boolean).join(" · "))||"Unverified",r.disposition,
   r.matchIds.map(markdown).join(", "),markdown(r.reason)+(r.intakeReason?". Intake: "+markdown(r.intakeReason):"")].join(" | ")+" |");
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
 outputFile,feed,now=new Date()}={}){
 const approved=readEvents(baselineFile),proposed=readEvents(proposedFile);
 const venueRegistry=JSON.parse(fs.readFileSync(path.join(root,"discovery/venues.json"),"utf8"));
 const sources=JSON.parse(fs.readFileSync(path.join(root,"discovery/sources.json"),"utf8")).sources;
 return review({approved,proposed,venueRegistry,sources,outputFile,feed,now});
}
async function review({approved,proposed,venueRegistry,sources,intakeOutcomes,feed,now,horizonDays,
 outputFile=path.join(root,"discovery/treetix-coverage-review.md"),write=true}){
 const connectedCalendars=sources.filter(s=>s.status==="pilot-enabled").map(treetix.calendarFor).filter(Boolean);
 const today=pacificToday(now);
 let output,result;
 try{
  const snapshot=feed===undefined?await treetix.fetchSnapshot():await feed;
  result=analyze({feed:snapshot,approved,proposed,venueRegistry,connectedCalendars,intakeOutcomes,today,horizonDays});
  output=report(result);
 }catch(error){
  result={error:String(error?.message||error),today,counts:null};
  output=errorReport(today,error);
 }
 if(write)fs.writeFileSync(outputFile,output);
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
module.exports={providerIdentity,dayValid,addDays,distinctive,likelySameBill,indexed,analyze,report,errorReport,readEvents,pacificToday,run,review};
