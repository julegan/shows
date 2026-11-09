"use strict";
const assert=require("node:assert/strict");
const registry=require("../discovery/sources.json");
const venues=require("../discovery/venues.json");
const sources=registry.sources;
const targetIds=["black-water","high-water-mark","twilight","coffin-club","star-theater","dantes","roseland","wonder-ballroom","hawthorne-theatre","high-limit-room","crystal-ballroom","revolution-hall"];
const sourceOrder=["black-water","high-water","soundcontrol-pdx","twilight","coffin-club","star-theater","dantes","roseland","wonder-ballroom","hawthorne-theatre","high-limit","crystal-ballroom","revolution-hall"];
assert.deepEqual(registry.primaryVenuePriority,targetIds,"Owner-selected priority is stable and machine readable");
assert(venues.editorialPreferenceGroups.preferred.length>targetIds.length,"Preferences must extend beyond legacy first twelve");
assert(targetIds.every(id=>venues.editorialPreferenceGroups.preferred.includes(id)),"All original core venues remain preferred");
assert.deepEqual(venues.editorialActiveVenueIds,[...venues.editorialPreferenceGroups.preferred,...venues.editorialPreferenceGroups.scene],"All relevant scene venues are full editorial priorities");
assert.deepEqual(venues.venuePriority,venues.editorialActiveVenueIds,"Canonical active venue roster drives research priority");
assert.deepEqual(registry.editorialPriority,venues.editorialActiveVenueIds.map(id=>venues.venues.find(v=>v.id===id).name),"Source research priorities must include preferred AND additional relevant venues");
assert.deepEqual(registry.editorialActiveVenueIds,venues.editorialActiveVenueIds,"Source discovery references full canonical active venue list");
for(const id of venues.editorialPreferenceGroups.scene)assert.equal(venues.venues.find(v=>v.id===id).tier,"core","Additional relevant scene venue has full scope: "+id);
assert(registry.primaryVenuePriorityRole.includes("Legacy"),"Legacy source adapter order must not be mistaken for editorial order");
assert.deepEqual(sources.slice(0,sourceOrder.length).map(s=>s.id),sourceOrder,"Core venue and High Water Mark promoter adapters are first");
assert.equal(new Set(sources.map(s=>s.id)).size,sources.length,"Source IDs must be unique");
const byId=Object.fromEntries(sources.map(s=>[s.id,s]));
const byVenue=Object.fromEntries(venues.venues.map(v=>[v.id,v]));
for(const id of targetIds){
  assert.equal(byVenue[id]?.tier,"core",id+" must be a core coverage target");
  assert.equal(byVenue[id].editorialPreference,"preferred",id+" must retain user preference");
  const source=sources.find(s=>s.venueRegistryId===id);
  assert(source,id+" must have a source record, even if the adapter is not yet ready");
  assert.equal(source.priority,"highest",id+" must have highest editorial priority");
  assert(source.url?.startsWith("https://"),id+" must point to its official HTTPS calendar/venue source");
}
assert.equal(byId["soundcontrol-pdx"].type,"promoter");
assert.equal(byId["soundcontrol-pdx"].venue,null,"Promoter is never treated as a venue");
assert.equal(byId["black-water"].status,"pilot-enabled","Keep public Google Calendar intake on");
assert.equal(byId["high-water"].status,"pilot-enabled","Provider-approved TreeTix feed is read-only; direct venue host is still blocked");
assert.equal(byId["no-fun"].priority,"secondary");
assert.equal(byId["no-fun"].status,"paused-secondary","No Fun must not dominate scheduled discovery");
assert.equal(byVenue["no-fun"].tier,"expansion","No Fun is secondary, not a top core source");
const enabled=sources.filter(s=>s.status==="pilot-enabled");
assert.deepEqual(enabled.map(s=>s.id),["black-water","high-water","soundcontrol-pdx","twilight","star-theater","dantes","roseland","wonder-ballroom","hawthorne-theatre","crystal-ballroom","revolution-hall","turn-turn-turn","kenton-club","mississippi-polaris","holocene","starday-tavern","the-off-beat","aladdin-theater","mission-theater","nova-pdx","lolas-room","showdown","45-east","mammoth-nw","the-1905","jack-london-revue","alberta-street-pub","alberta-rose-theatre","atlantis-lounge"]);
assert(enabled.every(s=>["black-water-ics","treetix-public-json","promoter-list-html","twilight-html","star-theater-html","hosted-venue-html","dantes-live-html","wonder-ballroom-html","revolution-events-html","crystal-official-html","mississippi-polaris-html","holocene-event-html","starday-google-html","kenton-official-html","turnturnturn-opendate","offbeat-official-html","aladdin-official-html","mission-official-html","nova-official-schema","lolas-mcmenamins-html","showdown-original-html","45east-redcube-original","mammoth-original-promoter","turntable-1905-ssr","alberta-squarespace-json","jack-london-original-html","alberta-rose-original-html","atlantis-original-html"].includes(s.adapter)),"Never run unverified adapters");
for(const id of ["coffin-club","high-limit"]){
  assert.equal(byId[id].status,"adapter-needed",id+" is research/implementation work, not a working importer");
}
const {reportPriorityCoverage}=require("../scripts/report-priority-coverage");
const {audit}=require("../scripts/audit-venue-coverage");
const summary=reportPriorityCoverage(audit("2026-10-21"));
assert(summary.includes("Black Water")&&summary.includes("High Water Mark Lounge")&&summary.includes("Hawthorne Theatre"),"Summary must cover owner-selected venues");
assert(summary.includes("No Fun:** paused-secondary"),"Summary must clearly disclose paused secondary ingest");
assert(summary.includes("Adapter needed"),"Gaps must not appear as complete integration");
for(const id of ["roseland","hawthorne-theatre","dantes","wonder-ballroom","crystal-ballroom","revolution-hall"])assert.equal(byId[id].status,"pilot-enabled",id+" passed a live GitHub-runner probe");
console.log("PASS — owner-ranked venues, current verified calendar coverage, and No Fun daily intake paused.");

