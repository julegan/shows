"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const original=JSON.parse(fs.readFileSync(path.join(root,"discovery/venues.json"),"utf8")).venues;
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,"places.js"),"utf8"),context);
const actual=JSON.parse(JSON.stringify(context.window.SHOWS_PLACES));
assert.equal(actual.length,original.length,"Public place identities reflect every canonical venue");
for(const [i,venue] of original.entries()){
 const entry=actual[i];
 assert.equal(entry.id,venue.id,"Stable venue ID");
 assert.equal(entry.name,venue.name,"Canonical venue name");
 assert.deepEqual(entry.aliases,venue.aliases||[],"Aliases stay current");
 assert.equal(entry.calendarUrl?.endsWith(".json")?null:entry.calendarUrl,
   venue.calendarUrl && !/\.json(?:$|[?#])/.test(venue.calendarUrl)?venue.calendarUrl:null,
   "Only human-facing official venue calendars are exposed");
}
const markup=fs.readFileSync(path.join(root,"index.html"),"utf8");
assert(markup.indexOf('src="./places.js"')>=0 && markup.indexOf('src="./places.js"')<markup.indexOf('src="./app.js"'),
 "Places directory loads before browser app");
console.log("PASS — Places identity snapshot matches authoritative registry and is loaded before app");
