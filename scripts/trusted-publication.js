#!/usr/bin/env node
"use strict";
// Trusted-original planning is read-only. GitHub workflow validates and
// conditionally publishes an append-only file; on any failure it preserves
// the full manual-review proposal. No source can whitelist itself.
const fs=require("node:fs");
const {parseFile}=require("./discover-events");
const jlr=require("./jack-london-importer");
const rose=require("./alberta-rose-importer");
const registry=require("../discovery/sources.json");
const policy=require("../discovery/trusted-sources.json");
const stampRx=/^20\d\d-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d-0[78]:00$/;
const badStatus=/\b(?:cancelled|canceled|postponed|rescheduled|moved(?:\s+to)?|venue change|date change|vip(?:\s+upgrade)?|add-on|sold out)\b/i;
const normal=s=>String(s||"").toLowerCase().replace(/\s+/g," ").trim();
const day=e=>e.startsAt?.slice(0,10);
const slot=e=>normal(e.venue)+"|"+day(e);
function localDay(now){
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",
  year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now).map(x=>[x.type,x.value]));
 return parts.year+"-"+parts.month+"-"+parts.day;
}
function validatePolicy(p=policy,sourceRegistry=registry){
 if(p.schemaVersion!==1||p.enabled!==true||!Array.isArray(p.sources)||!p.sources.length||p.sources.length>5||
  !Number.isInteger(p.maxAdditionsPerRun)||p.maxAdditionsPerRun<1||p.maxAdditionsPerRun>30||
  !Number.isInteger(p.minLeadHours)||p.minLeadHours<24||p.minLeadHours>168||
  !Number.isInteger(p.maxAheadDays)||p.maxAheadDays<7||p.maxAheadDays>180)
  throw Error("Unapproved trusted publication policy");
 const parsers={"jack-london-revue":{adapter:"jack-london-original-html",safe:jlr.eventUrl},
  "alberta-rose-theatre":{adapter:"alberta-rose-original-html",safe:rose.eventUrl}};
 const allowed=new Map();
 for(const entry of p.sources){
  const src=sourceRegistry.sources.find(s=>s.id===entry.id),parser=parsers[entry.id];
  if(!src||src.status!=="pilot-enabled"||!parser||src.adapter!==entry.adapter||
   parser.adapter!==entry.adapter||src.venue!==entry.venue||src.url!==entry.sourceUrl||
   !src.address||allowed.has(entry.id))throw Error("Unreviewed trusted source configuration: "+entry.id);
  allowed.set(entry.id,{src,safe:parser.safe});
 }
 return allowed;
}
function holdReason(e,base,proposals,now,p,allowed){
 if(!e||typeof e!=="object")return "Malformed event";
 const id=e.discovery?.sourceId,trust=allowed.get(id);
 if(!trust)return "Source is not on the owner-reviewed trusted list";
 if(e.discovery.method!=="primary-source-collection"||e.discovery.verifiedOriginalShowTime!==true)
  return "Original page or independent SHOW clock was not corroborated";
 if(e.venue!==trust.src.venue||e.address!==trust.src.address||e.source!==trust.src.name||
  !trust.safe(e.url))return "Venue address or original event permalink differs";
 if(id==="alberta-rose-theatre"&&e.sourceTicketId)
  return "Multi-performance ticket requires manual review";
 if(typeof e.title!=="string"||e.title.length<3||e.title.length>220||badStatus.test(e.title))
  return "Original event title indicates ambiguous status, add-on or missing text";
 if(!/^auto-[a-z0-9-]+-20\d\d-\d\d-\d\d-[a-f0-9]{12}$/.test(e.id||"")||
  !stampRx.test(e.startsAt||"")||!Number.isFinite(Date.parse(e.startsAt))||
  e.startTimeKind!=="listed"||e.eventFormat!=="unverified"||e.endsAt!==null)
  return "Unverified original event identity or SHOW clock format";
 const hours=(Date.parse(e.startsAt)-now.getTime())/3600000;
 if(hours<p.minLeadHours||hours>p.maxAheadDays*24)return "Outside cautious publication date horizon";
 if(e.free!==null||e.age!=="Not published"||!Array.isArray(e.musicStyles)||
  !Array.isArray(e.tags)||!Array.isArray(e.sources)||e.sources.length!==1)
  return "Unreviewed admission, age or editorial metadata";
 if(e.tags.some(x=>/separate same-day|source changed|time conflict|resched|cancel|moved|hold/i.test(x)))
  return "Original event needs conflict or status review";
 if([...base,...proposals].some(x=>x.id!==e.id&&slot(x)===slot(e)))
  return "Multiple existing or proposed bills share the same venue and day";
 if(base.some(x=>x.url===e.url||x.id===e.id))
  return "Original event URL or stable ID already belongs to approved listing";
 return null;
}
function serialize(parsed,events,added,now,mark){
 const ordered=[...events].sort((a,b)=>a.startsAt.localeCompare(b.startsAt)||a.title.localeCompare(b.title));
 const meta={...parsed.meta,
  totalOccurrences:ordered.length,musicOccurrences:ordered.filter(e=>e.category==="Music").length,
  addedOccurrences:added,sourceCheckedAt:localDay(now),
  coverageThrough:ordered.reduce((last,e)=>day(e)>last?day(e):last,"")};
 if(mark&&added){
  meta.batchId="trusted-original-"+localDay(now);
  meta.editorialReview="Only append-only original source additions passed the approved trusted policy; all other changes require review";
 }
 return parsed.prefix+"window.SHOWS_DATASET = "+JSON.stringify(meta,null,2)+";\nwindow.SHOWS_EVENTS = "+JSON.stringify(ordered,null,2)+";\n";
}
function plan({baseline,proposed,now=new Date(),config=policy,sourceRegistry=registry}){
 const base=parseFile(baseline),draft=parseFile(proposed);
 if(base.meta.totalOccurrences!==base.events.length||draft.meta.totalOccurrences!==draft.events.length)
  throw Error("Source event counts disagree with metadata");
 if(!Number.isFinite(now.valueOf()))throw Error("Invalid publication clock");
 const allowed=validatePolicy(config,sourceRegistry);
 const originals=new Map(base.events.map(x=>[x.id,x])),proposedIds=new Set(draft.events.map(x=>x.id));
 if(originals.size!==base.events.length||proposedIds.size!==draft.events.length||
  base.events.some(x=>!proposedIds.has(x.id)))throw Error("Duplicate IDs or missing original approved records");
 const additions=draft.events.filter(e=>!originals.has(e.id));
 const rejected=[],eligible=[];
 for(const e of additions){
  const reason=holdReason(e,base.events,additions,now,config,allowed);
  if(reason)rejected.push({id:e.id,source:e.discovery?.sourceId||"unknown",reason});
  else eligible.push(e);
 }
 if(eligible.length>config.maxAdditionsPerRun){
  for(const e of eligible)rejected.push({id:e.id,source:e.discovery.sourceId,reason:"Trusted batch exceeds per-run threshold"});
  eligible.length=0;
 }
 const trusted=eligible.map(e=>{
  const v={...e,tags:e.tags.filter(x=>x!=="Time needs confirmation"),
   startTimeKind:"show",subtitle:"Original venue listing · showtime verified",
   verificationMethod:"SHOWS trusted original calendar plus independent schedule checks",
   trustPublication:{policyVersion:1,mode:"trusted-original-addition",sourceId:e.discovery.sourceId}};
  delete v.artwork;delete v.sourceArtworkUrl;
  return v;
 });
 const ids=new Set(trusted.map(e=>e.id));
 const current=serialize(base,[...base.events,...trusted],trusted.length,now,true);
 const pendingList=draft.events.filter(e=>!ids.has(e.id));
 const pending=serialize(draft,pendingList,pendingList.filter(e=>!originals.has(e.id)).length,now,false);
 return {trusted,current,pending,rejected,proposalCount:additions.length};
}
function cli(){
 const args=new Map();
 for(let i=2;i<process.argv.length;i+=2)args.set(process.argv[i],process.argv[i+1]);
 for(const flag of ["--baseline","--proposed","--trusted","--pending","--summary"])
  if(!args.get(flag))throw Error("Missing trusted planner argument "+flag);
 const result=plan({baseline:fs.readFileSync(args.get("--baseline"),"utf8"),
  proposed:fs.readFileSync(args.get("--proposed"),"utf8")});
 fs.writeFileSync(args.get("--trusted"),result.current);
 fs.writeFileSync(args.get("--pending"),result.pending);
 const summary={trusted:result.trusted.length,proposed:result.proposalCount,
  remaining:result.proposalCount-result.trusted.length,
  sources:[...new Set(result.trusted.map(e=>e.discovery.sourceId))],
  rejected:result.rejected.slice(0,12)};
 fs.writeFileSync(args.get("--summary"),JSON.stringify(summary,null,2)+"\n");
 console.log("TRUSTED PUBLICATION PLAN "+JSON.stringify(summary));
}
if(require.main===module)try{cli()}catch(e){
 console.error("TRUSTED PUBLICATION FAILED CLOSED: "+e.message);process.exitCode=1;
}
module.exports={localDay,validatePolicy,holdReason,serialize,plan};