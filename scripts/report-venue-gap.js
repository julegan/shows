#!/usr/bin/env node
"use strict";
/*
 * Official-source versus approved SHOWS coverage for preferred and scene venues.
 * Source parser output is a partial observed inventory, NOT a claim of complete
 * venue bookings. This report never approves or publishes a candidate.
 */
const fs=require("node:fs");
const path=require("node:path");
const norm=value=>String(value||"").toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const day=e=>String(e?.startsAt||"").slice(0,10);
const addDays=(date,n)=>{
 const d=new Date(date+"T12:00:00Z");
 if(!Number.isFinite(d.valueOf()))throw Error("Invalid start date: "+date);
 d.setUTCDate(d.getUTCDate()+n);
 return d.toISOString().slice(0,10);
};
const safe=s=>String(s??"").replace(/\|/g,"/").replace(/[\r\n]+/g," ").slice(0,115);
const sourceStatus=(venueId,sources,shared,runs)=>{
 const source=sources.find(s=>s.venueRegistryId===venueId)
   ||sources.find(s=>s.id===shared[venueId]);
 if(!source)return {label:"No importer",sourceId:null,run:null};
 const run=runs.find(r=>r.id===source.id);
 const state=source.status==="pilot-enabled"?(run?.status||"not run"):source.status;
 return {label:state,sourceId:source.id,run};
};
function analyze({events=[],sourceRegistry={},venueRegistry={},found=[],reconciled={},sourceRuns=[],today}){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(today||""))throw Error("Expected an explicit Portland YYYY-MM-DD");
 const groups=venueRegistry.editorialPreferenceGroups||{};
 const activeIds=[...new Set([...(groups.preferred||[]),...(groups.scene||[])])];
 const venues=venueRegistry.venues||[],sources=sourceRegistry.sources||[],shared=sourceRegistry.sharedSourceCoverage||{};
 const aliases=new Map();
 for(const venue of venues)for(const label of [venue.name,...(venue.aliases||[])])aliases.set(norm(label),venue.id);
 const idOf=e=>aliases.get(norm(e?.venue));
 const periods=[30,56,90].map(days=>{
  const end=addDays(today,days-1);
  const within=events.filter(e=>day(e)>=today&&day(e)<=end);
  return {days,end,total:within.length,music:within.filter(e=>e.category==="Music").length,
   unclassified:within.filter(e=>e.category==="Unclassified").length,
   musicWithoutStyles:within.filter(e=>e.category==="Music"&&!(e.musicStyles||[]).length).length};
 });
 const end=periods[1].end;
 const inWindow=e=>day(e)>=today&&day(e)<=end;
 const approved=events.filter(inWindow);
 const sourceCandidates=found.filter(x=>x.event&&inWindow(x.event)).map(x=>x.event);
 const accepted=reconciled.accepted||[],held=reconciled.held||[];
 const candidateKey=e=>[e.discovery?.sourceId||"",idOf(e)||norm(e.venue),day(e),norm(e.title),e.url||""].join("|");
 const sourceUnique=[...new Map(sourceCandidates.map(e=>[candidateKey(e),e])).values()];
 const titleAndDate=e=>[idOf(e)||norm(e.venue),day(e),norm(e.title)].join("|");
 const approvedUrls=new Set(approved.map(e=>[idOf(e)||norm(e.venue),day(e),e.url].join("|")));
 const approvedTitles=new Set(approved.map(titleAndDate));
 const proposedIds=new Set(accepted.map(e=>e.id));
 const heldKeys=new Set(held.map(e=>[e.sourceId||"",e.url||"",norm(e.title)].join("|")));
 const rows=activeIds.map(venueId=>{
  const venue=venues.find(v=>v.id===venueId);
  if(!venue)throw Error("Unknown editorial venue "+venueId);
  const prev=approved.filter(e=>idOf(e)===venueId);
  const direct=sourceUnique.filter(e=>idOf(e)===venueId);
  const represented=e=>approvedUrls.has([venueId,day(e),e.url].join("|"))||approvedTitles.has(titleAndDate(e));
  const representedCount=direct.filter(represented).length;
  const unrepresented=direct.filter(e=>!represented(e));
  const proposed=unrepresented.filter(e=>proposedIds.has(e.id));
  const unresolved=unrepresented.filter(e=>!proposedIds.has(e.id));
  const unresolvedExamples=unresolved.slice(0,3).map(e=>({
   title:e.title,url:e.url,date:day(e),
   status:heldKeys.has([e.discovery?.sourceId||"",e.url||"",norm(e.title)].join("|"))?"held for reconciliation":"needs comparison"
  }));
  const s=sourceStatus(venueId,sources,shared,sourceRuns);
  // Only date-specific holds can be placed in the 56-day window.
  // Unknown-date holds are tracked separately, NEVER counted as missing shows.
  const rawHolds=found.filter(x=>!x.event&&x.hold&&x.sourceId===s.sourceId);
  const datedHolds=rawHolds.filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.date||"")&&x.date>=today&&x.date<=end).length;
  const undatedHolds=rawHolds.filter(x=>!/^\d{4}-\d{2}-\d{2}$/.test(x.date||"")).length;
  return {
   venueId,name:venue.name,group:(groups.preferred||[]).includes(venueId)?"preferred":"scene",
   source:s.label,sourceId:s.sourceId,sourceItemsChecked:s.run?.examined??null,
   approved:prev.length,music:prev.filter(e=>e.category==="Music").length,
   unclassified:prev.filter(e=>e.category==="Unclassified").length,
   musicWithoutStyles:prev.filter(e=>e.category==="Music"&&!(e.musicStyles||[]).length).length,
   parsedOfficial:direct.length,represented:representedCount,proposed:proposed.length,
   unresolved:unresolved.length,datedHolds,undatedHolds,unresolvedExamples
  };
 });
 return {today,end,periods,rows,sourceCandidateCount:sourceUnique.length,
   totalUnrepresented:rows.reduce((n,r)=>n+r.unresolved+r.proposed,0)};
}
// Turn the same 56-day evidence into a continuously refreshed technical
// worklist. These are observed needs and *unknown inventories*, not inferred
// show counts, venue rankings or automatic publication instructions.
function nextCoverageActions(a){
 const result={recover:[],connect:[],verify:[],classify:[]};
 for(const r of a.rows){
  if(["failed","empty"].includes(r.source))result.recover.push({
   venue:r.name,status:r.source,details:"Restore or verify original-source response; source inventory is unknown"});
  else if(["adapter-needed","source-blocked","No importer","reopening-watch"].includes(r.source))
   result.connect.push({venue:r.name,status:r.source,details:r.source==="reopening-watch"
    ?"Check original reopening announcement and dated event links before enabling intake"
    :"Find/validate an original dated calendar, authorized feed or original promoter evidence"});
  const queued=r.proposed+r.unresolved,held=r.datedHolds+r.undatedHolds;
  if(queued||held)result.verify.push({venue:r.name,status:"review needed",
   details:queued+" source records not conservatively matched to approved events; "+held+
    " held original records ("+r.datedHolds+" dated, "+r.undatedHolds+" undated). Verify source identity, time and duplicates."});
  if(r.musicWithoutStyles)result.classify.push({venue:r.name,status:"genre unverified",
   details:r.musicWithoutStyles+" approved Music records lack event-specific genre evidence; leave unclassified until confirmed"});
 }
 for(const rows of Object.values(result))rows.sort((a,b)=>a.venue.localeCompare(b.venue));
 return result;
}
function coverageActionLines(a){
 const task=nextCoverageActions(a);
 const out=["## Automated next coverage actions","",
  "Generated daily from the *approved inventory* and source checks. This is a research and adapter-development worklist, **not proof that a venue has no shows or that every unmatched source record is missing**. Preferred and scene groups have equal editorial priority. Unknown original inventories never count as zero events.",""];
 const sections=[
  ["recover","Recover failed or empty sources"],
  ["connect","Build or verify missing original source integrations"],
  ["verify","Resolve unmatched and held first-party records"],
  ["classify","Research event-specific genre evidence (not automatic tagging)"]
 ];
 for(const [key,title] of sections){
  out.push("### "+title,"");
  if(!task[key].length){out.push("No cases identified in this run.","");continue;}
  out.push("| Venue | Source state | Specific next step |","| --- | --- | --- |");
  for(const item of task[key])out.push("| "+safe(item.venue)+" | "+safe(item.status)+" | "+safe(item.details)+" |");
  out.push("");
 }
 return out;
}
function report(a){
 const lines=[
  "# SHOWS — priority venue source coverage audit ("+a.today+" to "+a.end+")","",
  "**What this measures:** approved SHOWS listings and events independently parsed from currently connected first-party source feeds. The parsed subset is **not an exhaustive inventory** of a venue; an empty/failed feed is not evidence that a venue has no shows. Proposed and held rows have not been approved. Comparisons by original link or exact venue/date/title are conservative and may undercount representation when different first-party links describe the same bill.","",
  "## Forward calendar health","",
  "| Next days | Through | All approved | Music | Type unconfirmed | Music without style evidence |",
  "| ---: | --- | ---: | ---: | ---: | ---: |"];
 for(const p of a.periods)lines.push("| "+p.days+" | "+p.end+" | "+p.total+" | "+p.music+" | "+p.unclassified+" | "+p.musicWithoutStyles+" |");
 lines.push("","## Preferred and scene venues — rolling 56 days","",
  "Both groups have equal editorial priority. **Approved** counts all categories, not just music. **Parsed** means valid future records returned by the enabled source in this run, not every booking. **Review** = not conservatively matched to approved SHOWS; includes pending proposals and possible same-night conflicts, **not confirmed missing shows**. A non-enabled source has an unknown source inventory, not zero real events.","",
  "| Group | Venue | Import / this run | Approved | Music | Unclassified | Missing music styles | Parsed source | Matched | Proposed | Review |",
  "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
 for(const r of a.rows){
  const measured=r.source==="checked"||r.source==="empty";
  lines.push("| "+r.group+" | "+safe(r.name)+" | "+safe(r.source)+(r.sourceItemsChecked===null?"":" ("+r.sourceItemsChecked+" raw)")+" | "+r.approved+" | "+r.music+" | "+r.unclassified+" | "+r.musicWithoutStyles+" | "+(measured?r.parsedOfficial:"unknown")+" | "+(measured?r.represented:"—")+" | "+(measured?r.proposed:"—")+" | "+(measured?r.unresolved:"—")+" |");
 }
 lines.push(...coverageActionLines(a));
 lines.push("","## Source records needing individual verification","",
  "These items were parsable from a connected first-party source and were **not** matched by an identical official URL or exact title/date/venue. They might be real gaps, reschedules, multiple times, or duplicates. Verify original identity and room before approval.","");
 const needing=a.rows.filter(r=>r.unresolvedExamples.length).sort((a,b)=>b.unresolved-a.unresolved);
 if(!needing.length)lines.push("No unmatched parsed official-source records in this period; this does not establish completeness.");
 for(const r of needing){
  lines.push("### "+safe(r.name)+" ("+r.unresolved+" review)");
  for(const e of r.unresolvedExamples)lines.push("- "+e.date+" — ["+safe(e.title)+"]("+e.url+") — "+e.status);
 }
 lines.push("","## Source uncertainty and gaps","",
  "Connected parsers can miss listings, dates, and some rooms. Investigate these gaps instead of using event-count growth as a proxy for completeness.","");
 for(const r of a.rows.filter(r=>r.source!=="checked"||r.datedHolds||r.undatedHolds)){
  lines.push("- **"+safe(r.name)+"**: "+r.source+
    (r.datedHolds?"; "+r.datedHolds+" held records with a date in this window":"")+
    (r.undatedHolds?"; "+r.undatedHolds+" held records without a parseable date":"")+
    ((r.source==="adapter-needed"||r.source==="No importer")?"; original published events remain unmeasured":"")+".");
 }
 lines.push("","### Editorial rules","",
  "- Do not promote a same-day conflict, unclassified event, or secondary guide lead solely to increase totals.",
  "- Confirm primary original event URL, year/date, exact venue/room, cancellation status, and time semantics independently.",
  "- Separate approved show count from venue completeness; expand integrations at priority venues with unknown source inventories.",
  "- Publishing remains via owner-approved Shows and separate Portfolio PRs.","");
 return lines.join("\n")+"\n";
}
if(require.main===module){
 const root=path.resolve(__dirname,"..");
 const raw=fs.readFileSync(path.join(root,"events.js"),"utf8");
 const data=JSON.parse(raw.match(/window\.SHOWS_EVENTS\s*=\s*(\[[\s\S]*?\]);\s*$/)?.[1]||"null");
 const sourceRegistry=JSON.parse(fs.readFileSync(path.join(root,"discovery/sources.json"),"utf8"));
 const venueRegistry=JSON.parse(fs.readFileSync(path.join(root,"discovery/venues.json"),"utf8"));
 const now=new Date();
 const p=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now).map(x=>[x.type,x.value]));
 process.stdout.write(report(analyze({events:data,sourceRegistry,venueRegistry,today:p.year+"-"+p.month+"-"+p.day})));
}
module.exports={analyze,report,nextCoverageActions,coverageActionLines,addDays};
