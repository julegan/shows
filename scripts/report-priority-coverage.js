#!/usr/bin/env node
"use strict";
// Editorial preference is independent of source readiness; events listed here
// are a reviewed SHOWS subset, not proof of complete venue calendar coverage.
const {audit}=require("./audit-venue-coverage");
const venues=require("../discovery/venues.json");
const sources=require("../discovery/sources.json");
function reportPriorityCoverage(snapshot=audit()){
 const byVenue=new Map(snapshot.rows.map(v=>[v.id,v]));
 const bySource=new Map(sources.sources.filter(s=>s.venueRegistryId).map(s=>[s.venueRegistryId,s]));
 const status=source=>!source?"No registered importer"
  :source.status==="pilot-enabled"?"Enabled"
  :source.status==="source-blocked"?"Direct source blocked; review promoter leads"
  :source.status==="adapter-needed"?"Adapter needed"
  :source.status==="reopening-watch"?"Reopening watch; no published source"
  :source.status==="paused-secondary"?"Paused (secondary)":source.status;
 const out=[
  "# SHOWS editorial-first venue coverage — "+snapshot.date,
  "",
  "Owner preference determines **research priority**; importer availability is a separate engineering property. Groups are **not ranked internally**. Counts are only future events already approved in SHOWS—not all advertised shows.",
  "",
  "| Editorial group | Venue | SHOWS events | Music | Automated discovery |",
  "| --- | --- | ---: | ---: | --- |"
 ];
 const groups=venues.editorialPreferenceGroups;
 for(const [group,ids] of Object.entries(groups)){
  for(const id of ids){
   const venue=byVenue.get(id);
   if(!venue)throw Error("Missing venue in registry: "+id);
   out.push("| "+group+" | "+venue.name+" | "+venue.futureCount+" | "+venue.futureMusic+" | "+status(bySource.get(id))+" |");
  }
 }
 const secondary=sources.sources.find(s=>s.id==="no-fun");
 out.push("","**No Fun:** "+secondary.status+" — existing approved events stay in the calendar; daily intake is not run.","",
  "**Research backlog:** Find first-party dated event lists at preferred venues marked *Adapter needed* or *No registered importer*, without reducing their editorial preference. Keep Doug Fir on reopening watch instead of generating shows.",
  "**Source health:** A blocked or inaccessible venue site is not a claim that it has zero upcoming events.",
  "**Approval:** Imported events and original artwork require review PRs. No automatic publishing.","");
 return out.join("\n");
}
if(require.main===module)process.stdout.write(reportPriorityCoverage());
module.exports={reportPriorityCoverage};
