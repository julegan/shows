"use strict";
const assert=require("node:assert/strict");
const backlog=require("../discovery/scene-source-backlog.json");
const canonical=require("../discovery/sources.json");
assert.equal(backlog.schemaVersion,1);
assert.equal(backlog.sources.length,12,"12 researched sources, not enabled importers");
assert.equal(new Set(backlog.sources.map(x=>x.id)).size,backlog.sources.length,"Unique source IDs");
const kinds=new Set(["promoter","record-label","scene-calendar"]);
for(const s of backlog.sources){
 assert(kinds.has(s.kind),"Known source kind required");
 assert(["verified-label-research-lead","identity-verified-feed-unverified","operator-announced-site-access-unverified","existing-review-only-lead-collector"].includes(s.researchStatus),"Explicit research state required: "+s.id);
 assert(typeof s.evidenceUrl==="string"&&s.evidenceUrl.startsWith("https://"),"Evidence needed for "+s.id);
 assert(typeof s.nextStep==="string"&&s.nextStep.length>40,"Next action required for "+s.id);
 assert(!("enabled" in s)&&!("adapter" in s)&&!("status" in s),"Research list must not activate an importer: "+s.id);
}
const promoters=backlog.sources.filter(x=>x.kind==="promoter");
assert.deepEqual(promoters.map(x=>x.id),["777-booking","third-eye-booking"]);
assert(promoters.every(x=>x.requestedByOwner),"Only two promoters were explicitly requested");
assert(promoters.every(x=>x.officialSourceUrl===null),"Don't invent unverified original profiles");
assert.equal(backlog.sources.filter(x=>x.kind==="record-label").length,8);
assert(backlog.sources.filter(x=>x.kind==="record-label").every(x=>x.requestedByOwner===false),"Label shortlist needs user review");
assert.equal(backlog.sources.find(x=>x.id==="pdx-subvert").researchStatus,"operator-announced-site-access-unverified");
const doomtown=canonical.sources.find(s=>s.id==="doomtown-pdx");
assert(doomtown&&doomtown.leadMode==="review-only-not-event-adapter","Existing Doomtown lead source must not be duplicated or upgraded");
assert.equal(backlog.sources.find(x=>x.id==="doomtown-pdx").researchStatus,"existing-review-only-lead-collector");
assert(!canonical.sources.some(s=>["777-booking","third-eye-booking","pdx-subvert"].includes(s.id)),"Unverified promoters and the revived site remain only research leads");
console.log("PASS — owner-requested promoters, labels, existing Doomtown review and no unverified adapter activation");
