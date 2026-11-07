"use strict";
// Review-only: verified official SHOW time corrections, never auto-publish.
// Missing events in a source feed are not cancellations.
const {normalizeUrl}=require("./source-change-review");
const registry=require("../discovery/sources.json").sources;
const miss=require("./mississippi-polaris-importer"),jlr=require("./jack-london-importer"),rose=require("./alberta-rose-importer");
const specs={
 "mississippi-polaris":{adapter:"mississippi-polaris-html",check:miss.ticketUrl},
 "jack-london-revue":{adapter:"jack-london-original-html",check:(url,room)=>room==="Jack London Revue"?jlr.eventUrl(url):null},
 "alberta-rose-theatre":{adapter:"alberta-rose-original-html",check:(url,room)=>room==="Alberta Rose Theatre"?rose.eventUrl(url):null}
};
const norm=s=>String(s||"").normalize("NFKC").replace(/\s+/g," ").trim().toLowerCase();
const status=/\b(?:cancelled|canceled|postponed|rescheduled|moved\s+to|venue\s+change|date\s+change|vip\s+upgrade)\b/i;
const stamp=/^20\d\d-\d\d-\d\dT\d\d:\d\d:\d\d-0[78]:00$/;
function sourceOf(e,sources=registry){
 const id=e?.discovery?.sourceId,spec=specs[id],source=sources.find(s=>s.id===id);
 if(!spec||!source||source.status!=="pilot-enabled"||source.adapter!==spec.adapter||
  e.source!==source.name||!e.venue)return null;
 const address=source.addresses?.[e.venue]||source.address;
 const url=spec.check(e.url,e.venue);
 return address&&e.address===address&&url&&normalizeUrl(url)===normalizeUrl(e.url)?{id,source}:null;
}
function proposeCorrections(approved,observations,{today,sources=registry}={}){
 if(!Array.isArray(approved)||!Array.isArray(observations)||!/^20\d\d-\d\d-\d\d$/.test(today||""))
  throw Error("Correction planning requires original records and current Pacific date");
 const approvedByUrl=new Map(),seen=new Map(),proposals=[];
 for(const e of approved){const url=normalizeUrl(e.url);if(url)approvedByUrl.set(url,[...(approvedByUrl.get(url)||[]),e]);}
 for(const o of observations){const e=o?.event,url=normalizeUrl(e?.url);if(url)seen.set(url,[...(seen.get(url)||[]),o]);}
 for(const [url,rows] of seen){
  if(rows.length!==1||!rows[0].event||approvedByUrl.get(url)?.length!==1)continue;
  const previous=approvedByUrl.get(url)[0],incoming=rows[0].event;
  const oldSource=sourceOf(previous,sources),newSource=sourceOf(incoming,sources);
  if(!oldSource||!newSource||oldSource.id!==newSource.id||!previous.id||
   previous.venue!==incoming.venue||previous.address!==incoming.address||
   norm(previous.title)!==norm(incoming.title)||status.test(previous.title+" "+incoming.title)||
   incoming.discovery?.verifiedOriginalShowTime!==true||
   incoming.discovery?.method!=="primary-source-collection")continue;
  if(!["listed","show"].includes(previous.startTimeKind)||incoming.startTimeKind!=="listed"||
   (previous.endsAt!==null&&previous.endsAt!==undefined)||
   !stamp.test(previous.startsAt||"")||!stamp.test(incoming.startsAt||"")||
   previous.startsAt.slice(0,10)!==incoming.startsAt.slice(0,10)||
   previous.startsAt.slice(0,10)<today)continue;
  const mins=Math.abs(Date.parse(previous.startsAt)-Date.parse(incoming.startsAt))/60000;
  if(!Number.isFinite(mins)||mins===0||mins>120)continue;
  const corrected={...previous,startsAt:incoming.startsAt,startTimeKind:"show",
   sourceCheckedAt:incoming.sourceCheckedAt,
   verificationMethod:"Proposed original-source correction: uniquely matched ticket, room, date and explicitly labeled SHOW time",
   sourceCorrection:{status:"proposed",sourceId:oldSource.id,sourceUrl:url,
    previousStartsAt:previous.startsAt,observedStartsAt:incoming.startsAt,
    checkedAt:incoming.sourceCheckedAt,
    evidence:"Original event ticket and venue calendar confirm a separately labeled SHOW time"}};
  proposals.push({id:previous.id,title:previous.title,venue:previous.venue,url,
   previousStartsAt:previous.startsAt,observedStartsAt:incoming.startsAt,event:corrected});
 }
 // Large source drift never becomes an unattended blanket correction proposal.
 if(proposals.length>8)return {events:approved,proposals:[],heldBatch:proposals.length};
 const patched=new Map(proposals.map(p=>[p.id,p.event]));
 return {events:approved.map(e=>patched.get(e.id)||e),proposals,heldBatch:0};
}
function renderReview(result){
 const lines=["# Verified original-source schedule correction proposals","",
  "**Proposed corrections: "+result.proposals.length+"** · Source-drift batch held: "+(result.heldBatch||0)+".","",
  "Only a uniquely matched first-party ticket and independently labeled SHOW time can propose a correction. No historical event is edited, removed or automatically published; unresolved changes require further automated investigation.","",
  "| Event | Earlier published time | New verified SHOW time | Original evidence |",
  "| --- | --- | --- | --- |"];
 for(const p of result.proposals)lines.push("| "+(p.venue+" — "+p.title).replace(/\|/g,"/")+" | "+p.previousStartsAt+" | "+p.observedStartsAt+" | "+p.url+" |");
 if(!result.proposals.length)lines.push("| No safe corrections this run | — | — | — |");
 lines.push("","## Strict boundaries","",
  "- Explicit original year/day, room, full showtime distinct from doors, and an official ticket permalink.",
  "- The source identity, title, venue and address must match the existing event exactly.",
  "- Same-day time changes up to 120 minutes only. Cancellations, venue changes, event date changes and status ambiguity stay held.",
  "- Preserve stable event IDs, descriptions, artist styles and all other approved editorial fields.",
  "- No assumption that an event absent from the original feed is canceled.",
  "- Unresolved source disagreements are retained in the uploaded source-change review report.","");
 return lines.join("\n");
}
module.exports={sourceOf,proposeCorrections,renderReview};