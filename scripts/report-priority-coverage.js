#!/usr/bin/env node
"use strict";
// A transparent source-readiness and calendar-coverage summary for each discovery run.
// Existing event counts are NOT a claim of complete official venue coverage.
const {audit}=require("./audit-venue-coverage");
const sources=require("../discovery/sources.json");
const bySource=new Map(sources.sources.filter(s=>s.venueRegistryId).map(s=>[s.venueRegistryId,s]));
function reportPriorityCoverage(snapshot=audit()){
 const byVenue=new Map(snapshot.rows.map(v=>[v.id,v]));
 const out=[
  "# SHOWS priority venue coverage — "+snapshot.date,
  "",
  "The owner-selected venues determine research and adapter investment. Counts below are future events **already in SHOWS**, not a count of all events on official calendars.",
  "",
  "| Priority | Venue | SHOWS events | Music | Automated discovery |",
  "| ---: | --- | ---: | ---: | --- |"
 ];
 for(const [i,id] of sources.primaryVenuePriority.entries()){
  const venue=byVenue.get(id),source=bySource.get(id);
  if(!venue||!source)throw new Error("Missing venue/source for priority ID: "+id);
  const state=source.status==="pilot-enabled"?"Enabled":source.status==="source-blocked"?"Direct source blocked; promoter leads only":source.status==="adapter-needed"?"Adapter needed":source.status;
  out.push("| "+(i+1)+" | "+venue.name+" | "+venue.futureCount+" | "+venue.futureMusic+" | "+state+" |");
 }
 const secondary=sources.sources.find(s=>s.id==="no-fun");
 out.push("","**No Fun:** "+secondary.status+" — existing approved events stay in the calendar; daily intake is not run.","",
  "**Source backlog:** Build verified adapters for the high-priority venues marked *Adapter needed*. For High Water Mark, validate allowed promoter data rather than bypassing the site's access restrictions.","",
  "**Approval:** Imported events and original artwork require review PRs. No automatic publishing.","");
 return out.join("\n");
}
if(require.main===module)process.stdout.write(reportPriorityCoverage());
module.exports={reportPriorityCoverage};
