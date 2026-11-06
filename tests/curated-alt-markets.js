"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const proposed=JSON.parse(fs.readFileSync(path.join(root,"discovery/curated-2026-alt-markets.json"),"utf8"));
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,"events.js"),"utf8"),ctx);
const e=ctx.window.SHOWS_EVENTS,m=ctx.window.SHOWS_DATASET,ids=e.map(x=>x.id);
const expected=proposed.candidates.map(x=>x.id);
assert.equal(proposed.batchId,"2026-11-03-curated-alt-markets");
assert.equal(expected.length,9);
assert.equal(new Set(expected).size,expected.length);
assert.equal(e.filter(x=>x.addedIn===proposed.batchId).length,9);
assert.equal(m.totalOccurrences,e.length);
// An automated refresh replaces the latest batch metadata as it grows the feed.
// The curated batch must remain in the audit history, not necessarily be latest.
const batches=[...(m.previousBatches||[]),{batchId:m.batchId,addedOccurrences:m.addedOccurrences}];
assert(batches.some(x=>x.batchId===proposed.batchId&&x.addedOccurrences===9),
 "Curated batch and its nine approved occurrences must survive later discovery runs");
assert(m.previousBatches.some(x=>x.batchId==="auto-discovery-2026-11-03-39"&&x.addedOccurrences===5),"Previously approved Mammoth event batch must be retained");
const dated=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
for(const id of expected){
 assert.equal(ids.filter(x=>x===id).length,1,id+" must appear once");
 const row=e.find(x=>x.id===id),proposal=proposed.candidates.find(x=>x.id===id);
 assert.equal(JSON.stringify(row),JSON.stringify(proposal),"Calendar event exactly preserves original source-backed proposal "+id);
 assert.equal(row.category,"Markets");assert.equal(row.sources[0].url,row.url);
 assert(row.url.startsWith("https://")&&row.sources[0].kind==="organizer");
 assert(!row.artwork,"No unlicensed art may be attached to curated market events");
 assert(row.startsAt.endsWith("-08:00"),"November and December 2026 events are after Pacific DST switch");
 assert(row.startsAt.slice(0,10)>="2026-11-03"&&row.startsAt.slice(0,10)<="2026-12-31","Only verified future 2026 dates");
 const parts=Object.fromEntries(dated.formatToParts(new Date(row.startsAt)).map(x=>[x.type,x.value]));
 assert.equal(parts.year+"-"+parts.month+"-"+parts.day,row.startsAt.slice(0,10));
 if(row.endsAt)assert(Date.parse(row.endsAt)>Date.parse(row.startsAt));
 else{
  assert.equal(id,"umbrae-dark-market-2026-11-15","Only organizer-confirmed date-only market");
  assert.equal(row.startTimeKind,"date-only");assert.equal(row.startsAt.slice(11,16),"00:00");
  assert.match(row.description,/NOT an opening time/);
 }
}
assert.equal(e.filter(x=>x.seriesId==="oddities-expo-portland-2026").length,2);
assert.equal(e.filter(x=>x.seriesId==="nopo-arts-market-november-2026").length,2);
assert.equal(e.filter(x=>x.seriesId==="moon-market-holiday-2026").length,3);
assert(!expected.some(id=>/flea|farmers/i.test(id)),"Do not invent Portland Flea dates or import routine farmers markets");
assert(e.filter(x=>x.addedIn===proposed.batchId&&x.venue==="Peninsula Odd Fellows Lodge").every(x=>/no elevator/i.test(x.accessibility)),"Important venue-access limitation retained");
assert(e.filter(x=>x.addedIn===proposed.batchId&&x.id.startsWith("moon-market")).every(x=>x.free===true),"Organizer-confirmed admission free");
assert(e.every((x,i)=>i===0||x.startsAt>=e[i-1].startsAt),"Canonical events remain chronological");
console.log("PASS — 9 primary-source alt markets, Portland 2026 dates/times, dedupe, accessibility, time holds and existing music coverage.");
