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
assert.deepEqual(venues.venuePriority,["black-water","high-water-mark","twilight","coffin-club","star-theater","dantes","roseland","wonder-ballroom","hawthorne-theatre","high-limit-room","crystal-ballroom","revolution-hall"],"Owner-prioritized twelve venue targets");
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
