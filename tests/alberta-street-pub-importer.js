"use strict";
const assert=require("node:assert/strict");
const m=require("../scripts/alberta-street-pub-importer");
const {extract,reconcile}=require("../scripts/discover-events");
const src=require("../discovery/sources.json").sources.find(s=>s.id==="alberta-street-pub");
const liveSourceUrl="https://www.albertastreetpub.com/music/2026/11/6/kalida-with-opener-paper-plane";
function sample(overrides={}){
 const date=Date.parse("2026-11-07T02:00:00Z");
 return {id:"6ad3d46d0b8c7254f2fff51c",title:"Kalida with Opener Paper Plane",
  startDate:date,endDate:date+7200000,
  fullUrl:"/music/2026/11/6/kalida-with-opener-paper-plane",
  assetUrl:"https://images.squarespace-cdn.com/content/v1/54109e68e4b06b163549a8dc/1792267410894-B6P9EIVFWJGZ6WOJKZ7S/Kalida.png",
  location:{addressTitle:"Alberta Street Pub",addressLine1:"1036 NE Alberta Street"},
  body:"<p>$12 Cover at the Door</p>",tags:[],categories:[],...overrides};
}
const page={collection:{title:"Live Events",urlId:"music",fullUrl:"/music"},pagination:{nextPage:true},upcoming:[sample(),sample({id:"other",title:"Jazz Night",fullUrl:"/music/2026/11/7/jazz-night",startDate:Date.parse("2026-11-08T05:00:00Z"),endDate:Date.parse("2026-11-08T07:00:00Z")})]};
assert.equal(m.eventUrl(liveSourceUrl),liveSourceUrl);
for(const bad of ["https://other.example/music/2026/11/6/bad","https://www.albertastreetpub.com/music/2026/11/6/bad?utm=1","https://www.albertastreetpub.com/music?format=json","https://www.albertastreetpub.com/music/../admin"]){
 assert.equal(m.eventUrl(bad),null,"No non-event or untrusted URLs");
}
assert.equal(m.eventUrl("/music/2023/3/5/soulful-sundays-legacy-slug"),"https://www.albertastreetpub.com/music/2023/3/5/soulful-sundays-legacy-slug",
 "A recurring event's historic URL does not imply a historic occurrence date");
const r=m.parse(page);
assert.equal(r.records.length,2);
assert.equal(r.partial,true,"Squarespace pagination must not imply complete source coverage");
assert.equal(r.records[0].fullUrl,liveSourceUrl);
assert.equal(r.records[0].startDate,Date.parse("2026-11-07T02:00:00Z"));
assert.equal(r.records[0].sourceVerifiedMusic,false,"A headliner name alone is not proof of format");
assert(r.records[0].artwork);
assert.equal(r.records[0].artwork.usageApproved,null,"No automatic flyer rights approval");
assert.equal(r.records[0].artwork.sourceUrl,liveSourceUrl);
assert.deepEqual(r.records[0].categories,[]);
assert.equal(m.record(sample({title:"Bridgetown Trivia"})).sourceVerifiedMusic,false);
assert.equal(m.record(sample({title:"The Thesis with music by DJ Verbz"})).sourceVerifiedMusic,true);
assert.equal(m.record(sample({title:"Live jazz trio"})).sourceVerifiedMusic,true);
assert.equal(m.record(sample({location:{addressTitle:"Wrong Bar",addressLine1:"Different"}})).hold.startsWith("Source location"),true);
assert.equal(m.record(sample({startDate:"2026-11-07"})).hold.startsWith("Original venue event"),true);
assert.equal(m.record(sample({endDate:Date.parse("2026-11-06T02:00:00Z")})).hold.startsWith("Original venue event"),true);
assert.equal(m.record(sample({fullUrl:"https://attacker.invalid/music/2026/11/6/evil"})).hold.startsWith("No event-specific"),true);
assert.equal(m.record(sample({assetUrl:"https://bad.example/image.png"})).artwork,undefined);
assert.equal(m.parse({...page,upcoming:[sample(),sample()]}).records.length,1,"Same URL + source timestamp dedupes identical recurring record");
assert.throws(()=>m.parse({...page,upcoming:[]}),/upcoming venue calendar/);
assert.throws(()=>m.parse({...page,collection:{title:"Different",urlId:"unexpected",fullUrl:"/music"}}),/collection identity/);
const fixture=m.record(sample({fullUrl:"/music/2023/3/5/ramblin-rose-older-url",title:"Ramblin Rose",
 startDate:Date.parse("2026-11-07T01:00:00Z"),endDate:Date.parse("2026-11-07T03:00:00Z")}));
const e=extract(fixture,src,new Date("2026-11-06T09:00:00-08:00")).event;
assert(e&&e.startsAt==="2026-11-06T17:00:00-08:00","Squarespace occurrence time, not historic permalink slug, drives verified date");
assert.equal(e.category,"Unclassified","Unverified band name must not inherit venue music classification");
const second=extract(m.record(sample({title:"DJ set with live music",startDate:Date.parse("2026-11-07T05:30:00Z"),endDate:Date.parse("2026-11-07T07:00:00Z"),
 fullUrl:"/music/2026/11/6/dj-set-with-live-music"})),src,new Date("2026-11-06T09:00:00-08:00")).event;
assert(second&&second.category==="Music");
assert.equal(reconcile([e],[{event:second}]).accepted.length,1,"Distinct first-party venue events can share a calendar date");
assert.equal(reconcile([e],[{event:e}]).skipped.length,1,"Original same event not duplicated");
(async()=>{
 const mock=async()=>({ok:true,status:200,headers:{get:()=> "application/json;charset=utf-8"},text:async()=>JSON.stringify(page)});
 const rows=await m.fetchEvents(src,mock);
 assert.equal(rows.length,2);
 await assert.rejects(()=>m.fetchEvents({...src,url:"https://evil.invalid/"},mock),/Unexpected Alberta/);
 console.log("PASS — Alberta venue original event URL, Pacific source occurrence, recurring historic URL, distinct bills, nonmusic, artwork rights and pagination holds");
})().catch(e=>{console.error(e);process.exitCode=1});
