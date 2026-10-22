"use strict";
const assert=require("node:assert/strict");
const c=require("../scripts/crystal-importer");
const source=require("../discovery/sources.json").sources.find(s=>s.id==="crystal-ballroom");
assert(source);
const url="https://www.crystalballroompdx.com/events/276053-dai-freyr/";
const other="https://www.crystalballroompdx.com/events/277068-julia-jacklin/";
assert.equal(c.safeCrystalUrl(url),url);
assert.equal(c.safeCrystalUrl(url+"?tracking=1"),null);
assert.equal(c.safeCrystalUrl("https://evil.example/events/276053-dai-freyr/"),null);
assert.equal(c.safeCrystalUrl("https://www.crystalballroompdx.com/other/276053-dai-freyr/"),null);
assert.equal(c.safePageUrl("https://www.crystalballroompdx.com/events/page/2/"),"https://www.crystalballroompdx.com/events/page/2/");
assert.equal(c.safePageUrl("https://www.crystalballroompdx.com/events/page/16/"),null);
assert.equal(c.safePageUrl("https://www.crystalballroompdx.com/events/page/2/?pg=1"),null);
assert.deepEqual(c.links('<a href="'+url+'">Daði</a><a href="'+url+'">Again</a><a href="'+other+'">Julia</a><a href="https://mcmenamins.com/events/999-other">Other room</a>'),[url,other]);
assert.throws(()=>c.links("<p>empty archive</p>"),/no first-party event links/);
assert.deepEqual(c.pages('<a href="/events/page/2/">2</a><a href="/events/page/3/">3</a><a href="/events/page/2/">Again</a>'),["https://www.crystalballroompdx.com/events/page/2/","https://www.crystalballroompdx.com/events/page/3/"]);
const og=(title,desc,permalink=url)=>'<meta property="og:title" content="'+title+'"><meta property="og:description" content="'+desc+'"><meta property="og:url" content="'+permalink+'">';
function html({title="Daði Freyr",venue="Crystal Ballroom",date="2026-10-24T20:00:00-07:00",status="EventScheduled",path=url}={}){
 return '<html><head>'+og(title+' - Crystal Ballroom','Saturday, October 24th at '+venue+' in Portland, OR',path)+
 '<meta property="og:image" content="https://www.crystalballroompdx.com/wp-content/uploads/2026/03/dadi.jpg">'+
 '<script type="application/ld+json">'+JSON.stringify({"@graph":[{"@type":"WebPage","name":"Event detail"},{"@type":"Event",name:title,startDate:date,eventStatus:"https://schema.org/"+status,"@id":path+"#event"}]})+'</script></head><body><h1>'+title+'</h1></body></html>';
}
const e=c.parseDetail(html(),url);
assert.equal(e.title,"Daði Freyr");assert.equal(e.venue,"Crystal Ballroom");
assert.equal(e.startDate,"2026-10-25T03:00:00.000Z");
assert.equal(e.artwork.url,"https://www.crystalballroompdx.com/wp-content/uploads/2026/03/dadi.jpg");
assert.equal(e.artwork.usageApproved,null);
assert.match(c.parseDetail(html({venue:"Lola's Room"}),url).hold,/performance room/);
assert.match(c.parseDetail(html({venue:"Ringlers Pub"}),url).hold,/performance room/);
assert.match(c.parseDetail(html({date:"2026-10-24T20:00:00-08:00"}),url).hold,/Pacific/);
assert.match(c.parseDetail(html({date:"2026-10-24T20:00:00"}),url).hold,/Pacific/);
assert.match(c.parseDetail(html({title:"MOVED TO ALADDIN THEATER: Daði Freyr"}),url).hold,/move/);
assert.match(c.parseDetail(html({status:"EventCancelled"}),url).hold,/no longer scheduled/);
assert.match(c.parseDetail(html({path:other}),url).hold,/Canonical/);
assert.match(c.parseDetail(html({date:"2027-01-23T20:30:00-08:00"}),url).startDate,/2027-01-24T04:30:00.000Z/);
assert.match(c.parseDetail(html({date:"2026-02-30T20:00:00-08:00"}),url).hold,/Pacific/);
console.log("PASS — first-party Crystal event links, trusted room-only OG identity, Event JSON-LD date/time, Pacific DST and artwork provenance");
