"use strict";
const assert=require("node:assert/strict");
const importer=require("../scripts/jack-london-importer");
const {extract,reconcile}=require("../scripts/discover-events");
const src=require("../discovery/sources.json").sources.find(x=>x.id==="jack-london-revue");
const URL="https://www.jacklondonrevue.com/tm-event/mel-brown-b3-organ-group-jazz-titan-thursdays-8/";
function card({name="MEL BROWN B3 ORGAN GROUP - Jazz Titan Thursdays",date="Thu Nov 12",doors="6:00 pm",show="7:00 pm",url=URL}={}){
 return '<div class="tw-section"><div class="tw-name"><a href="'+url+'">'+name+'</a></div>'+
 '<div class="tw-date-time"><span class="tw-event-date">'+date+'</span>'+
 '<span class="tw-event-door-time">'+doors+'</span><span class="tw-event-time">Show: '+show+'</span></div></div>';
}
function roster(cards=[card()]){
 return '<html><div id="tw-responsive" class="event-list"><div class="tw-plugin-upcoming-event-list">'+cards.join("")+'</div></div></html>';
}
function detail({name="MEL BROWN B3 ORGAN GROUP - Jazz Titan Thursdays",date="November 12, 2026",
 show="SHOW: 7:00 pm",doors="6:00 pm",room="Jack London Revue"}={}){
 return '<html><div id="tw-responsive" class="tm-event-details"><div class="tw-name event-title">'+name+'</div>'+
 '<div class="tw-date-time"><span class="tw-day-of-week">Thu</span><span class="tw-event-date">'+date+'</span>'+
 '<span class="tw-event-door-time">'+doors+'</span><span class="tw-event-time">'+show+'</span></div>'+
 '<span class="tw-venue-name">'+room+'</span>'+
 '<img class="event-img original" src="https://i.ticketweb.com/i/00/12/98/92/14_Original.jpg?v=5">'+
 '<a href="https://www.ticketweb.com/event/mel-brown-b3-organ-group-jack-london-revue-tickets/14862453?pl=jacklondon">Tickets</a>'+
 '<div class="tw-description">Live jazz orchestra concert with guest musicians.</div></div></html>';
}
assert.equal(importer.eventUrl(URL),URL);
for(const bad of ["https://evil.test/tm-event/name/","https://www.jacklondonrevue.com/tm-event/name/?track=1","https://www.jacklondonrevue.com/calendar/","http://www.jacklondonrevue.com/tm-event/name/"])
 assert.equal(importer.eventUrl(bad),null);
assert.equal(importer.art("https://evil.test/i/00/12/98/92/14_Original.jpg",URL),null);
const rows=importer.roster(roster()).rows;
assert.equal(rows.length,1);
assert.equal(rows[0].show,"19:00");
assert.equal(rows[0].doors,"18:00");
assert.equal(rows[0].month,11);
assert.equal(rows[0].day,12);
assert.throws(()=>importer.roster("Invalid venue calendar"),/roster missing/);
const entry=importer.detail(detail(),rows[0]);
assert.equal(entry.startDate,"2026-11-13T03:00:00.000Z");
assert.equal(entry.venue,"Jack London Revue");
assert.equal(entry.sourceVerifiedMusic,true);
assert.equal(entry.artwork.usageApproved,null);
assert.equal(entry.artwork.sourceUrl,URL);
for(const [p,label] of [[{date:"November 13, 2026"},"roster date"],
 [{show:"SHOW: 6:00 pm"},"show vs doors"],
 [{room:"Another Venue"},"venue"],
 [{name:"Other Band"},"title"],
 [{date:"February 30, 2026"},"invalid date"]]){
 assert(importer.detail(detail(p),rows[0]).hold,label+" mismatch must be held");
}
assert(importer.detail(detail(),{...rows[0],url:"https://evil.test/tm-event/fake/"}).hold);
const proposed=extract(entry,src,new Date("2026-11-06T10:00:00-08:00"));
assert(proposed.event,"Verified show reaches editorial discovery");
assert.equal(proposed.event.category,"Music");
assert.deepEqual(proposed.event.musicStyles,["Jazz"]);
assert.equal(reconcile([proposed.event],[proposed]).skipped.length,1);
(async()=>{
 const mock=async url=>({ok:true,status:200,headers:{get:()=>"text/html"},text:async()=>url===importer.HOME?roster():detail()});
 assert.equal((await importer.fetchEvents(src,mock)).length,1);
 await assert.rejects(()=>importer.fetchEvents({...src,url:"https://evil.test"},mock),/Unexpected/);
 console.log("PASS — JLR original URL, verified year/venue/showtime-vs-doors, genre, dedup and artwork review");
})().catch(e=>{console.error(e);process.exitCode=1});