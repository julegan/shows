"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {audit,report}=require("../scripts/audit-venue-coverage");
const venues=JSON.parse(fs.readFileSync(path.join(__dirname,"../discovery/venues.json"),"utf8"));
const ids=new Set();
for(const v of venues.venues){
 assert(v.id&&!ids.has(v.id),"Unique stable venue ID: "+v.id);
 ids.add(v.id);
 assert(v.name && ["core","expansion","watch"].includes(v.tier));
 assert(["active-adapter","source-blocked","adapter-needed","source-empty","not-open"].includes(v.ingestionStatus));
 if(v.calendarUrl)assert(/^https:\/\//.test(v.calendarUrl));
}
const a=audit("2026-10-18");
const count=id=>a.rows.find(x=>x.id===id);
assert(count("black-water"),"Black Water must remain a core venue even without a working feed");
assert.equal(count("black-water").futureCount,11,"Official source provides eleven dated Black Water listings");
assert.equal(count("black-water").futureMusic,8,"Only source-evident music should be classified as Music");
assert.equal(count("black-water").ingestionStatus,"active-adapter");
const allGroups=Object.values(venues.editorialPreferenceGroups).flat();
assert.equal(new Set(allGroups).size,allGroups.length,"Preference groups must not duplicate venues");
assert.equal(allGroups.length,venues.venues.length,"Every venue must belong to exactly one preference group");
for(const venue of venues.venues){
 assert(venues.editorialPreferenceGroups[venue.editorialPreference]?.includes(venue.id),"Venue's preference group must match group index: "+venue.id);
 assert(!("editorialRank" in venue),"Preferences are groups, not an assumed personal rank");
}
assert.deepEqual(venues.venuePriority,venues.editorialPreferenceGroups.preferred,"Legacy venuePriority alias must match user-preferred group");
for(const id of ["mississippi","holocene","doug-fir","nova-pdx","starthrow","lolas-room","showdown","45-east","republic-cafe","b-side","wyrd-hut","moda-center"]){
 assert(venues.editorialPreferenceGroups.preferred.includes(id),"User-preferred venue retained: "+id);
}
assert.equal(count("the-fixin-to").editorialPreference,"secondary","Arcade conversion removes live-show import priority");
assert.equal(count("doug-fir").ingestionStatus,"not-open","Doug Fir not falsely marked open");
assert.equal(count("doug-fir").editorialPreference,"preferred","Reopening watch must not lower personal priority");
assert.equal(count("no-fun").tier,"expansion","No Fun stays listed but is no longer first-priority");
for(const id of ["dantes","roseland","wonder-ballroom","hawthorne-theatre","high-limit-room","crystal-ballroom","revolution-hall"]){
 assert(count(id).tier==="core","Recently elevated priority venue: "+id);
 assert(count(id).calendarUrl?.startsWith("https://"),"Official venue URL: "+id);
}
assert(count("star-theater").futureMusic>0);
assert(count("coffin-club").futureMusic>0);
// Discovery PRs add genuine venue events; an old "zero Mississippi music"
// fixture would break whenever the official importer works as intended.
const mississippi=count("mississippi");
assert(mississippi&&mississippi.ingestionStatus==="active-adapter","Mississippi Studios retains its verified original event source");
assert(mississippi.calendarUrl?.startsWith("https://mississippistudios.com/"),"Mississippi source remains official");
assert(mississippi.futureMusic<=mississippi.futureCount,"Genre classification cannot exceed listed venue events");
const polaris=count("polaris-hall");
assert(polaris&&polaris.ingestionStatus==="active-adapter","Polaris Hall retains its independent verified venue identity");
assert(polaris.futureMusic<=polaris.futureCount,"Polaris venue music cannot exceed total future listings");
assert(!venues.venues.some(x=>x.id==="soundcontrol-pdx"),"Promoter is not a single venue");
assert(venues.supplementaryDiscovery.some(x=>x.id==="soundcontrol-pdx"));
assert(venues.supplementaryDiscovery.some(x=>x.id==="doomtown-pdx"));
const text=report(a);
assert(text.includes("Black Water")&&text.includes("Original images"));
console.log("PASS — "+a.listedVenues+" venue registry entries with verifiable reporting and known source gaps");