assert.equal(byVenue["show-bar"].ingestionStatus,"active-adapter","Show Bar has independent venue identity backed by verified original event cards");
assert(!byVenue["revolution-hall"].aliases?.some(s=>/show\s*bar/i.test(s)),"Never merge Show Bar into main-hall venue aliases");

assert.equal(byId["mississippi-polaris"].status,"pilot-enabled");
for(const id of ["mississippi","polaris-hall"])assert.equal(byVenue[id].ingestionStatus,"active-adapter","Each stage is separately tracked");

assert.equal(byVenue["holocene"].ingestionStatus,"active-adapter","Holocene original Event schema live tested");

assert.equal(byId["starday-tavern"].status,"pilot-enabled","Source-verified original Starday public calendar is review-only");
assert.equal(byVenue["starday-tavern"].ingestionStatus,"active-adapter");
assert.equal(byId["kenton-club"].adapter,"kenton-official-html");
assert.equal(byId["kenton-club"].status,"pilot-enabled","Official Kenton importer passed GitHub Actions probe 40170404712");
assert.equal(byVenue["kenton-club"].ingestionStatus,"active-adapter");

assert.equal(byId['turn-turn-turn'].adapter,'turnturnturn-opendate');
assert.equal(byId['turn-turn-turn'].status,'pilot-enabled','Official venue and event details passed GitHub runner 40171261702');
assert.equal(byVenue['turn-turn-turn'].ingestionStatus,'active-adapter');

for(const id of ["republic-cafe","b-side","wyrd-hut","starthrow","moda-center"]){
 assert.equal(byId[id]?.status,"adapter-needed","No unverified new importer activated for "+id);
 assert.equal(byVenue[id]?.editorialPreference,"preferred","Requested venue must be researched ahead of convenience");
}
assert.equal(byId["doug-fir"].status,"reopening-watch","Reopening venue is a research watch, not an active source");
assert.equal(byVenue["the-fixin-to"].editorialPreference,"secondary","Former concert room not prioritized as active music venue");

