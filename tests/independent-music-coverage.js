"use strict";
const assert=require("node:assert/strict");
const {analyze,report}=require("../scripts/independent-music-coverage");
const u="https://abeathappening.org/events/2027/1/17/a-beat-happening-january";
const other="https://abeathappening.org/events/2027/1/20/second";
const a={id:"published",url:u,title:"Original DJ set",startsAt:"2027-01-17T16:00:00-08:00",
 category:"Music",musicStyles:["Hip-hop & rap"],discovery:{sourceId:"a-beat-happening"}};
const b={...a,id:"new",title:"Other format",url:other,startsAt:"2027-01-20T16:00:00-08:00",category:"Unclassified",musicStyles:[]};
const review=analyze({today:"2027-01-01",
 sources:[{id:"a-beat-happening",name:"A Beat Happening"},{id:"atlantis-lounge",name:"Atlantis"}],
 approved:[a],found:[{sourceId:"a-beat-happening",event:a},{sourceId:"a-beat-happening",event:b},
  {sourceId:"atlantis-lounge",hold:"Unknown time",title:"Original hold",url:"https://mississippipizza.com/event/hold/"}],
 reconciled:{accepted:[],held:[{url:other,hold:"Same venue/day conflict"}]},
 sourceRuns:[{id:"a-beat-happening",status:"checked"},{id:"atlantis-lounge",status:"failed"}]});
assert.deepEqual(review.windows.map(w=>w.days),[30,60,90]);
assert.equal(review.windows[0].groups[0].observed,2);
assert.equal(review.windows[0].groups[0].published,1);
assert.equal(review.windows[0].groups[0].exceptions,1);
assert.equal(review.windows[0].groups[0].unknown,1);
assert.equal(review.health[1].undated,1);
assert.deepEqual(review.rows.map(x=>x.disposition),["published","reconciliation-hold","source-hold"]);
const out=report(review);
assert.match(out,/30-day window/);assert.match(out,/60-day window/);assert.match(out,/90-day window/);
assert.match(out,/Source status/);assert.match(out,/Original hold/);
assert.throws(()=>analyze({today:"2027-02-31"}),/Invalid audit date/);
console.log("PASS — source-level 30/60/90-day originals, exceptions, unknown style and failed feeds");
