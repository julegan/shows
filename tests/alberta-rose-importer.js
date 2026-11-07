"use strict";
const assert=require("node:assert/strict");
const rose=require("../scripts/alberta-rose-importer");
const {extract,reconcile,urlOf}=require("../scripts/discover-events");
const source=require("../discovery/sources.json").sources.find(s=>s.id==="alberta-rose-theatre");
const eventUrl="https://albertarosetheatre.com/event/chris-smither-2/alberta-rose-theatre/portland-oregon/";
const seriesUrl="https://albertarosetheatre.com/calendar/category/series/mortified/alberta-rose-theatre/portland-oregon/";
const ticket1="https://www.etix.com/ticket/p/36870809/mortified-5-pm-show-portland-alberta-rose-theatre?partner_id=100";
const ticket2="https://www.etix.com/ticket/p/42566250/mortified-8-pm-show-portland-alberta-rose-theatre?partner_id=100";
function single(opts={}){
 return '<div class = "col-12 eventWrapper rhpSingleEvent py-4 px-0 rhp-event__single-event--list">'+
 '<img src="https://albertarosetheatre.com/wp-content/uploads/2026/04/chris-smither-1.jfif" class="eventListImage">'+
 '<a id = "eventTitle" class="url" href="'+(opts.url||eventUrl)+'">'+
 '<h2 class="rhp-event__title--list">'+(opts.title||"Chris Smither")+'</h2></a>'+
 '<div id="eventDate">'+(opts.day||"Fri, Nov 06")+'</div>'+
 '<span class="rhp-event__time-text--list">'+(opts.time||"Doors: 7 pm Show: 8 pm")+'</span>'+
 '<div class="eventsVenueDiv" id="'+(opts.venue||"eventVenueId-12630")+'"></div></div>';
}
function performance(day,time,ticket){
 return '<li class="rhp-event-series-individual">'+
 '<div class="rhp-event-series-date">'+day+'</div>'+
 '<div class="rhp-event-series-time">'+time+'</div>'+
 '<a href="'+ticket+'">Tickets</a></li>';
}
function series(){
 return '<div class = "col-sm-12 rhp-list-view rhpEventSeries rhp-event__single-series--list eventWrapper py-md-4 px-md-0">'+
 '<img src="https://albertarosetheatre.com/wp-content/uploads/2025/01/etix-Mortified_2980331736959096.jfif">'+
 '<div class="eventSeriesTitle"><h2 class="rhpEventHeader rhp-event__title--list">'+
 '<a href="'+seriesUrl+'">Mortified</a></h2></div>'+
 '<ul class="rhp-event-series-list">'+
 performance("Nov 14","Doors: 4 pm Show: 5 pm",ticket1)+
 performance("Nov 14","Doors: 7:30 pm Show: 8 pm",ticket2)+
 performance("Jan 24","Doors: 2:30 pm Show: 3:30 pm","https://www.etix.com/ticket/p/42566251/mortified-matinee-portland-alberta-rose-theatre?partner_id=100")+
 '</ul></div>';
}
const header=month=>"<span class='rhp-events-list-separator-month d-flex'><span>"+month+"</span></span>";
function page(...items){return "<html>"+(".".repeat(1100))+
 '<div class="d-block d-md-none generalView rhp-mobile-list">'+header("November 2026")+items.join("")+
 '<div class="d-none d-md-block generalView rhp-desktop-list">'+single()+"</div></html>";}
assert.equal(rose.eventUrl(eventUrl),eventUrl);
for(const bad of ["http://albertarosetheatre.com/event/fake/alberta-rose-theatre/portland-oregon/",
 "https://example.invalid/event/fake/alberta-rose-theatre/portland-oregon/",
 eventUrl+"?utm_source=bad","https://albertarosetheatre.com/calendar/"])
 assert.equal(rose.eventUrl(bad),null,"Do not trust generic/non-original event links");
assert.equal(rose.ticketUrl(ticket1).eventId,"36870809");
for(const bad of ["https://evil.invalid/ticket/p/36870809/mortified-5-pm-show-portland-alberta-rose-theatre?partner_id=100",
 "https://www.etix.com/ticket/p/36870809/mortified-5-pm-show-portland-other-theatre?partner_id=100",
 ticket1+"&redirect=evil"])assert.equal(rose.ticketUrl(bad),null);
assert.equal(rose.artwork("https://evil.invalid/poster.jpg",eventUrl),null);
assert.equal(rose.artwork("https://albertarosetheatre.com/wp-content/uploads/2026/04/flyer.jfif",eventUrl).usageApproved,null);
const result=rose.parse(page(single(),series()));
assert.equal(result.meta.monthGroups,1);
assert.equal(result.meta.calendarCards,2);
assert.equal(result.records.length,4,"One individually linked bill, two series ticket sessions, cross-month held");
assert.equal(result.meta.verified,3);
assert.equal(result.meta.held,1);
assert.deepEqual(result.records.slice(0,3).map(r=>r.startDate),[
 "2026-11-07T04:00:00.000Z","2026-11-15T01:00:00.000Z","2026-11-15T04:00:00.000Z"]);
assert.equal(result.records[0].fullUrl,eventUrl);
assert.equal(result.records[0].artwork.usageApproved,null);
assert.deepEqual(result.records.slice(1,3).map(r=>r.sourceTicketId),["36870809","42566250"]);
assert.match(result.records[3].hold,/Cross-month/);
assert.match(rose.single(single({day:"Sat, Nov 06"}),{month:11,year:2026}).hold,/conflict/i,
 "Weekday must agree with source month/year and date");
assert.match(rose.single(single({time:"Doors: 9 pm Show: 8 pm"}),{month:11,year:2026}).hold,/conflict/i);
assert.match(rose.single(single({venue:"eventVenueId-9999"}),{month:11,year:2026}).hold,/venue identity/i);
assert.match(rose.single(single({time:"Doors: 7 pm"}),{month:11,year:2026}).hold,/SHOW clock/);
assert.throws(()=>rose.parse("not an original event calendar"),/absent or oversized|calendar/);
const first=extract(result.records[0],source,new Date("2026-11-05T18:00:00-08:00"));
assert.equal(first.event?.venue,"Alberta Rose Theatre");
assert.equal(first.event?.startsAt,"2026-11-06T20:00:00-08:00");
assert.equal(first.event?.startTimeKind,"listed");
assert.equal(urlOf(result.records[0],source),eventUrl);
const other=extract(result.records[1],source,new Date("2026-11-05T18:00:00-08:00"));
const late=extract(result.records[2],source,new Date("2026-11-05T18:00:00-08:00"));
assert.equal(urlOf(result.records[1],source),rose.ticketUrl(ticket1).url);
assert.equal(other.event?.sourceCategories.length,0,"Do not invent a music genre from venue reputation");
assert.equal(reconcile([other.event],[late]).accepted.length,1,
 "Independently ticketed and widely separated same-day show slots must both reach editorial review");
assert.equal(reconcile([other.event],[other]).skipped.length,1,"Same original ticket cannot create another listing");
(async()=>{
 const request=async()=>({ok:true,status:200,headers:{get:()=>"text/html; charset=UTF-8"},text:async()=>page(single(),series())});
 assert.equal((await rose.fetchEvents(source,request)).length,4);
 await assert.rejects(()=>rose.fetchEvents({...source,url:"https://evil.invalid"},request),/Unexpected Alberta Rose/);
 console.log("PASS — Alberta Rose original year, weekday, event/ticket identities, separate series showtimes, artwork evidence, unchanged review-only classification");
})().catch(e=>{console.error(e);process.exitCode=1});
