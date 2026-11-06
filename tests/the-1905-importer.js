"use strict";
const assert=require("node:assert/strict");
const m=require("../scripts/the-1905-importer");
const {wallToPacific}=require("../scripts/priority-importers");
const URL="https://the1905.turntabletickets.com/shows/13202/2026-11-07";
function performance(id,clock="18:30",patch={}){
 const instant=wallToPacific(2026,11,7,clock);
 return {id,show_id:13202,date:"2026-11-07",time:clock,datetime:new Date(instant).toISOString(),sold:false,
  show:{id:13202,name:"Nicole McCabe",description:"<p>Live modern jazz music.</p>",
    image:"https://assets-prod.turntabletickets.com/media/the1905/show-13202/flyer.jpg"},...patch};
}
const data=[performance(48287),performance(48289,"20:30")];
function fixture(items=data,hasMore=true){
 return '<html><head><title>Shows - The 1905</title></head><body>'+
  '<a href="/shows/13202/2026-11-07">Original show page</a>'+
  '<script>window.__pinia='+JSON.stringify({performancePaginate:{ssrPrefetchDone:true,hasMore,performances:items}})+';</script></body></html>';
}
assert.equal(m.showUrl(URL),URL);
for(const link of ["https://other.example/shows/13202/2026-11-07",URL+"?utm_campaign=bad",URL+"#fake","https://the1905.turntabletickets.com/calendar"]){
 assert.equal(m.showUrl(link),null,"Only original event-specific links can be referenced");
}
assert.equal(m.image("https://attacker.invalid/flyer.jpg",13202,URL),null);
assert.equal(m.image("https://assets-prod.turntabletickets.com/media/other/show-13202/flyer.jpg",13202,URL),null);
const got=m.parse(fixture());
assert.equal(got.partial,true,"When source says there are more pages, do not report full coverage");
assert.deepEqual(got.records.map(x=>x.sourcePerformanceId),["48287","48289"],"Independent ticket IDs retained");
assert.deepEqual(got.records.map(x=>x.startDate),["2026-11-08T02:30:00.000Z","2026-11-08T04:30:00.000Z"]);
assert.deepEqual(got.records.map(x=>x.title),["Nicole McCabe — 6:30 PM show","Nicole McCabe — 8:30 PM show"]);
assert.deepEqual(got.records[0].categories,["Jazz"]);
assert.equal(got.records[0].artwork.usageApproved,null);
assert.equal(got.records[0].artwork.sourceUrl,URL);
assert.match(got.records[0].timeEvidence,/not doors/);
assert.equal(m.parse(fixture([performance(48287,"18:30",{datetime:"2026-11-08T04:00:00Z"}),performance(48289,"20:30")])).records[0].hold.startsWith("Original show clock"),true);
assert.equal(m.parse(fixture([performance(48287,"18:30",{show:{id:13203,name:"Wrong",image:""}}),performance(48289,"20:30")])).records[0].hold.startsWith("Original performance"),true);
assert.equal(m.parse(fixture([performance(48287,"18:30",{show:{id:13202,name:"Jazz trivia",description:"Music",image:""}}),performance(48289,"20:30")])).records[0].categories.length,0,
 "Genre claims must not derive from venue reputation");
assert.throws(()=>m.parse(fixture().replace("/shows/13202/2026-11-07","/calendar")),/show permalinks not found/);
assert.throws(()=>m.parse(fixture().replace("Shows - The 1905","Unrelated ticket site")),/ticket page changed/);
(async()=>{
 const src=require("../discovery/sources.json").sources.find(s=>s.id==="the-1905");
 const mock=async()=>({ok:true,status:200,headers:{get:()=>"text/html"},text:async()=>fixture()});
 const fetched=await m.fetchEvents(src,mock);
 assert.equal(fetched.length,2);
 assert.deepEqual(fetched.map(e=>e.sourcePerformanceId),["48287","48289"]);
 await assert.rejects(()=>m.fetchEvents({...src,url:"https://bad.example/"},mock),/Unexpected/);
 console.log("PASS — The 1905 original ticketed jazz performance IDs, year/clock/Pacific UTC agreement, standalone source links, artwork review, pagination caveat");
})().catch(e=>{console.error(e);process.exitCode=1});
