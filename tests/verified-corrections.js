"use strict";
const assert=require("node:assert/strict");
const {sourceOf,proposeCorrections,renderReview}=require("../scripts/verified-corrections");
const sources=require("../discovery/sources.json").sources;
const miss=sources.find(s=>s.id==="mississippi-polaris");
const jack=sources.find(s=>s.id==="jack-london-revue");
const rose=sources.find(s=>s.id==="alberta-rose-theatre");
const now="2026-11-06";
const make=(src,id,venue,url,time,options={})=>({
 id:"legacy-"+id,title:"The Distinct Original Concert",venue,
 address:src.addresses?.[venue]||src.address,source:src.name,url,
 category:"Music",tags:["Original verified event"],musicStyles:["Jazz"],
 startTimeKind:"listed",startsAt:time,endsAt:null,
 sourceCheckedAt:"2026-11-06",free:null,age:"Not published",
 description:"Original venue calendar",discovery:{sourceId:src.id,method:"primary-source-collection",
 verifiedOriginalShowTime:true},...options
});
const old=make(miss,"mississippi","Mississippi Studios",
 "https://www.etix.com/ticket/p/67262153/sold-outroger-clyne-the-peacemakers-hell-to-breakfast-tour-night-1-portland-mississippi-studios",
 "2026-11-21T20:00:00-08:00");
const observed={event:{...old,startsAt:"2026-11-21T19:30:00-08:00"}};
assert(sourceOf(old),"Original Mississippi venue id and ticket permalink match");
assert(sourceOf(make(jack,"jack","Jack London Revue",
 "https://www.jacklondonrevue.com/tm-event/a-jazz-bill/","2026-11-19T20:00:00-08:00")));
assert(sourceOf(make(rose,"rose","Alberta Rose Theatre",
 "https://albertarosetheatre.com/event/an-original-bill/alberta-rose-theatre/portland-oregon/",
 "2026-11-20T20:00:00-08:00")));
const result=proposeCorrections([old],[observed],{today:now});
assert.equal(result.proposals.length,1,"Same uniquely verified official show clock becomes a concrete correction proposal");
assert.equal(result.events.length,1);
assert.equal(result.events[0].startsAt,"2026-11-21T19:30:00-08:00");
assert.equal(result.events[0].startTimeKind,"show","Explicitly verified SHOW clock not confused with doors");
assert.equal(result.events[0].id,old.id,"Existing published ID remains stable");
assert.deepEqual(result.events[0].musicStyles,old.musicStyles,"No invented classification");
assert.equal(result.events[0].sourceCorrection.previousStartsAt,old.startsAt);
assert.match(renderReview(result),/Source-confirmed SHOW time|verified SHOW time/i);
assert(renderReview(result).includes(old.url),"Source URL retained as evidence");
const keep=(event,rows=[{event}])=>proposeCorrections([old],rows,{today:now});
assert.equal(keep({...observed.event,startsAt:old.startsAt}).proposals.length,0,"No difference is not a correction");
assert.equal(keep({...observed.event,startsAt:"2026-11-22T19:30:00-08:00"}).proposals.length,0,"Date changes never auto-correct");
assert.equal(keep({...observed.event,startsAt:"2026-11-21T16:30:00-08:00"}).proposals.length,0,"Large time drift is held");
assert.equal(keep({...observed.event,title:"Different Artist"}).proposals.length,0,"Changed artist lineup needs research");
assert.equal(keep({...observed.event,title:old.title+" - CANCELLED"}).proposals.length,0,"Canceled show never becomes a time correction");
assert.equal(keep({...observed.event,venue:"Polaris Hall"}).proposals.length,0,"Wrong room is never changed");
assert.equal(keep({...observed.event,address:"Unknown"}).proposals.length,0,"Location mismatch held");
assert.equal(keep({...observed.event,startTimeKind:"doors"}).proposals.length,0,"Doors-only is not a verified SHOW clock");
assert.equal(keep({...observed.event,discovery:{...old.discovery,verifiedOriginalShowTime:false}}).proposals.length,0,"Source clock attestation is required");
assert.equal(keep({...observed.event,discovery:{sourceId:"untrusted"}}).proposals.length,0,"Unknown source cannot self-authorize");
assert.equal(keep({...observed.event,url:"https://example.invalid/bill"}).proposals.length,0,"Offsite event URLs cannot self-authorize");
assert.equal(keep({...observed.event,source:"Someone else"}).proposals.length,0,"Source provenance match required");
assert.equal(proposeCorrections([old],[observed,observed],{today:now}).proposals.length,0,"Duplicated source observations are ambiguous");
assert.equal(proposeCorrections([old,{...old,id:"duplicate"}],[observed],{today:now}).proposals.length,0,"Reused URL in approved inventory is ambiguous");
assert.equal(proposeCorrections([old],[],{today:now}).proposals.length,0,"Missing from feed never means cancelled");
assert.equal(proposeCorrections([old],[observed],{today:"2026-12-01"}).proposals.length,0,"Past changes are not approved");
const collision=Array.from({length:9},(_,i)=>({
 ...old,id:"old-"+i,url:"https://www.etix.com/ticket/p/"+(12345670+i)+"/"+
 "original-event-"+i+"-portland-mississippi-studios",
 startsAt:"2026-11-"+String(10+i).padStart(2,"0")+"T20:00:00-08:00"
}));
const mass=collision.map(e=>({event:{...e,startsAt:e.startsAt.replace("20:00:00","19:30:00")}}));
assert.equal(proposeCorrections(collision,mass,{today:now}).heldBatch,9);
assert.equal(proposeCorrections(collision,mass,{today:now}).proposals.length,0,"Bulk source drift held rather than rewriting all records");
assert.throws(()=>proposeCorrections([],[],{}),/explicit/);
console.log("PASS — evidence-backed official showtime correction proposals hold ambiguity, dates, cancellations, identity mismatches, bulk drift and unsupported metadata");
