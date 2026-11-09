"use strict";
const assert=require("node:assert/strict");
const {CALENDAR,eventUrl,links,detail,fetchEvents}=require("../scripts/atlantis-importer");
const {extract,reconcile,urlOf}=require("../scripts/discover-events");
const source=require("../discovery/sources.json").sources.find(s=>s.id==="atlantis-lounge");
assert(source&&source.status==="pilot-enabled"&&source.adapter==="atlantis-original-html");
assert.equal(source.url,CALENDAR);
const hiphop="https://mississippipizza.com/event/hungry-hungry-hip-hop-10/";
const soul="https://mississippipizza.com/event/mellow-rebels-soul-rose/";
const trivia="https://mississippipizza.com/event/free-trivia-sippi/";
assert.equal(eventUrl(hiphop),hiphop);
for(const unsafe of ["https://other.example.com/event/hungry-hungry-hip-hop-10/",
 "http://mississippipizza.com/event/hungry-hungry-hip-hop-10/",
 "https://mississippipizza.com/events/",
 "https://mississippipizza.com/event/hungry-hungry-hip-hop-10/?tracking=1",
 "https://mississippipizza.com/admin/"])
 assert.equal(eventUrl(unsafe),null,"Reject foreign, tracking or non-event URL "+unsafe);
assert.equal(urlOf({fullUrl:hiphop},source),hiphop);
assert.equal(urlOf({fullUrl:"https://not-original.example.org/event/fake/"},source),null);
const calendar='<html><body>'+Array.from({length:12},()=>'<p>Original calendar links</p>').join("")+
 '<a href="'+hiphop+'">Hungry Hungry Hip Hop</a>'+
 '<a href="'+soul+'">Mellow Rebels</a>'+
 '<a href="'+hiphop+'">Same bill again</a>'+
 '<a href="https://foreign.example.org/event/fake/">External</a>'+
 '<a href="/events/">Calendar</a></body></html>';
assert.deepEqual(links(calendar),[hiphop,soul]);
assert.throws(()=>links("<html>no original events</html>"),/missing/);
const page=(title,date,time,description,room="The Atlantis Lounge")=>'<html><body>'+
 '<h4>'+room+'</h4><h1>'+title+'</h1><div>Ages 21 and up</div>'+
 '<img alt="'+title+'" src="/wp-content/uploads/2026/11/poster.jpg">'+
 '<div>'+date+'</div><p>'+time+'</p><span>$11.50</span>'+
 '<div>'+description+'</div><a href="https://www.etix.com/ticket">Buy Tickets</a>'+
 '<footer>Visit Us 3552 N Mississippi Ave Portland OR</footer></body></html>';
const hip=page("Hungry Hungry Hip Hop","Sunday, November 22, 2026","8pm",
 "Hungry Hungry Hip Hop is a showcase of local hip hop performers.");
const parsed=detail(hip,hiphop);
assert.equal(parsed.title,"Hungry Hungry Hip Hop");
assert.equal(parsed.startDate,"2026-11-23T04:00:00.000Z");
assert.equal(parsed.venue,"Mississippi Pizza / Atlantis Lounge");
assert(parsed.sourceVerifiedMusic);
assert(parsed.tags.some(x=>/hip hop/i.test(x)));
assert(!parsed.verifiedOriginalShowTime,"Listed event clock does not necessarily mean confirmed show start");
assert.equal(extract(parsed,source,new Date("2026-11-08T12:00:00-08:00")).event?.category,"Music");
assert.deepEqual(extract(parsed,source,new Date("2026-11-08T12:00:00-08:00")).event?.musicStyles,["Hip-hop & rap"]);
assert.equal(detail(page("Wrong","Monday, November 22, 2026","8pm","music"),hiphop).hold,
 "Invalid or weekday-conflicting original date");
assert.equal(detail(page("Missing room","Sunday, November 22, 2026","8pm","music","Other Club"),hiphop).hold,
 "Event-specific title/Atlantis Lounge room cannot be verified");
assert.equal(detail(page("No clock","Sunday, November 22, 2026","","music"),hiphop).hold,
 "Original event detail lacks a verified start clock");
assert.equal(detail(page("Invalid date","Sunday, November 32, 2026","8pm","music"),hiphop).hold,
 "Invalid or weekday-conflicting original date");
const nonMusic=detail(page("FREE! Trivia-sippi! Weekly Quiz Night!","Wednesday, November 25, 2026","6pm","Bring a team!"),trivia);
assert.equal(extract(nonMusic,source,new Date("2026-11-08T12:00:00-08:00")).event?.category,"Other",
 "A nonmusic venue entry must not be mislabeled hip-hop");
const unknown=detail(page("Local Original Artist","Sunday, November 22, 2026","5pm","Enjoy the evening."),soul);
assert.equal(extract(unknown,source,new Date("2026-11-08T12:00:00-08:00")).event?.category,"Unclassified",
 "Unknown genres remain eligible");
const now=new Date("2026-11-08T12:00:00-08:00");
const first=extract(parsed,source,now);
const second=extract(unknown,source,now);
assert(first.event&&second.event);
assert.equal(reconcile([],[first,second]).accepted.length,2,
 "Separate original events with different identities and verified clocks can appear on the same day");
assert.equal(reconcile([first.event],[first]).accepted.length,0,"Stable original permalink avoids repeated insertion");
assert.equal(reconcile([{...first.event,startsAt:"2026-11-29T20:00:00-08:00"}],[first]).held[0]?.hold,
 "Potential reschedule of an existing event URL","Changed event date cannot silently duplicate a published occurrence");
const pages=new Map([[CALENDAR,calendar],[hiphop,hip],[soul,page("Local Original Artist","Sunday, November 22, 2026","5pm","Enjoy the evening.")]]);
const attempted=[];
(async()=>{
 const rows=await fetchEvents(source,async url=>{
  attempted.push(url);
  if(!pages.has(url))return {ok:false,status:404,headers:{get:()=>"text/html"}};
  return {ok:true,status:200,headers:{get:()=>"text/html; charset=UTF-8"},text:async()=>pages.get(url)};
 });
 assert.equal(rows.length,2);
 assert(rows.every(x=>x.startDate));
 assert.equal(attempted.length,3);
 assert.equal(rows[0].title,"Hungry Hungry Hip Hop");
 const held=await fetchEvents(source,async url=>({
  ok:url!==soul,status:url===soul?404:200,
  headers:{get:()=>"text/html"},text:async()=>pages.get(url)
 }));
 assert(held.some(x=>x.hold),"Unavailable original details produce individual holds, not fabricated events");
 console.log("PASS — Atlantis original event intake, independent dated detail, safe clock, genre and same-day identities");
})().catch(e=>{console.error(e);process.exitCode=1;});
