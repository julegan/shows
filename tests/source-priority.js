"use strict";
const assert=require("node:assert/strict");
const registry=require("../discovery/sources.json");
const venues=require("../discovery/venues.json");
const sources=registry.sources;
const targetIds=["black-water","high-water-mark","twilight","coffin-club","star-theater","dantes","roseland","wonder-ballroom","hawthorne-theatre","high-limit-room"];
const sourceOrder=["black-water","high-water","soundcontrol-pdx","twilight","coffin-club","star-theater","dantes","roseland","wonder-ballroom","hawthorne-theatre","high-limit"];
assert.deepEqual(registry.primaryVenuePriority,targetIds,"Owner-selected priority is stable and machine readable");
assert.deepEqual(venues.venuePriority,targetIds,"Canonical venue registry must agree with discovery registry");
assert.deepEqual(sources.slice(0,sourceOrder.length).map(s=>s.id),sourceOrder,"Core venue and High Water Mark promoter adapters are first");
assert.equal(new Set(sources.map(s=>s.id)).size,sources.length,"Source IDs must be unique");
const byId=Object.fromEntries(sources.map(s=>[s.id,s]));
const byVenue=Object.fromEntries(venues.venues.map(v=>[v.id,v]));
for(const [rank,id] of targetIds.entries()){
  assert.equal(byVenue[id]?.tier,"core",id+" must be a core coverage target");
  assert.equal(byVenue[id].editorialRank,rank+1,id+" rank should be explicitly recorded");
  const source=sources.find(s=>s.venueRegistryId===id);
  assert(source,id+" must have a source record, even if the adapter is not yet ready");
  assert.equal(source.priority,"highest",id+" must have highest editorial priority");
  assert(source.url?.startsWith("https://"),id+" must point to its official HTTPS calendar/venue source");
}
assert.equal(byId["soundcontrol-pdx"].type,"promoter");
assert.equal(byId["soundcontrol-pdx"].venue,null,"Promoter is never treated as a venue");
assert.equal(byId["black-water"].status,"pilot-enabled","Keep public Google Calendar intake on");
assert.equal(byId["high-water"].status,"source-blocked","Do not bypass venue site access controls");
assert.equal(byId["no-fun"].priority,"secondary");
assert.equal(byId["no-fun"].status,"paused-secondary","No Fun must not dominate scheduled discovery");
assert.equal(byVenue["no-fun"].tier,"expansion","No Fun is secondary, not a top core source");
const enabled=sources.filter(s=>s.status==="pilot-enabled");
assert.deepEqual(enabled.map(s=>s.id),["black-water","soundcontrol-pdx","twilight","star-theater","dantes","roseland","hawthorne-theatre"]);
assert(enabled.every(s=>["black-water-ics","promoter-list-html","twilight-html","star-theater-html","hosted-venue-html","dantes-live-html"].includes(s.adapter)),"Never run unverified adapters");
for(const id of ["coffin-club","wonder-ballroom","high-limit"]){
  assert.equal(byId[id].status,"adapter-needed",id+" is research/implementation work, not a working importer");
}
const {reportPriorityCoverage}=require("../scripts/report-priority-coverage");
const {audit}=require("../scripts/audit-venue-coverage");
const summary=reportPriorityCoverage(audit("2026-10-21"));
assert(summary.includes("Black Water")&&summary.includes("High Water Mark Lounge")&&summary.includes("Hawthorne Theatre"),"Summary must cover owner-selected venues");
assert(summary.includes("No Fun:** paused-secondary"),"Summary must clearly disclose paused secondary ingest");
assert(summary.includes("Adapter needed"),"Gaps must not appear as complete integration");
for(const id of ["roseland","hawthorne-theatre","dantes"])assert.equal(byId[id].status,"pilot-enabled",id+" passed a live GitHub-runner probe");
console.log("PASS — owner-ranked venues, Dante's and other verified calendars, and No Fun daily intake paused.");
