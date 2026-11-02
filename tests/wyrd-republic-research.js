"use strict";
const assert=require("node:assert/strict");
const venues=require("../discovery/venues.json");
const sources=require("../discovery/sources.json");
for(const id of ["wyrd-hut","republic-cafe"]){
 const venue=venues.venues.find(v=>v.id===id);
 const source=sources.sources.find(s=>s.id===id);
 assert(venue && source,"Retain editorial venue/source "+id);
 assert.equal(venue.editorialPreference,"preferred","Personal venue priority is separate from feed readiness");
 assert(venues.editorialActiveVenueIds.includes(id),"Both venues are fully relevant active priorities");
 assert.equal(source.status,"adapter-needed","Do not activate unverified importer for "+id);
 assert(!source.adapter,"No unverified event feed for "+id);
 assert.equal(source.priority,"editorial-active","Undercovered must not equal unimportant");
 assert(Array.isArray(source.researchSources)&&source.researchSources.length>=2,"Track original leads for "+id);
 for(const lead of source.researchSources){
  assert(/^https:\/\//.test(lead.url),"Links must use HTTPS");
  assert(lead.kind && lead.status,"Document provenance and source capability");
 }
}
assert(venues.venues.find(v=>v.id==="wyrd-hut").notes.includes("65th Ave"),"Preserve primary organizer address with discrepancy");
assert(venues.venues.find(v=>v.id==="republic-cafe").notes.includes("no public comprehensive"),"Do not falsely claim an official events feed");
console.log("PASS — Wyrd and Republic stay full editorial priorities but unconnected, with original source evidence and no fabricated venue events");
