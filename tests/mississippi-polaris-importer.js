"use strict";
const assert=require("node:assert/strict");
const {ROOM,ticketUrl,parseCard,parseMississippi}=require("../scripts/mississippi-polaris-importer");
const src={id:"mississippi-polaris",url:"https://mississippistudios.com/calendar",baseUrl:"https://mississippistudios.com"};
const ms="https://www.etix.com/ticket/p/97738010/the-fourth-wall-portland-mississippi-studios";
const ph="https://www.etix.com/ticket/p/62650540/bedouine-portland-polaris-hall";
function card(room,id,url,title,date,doors="7PM",show="8 PM"){
 const style=room==="Mississippi Studios"?"standard":"dark";
 return '<div class="event__item style--'+style+'"><div class="event" data-venue-id="'+id+'"><div class="shell"><div class="event__inner">'+
 '<div class="event__head"><h5>'+date+'</h5><div class="event-presented-by">'+room+' Presents</div><h2 class="event-title"><a href="'+url+'">'+title+'</a></h2><h4>Supporting Act</h4></div>'+
 '<div class="event__image"><img src="https://cdn.etix.com/etix/performance-image/performance_image_1200w/test.jpg" alt="image"></div>'+
 '<div class="event__content"><p><span class="event-doors-showtime" data-event-doors="2026-10-23T02:00:00Z">Doors: '+doors+' / Show: '+show+'</span></p></div>'+
 '</div></div></div></div>';
}
assert.equal(ROOM["Mississippi Studios"].id,"16896");
assert.equal(ROOM["Polaris Hall"].id,"16900");
assert.equal(ticketUrl(ms,"Mississippi Studios"),ms);
assert.equal(ticketUrl(ph,"Polaris Hall"),ph);
assert.equal(ticketUrl(ph,"Mississippi Studios"),null);
assert.equal(ticketUrl(ms+"?t=1","Mississippi Studios"),null);
assert.equal(ticketUrl(ms.replace("www.etix.com","unknown.example"),"Mississippi Studios"),null);
const first=card("Mississippi Studios","16896",ms,"The Fourth Wall","Thursday, October 22, 2026");
const second=card("Polaris Hall","16900",ph,"Bedouine","Thursday, October 22, 2026");
const parsed=parseMississippi('<div id="full-list">'+first+second+first+'</div><div id="compact-list"></div>',src);
assert.equal(parsed.length,2,"Repeated cards deduplicated");
assert.equal(parsed[0].title,"The Fourth Wall");
assert.equal(parsed[1].venue,"Polaris Hall");
assert.equal(parsed[0].startDate,"2026-10-23T03:00:00.000Z");
assert.equal(parsed[0].artwork.usageApproved,null);
assert.equal(parsed[0].artwork.sourceUrl,src.url);
assert.match(parseCard(card("Polaris Hall","16896",ph,"Bedouine","Thursday, October 22, 2026"),src).hold,/room disagree/);
assert.match(parseCard(card("Mississippi Studios","16896",ms,"Changed","Friday, October 22, 2026"),src).hold,/weekday/);
assert.match(parseCard(card("Mississippi Studios","16896",ms,"POSTPONED: The Fourth Wall","Thursday, October 22, 2026"),src).hold,/change or cancellation/);
assert.match(parseCard(card("Mississippi Studios","16896",ms,"The Fourth Wall","Thursday, October 22, 2026","7PM","6 PM"),src).hold,/earlier than doors/);
assert.match(parseCard(card("Mississippi Studios","16896",ms,"The Fourth Wall","October 22, 2026"),src).hold,/full date/);
const {extract,reconcile}=require("../scripts/discover-events");
const now=new Date("2026-10-21T20:00:00-07:00");
const rows=parsed.map(x=>extract(x,{...src,adapter:"mississippi-polaris-html",name:"Mississippi / Polaris",address:null,neighborhood:"Portland"},now));
assert(rows.every(x=>x.event),"Both independent rooms produce review candidates");
assert.equal(reconcile([],rows).accepted.length,2);
const early=rows[0].event;
const late={...early,id:early.id+"-late",title:early.title+" (Late)",startsAt:"2026-10-22T22:00:00-07:00",url:"https://www.etix.com/ticket/p/11111111/late-show-portland-mississippi-studios"};
assert.equal(reconcile([],[{event:early},{event:late}]).accepted.length,2,"Distinct ticketed early and late Mississippi performances can coexist");
assert.equal(reconcile([],[{event:early},{event:{...late,url:early.url}}]).accepted.length,1,"Shared ticket URL must not bypass collision holds");
console.log("PASS — Original Mississippi and Polaris event room ids, original Etix URL, date/weekday, showtime, cancellation, provenance and dual-room intake");
