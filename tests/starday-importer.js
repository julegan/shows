"use strict";
const assert=require("node:assert/strict");
const s=require("../scripts/starday-importer");
const id="testevent_20261025T040000Z";
const id2="lateevent_20261025T050000Z";
const link=x=>"https://www.google.com/calendar/event?eid="+encodeURIComponent(Buffer.from(x+" m59vjhvcv0iflpv2iknoqlmvko@group.calendar.google.com").toString("base64"));
const row=(x,tm="2026-10-24T21:00:00-07:00",title="Hermit Crab + Gladys")=>({
 id:100,title,start:tm,end:"2026-10-24T23:59:00-07:00",start_timezone:"America/Los_Angeles",end_timezone:"America/Los_Angeles",
 url:link(x),google_event_id:x,allDay:"",description:"",location:""
});
const escape=x=>x.replace(/&/g,"&amp;").replace(/"/g,"&quot;");
const html=x=>'<div id="eael-event-calendar-2127f90" class="eael-event-calendar-cls" data-events="'+escape(JSON.stringify(x))+'"></div>';
assert.equal(s.sourceUrl(link(id),id),link(id));
assert.equal(s.sourceUrl(link(id),id2),null);
assert.equal(s.sourceUrl("https://evil.example/calendar/event?eid=abc",id),null);
assert.equal(s.sourceUrl("https://www.google.com/calendar/event?eid=x&other=1",id),null);
assert.equal(s.startISO("2026-10-24T21:00:00-07:00"),"2026-10-25T04:00:00.000Z");
assert.equal(s.startISO("2026-10-24T21:00:00-08:00"),null,"DST discrepancy must be held");
assert.equal(s.startISO("2027-01-24T20:00:00-08:00"),"2027-01-25T04:00:00.000Z");
const p=s.parseStarday(html([row(id),row(id2,"2026-10-24T22:00:00-07:00","Late Show"),row(id)]),{id:"starday-tavern",url:"https://stardaytavern.com/"});
assert.equal(p.length,2,"Same public event link deduped");
assert.equal(p[0].title,"Hermit Crab + Gladys");
assert.equal(p[0].google_event_id,id);
assert.match(p[0].timeEvidence,/doors or showtime/);
assert.match(s.parseItem({...row(id),title:"CLOSED"}).hold,/closure/);
assert.match(s.parseItem({...row(id),start:"2026-10-24T21:00:00-08:00"}).hold,/timezone/);
assert.throws(()=>s.records("<div></div>"),/missing/);
const {extract,reconcile}=require("../scripts/discover-events");
const source={id:"starday-tavern",name:"Starday Tavern",venue:"Starday Tavern",address:"6517 SE Foster Rd, Portland, OR",neighborhood:"Foster-Powell",baseUrl:"https://stardaytavern.com",adapter:"starday-google-html"};
const now=new Date("2026-10-22T20:00:00-07:00");
const candidates=p.map(x=>extract(x,source,now));
assert(candidates.every(x=>x.event),"Both time-specific original venue events become review candidates");
assert.equal(reconcile([],candidates).accepted.length,2,"Separately timed and ticketed Starday events are retained");
assert.equal(reconcile([],[candidates[0],{event:{...candidates[0].event,id:"different"}}]).accepted.length,1);
console.log("PASS — Starday source date/time, Google original eid identity, HTML encoded events, same-date shows and DST holds");


// The direct original-site collector retries only transient failures, never
// access restrictions, invalid HTML or mismatched source configuration.
(async()=>{
 const actual={id:"starday-tavern",adapter:"starday-google-html",url:"https://stardaytavern.com/",baseUrl:"https://stardaytavern.com"};
 const success=()=>({ok:true,headers:{get:()=> "text/html; charset=utf-8"},
  text:async()=>html([row(id),row(id2,"2026-10-24T22:00:00-07:00","Late Show")])});
 let attempts=0;
 const recovered=await s.fetchOfficialStarday(actual,async (_url,options)=>{
  assert.equal(options.redirect,"error");
  assert.equal(_url,"https://stardaytavern.com/");
  attempts++;
  if(attempts===1)throw Object.assign(Error("The operation was aborted due to timeout"),{name:"TimeoutError"});
  return success();
 });
 assert.equal(attempts,2,"A single timeout gets one retry");
 assert.equal(recovered.length,2,"Recovered official events are parsed, not silently skipped");
 let denied=0;
 await assert.rejects(s.fetchOfficialStarday(actual,async()=>{denied++;return {ok:false,status:403}}),/HTTP 403/);
 assert.equal(denied,1,"HTTP 403 is never retried");
 let busy=0;
 await s.fetchOfficialStarday(actual,async()=>{busy++;return busy===1?{ok:false,status:503}:success()});
 assert.equal(busy,2,"HTTP 503 is retried at most once");
 let expired=0;
 await assert.rejects(s.fetchOfficialStarday(actual,async()=>{
  expired++;throw Object.assign(Error("The operation was aborted due to timeout"),{name:"TimeoutError"});
 }),/timeout/);
 assert.equal(expired,2,"Even recurring timeouts stop after two attempts");
 let malformed=0;
 await assert.rejects(s.fetchOfficialStarday(actual,async()=>{
  malformed++;return {ok:true,headers:{get:()=> "text/html"},text:async()=>"<html>No calendar data</html>"};
 }),/calendar missing/);
 assert.equal(malformed,1,"Source structure errors are not network retries");
 await assert.rejects(s.fetchOfficialStarday({...actual,url:"https://attacker.example/"},async()=>success()),/Unapproved Starday/);
 console.log("PASS — Starday original-site transient retries, hard 403, bounded timeouts and strict parser");
})().catch(e=>{console.error(e);process.exitCode=1});
