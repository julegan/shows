"use strict";
const assert=require("node:assert/strict");
const h=require("../scripts/holocene-importer");
const url="https://www.holocene.org/event/crimewave-a-goth-post-punk-darkwave-party-21-2/holocene/portland/";
assert.equal(h.safeUrl(url),url);
assert.equal(h.safeUrl(url+"?utm=1"),null);
assert.equal(h.safeUrl("https://evil.example/event/crimewave-a-goth-post-punk-darkwave-party-21-2/holocene/portland/"),null);
assert.deepEqual(h.links('<a href="'+url+'">Go</a><a href="'+url+'">Again</a>'),[url]);
assert.throws(()=>h.links("<h1>empty</h1>"),/layout/);
function page({date="2026-10-22T21:00:00-0700",location="Holocene",title="CRIMEWAVE: A GOTH, POST-PUNK, & DARKWAVE PARTY",status="EventScheduled",canonical=url}={}){
 return '<html><head><script type="application/ld+json">'+JSON.stringify({"@context":"https://schema.org","@type":"Event",name:title,startDate:date,eventStatus:"https://schema.org/"+status,location:{"@type":"Place",name:location,address:"1001 SE Morrison"},url:canonical})+'</script><meta property="og:image" content="https://www.holocene.org/wp-content/uploads/2026/09/crimewave.jpg"></head><body><h1>'+title+'</h1></body></html>';
}
const e=h.parseDetail(page(),url);
assert.equal(e.venue,"Holocene");assert.equal(e.startDate,"2026-10-23T04:00:00.000Z");
assert.match(e.timeEvidence,/may label this as doors/);
assert.equal(e.artwork.usageApproved,null);
assert.equal(e.artwork.sourceUrl,url);
assert.match(h.parseDetail(page({location:"Revolution Hall"}),url).hold,/does not confirm/);
assert.match(h.parseDetail(page({status:"EventCancelled"}),url).hold,/changed schedule/);
assert.match(h.parseDetail(page({title:"RESCHEDULED TO NEXT MONTH"}),url).hold,/changed schedule/);
assert.match(h.parseDetail(page({date:"2026-10-22T21:00:00"}),url).hold,/timezone/);
assert.match(h.parseDetail(page({date:"2026-10-22T21:00:00-0800"}),url).hold,/timezone\/DST/);
assert.match(h.parseDetail(page({canonical:"https://www.holocene.org/event/other/holocene/portland/"}),url).hold,/conflicts/);
assert.equal(h.parseDetail(page({date:"2027-01-22T20:00:00-0800"}),url).startDate,"2027-01-23T04:00:00.000Z");
console.log("PASS — Holocene official venue Event schema, dated source timezone/DST, cancellation, canonical URL and flyer review provenance");
