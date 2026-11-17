"use strict";
const assert=require("node:assert/strict");
const keys=require("../scripts/keys-lounge-diagnostic");
const days=[
 ["Tuesdays","The session at Keys","8pm-11pm"],
 ["WEDNESDAYS","DJ Set","6PM-10PM"],
 ["Thursdays","Lounge Vibrations","8pm-10PM"],
 ["Fridays","Vinyl DJ","5:30pm-12:30am"],
 ["Saturdays","vinyl dj 5PM-9PM LIVE Jazz social","10pm-Midnight"]
];
const html="<html><body><h1>Keys Lounge</h1>"+days.map(d=>"<section><h2>"+d[0]+"</h2><p>"+d[1]+"</p><p>"+d[2]+"</p></section>").join("")+"<p>"+("Official weekly music programming ".repeat(20))+"</p></body></html>";
const result=keys.analyze(html);
assert.equal(result.proposedEvents.length,0);
assert(result.observations.some(o=>o.slot==="tuesday-jazz"));
assert(result.observations.some(o=>o.slot==="thursday-residency"));
assert(result.observations.every(o=>o.eventDate===null&&o.eventTime===null));
assert(result.holds.some(h=>h.slot==="friday-dj"),"Absent Friday clock remains held");
assert.throws(()=>keys.analyze("<html>Unrelated page</html>"),/Missing or oversized|identity/);
assert.throws(()=>keys.analyze("x".repeat(900001)),/oversized/);
const wrong=html.replace("Lounge Vibrations","Private Event");
assert(keys.analyze(wrong).holds.some(h=>h.slot==="thursday-residency"));
(async()=>{
 let calls=0;
 const out=await keys.run({write:false,request:async url=>{
  calls++;assert.equal(url,"https://www.keyspdx.com/");
  return {ok:true,headers:{get:()=> "text/html; charset=UTF-8"},text:async()=>html};
 }});
 assert.equal(calls,1,"Only fetch original registered source");
 assert.equal(out.proposedEvents.length,0);
 await assert.rejects(keys.run({write:false,request:async()=>({ok:false,status:403})}),/HTTP 403/);
 console.log("PASS — Keys first-party schedule is diagnostic only, no synthetic event occurrences");
})().catch(e=>{console.error(e);process.exitCode=1;});
