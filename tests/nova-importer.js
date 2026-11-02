"use strict";
const assert=require("node:assert/strict");
const {CALENDAR_URL,HOME_URL,dateOf,tixrUrl,art,cardsFromHome,findClock,rawEvents,toCandidate,parseNova,fetchNovaEvents}=require("../scripts/nova-importer");
const fixture={
 "@type":"MusicEvent",name:"House Wednesday",startDate:"Nov 04, 2026",
 eventStatus:"https://schema.org/EventScheduled",offers:{url:"https://tixr.com/e/204316?utm_source=venue"},
 location:{name:"Nova PDX",address:{streetAddress:"722 E Burnside St",addressLocality:"Portland",addressRegion:"OR"}},
 image:"https://cdn.prod.website-files.com/official-show-image.webp"
};
const page="<script type='application/ld+json'>"+JSON.stringify(fixture)+"</script>";
const home="<div><strong>House Wednesday</strong> <p>Nov 4, 2026</p><b>9:00 pm</b> GET TICKETS</div>";
assert.equal(dateOf("Nov 04, 2026"),"2026-11-04");
assert.equal(dateOf("November 31, 2026"),null);
assert.equal(dateOf("Nov 04"),null);
assert.equal(tixrUrl("https://tixr.com/e/204316?utm_campaign=abc"),"https://tixr.com/e/204316");
assert.equal(tixrUrl("https://www.tixr.com/groups/else/events/no"),null);
assert.equal(tixrUrl("https://evil.example/e/204316"),null);
assert.equal(art(fixture.image).usageApproved,null);
assert.equal(art("https://evil.example/x.png"),null);
assert.equal(rawEvents(page).length,1);
const cards=cardsFromHome(home);
assert.equal(findClock("House Wednesday","2026-11-04",cards),"21:00");
assert.equal(findClock("House Wednesday","2026-11-11",cards),null);
const mapped=parseNova(page,home);
assert.equal(mapped.length,1);
assert.equal(mapped[0].startDate,"2026-11-05T05:00:00.000Z");
assert.equal(mapped[0].fullUrl,"https://tixr.com/e/204316");
assert.equal(mapped[0].artwork.usageApproved,null);
assert.equal(parseNova(page,"")[0].sourceDateOnly,true);
assert.equal(parseNova(page,"")[0].dateOnly,"2026-11-04");
assert.match(toCandidate({...fixture,location:{name:"Wrong Stage",address:fixture.location.address}}).hold,/Not verified/);
assert.match(toCandidate({...fixture,eventStatus:"https://schema.org/EventCancelled"}).hold,/cancellation/);
assert.match(toCandidate({...fixture,offers:{url:"https://other.example/event"}}).hold,/ticket link/);
assert.throws(()=>parseNova("<body>No calendar</body>",""),/NOT an empty calendar/);
(async()=>{
 const request=async url=>{
  assert([CALENDAR_URL,HOME_URL].includes(url),"Only official allowlisted pages");
  const content=url===CALENDAR_URL?page:home;
  return {ok:true,status:200,headers:{get:()=> "text/html; charset=utf-8"},
   body:new ReadableStream({start(ctrl){ctrl.enqueue(new TextEncoder().encode(content));ctrl.close()}})};
 };
 const got=await fetchNovaEvents({request});
 assert.equal(got[0].startDate,"2026-11-05T05:00:00.000Z");
 await assert.rejects(fetchNovaEvents({request:async()=>({ok:false,status:403})}),/unavailable, not zero events/);
 console.log("PASS — Nova original JSON-LD identity, safe Tixr links, exact-date homepage clock, Pacific offsets and source holds");
})().catch(e=>{console.error(e);process.exitCode=1});
