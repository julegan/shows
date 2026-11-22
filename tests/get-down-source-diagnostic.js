"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const d=require("../scripts/get-down-source-diagnostic");
const padding="Original venue calendar and live show information ".repeat(12);
const html='<html><body><h1>The Get Down</h1><p>680 SE 6th Ave Portland</p>'+
 '<div>The Get Down Presents Polyrhythmics DOORS: 8:00 pm buy tickets</div>'+
 '<div>The Get Down & KMHD Present DTF: Deitch, Teitel, Fribush DOORS: 7:00 pm buy tickets</div>'+
 '<a href="https://www.tixr.com/groups/thegetdownpdx/events/polyrhythmics-123">Polyrhythmics</a>'+
 '<a href="https://www.tixr.com/groups/thegetdownpdx/events/unpaired-456">Buy Tickets</a>'+
 '<a href="https://www.tixr.com/groups/thegetdownpdx/events/unpaired-456">More Info</a>'+
 '<a href="https://other.example/events/unknown">Buy Tickets</a>'+
 '<a href="https://evil.example/events/anything">Untrusted link</a>'+
 '<a href="javascript:alert(1)">Bad</a>'+
 '<p>'+padding+'</p></body></html>';
const existing=[{id:"p",title:"Polyrhythmics",venue:"The Get Down",startsAt:"2026-11-20T21:00:00-08:00"},
 {id:"other",title:"DTF: Deitch, Teitel, Fribush",venue:"The Get Down Bar",startsAt:"2026-12-18T20:00:00-08:00"}];
const result=d.inspect(html,existing);
assert.equal(result.proposedEvents.length,0);
assert.equal(result.artwork.length,0);
assert.equal(result.canonicalVenueCount,1,"Never conflate other similarly named venues");
assert(result.observations.some(o=>o.titleHint==="Polyrhythmics"&&o.status==="possible-existing-title-review"));
assert(result.observations.some(o=>o.titleHint.startsWith("DTF:")&&o.status==="missing-or-title-different-review"));
assert.equal(result.sourceLinks.length,2,"Generic official ticket CTA is preserved once for investigation");
assert.equal(result.sourceLinks[0].url,"https://www.tixr.com/groups/thegetdownpdx/events/polyrhythmics-123");
assert.equal(result.sourceLinks[0].association,"labelled-link");
assert.deepEqual(result.sourceLinks[1],{
 label:"Buy Tickets",url:"https://www.tixr.com/groups/thegetdownpdx/events/unpaired-456",
 association:"unpaired-ticket-link"
},"Never assign a generic CTA to the adjacent bill or infer an event from it");
assert.equal(result.observations.length,2,"Unpaired ticket links never fabricate event titles");
assert.equal(result.proposedEvents.length,0,"Unpaired ticket URLs never become canonical events");
assert(!JSON.stringify(result).includes("evil.example"));
assert.throws(()=>d.inspect(html.replace("680 SE 6th Ave","615 SE Alder St"),existing),/identity/);
assert.throws(()=>d.inspect("x".repeat(1500001)),/oversized/);
assert.equal(d.normalized("DTF: Deitch, Teitel, Fribush"),"dtf deitch teitel fribush");
const watch=fs.readFileSync(path.join(__dirname,"../.github/workflows/get-down-calendar-watch.yml"),"utf8");
assert.match(watch,/schedule:/,"Original calendar watch runs without manual nomination");
assert.match(watch,/workflow_dispatch:/,"Source watch can be manually repeated");
assert.match(watch,/contents: read/,"Research workflow has no write permission");
assert.doesNotMatch(watch,/contents: write|pull-requests: write|gh pr create|git push/,"Research never publishes");
assert.match(watch,/node tests\/get-down-source-diagnostic\.js/,"Live watch tests its parser first");
assert.match(watch,/continue-on-error: true/,"A source block is recorded without claiming missing events");
assert.match(watch,/if-no-files-found: warn/,"Blocked source retains explicit status");
assert.match(watch,/discovery\/get-down-source-diagnostic\.md/,"Original evidence is retained for review");
const script=fs.readFileSync(path.join(__dirname,"../scripts/get-down-source-diagnostic.js"),"utf8");
assert(!script.includes("events.push("),"No event creation in research-only diagnostic");
(async()=>{
 let count=0;
 const r=await d.run({write:false,events:existing,request:async(url,opts)=>{
  count++;assert.equal(url,d.SOURCE);assert.equal(opts.redirect,"error");
  return {ok:true,headers:{get:()=> "text/html; charset=utf-8"},text:async()=>html};
 }});
 assert.equal(count,1);
 assert.equal(r.observations.length,2);
 await assert.rejects(d.run({write:false,events:existing,request:async()=>({ok:false,status:403})}),/HTTP 403/);
 await assert.rejects(d.run({write:false,events:existing,request:async()=>({ok:true,headers:{get:()=>"application/json"}})}),/did not return HTML/);
 console.log("PASS — Get Down original calendar identity, bounded source links, conservative title gaps and read-only behavior");
})().catch(e=>{console.error(e);process.exitCode=1;});
