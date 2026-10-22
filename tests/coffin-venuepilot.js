"use strict";
const assert=require("node:assert/strict");
const {ACCOUNT_ID,ENDPOINT,QUERY,primaryTicketUrl,toEvent,parsePage,fetchCoffinEvents}=require("../scripts/coffin-venuepilot");
assert.equal(ACCOUNT_ID,3434,"Only official Coffin public account is queried");
assert.equal(ENDPOINT,"https://public.api.venuepilot.com/graphql");
assert(QUERY.includes("startTime")&&QUERY.includes("doorTime")&&QUERY.includes("canceled"),"Include official status and showtime evidence");
const ticket="https://tickets.venuepilot.com/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb";
assert.equal(primaryTicketUrl(ticket+"?direct=true"),ticket);
assert.equal(primaryTicketUrl("https://evil.example/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb"),null);
assert.equal(primaryTicketUrl("http://tickets.venuepilot.com/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb"),null);
const raw={id:123,slug:"soft-vein-2026-11-07-the-coffin-portland-7e7bbb",name:"Soft Vein + Modele + Chalice Sect",
 startTime:"2026-11-08T04:30:00Z",doorTime:"2026-11-08T04:00:00Z",canceled:false,ticketsUrl:ticket,
 venue:{name:"The Coffin",street1:"421 SE Grand Ave",city:"Portland",state:"OR",timezone:"America/Los_Angeles"},
 images:[{name:"Official Soft Vein event flyer",highlighted:true,variants:[{variant:"large",src:"https://s3.amazonaws.com/files.venuepilot.com/events/soft-vein.jpg"}]}]};
const e=toEvent(raw);
assert.equal(e.title,"Soft Vein + Modele + Chalice Sect");
assert.equal(e.venue,"The Coffin Club");
assert.equal(e.startDate,"2026-11-08T04:30:00Z");
assert.equal(e.artwork?.usageApproved,null);
assert.equal(e.artwork?.sourceUrl,ticket);
assert.match(toEvent({...raw,canceled:true}).hold,/canceled/);
assert.match(toEvent({...raw,venue:{...raw.venue,name:"Unknown Lounge"}}).hold,/identity/);
assert.match(toEvent({...raw,venue:{...raw.venue,city:"Seattle"}}).hold,/identity/);
assert.match(toEvent({...raw,venue:{...raw.venue,street1:"500 Wrong Street"}}).hold,/identity/);
assert.match(toEvent({...raw,venue:{...raw.venue,timezone:"America/New_York"}}).hold,/timezone/);
assert.match(toEvent({...raw,startTime:"2026-11-08T03:00:00Z"}).hold,/before its published door/);
assert.match(toEvent({...raw,startTime:null}).hold,/start time/);
assert.match(toEvent({...raw,ticketsUrl:"https://other-tickets.example/e/wrong"}).hold,/ticket URL/);
assert.throws(()=>parsePage({data:{events:{nodes:[],pageInfo:{}}}}),/schema changed/);
assert.throws(()=>parsePage({errors:[{message:"denied"}]}),/valid events connection/);
(async()=>{
 const calls=[],appId="a".repeat(64);
 const request=async(url,opts)=>{
  assert.equal(url,ENDPOINT);assert.equal(opts.headers["x-vp-app-id"],appId);
  const body=JSON.parse(opts.body);assert.deepEqual(body.variables.filter,{accountIds:[3434],startDate:"2026-10-21"});
  calls.push(body.variables.after);
  return {ok:true,status:200,json:async()=>({data:{events:{nodes:[{...raw,id:calls.length,ticketsUrl:ticket+(calls.length===2?"-alt":"")}],
   pageInfo:{hasNextPage:calls.length===1,endCursor:calls.length===1?"next":null}}}})};
 };
 const events=await fetchCoffinEvents({appId,request,startDate:"2026-10-21"});
 assert.deepEqual(calls,[null,"next"]);assert.equal(events.length,2);
 await assert.rejects(fetchCoffinEvents({appId:"not-an-app-id",request}),/missing or invalid/);
 await assert.rejects(fetchCoffinEvents({appId,request:async()=>({ok:false,status:500}),startDate:"2026-10-21"}),/API HTTP 500/);
 console.log("PASS — VenuePilot Coffin primary account, pagination, showtime, cancellation, venue identity, artwork and secret isolation");
})().catch(e=>{console.error(e);process.exitCode=1});
