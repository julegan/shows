"use strict";
const assert=require("node:assert/strict");
const s=require("../scripts/wyrd-secondary-leads.js");
const source=(name,time,street="4704 SE 65th Ave, Portland, OR 97206, United States",city="Portland",link="https://www.sadtimesproductions.com/shows")=>JSON.stringify({
 "@context":"https://schema.org","@type":"MusicEvent",name,startDate:time,
 location:{"@type":"Place",name:"",address:{"@type":"PostalAddress",streetAddress:street,addressLocality:city}},
 performer:[{"@type":"MusicGroup",name:name.split(",")[0]}],offers:{"@type":"Offer",url:link}
});
const block=x=>'<script type="application/ld+json">'+x+'</script>';
const day=new Date("2026-11-01T12:00:00Z");
const fixture='<html><body>'+
 block(JSON.stringify({"@type":"MusicVenue",name:"Wyrd Hut"}))+
 block(source("House of Warmth, sertraline., Speckle","2026-12-21T04:00:00Z"))+
 block(source("Kids on Fire","2027-01-04T03:30:00Z"))+
 block(source("Kids on Fire","2027-01-04T03:30:00Z"))+
 block(source("Wrong Venue","2026-12-21T04:00:00Z","13207 SE McLoughlin Blvd, Portland, OR","Milwaukie"))+
 block(source("No Year","Jan 9"))+
 block(source("Last Year","2025-11-11T00:00:00Z"))+
 '</body></html>';
assert.equal(s.sourceUrl("https://www.sadtimesproductions.com/shows?utm_campaign=secret"),"https://www.sadtimesproductions.com/shows");
assert.equal(s.sourceUrl("https://evil.example/shows"),null);
assert.equal(s.sourceUrl("http://www.sadtimesproductions.com/shows"),null);
assert.equal(s.localTime("2026-12-21T04:00:00Z"),"2026-12-20 20:00 America/Los_Angeles");
assert.equal(s.localTime("2027-01-04T03:30:00Z"),"2027-01-03 19:30 America/Los_Angeles");
assert.equal(s.localTime("not-a-date"),null);
const rows=s.parse(fixture,day);
assert.equal(rows.length,2,"Deduplicate and filter wrong venue/past/undated events");
assert.equal(rows[0].when,"2026-12-20 20:00 America/Los_Angeles");
assert.equal(rows[0].promoterSourceKind,"general-promoter-archive-not-event-proof");
assert.match(rows[0].verification,/DO NOT PUBLISH/);
const markdown=s.report(rows,null);
assert.match(markdown,/secondary aggregator/i);
assert.match(markdown,/0 automatically approved/);
assert.match(markdown,/2026-12-20 20:00/);
assert.match(markdown,/not a dated bill/);
assert.doesNotMatch(markdown,/Wrong Venue/);
assert.match(s.report([],"HTTP 429"),/Source hold:/);
assert.throws(()=>s.parse("No MusicEvent",day),/No bounded original/);
assert.throws(()=>s.parse(block(JSON.stringify({"@type":"MusicEvent",name:"wrong",startDate:"2026-12-21T04:00:00Z",location:{address:{streetAddress:"13207 SE McLoughlin Blvd",addressLocality:"Milwaukie"}},performer:[{name:"wrong"}]})),day),/No credible future Wyrd/);
(async()=>{
 const request=async()=>({ok:true,status:200,headers:{get:()=>"text/html; charset=utf-8"},
  body:new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(fixture));c.close()}})});
 const got=await s.fetchLeads({request,now:day});
 assert.equal(got.length,2);
 await assert.rejects(s.fetchLeads({request:async()=>({ok:false,status:429,headers:{get:()=>"text/html"}})}),/unavailable HTTP 429/);
 console.log("PASS — Wyrd source-bounded UTC to Pacific lead report; 2 deduped holds, zero published; no wrong WYRD venue, no direct ticket API");
})().catch(e=>{console.error(e);process.exitCode=1});
