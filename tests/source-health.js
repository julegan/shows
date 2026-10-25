"use strict";
const assert=require("node:assert/strict");
const {sourceHealthSummary}=require("../scripts/source-health");
const sources=[
 {id:"a",name:"Priority Venue A",status:"pilot-enabled",priority:"highest"},
 {id:"b",name:"Empty Venue",status:"pilot-enabled",priority:"highest"},
 {id:"c",name:"Failing Venue",status:"pilot-enabled"},
 {id:"d",name:"Coffin Club",status:"adapter-needed",priority:"highest"},
 {id:"e",name:"Blocked Venue",status:"source-blocked"}
];
const events=[
 {title:"Unfamiliar artist",venue:"Priority Venue A",category:"Unclassified",url:"https://example.org/a",discovery:{sourceId:"a"}},
 {title:"Punk metal show",venue:"Priority Venue A",category:"Music",artwork:{url:"https://example.org/a.jpg"},discovery:{sourceId:"a"}}
];
const text=sourceHealthSummary({sourceRegistry:sources,sourceRuns:[
 {id:"a",status:"checked",examined:20},
 {id:"b",status:"empty",examined:0},
 {id:"c",status:"failed",examined:0}
],accepted:events,held:[{sourceId:"a",hold:"Time missing"}],skipped:[{sourceId:"a",skip:"Already present"}],
 errors:[{source:"c",error:"HTTP 403"}]});
assert.match(text,/Priority Venue A \| Checked \| 20 \| 2 \| 1 \| 1 \| 1 \| 1 \| 1/);
assert.match(text,/Empty Venue \| EMPTY \| 0/);
assert.match(text,/Failing Venue \| FAILED \| 0/);
assert.match(text,/Coffin Club: \*\*adapter-needed\*\*/);
assert.match(text,/Blocked Venue: \*\*source-blocked\*\*/);
assert.match(text,/Unfamiliar artist/);
assert.match(text,/not\*\* establish complete venue coverage/);
assert(!text.includes("https://example.org/a.jpg"),"Report does not reproduce unnecessary image URLs");
console.log("PASS — concise per-source review, held/duplicate attribution, classifications and missing connections.");
