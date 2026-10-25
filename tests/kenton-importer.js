"use strict";
const assert=require("node:assert/strict");
const {parseKenton,resolvedDay,visibleLines}=require("../scripts/kenton-importer");
const {urlOf,extract,reconcile}=require("../scripts/discover-events");
const source=require("../discovery/sources.json").sources.find(x=>x.id==="kenton-club");
const now=new Date("2026-10-25T04:30:00Z"); // Still Oct 24 in Portland.
const fixture=`<html><head><title>Kenton Club</title><script>Saturday October 24 BAD INJECTION</script></head>
<body><h1>Kenton Club</h1><p>All shows $10 cover unless noted</p>
<p>Saturday October 24</p><p>Weird Rainbow-Little Hexes-</p>
<p>Heirloom Monsters</p><p>Mask Appeal</p>
<p>Sunday November 1</p><p>1-6</p><p>Beelzebubs Bazaar a Free Market</p>
<p>Friday November 6</p><p>National Diet-Horsebag-Sun Blood Stories</p>
<p>Saturday November 7</p><p>DJ Action Slacks</p>
<p>Friday November 20 (Show starts at 8)</p><p>Glam Country-Fawkes Glove-Superplume</p>
<p>Saturday November 28</p><p>Muscle Cats-One Drink and Other lies</p>
<p>Saturday November</p><p>wfkcbooking @gmail.com</p><p>2025 N Kilpatrick St</p>
</body></html>`;
const rows=parseKenton(fixture,{now});
assert.equal(rows.length,6,"Six dated official entries, no fabricated seventh");
assert.equal(rows[0].dateOnly,"2026-10-24");
assert.match(rows[0].title,/Heirloom Monsters Mask Appeal/);
assert(!rows[0].title.includes("BAD INJECTION"),"Script content excluded");
assert.equal(rows[1].dateOnly,"2026-11-01");
assert.equal(rows[1].title,"Beelzebubs Bazaar a Free Market","Unlabeled market hours are not the title or guessed show time");
assert.equal(rows[4].dateOnly,"2026-11-20");
assert(!rows.some(x=>x.title.includes("wfkcbooking")));
assert.equal(resolvedDay("Friday","November",20,now),"2026-11-20");
assert.equal(resolvedDay("Tuesday","November",20,now),null,"Wrong weekday must not silently pass");
assert.equal(resolvedDay("Saturday","November",29,now),null,"Wrong date/weekday must not silently pass");
assert.equal(resolvedDay("Saturday","April",10,now),null,"Outside next 120 days");
assert.equal(urlOf(rows[0],source),"https://www.kentonclub.com/","Only the official roster URL is permitted");
assert.equal(urlOf({...rows[0],fullUrl:"https://not-kenton.example/"},source),null);
assert.equal(urlOf({...rows[0],fullUrl:"https://www.kentonclub.com/contact"},source),null);
const converted=rows.map(x=>extract(x,source,now));
assert(converted.every(x=>x.event),"All fixture shows produce dated review candidates");
assert.equal(converted[0].event.startTimeKind,"date-only");
assert.equal(converted[0].event.startsAt,"2026-10-24T00:00:00-07:00");
assert.equal(converted[1].event.category,"Markets","Official bazaar never reclassified as concert");
assert.equal(converted[2].event.category,"Music");
assert.notEqual(converted[0].event.id,converted[1].event.id,"Shared listing permalink cannot collapse event IDs");
assert.notEqual(converted[2].event.id,converted[3].event.id);
assert.equal(reconcile([],converted).accepted.length,6,"No unrelated distinct-day show is dropped");
assert.throws(()=>parseKenton("<h1>Kenton Club</h1><p>No roster</p>",{now}),/heading missing/);
assert(visibleLines("<div><script>evil</script><p>A&amp;B</p></div>").includes("A&B"));
console.log("PASS — Kenton official dated bills, matching weekdays, year bounds, unknown times, markets, unique IDs and fail closed.");
