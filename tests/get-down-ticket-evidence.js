"use strict";
const assert=require("node:assert/strict");
const d=require("../scripts/get-down-ticket-evidence");
const {SOURCE}=require("../scripts/get-down-source-diagnostic");
const ticket="https://www.tixr.com/groups/thegetdownpdx/events/polyrhythmics-123";
assert.equal(d.originalTicket(ticket),ticket);
for(const url of ["https://www.tixr.com/groups/anothervenue/events/polyrhythmics-123",
 "https://www.tixr.com/groups/thegetdownpdx/events/polyrhythmics-123?redirect=evil",
 "http://www.tixr.com/groups/thegetdownpdx/events/polyrhythmics-123",
 "https://www.tixr.com/groups/thegetdownpdx"])assert.equal(d.originalTicket(url),null);
const event={ "@context":"https://schema.org","@type":"Event",name:"Polyrhythmics",
 startDate:"2026-12-05T20:00:00-08:00",location:{name:"The Get Down",
 address:{streetAddress:"680 SE 6th Ave",addressLocality:"Portland"}}};
const page=e=>'<html><body><p>Official ticket details</p><script type="application/ld+json">'+JSON.stringify(e)+'</script></body></html>';
assert.equal(d.inspectTicket(page(event),ticket).title,"Polyrhythmics");
assert.equal(d.inspectTicket(page(event),ticket).observedStart,event.startDate);
assert.equal(d.inspectTicket(page({...event,location:{name:"Another venue",address:{streetAddress:"680 SE 6th Ave"}}}),ticket).hold,
 "No original event schema independently verifies venue AND street address");
assert.equal(d.inspectTicket(page({...event,location:{name:"The Get Down",address:{streetAddress:"600 SE 6th Ave"}}}),ticket).hold,
 "No original event schema independently verifies venue AND street address");
assert.match(d.inspectTicket(page({...event,startDate:"2026-12-05"}),ticket).hold,/offset-aware/);
assert.match(d.inspectTicket(page({...event,eventStatus:"https://schema.org/EventCancelled"}),ticket).hold,/manual review/);
assert.equal(d.inspectTicket(page(event),"https://evil.example/events/a").hold,
 "Ticket URL not scoped to The Get Down's original Tixr group");
(async()=>{
 const calendar='<html><body><h1>The Get Down</h1><p>680 SE 6th Ave Portland</p>'+
 '<a href="'+ticket+'">Buy Tickets</a>'+'<p>Original venue music calendar </p>'.repeat(20)+'</body></html>';
 const calls=[];
 const result=await d.run({write:false,request:async url=>{
  calls.push(url);
  return {ok:true,status:200,headers:{get:()=>"text/html"},text:async()=>url===SOURCE?calendar:page(event)};
 }});
 assert.deepEqual(calls,[SOURCE,ticket]);
 assert.equal(result.findings.length,1);
 assert.equal(result.findings[0].status,"original-ticket-evidence-only");
 assert.equal(result.findings[0].proposedEvents,0);
 assert.match(result.report,/showtime semantics unverified/);
 const failed=await d.run({write:false,request:async url=>({
  ok:url===SOURCE,status:url===SOURCE?200:403,headers:{get:()=>"text/html"},
  text:async()=>calendar
 })});
 assert.match(failed.findings[0].hold,/HTTP 403/);
 console.log("PASS — original Get Down ticket identity, explicit venue/address, safe clock evidence and review-only holds");
})().catch(e=>{console.error(e);process.exitCode=1;});
