"use strict";
const assert=require("node:assert/strict");
const x=require("../scripts/45east-redcube-importer");
const {extract}=require("../scripts/discover-events");
function card({title="ELY OAKS",date="FRIDAY NOVEMBER 6 2026",venue="45 EAST - PORTLAND",ticket="https://tixr.com/groups/45east/elyoaks1106",img="https://www.redcubepresents.com/wp-content/uploads/2026/09/45-EW_640x359.png"}={}){
 return '<div class="elementor-column elementor-col-33 elementor-top-column elementor-element-'+Math.random().toString(16).slice(2)+'" data-element_type="column">'+
 '<div><img src="'+img+'"/></div>'+
 '<h2 class="elementor-heading-title elementor-size-default">'+title+'</h2>'+
 '<h2 class="elementor-heading-title elementor-size-default">'+date+'</h2>'+
 '<h2 class="elementor-heading-title elementor-size-default">'+venue+'</h2>'+
 '<a class="elementor-button" href="'+ticket+'">BUY TICKETS</a></div>';
}
const intro="<!doctype html><html><body>"+("source notice ".repeat(500));
const source={id:"45-east",url:x.CALENDAR_URL,baseUrl:"https://www.redcubepresents.com",adapter:"45east-redcube-original",
 name:"45 East / Red Cube Presents",venue:"45 East",address:"315 SE 3rd Ave, Portland, OR 97214",neighborhood:"Central Eastside"};
assert.equal(x.ticketUrl("https://tixr.com/groups/45east/elyoaks1106?utm_source=redcube"),"https://tixr.com/groups/45east/elyoaks1106");
assert.equal(x.ticketUrl("https://tixr.com/groups/qnightclub/elyoaks1106"),null);
assert.equal(x.ticketUrl("https://www.tixr.com/groups/45east/event"),null);
assert.equal(x.ticketUrl("https://tixr.com/groups/45east/event#hash"),"https://tixr.com/groups/45east/event");
assert.equal(x.officialArt("https://www.redcubepresents.com/wp-content/uploads/2026/09/45-EW_640x359.png").usageApproved,null);
assert.equal(x.officialArt("https://fake.example/uploads/2026/09/poster.png"),null);
assert.equal(x.parseDate("FRIDAY NOVEMBER 6 2026"),"2026-11-06");
assert.equal(x.parseDate("SATURDAY NOVEMBER 6 2026"),null);
assert.equal(x.parseDate("FRIDAY NOVEMBER 31 2026"),null);
assert.equal(x.parseDate("FRIDAY NOVEMBER 6"),null);
assert.equal(x.parseDate("FRIDAY JANUARY 15 2027"),"2027-01-15");
const cards=[card(),card({title:"Elsewhere",venue:"Q NIGHTCLUB - SEATTLE",ticket:"https://tixr.com/groups/qnightclub/elsewhere"}),
 card({title:"Mixed",date:"SATURDAY NOVEMBER 7 2026",ticket:"https://tixr.com/groups/45east/mixed1107"})];
const page=intro+cards.join("")+"</body></html>";
const parsed=x.parse(page);
assert.equal(parsed.length,2,"Do not collect Seattle or other room");
assert.equal(parsed[0].title,"ELY OAKS");
assert.equal(parsed[0].dateOnly,"2026-11-06");
assert.equal(parsed[0].sourceDateOnly,true);
assert.equal(parsed[0].artwork.usageApproved,null);
assert(!parsed[0].startDate,"Never invent event time");
assert.equal(parsed[0].venue,"45 East");
assert.throws(()=>x.parse(intro+card({venue:"Q NIGHTCLUB - SEATTLE"})+"</body></html>"),/No original 45 East cards/);
assert.throws(()=>x.parse(intro+card({date:"FRIDAY NOVEMBER 31 2026"})+"</body></html>"),/No original 45 East cards/);
assert(x.parse(intro+card({ticket:"https://tixr.com/groups/qnightclub/bad"})+card()+"</body></html>").some(r=>r.hold));
const mapped=extract(parsed[0],source,new Date("2026-11-02T12:00:00-08:00"));
assert(mapped.event,JSON.stringify(mapped));
assert.equal(mapped.event.startTimeKind,"date-only");
assert.equal(mapped.event.venue,"45 East");
assert.equal(mapped.event.artwork.usageApproved,null);
assert.match(mapped.event.description,/NOT published/);
(async()=>{
 let calls=0;
 const request=async(url)=>{
  calls++;assert.equal(url,x.CALENDAR_URL);
  return {ok:true,status:200,headers:{get:()=> "text/html; charset=utf-8"},
   body:new ReadableStream({start(ctrl){ctrl.enqueue(new TextEncoder().encode(page));ctrl.close()}})};
 };
 const items=await x.fetchEvents(source,{request});
 assert.equal(calls,1,"Promoter read is a single official document");
 assert.equal(items.length,2);
 await assert.rejects(x.fetchEvents(source,{request:async()=>({ok:false,status:429,headers:{get:()=>"text/html"}})}),/unavailable 429/);
 console.log("PASS — 45 East Red Cube first-party room filter, whole date, no guessed clocks, original Tixr, poster rights and source failure");
})().catch(e=>{console.error(e);process.exitCode=1});
