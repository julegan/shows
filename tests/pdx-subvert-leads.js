"use strict";
const assert=require("node:assert/strict");
const s=require("../scripts/pdx-subvert-leads.js");
const now=new Date("2026-11-02T20:00:00Z");
function show(id,patch={}){
 return {id,imageUrl:"https://res.cloudinary.com/gksbz5nt/image/upload/v1790792382/subvert/gf76lswgfuohtgiloird.jpg",
  dateOfShow:"$D2026-11-07T20:00:00.000Z",isAllAges:true,
  bands:["Habak (San Diego)","Frenzy","Malakili"],location:"Black Water",cost:"15",
  other:"",notes:"",hasPreSale:false,preSaleUrl:null,isCancelled:false,...patch};
}
const id1="6abd5377faf2348b784a3aa6",id2="6ae4ef430441523ee4daa958",id3="6ad43f9dc3233ca8b8885264";
const sourceRows=[
 show(id1),
 show(id2,{dateOfShow:"$D2026-11-14T02:00:00.000Z",bands:["Huge Prick","Jab","Festering Estate","Zero Sanity"],location:"Ask A Idiot",notes:"Assuming its all ages"}),
 show(id3,{dateOfShow:"$D2026-11-14T19:00:00.000Z",bands:["Record Fair! + DJ sets"],location:"Black Water"})
];
const fragment="m:R[1,{\"children\":["+sourceRows.map(x=>'["$","$L1b","'+x.id+'",{"show":'+JSON.stringify(x)+'}]').join(",")+"]}]";
const page='<html><head></head><body>'+("realistic public RSC ".repeat(80))+
 '<script>self.__next_f.push([1,'+JSON.stringify(fragment)+'])</script>'+
 '<script>self.__next_f.push([1,'+JSON.stringify("some other app resources")+'])</script></body></html>';
assert.equal(s.getFlight(page).length,2);
assert.equal(s.extractRecords(page).length,3);
assert.equal(s.extractRecords(page.replace("</body>",'<script>self.__next_f.push([1,'+JSON.stringify(fragment)+'])</script></body>')).length,3,"Duplicate embedded records must be deduplicated by original id");
const found=s.parse(page,now);
assert.equal(found.total,3);
assert.equal(found.records[0].displayedClock,"20:00");
assert.equal(found.records[0].date,"2026-11-07");
assert.equal(found.records[0].flyerReference,sourceRows[0].imageUrl);
assert.equal(found.records[0].publishable,false);
assert.equal(found.records[0].hold,null);
assert.match(found.records[0].timeEvidence,/not independently confirmed/);
assert.match(found.records[1].hold,/Unusual pre-8AM/);
assert.match(found.records[2].hold,/Mixed record fair/);
assert.equal(found.records[1].date,"2026-11-14","Do NOT convert source UTC to a previous Pacific calendar day");
assert.match(found.records[1].notes,/Assuming/);
assert(s.status(show(id1,{isCancelled:true}),now).hold.includes("canceled"));
assert.match(s.status(show(id1,{dateOfShow:"$D2026-11-31T20:00:00.000Z"}),now).hold,/Invalid/);
assert.match(s.status(show(id1,{dateOfShow:"$D2026-11-07T20:00:00.000Z",location:""}),now).hold,/missing/);
assert.match(s.status(show(id1,{dateOfShow:"$D2026-11-07T06:00:00.000Z"}),now).hold,/pre-8AM/);
assert.equal(s.status(show(id1,{imageUrl:"https://evil.example/flyer.png"}),now).flyerReference,null);
assert.match(s.report(found,null),/0 automatically approved/);
assert.match(s.report(found,null),/reuse rights unverified/i);
assert.match(s.report(null,"HTTP 403"),/Source hold/);
assert.throws(()=>s.parse("broken source",now),/HTML missing/);
assert.throws(()=>s.parse("<html>"+(" ".repeat(1500))+"</html>",now),/Next.js/);
assert.throws(()=>s.parse(page.replace("6abd5377faf2348b784a3aa6","BAD_ID").replace("6abd5377faf2348b784a3aa6","BAD_ID"),now),/no stable id/);
(async()=>{
 const request=async url=>{assert.equal(url,s.SOURCE);return {ok:true,status:200,headers:{get:()=>"text/html"},
  body:new ReadableStream({start(ctrl){ctrl.enqueue(new TextEncoder().encode(page));ctrl.close();}})};};
 assert.equal((await s.fetchLeads({request,now})).records.length,3);
 await assert.rejects(s.fetchLeads({request:async()=>({ok:false,status:403,headers:{get:()=>"text/html"}}),now}),/HTTP 403/);
 console.log("PASS — PDX SUBVERT direct RSC objects, 3 original source leads, ambiguous 2AM/record-fair holds, image rights, 403 and no publication");
})().catch(e=>{console.error(e);process.exitCode=1});
