"use strict";
const assert=require("node:assert/strict");
const s=require("../scripts/republic-organizer-leads");
const conf=require("../discovery/republic-organizer-watch.json");
const url=conf.eventUrls[0];
const source={
 "@context":"https://schema.org","@type":"Event",
 name:"BIGBABABYGUCCI in Portland - Before The Paint Dries Tour",
 description:"Support from LIL CANDYPAINT, ZAYBREEZY, YUNG CEE",
 url,eventStatus:"https://schema.org/EventScheduled",
 organizer:{"@type":"Organization",name:"Heady Presents",url:"https://www.eventbrite.com/o/heady-presents-121506951205"},
 location:{"@type":"Place",name:"Republic Cafe and Ming Lounge",address:{"@type":"PostalAddress",streetAddress:"222 Northwest 4th Avenue",addressLocality:"Portland",addressRegion:"OR"}},
 startDate:"2026-12-19T20:00:00-08:00",endDate:"2026-12-19T23:00:00-08:00",offers:[{url}]
};
const page=x=>'<html><script type="application/ld+json">'+JSON.stringify({"@type":"WebPage",name:"Tickets"})+'</script><script type="application/ld+json">'+JSON.stringify(x)+'</script></html>';
const when=new Date("2026-11-01T12:00:00-08:00");
assert.equal(s.localDay(source.startDate),"2026-12-19 20:00 Pacific");
assert.equal(s.localDay("invalid"),null);
assert.equal(s.parse(page(source),url,when).organizer,"Heady Presents");
assert.equal(s.parse(page(source),url,when).startsAt,"2026-12-19 20:00 Pacific");
assert.match(s.parse(page(source),url,when).editorialStatus,/REVIEW ONLY/);
assert.throws(()=>s.parse(page({...source,eventStatus:"https://schema.org/EventCancelled"}),url,when),/not currently scheduled/);
assert.throws(()=>s.parse(page({...source,location:{...source.location,name:"Other venue"}}),url,when),/venue address or identity/);
assert.throws(()=>s.parse(page({...source,location:{...source.location,address:{...source.location.address,streetAddress:"400 NE 10th Ave"}}}),url,when),/venue address/);
assert.throws(()=>s.parse(page({...source,organizer:{name:"Other"}}),url,when),/organizer or title/);
assert.throws(()=>s.parse(page({...source,startDate:"2026-12-19"}),url,when),/invalid or too far/);
assert.throws(()=>s.parse(page({...source,offers:[{url:"https://other.com"}]}),url,when),/ticket offer mismatch/);
assert.throws(()=>s.parse(page(source),url,new Date("2027-06-01T00:00:00Z")),/expired/);
assert.throws(()=>s.parse(page(source)+"<script type='application/ld+json'>"+JSON.stringify(source)+"</script>",url,when),/singular original event/);
assert.match(s.report([s.parse(page(source),url,when)],[]),/0 automatically approved/);
assert.match(s.report([],[{url,reason:"HTTP 429"}]),/Source hold/);
(async()=>{
 let calls=0;
 const request=async u=>{
  calls++;assert.equal(u,url);
  return {ok:true,status:200,headers:{get:()=>"text/html; charset=utf-8"},
   body:new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(page(source)));c.close();}})};
 };
 assert.equal((await s.read(url,request,when)).startsAt,"2026-12-19 20:00 Pacific");
 assert.equal(calls,1);
 await assert.rejects(s.read(url,async()=>({ok:false,status:429,headers:{get:()=>"text/html"}})),/unavailable HTTP 429/);
 console.log("PASS — Republic original event ticket, owner, room/address, local show time and review-only source holds");
})().catch(e=>{console.error(e);process.exitCode=1});
