"use strict";
const assert=require("node:assert/strict");
const mammoth=require("../scripts/mammoth-importer");
const {extract,urlOf,reconcile}=require("../scripts/discover-events");
const source=require("../discovery/sources.json").sources.find(s=>s.id==="mammoth-nw");
const lounge="https://mammothnw.com/event/strawberry-fuzz-2/hawthorne-theatre-lounge/portland-oregon/";
const high="https://mammothnw.com/event/riley/high-limit-room/portland-oregon/";
assert(source&&source.status==="pilot-enabled"&&source.type==="promoter");
assert.equal(mammoth.safeUrl(lounge),lounge);
assert.equal(mammoth.safeUrl(high),high);
for(const invalid of [
 "https://mammothnw.com/events/",
 "https://mammothnw.com/event/show/hawthorne-theatre/portland-oregon/",
 "https://mammothnw.com/event/show/roseland-theater/portland-oregon/",
 "https://mammothnw.com/event/show/high-limit-room/seattle-washington/",
 "https://mammothnw.com/event/show/high-limit-room/eugene-oregon/",
 "https://mammothnw.com/event/show/high-limit-room/portland-oregon/?redirect=evil",
 "https://mammothnw.com.evil.test/event/show/high-limit-room/portland-oregon/",
 "http://mammothnw.com/event/show/high-limit-room/portland-oregon/"
]) assert.equal(mammoth.safeUrl(invalid),null,"Reject unapproved room/city URL: "+invalid);
const roster='<a href="'+lounge+'">Strawberry Fuzz</a>'+
 '<a href="https://mammothnw.com/event/test/hawthorne-theatre/portland-oregon/">Main</a>'+
 '<a href="https://mammothnw.com/event/test/el-corazon/seattle-washington/">Seattle</a>'+
 '<a href="'+high+'">Riley</a><a href="'+lounge+'">Duplicate</a>';
assert.deepEqual(mammoth.links(roster),[lounge,high],"Only exact allowed rooms, deduplicated");
const loungeBody=[
 '<head><title>Strawberry Fuzz | Mammoth</title></head>',
 '<h1 class="mb-1">Strawberry Fuzz</h1>',
 "<p>with Keddie's Resort</p><p>Doors: 7 pm // Show: 8 pm</p>",
 '<div>Sunday, November 8th, 2026 8:00PM</div><p>Hawthorne Lounge</p>',
 '<img alt="Strawberry Fuzz" src="https://mammothnw.com/wp-content/uploads/2026/11/strawberry-fuzz.jfif" />'
].join("\n");
const highBody='<h1>Riley!</h1><p>Doors: 6 pm // Show: 7 pm</p><div>Sunday, February 7th, 2027 7:00PM High Limit Room</div>';
const l=mammoth.detail(loungeBody,lounge);
assert.equal(l.venue,"Hawthorne Lounge");
assert.equal(l.startDate,"2026-11-09T04:00:00.000Z","Pacific Standard Time offset matters");
assert(l.artwork?.url.endsWith("/strawberry-fuzz.jfif"),"Event-specific original image only");
const h=mammoth.detail(highBody,high);
assert.equal(h.venue,"High Limit Room");
assert.equal(h.startDate,"2027-02-08T03:00:00.000Z");
assert.equal(h.address,"720 SE Hawthorne Blvd, Portland, OR 97214");
assert(mammoth.detail(loungeBody.replace("November 8th","November 9th"),lounge).hold?.includes("weekday"),
 "Event-specific full-year date must agree with weekday");
assert(mammoth.detail(loungeBody.replace("Hawthorne Lounge</p>","Hawthorne Theatre</p>"),lounge).hold?.includes("venue"),
 "Do not confuse the lounge with main stage");
assert(mammoth.detail(loungeBody.replace("Show: 8 pm","Show: 9 pm"),lounge).hold?.includes("showtime"),
 "Promoter show clock must match full dated detail clock");
assert(mammoth.detail(loungeBody.replace("Strawberry Fuzz</h1>","Cancelled: Strawberry Fuzz</h1>"),lounge).hold?.includes("cancelled"),
 "Explicit cancellation is held for review");
assert(mammoth.detail(loungeBody.replace("2026 8:00PM","8:00PM"),lounge).hold?.includes("full year"),
 "A yearless show must not be dated by assumption");
const mocked=async url=>({
 ok:true,status:200,headers:{get:()=> "text/html; charset=UTF-8"},
 text:async()=>url===mammoth.CALENDAR?roster:url===lounge?loungeBody:highBody
});
(async()=>{
 const records=await mammoth.fetchEvents(mocked);
 assert.equal(records.length,2);
 assert(records.every(x=>x.startDate),"Both original room records validated");
 for(const item of records){
  assert.equal(urlOf(item,source),item.fullUrl);
  const candidate=extract(item,source,new Date("2026-11-03T12:00:00-08:00"));
  assert(candidate.event,"Canonical discovery accepts original room record");
  assert.equal(candidate.event.venue,item.venue);
  assert.equal(candidate.event.startTimeKind,"listed");
  assert.equal(candidate.event.category,"Unclassified",
    "Promoter stage/location alone is not enough to infer a concert or style");
 }
 const accepted=reconcile([],records.map(x=>extract(x,source,new Date("2026-11-03T12:00:00-08:00"))));
 assert.equal(accepted.accepted.length,2);
 console.log("PASS — Mammoth official Portland room source, full-year Pacific times, source rights and held conflicts");
})().catch(e=>{console.error(e);process.exitCode=1});
