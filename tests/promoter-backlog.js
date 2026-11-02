"use strict";
const assert=require("node:assert/strict");
const registry=require("../discovery/promoter-backlog.json");
const sources=require("../discovery/sources.json");
const venues=require("../discovery/venues.json");
assert.equal(registry.version,1);
assert.equal(registry.promoters.length,2);
assert.deepEqual(registry.promoters.map(p=>p.id),["777-booking","third-eye-booking-pdx"]);
for(const p of registry.promoters){
 assert.equal(p.type,"promoter","Booking organizers must not be mistaken for venues");
 assert.equal(p.status,"research-backlog","No unverified promoter sources can be activated");
 assert(p.evidence.length>0,"Each promoter needs provenance for future research");
 assert(p.sourceCandidates.every(s=>/^https:\/\//.test(s.url)));
 assert(!sources.sources.some(s=>s.id===p.id),"Promoter backlog must not be a live importer");
 assert(!venues.venues.some(v=>v.id===p.id),"Promoter is not a venue");
}
assert(!registry.promoters.find(p=>p.id==="third-eye-booking-pdx").sourceCandidates.length,"Don't invent Third Eye official URL from unrelated agencies");
console.log("PASS — 777 Booking and Third Eye Booking are independent, inactive, sourced promoter research leads");
