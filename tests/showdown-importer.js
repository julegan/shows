"use strict";
const assert=require("node:assert/strict");
const a=require("../scripts/showdown-importer");
const {extract}=require("../scripts/discover-events");
assert.equal(a.normal("Madam Cooper&#039;s Country Cabaret"),a.normal("Madam Cooper\'s Country Cabaret"));
const first="https://www.showdownpdx.com/tm-event/square-dancing-with-old-time-highway-and-caller-amy-hofer/";
const second="https://www.showdownpdx.com/tm-event/nug-how-strange-it-is-and-bonus-room/";
const title1="Square Dancing with Old Time Highway and Caller Amy Hofer / KARAOKE @ 9:30";
const title2="Nug, How Strange It Is, and Bonus Room";
function card({title=title1,url=first,weekday="Mon",monthday="Nov 2",time="Show: 7:00 pm",door="6:00 pm"}={}){
 return '<div class="tw-section"><div class="tw-event-datetime"><span class="tw-day-of-week">'+weekday+'</span>'+
 '<span class="tw-event-date">'+monthday+'</span></div><div class="tw-image">'+
 '<img class="event-img large" src="https://i.ticketweb.com/i/00/13/03/11/64_Original.jpg?v=3" /></div>'+
 '<div class="tw-name"><a href="'+url+'">'+title+'</a></div>'+
 '<div class="tw-date-time"><span class="tw-event-time">'+time+'</span>'+
 '<span class="tw-event-door-time">'+door+'</span></div></div>';
}
function google({title=title1,year=2026,mon="11",day="02",time="190000",location="1195 SE Powell Blvd,Portland,OR,US"}={}){
 const p=new URLSearchParams({action:"TEMPLATE",text:title,dates:String(year)+mon+day+"T"+time+"/"+String(year)+mon+day+"T"+time,location,ctz:"PST"});
 return '<a href="https://www.google.com/calendar/event?'+p.toString().replace(/&/g,"&amp;")+'">+ Google Calendar</a>';
}
const body1=card();
const body2=card({title:title2,url:second,weekday:"Thu",monthday:"Dec 3",time:"Show: 8:00 pm",door:"7:00 pm"});
const p1=a.parsePage(body1+'<a href="/page/2/">2</a>');
assert.equal(p1.entries.length,1);
assert.equal(p1.pagination[0],"https://www.showdownpdx.com/page/2/");
assert.equal(p1.entries[0].artwork.usageApproved,null);
assert.equal(a.eventUrl(first+"?utm=invalid"),null);
assert.equal(a.eventUrl(first.replace("www.showdownpdx.com","bad.example")),null);
assert.equal(a.pageUrl("https://www.showdownpdx.com/page/9/"),null);
assert.equal(a.pageUrl("http://www.showdownpdx.com/page/2/"),null);
assert.equal(a.parsePage(body1+body1).entries.length,1,"Same page repeated cards must dedupe");
assert.throws(()=>a.parsePage(body1.replace("Mon","Foo")),/No original Showdown event cards/);
const detail1=google();
const detail2=google({title:title2,mon:"12",day:"03",time:"200000"});
assert.equal(a.calendarLink(detail1).year,2026);
assert.equal(a.calendarLink(detail1).clock,"19:00");
assert.equal(a.parseDetail(detail1,p1.entries[0]).startDate,"2026-11-03T03:00:00.000Z","November PST");
assert.equal(a.parseDetail(detail2,a.parsePage(body2).entries[0]).startDate,"2026-12-04T04:00:00.000Z");
assert.match(a.parseDetail(google({mon:"12"}),p1.entries[0]).hold,/disagree/);
assert.match(a.parseDetail(google({title:"Another show"}),p1.entries[0]).hold,/title/);
assert.match(a.parseDetail(google({location:"Seattle, WA"}),p1.entries[0]).hold,/location/);
assert.match(a.parseDetail("",p1.entries[0]).hold,/full-year/);
assert.equal(a.calendarLink(google()+google()),null);
assert.throws(()=>a.parsePage(card({time:"Doors: 7:00 pm"})),/No original Showdown event cards/);
const parsed=a.parseDetail(detail1,p1.entries[0]);
assert(!parsed.sourceVerifiedMusic,"Country/scene listings must be classified accurately");
const source={id:"showdown",name:"The Showdown",venue:"The Showdown",adapter:"showdown-original-html",baseUrl:a.ROOT,address:"1195 SE Powell Blvd, Portland, OR 97202",neighborhood:"Brooklyn"};
(async()=>{
 const calls=[];
 const request=async u=>{
  calls.push(u);
  const s=u===a.HOME?body1+'<a href="/page/2/">2</a>':
    u===a.ROOT+"/page/2/"?body2:
    u===first?detail1:
    u===second?detail2:null;
  if(!s)throw Error("Unexpected original URL "+u);
  return {ok:true,status:200,headers:{get:()=>"text/html; charset=utf-8"},
   body:new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(s));c.close()}})};
 };
 const items=await a.fetchEvents({...source,url:a.HOME},{request});
 assert.equal(items.length,2);
 assert(items.every(x=>x.startDate&&!x.hold));
 assert.equal(calls.length,4,"Two pages and two original event details, no provider checkout calls");
 const mapped=extract(items[1],source,new Date("2026-11-02T12:00:00-08:00"));
 assert(mapped.event,JSON.stringify(mapped));
 assert.equal(mapped.event.venue,"The Showdown");
 assert.equal(mapped.event.startsAt,"2026-12-03T20:00:00-08:00");
 assert.equal(mapped.event.startTimeKind,"listed");
 assert.equal(mapped.event.artwork.usageApproved,null);
 const blocked=await a.fetchEvents({...source,url:a.HOME},{request:async u=>{
  if(u!==first)return request(u);
  return {ok:false,status:429,headers:{get:()=>"text/html"}};
 }});
 assert(blocked.some(x=>x.hold),"HTTP 429 is held, never swallowed or treated as empty source");
 console.log("PASS — Showdown multi-page original events, year from per-event Google Calendar, Pacific timing, title/venue, tickets and review holds");
})().catch(e=>{console.error(e);process.exitCode=1});
