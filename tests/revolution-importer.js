"use strict";
const assert=require("node:assert/strict");
const {parseRevolution,parseCard,validatedTicket}=require("../scripts/revolution-importer");
const src=require("../discovery/sources.json").sources.find(s=>s.id==="revolution-hall");
assert(src);
const mainUrl="https://www.etix.com/ticket/p/31018483/the-dillinger-escape-plan-final-calculating-infinity-shows-portland-revolution-hall";
const barUrl="https://www.etix.com/ticket/p/45390314/francis-of-delirium-portland-show-bar-at-revolution-hall";
assert.equal(validatedTicket(mainUrl,"revolution-hall")?.eventId,"31018483");
assert.equal(validatedTicket(barUrl,"show-bar-at-revolution-hall")?.eventId,"45390314");
for(const url of ["https://evil.example/ticket/p/31018483/the-dillinger-escape-plan-final-calculating-infinity-shows-portland-revolution-hall",mainUrl+"?tracking=1","http://www.etix.com/ticket/p/31018483/test-portland-revolution-hall"])assert.equal(validatedTicket(url,"revolution-hall"),null);
assert.equal(validatedTicket(barUrl,"revolution-hall"),null,"Do not place Show Bar shows in the main hall");
function row({room,id,venueId,title,url,date,doors,show,stamp,photo}){
 return '<div class="event-wrapper '+room+'"><div class="event event--grid-style event-background-images" itemscope itemtype="http://schema.org/Event" data-venue-id="'+venueId+'" data-event-id="'+id+'">'+
 '<div class="event__image"><a href="'+url+'"><img src="'+(photo||"https://cdn.etix.com/etix/performance-image/performance_image_1200w/event-flyer.jpg")+'" itemprop="logo"></a></div>'+
 '<div class="event__content"><h3 itemprop="name"><a href="'+url+'">'+title+'</a></h3><h4>Supporting Act</h4>'+
 '<span class="event-date--full">'+date+'</span><span class="event-doors-showtime" data-event-doors="'+stamp+'">Doors: '+doors+' / Show: '+show+'</span>'+
 '</div></div></div>';
}
const main={room:"revolution-hall",venueId:"16897",id:"31018483",title:"The Dillinger Escape Plan - Final Calculating Infinity Shows",url:mainUrl,date:"Sun, October 25th, 2026",doors:"7PM",show:"8PM",stamp:"2026-10-26T02:00:00Z"};
const bar={room:"show-bar-at-revolution-hall",venueId:"21322",id:"45390314",title:"Francis of Delirium",url:barUrl,date:"Tue, October 27th, 2026",doors:"7PM",show:"8PM",stamp:"2026-10-28T02:00:00Z"};
const rows=parseRevolution(row(main)+row(bar)+row({...main,title:"RESCHEDULED TO 3/29/27: Death From Above 1979"}),src);
assert.equal(rows.length,3);
assert.equal(rows[0].venue,"Revolution Hall");assert.equal(rows[1].venue,"Show Bar at Revolution Hall");
assert.equal(rows[0].startDate,"2026-10-26T03:00:00.000Z");
assert.equal(rows[1].startDate,"2026-10-28T03:00:00.000Z");
assert.equal(rows[0].artwork.usageApproved,null);
assert.equal(rows[0].artwork.sourceUrl,src.url);
assert.match(rows[2].hold,/Rescheduled/);
assert.match(parseCard(row({...main,venueId:"21322"}),"revolution-hall",src).hold,/room id/);
assert.match(parseCard(row({...main,date:"Sat, October 25th, 2026"}),"revolution-hall",src).hold,/weekday/);
assert.match(parseCard(row({...main,date:"Today"}),"revolution-hall",src).hold,/full weekday/);
assert.match(parseCard(row({...main,show:"Doors only"}),"revolution-hall",src).hold,/performance/);
assert.match(parseCard(row({...main,stamp:"2026-10-26T04:00:00Z"}),"revolution-hall",src).hold,/Doors timestamp conflicts/);
assert.equal(parseRevolution(row(main)+row(main),src).length,1,"Duplicate featured shows must not repeat in discovery");
const {extract,reconcile}=require("../scripts/discover-events");
const now=new Date("2026-10-21T20:00:00-07:00");
const candidates=rows.slice(0,2).map(x=>extract(x,{...src,adapter:"revolution-events-html"},now));
assert(candidates.every(x=>x.event),"Both independently verified venue cards pass source extraction");
assert.equal(reconcile([],candidates).accepted.length,2,"Main room and Show Bar can have simultaneous events");
console.log("PASS — Revolution and Show Bar rooms, exact dates/times, authoritative Etix links, dedupe, reschedules and flyer provenance");
