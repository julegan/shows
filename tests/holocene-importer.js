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

const newUrl="https://www.holocene.org/events/2026-11-24-spanish-love-songs-the-cost-of-living-tour";
assert.equal(h.safeUrl(newUrl),newUrl);
assert.equal(h.safeUrl(newUrl+"?q=bad"),null);
assert.equal(h.safeUrl("https://www.holocene.org/events/2026-13-24-invalid"),null);
assert.deepEqual(h.links('<a href="/events/2026-11-24-spanish-love-songs-the-cost-of-living-tour">Show</a><a href="'+newUrl+'">Duplicate</a>'),[newUrl]);
function rendered({heading="Spanish Love Songs",day="Tuesday, November 24, 2026",label="Doors",time="7PM",venue="1001 SE Morrison St, Portland"}={}){
 return '<html><head><meta property="og:image" content="https://www.holocene.org/events/poster.jpg"></head><body>'+
  '<main><p>'+day+'</p><h1>'+heading+'</h1><dl><dt>'+label+'</dt><dd>'+time+
  '</dd><dt>Venue</dt><dd>'+venue+'</dd></dl></main><h2>More nights at Holocene</h2></body></html>';
}
const newEntry=h.parseDetail(rendered(),newUrl);
assert.equal(newEntry.venue,"Holocene");
assert.equal(newEntry.startDate,"2026-11-25T03:00:00.000Z");
assert.match(newEntry.timeEvidence,/doors, NOT confirmed performance start/);
assert.equal(newEntry.artwork.sourceUrl,newUrl);
assert.equal(newEntry.artwork.usageApproved,null);
assert.match(h.parseDetail(rendered({day:"Wednesday, November 24, 2026"}),newUrl).hold,/date\/weekday/);
assert.match(h.parseDetail(rendered({venue:"Other Venue"}),newUrl).hold,/does not confirm/);
assert.match(h.parseDetail(rendered({label:"Check In",time:"7PM"}),newUrl).hold,/no explicit Starts or Doors/);
assert.match(h.parseDetail(rendered({heading:"EVENT CANCELED"}),newUrl).hold,/canceled/);
const started=h.parseDetail(rendered({label:"Starts",time:"9PM"}),newUrl);
assert.equal(started.startDate,"2026-11-25T05:00:00.000Z");
assert.match(started.timeEvidence,/event start/);
assert.match(h.parseDetail(page({date:"2026-11-25T21:00:00-0800",canonical:newUrl}),newUrl).hold,/conflicts with dated permalink/);

console.log("PASS — Holocene legacy Event schema plus current calendar, verified weekday/venue, starts/doors labels and artwork provenance");
