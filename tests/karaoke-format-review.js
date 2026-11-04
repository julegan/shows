"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {classifyEvent}=require("../scripts/event-classification");
const {reclassifyKaraoke}=require("../scripts/karaoke-format-review");

const base={id:"example",category:"Other",title:"Karaoke Night - Free!",
  discovery:{sourceId:"high-water"},tags:["Source-listed Other","Time needs confirmation"],
  startsAt:"2026-11-10T20:00:00-08:00",url:"https://www.treetix.com/event/123/highwatermark",
  musicStyles:[],sourceCategories:[],description:"Original venue listing",icon:"◇"};
const records=[base,
 {...base,id:"other",title:"Tuesday Trivia"},
 {...base,id:"curated",discovery:undefined,title:"KARAOKE FROM HELL"},
 {...base,id:"already",category:"Karaoke",title:"No Fun Karaoke"},
 {...base,id:"band",category:"Music",title:"Karaoke band evening"},
 {...base,id:"mixed",title:"Square Dancing / KARAOKE @ 9:30"},
 {...base,id:"punk",title:"Metal and punk karaoke"}
];
const result=reclassifyKaraoke(records);
assert.equal(result.changed.length,3,"Only previously source-discovered Other karaoke listings change");
assert.deepEqual(result.changed.map(x=>x.id),["example","mixed","punk"]);
assert.equal(result.events[0].category,"Karaoke");
assert.equal(result.events[0].tags[0],"Source-listed Karaoke");
assert.equal(result.events[0].classificationEvidence,"Event-specific source wording");
assert.deepEqual(result.events.slice(1,5),records.slice(1,5),"Nonmatching, curated and already labeled events are preserved untouched");
assert.equal(result.events[5].category,"Karaoke","Combined original title still has an explicit karaoke program");
assert.equal(result.events[6].category,"Karaoke","Music-associated karaoke is not a live band concert");
assert.deepEqual(result.events.map(e=>e.id),records.map(e=>e.id),"Event IDs preserved");
assert.deepEqual(result.events.map(e=>e.startsAt),records.map(e=>e.startsAt),"Start times preserved");
assert.deepEqual(result.events.map(e=>e.url),records.map(e=>e.url),"Event URLs preserved");
assert.equal(reclassifyKaraoke(result.events).changed.length,0,"Reclassification is idempotent");
assert.equal(base.category,"Other","Input is immutable");
assert.equal(base.tags[0],"Source-listed Other","Input tags are immutable");

// Real dataset growth must not make this migration fixture brittle.
const canonical=fs.readFileSync(path.resolve(__dirname,"../events.js"),"utf8");
const m=canonical.match(/window\.SHOWS_EVENTS\s*=\s*(\[[\s\S]*?\]);\s*$/);
assert(m,"Approved dataset remains parseable");
const published=JSON.parse(m[1]);
const expected=published.filter(e=>e.discovery?.sourceId&&e.category==="Other"&&/\bkaraoke\b/i.test(e.title)
  &&classifyEvent({title:e.title,categories:e.sourceCategories||[]}).category==="Karaoke");
const review=reclassifyKaraoke(published);
assert.equal(review.changed.length,expected.length,"All existing explicit karaoke titles are proposed consistently");
assert.equal(review.events.length,published.length,"Never add/remove event records");
assert.equal(new Set(review.events.map(e=>e.id)).size,published.length,"Never introduce duplicate IDs");
console.log("PASS — karaoke separate from Music, legacy records review-only, canonical IDs and source evidence preserved");