assert.equal(registry.sharedSourceCoverage["mississippi"],"mississippi-polaris","Do not duplicate Mississippi importer");
assert.equal(registry.sharedSourceCoverage["polaris-hall"],"mississippi-polaris","Do not duplicate Polaris importer");
assert.equal(registry.sharedSourceCoverage["show-bar"],"revolution-hall","Do not duplicate Show Bar importer");
assert(!registry.sources.some(s=>["mississippi","polaris-hall","show-bar"].includes(s.id)),"Do not create fake blocked stubs for shared active venue feeds");
for(const id of venues.editorialPreferenceGroups.scene){
 if(registry.sharedSourceCoverage[id])continue;
 assert(registry.sources.some(s=>s.venueRegistryId===id),"Each additional scene venue needs source tracking: "+id);
}

assert.equal(byId["nova-pdx"].status,"pilot-enabled","Nova source activated only after live GitHub Actions proof");
assert.equal(byId["nova-pdx"].adapter,"nova-official-schema","Nova stays first-party and read-only");
assert.equal(byVenue["nova-pdx"].ingestionStatus,"active-adapter","Live verified Nova date+clock source active");

assert.equal(byId["lolas-room"].status,"pilot-enabled","Lola source activated only after room-specific live source probe");
assert.equal(byId["lolas-room"].adapter,"lolas-mcmenamins-html","Lola keeps separate first-party room-scoped importer");
assert.equal(byVenue["lolas-room"].ingestionStatus,"active-adapter","Official Lola independent room calendar active");
assert.equal(byId["crystal-ballroom"].adapter,"crystal-official-html","Crystal Ballroom remains separate from Lola");

assert.equal(byId["showdown"].status,"pilot-enabled","Showdown enabled after GitHub Actions source proof");
assert.equal(byId["showdown"].adapter,"showdown-original-html","Showdown uses primary venue calendar with detail-year corroboration");
assert.equal(byVenue["showdown"].ingestionStatus,"active-adapter","Showdown room is now independently connected");

assert.equal(byId["45-east"].status,"pilot-enabled","45 East Red Cube group-specific venue source enabled");
assert.equal(byId["45-east"].adapter,"45east-redcube-original","45 East original venue promoter group feed is isolated");
assert.equal(byVenue["45-east"].ingestionStatus,"active-adapter","45 East review-only discovery active");
assert(!registry.sources.some(s=>["777-booking","third-eye-booking-pdx"].includes(s.id)),"Unverified promoter backlog cannot be enabled as a source");

// Mammoth promoter pilot covers only the two verified gap rooms, not all PNW listings.
assert.equal(byId["mammoth-nw"].status,"pilot-enabled");
assert.equal(byId["mammoth-nw"].type,"promoter");
assert.equal(byId["mammoth-nw"].venue,null,"Mammoth is not a physical venue");
assert.deepEqual(byId["mammoth-nw"].coverageTargetIds,["hawthorne-lounge","high-limit-room"]);
assert(!byId["mammoth-nw"].coverageTargetIds.includes("roseland"),"Existing venue adapter must not be duplicated");

assert.equal(byId["the-1905"].status,"pilot-enabled");
assert.equal(byId["the-1905"].adapter,"turntable-1905-ssr");
assert.equal(byVenue["the-1905"].ingestionStatus,"active-adapter");
assert.match(byId["the-1905"].reason,/partial, not comprehensive/);

assert.equal(byId["alberta-street-pub"].status,"pilot-enabled");
assert.equal(byId["alberta-street-pub"].adapter,"alberta-squarespace-json");
assert.equal(byVenue["alberta-street-pub"].ingestionStatus,"active-adapter");

assert.equal(byId["jack-london-revue"].status,"pilot-enabled");
assert.equal(byId["jack-london-revue"].adapter,"jack-london-original-html");
assert.equal(byVenue["jack-london-revue"].ingestionStatus,"active-adapter");

assert.equal(byId["alberta-rose-theatre"].status,"pilot-enabled");
assert.equal(byId["alberta-rose-theatre"].adapter,"alberta-rose-original-html");
assert.equal(byVenue["alberta-rose-theatre"].ingestionStatus,"active-adapter");
assert.equal(byId["keys-lounge"].status,"adapter-needed","Keys source describes weekly music programming but lacks dated original event links");
