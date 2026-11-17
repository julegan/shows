"use strict";
const assert=require("node:assert/strict");
const m=require("../scripts/a-beat-happening-importer");
const {extract,reconcile}=require("../scripts/discover-events");
const source=require("../discovery/sources.json").sources.find(s=>s.id==="a-beat-happening");
assert(source&&source.status==="pilot-enabled"&&source.adapter==="a-beat-happening-squarespace");
assert.equal(source.url,m.SOURCE);
const url="https://abeathappening.org/events/2027/1/17/a-beat-happening-january";
const when=Date.parse("2027-01-18T00:00:00Z"); // 4 PM Pacific on Sunday
const venue={addressTitle:"L’Atelier Yaffe",addressLine1:"111 Northeast Martin Luther King Junior Boulevard"};
const original=(extra={})=>({
 id:"original-2027-01",title:"A Beat Happening January 2027",
 fullUrl:"/events/2027/1/17/a-beat-happening-january",
 startDate:when,endDate:when+3*3600000,
 location:venue,body:"Free all-ages music producer and DJ showcase. Portland hip-hop and beatmaker sets.",
 excerpt:"DJ showcase with Portland hip-hop producers",
 ...extra
});
const feed=entries=>({collection:{fullUrl:"/events",urlId:"events"},upcoming:entries});
assert.equal(m.eventUrl(url),url);
for(const unsafe of [
 "https://foreign.example/events/2027/1/17/a-beat-happening-january",
 "http://abeathappening.org/events/2027/1/17/a-beat-happening-january",
 "https://abeathappening.org/events",
 "https://abeathappening.org/events/2027/1/17/a-beat-happening-january?format=ical",
 "https://abeathappening.org/events/2027/1/17/a-beat-happening-january#event",
 "https://abeathappening.org/events/2027/1/17/.."
])assert.equal(m.eventUrl(unsafe),null);
const candidate=m.record(original());
assert.equal(candidate.fullUrl,url);
assert.equal(candidate.venue,"L'Atelier Yaffe");
assert.equal(candidate.address,"111 NE Martin Luther King Jr Blvd, Portland, OR 97232");
assert(candidate.sourceVerifiedMusic);
assert(candidate.tags.some(t=>/hip.hop/i.test(t)));
assert(m.record(original({location:{addressTitle:"Atlanta venue",addressLine1:"111 Fake Rd, Atlanta GA"}})).hold);
assert(m.record(original({location:{addressTitle:"L'Atelier Yaffe",addressLine1:"222 Not Martin Luther King"}})).hold);
assert(m.record(original({startDate:null})).hold);
assert(m.record(original({endDate:when-1000})).hold);
assert(m.record(original({timeZone:"America/New_York"})).hold);
assert(m.record(original({status:"cancelled"})).hold);
assert(m.record(original({fullUrl:"https://bad.example/events/2027/1/17/fake"})).hold);
assert.deepEqual(m.parse(feed([]),{now:new Date("2026-11-17T12:00:00Z")}),[],
 "No new advertised dates is a legitimate empty original organizer calendar");
assert.equal(m.parse(feed([original({startDate:Date.parse("2026-10-18T23:00:00Z")}),original()]),{
 now:new Date("2026-11-17T12:00:00Z")}).length,1,"Historical showcase must not become a new 2027 occurrence");
assert.throws(()=>m.parse({collection:{fullUrl:"/blog",urlId:"blog"},upcoming:[]}),/identity/);
assert.throws(()=>m.parse({collection:{fullUrl:"/events",urlId:"events"}}),/batch/);
const future=new Date("2026-11-17T12:00:00Z");
const extracted=extract(candidate,source,future);
assert(extracted.event,"Individually dated original event should reach discovery review");
assert.equal(extracted.event.venue,"L'Atelier Yaffe");
assert.equal(extracted.event.category,"Music");
assert(extracted.event.musicStyles.includes("Hip-hop & rap"));
assert.equal(reconcile([extracted.event],[extracted]).accepted.length,0,"Never duplicate the same approved primary URL");
const changed=extract(m.record(original({title:"A Beat Happening January 2027 — revised bill"})),source,future);
assert.equal(changed.event.id,extracted.event.id,"Original permalink keeps identity stable when title changes");
const separate=extract(m.record(original({
 fullUrl:"/events/2027/1/17/a-beat-happening-second-bill",id:"second",title:"Separate community DJ bill"
})),source,future);
assert.notEqual(separate.event.id,extracted.event.id,"Distinct original show IDs are not collapsed");
const request=async (url,opts)=>{
 assert.equal(url,m.SOURCE);assert.equal(opts.redirect,"error");
 return new Response(JSON.stringify(feed([original()])),{status:200,headers:{"Content-Type":"application/json"}});
};
(async()=>{
 assert.equal((await m.fetchEvents(source,request,future)).length,1);
 await assert.rejects(m.fetchEvents(source,async()=>new Response("Forbidden",{status:403}),future),/unavailable/);
 console.log("PASS — A Beat Happening original event dates, geo, format, historical exclusions and stable IDs");
})().catch(e=>{console.error(e);process.exitCode=1;});
