"use strict";
const assert=require("node:assert/strict");
const {CALENDAR,eventUrl,links,detail,startInstant,fetchEvents}=require("../scripts/goodfoot-importer");
const {extract,reconcile,urlOf}=require("../scripts/discover-events");
const source=require("../discovery/sources.json").sources.find(s=>s.id==="the-goodfoot");
const now=new Date("2026-11-08T17:00:00-08:00");
const greater="https://thegoodfoot.com/events/greaterkind-8pm-doors-4/";
const soul="https://thegoodfoot.com/events/soul-stew-with-dj-aquaman-friends-9pm-doors-2/";
const comedy="https://thegoodfoot.com/events/standup-comedy-7pm-doors/";
assert(source?.status==="adapter-needed"&&source.adapter==="goodfoot-original-html", "Blocked original source must remain inactive");
assert.equal(eventUrl(greater),greater);
for(const u of ["http://thegoodfoot.com/events/fake/","https://evil.test/events/greaterkind-8pm-doors-4/",
 "https://thegoodfoot.com/music/","https://thegoodfoot.com/events/greaterkind-8pm-doors-4/?utm_source=x",
 "https://thegoodfoot.com/wp-admin/events/greaterkind-8pm-doors-4/"])
 assert.equal(eventUrl(u),null,"Reject unapproved origin, paths or query");
assert.equal(urlOf({fullUrl:greater},source),greater);
assert.equal(urlOf({fullUrl:"https://evil.example.org/events/fake/"},source),null);
const roster="<html><main>"+("Original Goodfoot event calendar. ".repeat(25))+
 '<a href="'+greater+'">Greaterkind</a><a href="'+soul+'">Soul Stew</a>'+
 '<a href="'+greater+'">Read More</a><a href="https://other.example.com/events/fake/">Elsewhere</a></main></html>';
assert.deepEqual(links(roster),[greater,soul]);
assert.throws(()=>links("<html>no events</html>"),/missing/);
function page(name,day,time,description,opts={}){
 const data={"@context":"https://schema.org","@type":"Event",name,
  startDate:"2026-11-"+String(day).padStart(2,"0")+"T"+time+"-08:00",
  location:{"@type":"Place",name:opts.place||"the goodfoot pub and lounge"},
  description,url:opts.schemaUrl||opts.url||greater,eventStatus:opts.eventStatus||"https://schema.org/EventScheduled"};
 return '<html><body><h1>'+name+'</h1><div>November '+day+' @ '+time+'</div><p>'+
  description+'</p><script type="application/ld+json">'+JSON.stringify(data)+'</script></body></html>';
}
const originalTitle="GREATERKIND (8pm Doors)";
const original=page(originalTitle,10,"20:00:00","Channeling elements of jazz fusion and funk with undertones of R&B, gospel and hip hop, greaterkind plays live.",{url:greater});
const music=detail(original,greater);
assert.equal(music.startDate,"2026-11-11T04:00:00.000Z");
assert.equal(music.sourceTimeKind,"doors");
assert.equal(music.sourceVerifiedMusic,true);
assert.equal(music.venue,"The Goodfoot");
assert.equal(extract(music,source,now).event?.startTimeKind,"doors");
assert.deepEqual(extract(music,source,now).event.musicStyles,["Jazz","Hip-hop & rap","R&B & soul","Funk & disco"]);
assert.equal(startInstant("2026-11-10T20:00:00+00:00"),null,"Contradictory offset is held");
assert.equal(startInstant("2026-11-10T20:00:00").instant,"2026-11-11T04:00:00.000Z","Local wall-time source supported");
assert.equal(detail(page(originalTitle,10,"20:00:00","music",{place:"Other Venue"}),greater).hold,"Original event location does not match Goodfoot");
assert.equal(detail(page(originalTitle,10,"20:00:00","music",{eventStatus:"https://schema.org/EventCancelled"}),greater).hold,"Original Goodfoot event has changed status");
assert.equal(detail(page(originalTitle,10,"21:00:00","music"),greater).hold,"Original detail start time conflicts with title's doors clock");
assert.equal(detail(page(originalTitle,10,"20:00:00","music",{schemaUrl:soul}),greater).hold,"Original detail URL and event identity disagree");
const nonmusic=detail(page("STAND-UP COMEDY (7pm Doors)",12,"19:00:00","Stand-up comedy night.",{url:comedy}),comedy);
assert.equal(extract(nonmusic,source,now).event?.category,"Performance","Comedy is not automatically tagged Music");
const unknown=detail(page("Evening with a Local Artist (10pm Doors)",10,"22:00:00","An original venue evening.",{url:soul}),soul);
assert.equal(extract(unknown,source,now).event?.category,"Unclassified","Unknown genre is not suppressed");
assert.equal(reconcile([],[extract(music,source,now),extract(unknown,source,now)]).accepted.length,2,
 "Different dated original bill identities and sufficiently separated starts are retained");
const already=extract(music,source,now);
assert.equal(reconcile([already.event],[already]).accepted.length,0,"Existing original identity deduplicated");
const moved=extract({...music,startDate:"2026-11-18T04:00:00.000Z"},source,now);
assert.equal(reconcile([already.event],[moved]).held[0]?.hold,"Potential reschedule of an existing event URL",
 "Retimed original permalinks are held for manual verification");
const pages=new Map([[CALENDAR,roster],[greater,original],
 [soul,page("SOUL STEW with DJ AQUAMAN & FRIENDS (9pm Doors)",13,"21:00:00","Deep funk, soul and disco from the Soul Stew DJ night.",{url:soul})]]);
(async()=>{
 const seen=[];
 const rows=await fetchEvents(source,async url=>{
  seen.push(url);
  return {ok:pages.has(url),status:pages.has(url)?200:404,
   headers:{get:()=>"text/html; charset=utf-8"},text:async()=>pages.get(url)};
 });
 assert.equal(rows.length,2);
 assert.equal(rows.filter(x=>x.startDate).length,2);
 assert.equal(seen.length,3);
 const held=await fetchEvents(source,async url=>({
  ok:url!==soul,status:url!==soul?200:404,
  headers:{get:()=>"text/html"},text:async()=>pages.get(url)
 }));
 assert(held.some(x=>x.hold),"Original inaccessible details become item holds");
 console.log("PASS — Goodfoot original music calendar, schemas, Pacific doors, genre, nonmusic, same-day identities");
})().catch(e=>{console.error(e);process.exitCode=1;});
