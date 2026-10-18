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
assert.equal(count("black-water").futureMusic,0,"Missing coverage must be visible");
assert(count("star-theater").futureMusic>0);
assert(count("coffin-club").futureMusic>0);
assert(count("mississippi").futureMusic===0,"Missing but public official calendar must show a gap");
assert(!venues.venues.some(x=>x.id==="soundcontrol-pdx"),"Promoter is not a single venue");
assert(venues.supplementaryDiscovery.some(x=>x.id==="soundcontrol-pdx"));
assert(venues.supplementaryDiscovery.some(x=>x.id==="doomtown-pdx"));
const text=report(a);
assert(text.includes("Black Water")&&text.includes("Original images"));
console.log("PASS — "+a.listedVenues+" venue registry entries with verifiable reporting and known source gaps");
