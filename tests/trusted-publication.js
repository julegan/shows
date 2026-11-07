"use strict";
const assert=require("node:assert/strict");
const {plan,validatePolicy,holdReason,localDay}=require("../scripts/trusted-publication");
const policy=require("../discovery/trusted-sources.json");
const sourceRegistry=require("../discovery/sources.json");
const {parseFile}=require("../scripts/discover-events");
const now=new Date("2026-11-06T13:00:00-08:00");
assert.equal(localDay(now),"2026-11-06");
assert.equal(validatePolicy().size,2,"Only two independently date-verified original adapters are trusted");
const jack=sourceRegistry.sources.find(x=>x.id==="jack-london-revue");
const rose=sourceRegistry.sources.find(x=>x.id==="alberta-rose-theatre");
const make=(src,id,when,url,opts={})=>({
 id:"auto-"+src.id+"-"+when.slice(0,10)+"-"+id,title:"Original jazz bill "+id,
 subtitle:"Source-discovered venue event · details need review",category:"Unclassified",
 tags:["Category needs review","Time needs confirmation","Format needs confirmation"],
 musicStyles:[],eventFormat:"unverified",startTimeKind:"listed",startsAt:when,endsAt:null,
 venue:src.venue,address:src.address,neighborhood:src.neighborhood,
 price:"See organizer for current admission",free:null,age:"Not published",
 description:"Official showtime from first-party source",source:src.name,url,icon:"◇",
 sourceCheckedAt:"2026-11-06",verificationMethod:"Automated venue review",
 sources:[{name:src.name,url,kind:"organizer",checkedAt:"2026-11-06"}],
 addedIn:"auto-discovery-2026-11-06",
 artwork:{url:"https://example.com/flyer.jpg",sourceUrl:url,usageApproved:null},
 discovery:{sourceId:src.id,method:"primary-source-collection",verifiedOriginalShowTime:true},
 ...opts
});
const urlJack="https://www.jacklondonrevue.com/tm-event/verified-original-bill/";
const urlRose="https://albertarosetheatre.com/event/verified-bill/alberta-rose-theatre/portland-oregon/";
const old={id:"old-123",title:"Previously approved concert",venue:"Old Theatre",category:"Music",
 startsAt:"2026-11-09T20:00:00-08:00",url:"https://example.org/old-event",musicStyles:[],
 tags:[],startTimeKind:"show"};
const first=make(jack,"a1b2c3d4e5f6","2026-11-15T20:00:00-08:00",urlJack);
const second=make(rose,"aaaabbbbcccc","2026-11-16T20:00:00-08:00",urlRose);
function dataset(events){
 return "window.SHOWS_DATASET = "+JSON.stringify({totalOccurrences:events.length,musicOccurrences:events.filter(x=>x.category==="Music").length,
  batchId:"fixture-2026-11-06",addedOccurrences:events.length,sourceCheckedAt:"2026-11-06"})+";\n"+
 "window.SHOWS_EVENTS = "+JSON.stringify(events)+";\n";
}
const result=plan({baseline:dataset([old]),proposed:dataset([old,first,second]),now});
assert.equal(result.trusted.length,2,"Two original single-show events get verified and partitioned");
const approved=parseFile(result.current),pending=parseFile(result.pending);
assert.equal(approved.events.length,3);
assert.equal(pending.events.length,3,"Review snapshot includes inherited newly approved trusted records");
assert.deepEqual(pending.events.find(x=>x.id===old.id),old,"Previously approved event remains intact");
assert.equal(result.pending,result.current,"Trust-only additions do not generate an unnecessary metadata-only review PR");
for(const event of result.trusted){
 assert.equal(event.startTimeKind,"show","Explicit independently verified SHOW time is presented as show, not doors");
 assert.equal(event.trustPublication.policyVersion,1);
 assert.equal(event.artwork,undefined,"Pending-rights flyers are never auto-published");
 assert.equal(event.sourceArtworkUrl,undefined);
 assert(!event.tags.includes("Time needs confirmation"));
 assert(event.tags.includes("Format needs confirmation"),
  "A showtime verification must never imply an unverified music/performance category");
}
for(const e of result.trusted){
 assert.deepEqual(pending.events.find(x=>x.id===e.id),approved.events.find(x=>x.id===e.id),
  "An inherited trusted event is exactly identical to canonical main, including removed artwork");
}
const otherSource={...first,id:"auto-other-2026-11-19-aabbccddeeff",title:"Source still needs review",
  startsAt:"2026-11-19T20:00:00-08:00",
  discovery:{sourceId:"untrusted",method:"primary-source-collection"}};
const mixed=plan({baseline:dataset([old]),proposed:dataset([old,first,otherSource]),now});
assert.equal(mixed.trusted.length,1);
const mixedPending=parseFile(mixed.pending).events;
assert.equal(mixedPending.length,3);
assert(mixedPending.some(x=>x.id===first.id&&x.artwork===undefined&&x.trustPublication?.mode==="trusted-original-addition"),
 "Reviewable branch retains exactly the approved trusted rendition, not its unapproved flyer");
assert(mixedPending.some(x=>x.id===otherSource.id),"Untrusted new event remains for approval");
assert(!parseFile(mixed.current).events.some(x=>x.id===otherSource.id),
 "Trusted main cannot accidentally carry the untrusted candidate");
const changedOld={...old,title:"Hacked earlier approved description"};
const changes=plan({baseline:dataset([old]),proposed:dataset([changedOld,first]),now});
assert.deepEqual(parseFile(changes.current).events.find(x=>x.id===old.id),old,
 "Changed previously approved event cannot be published by routine trust lane");
assert.equal(parseFile(changes.pending).events.find(x=>x.id===old.id).title,changedOld.title,
 "Previously approved event updates are retained for editorial comparison");
const other=make(rose,"abcabcabcabc","2026-11-16T21:00:00-08:00",
 "https://albertarosetheatre.com/event/different-bill/alberta-rose-theatre/portland-oregon/");
const collision=plan({baseline:dataset([old]),proposed:dataset([old,second,other]),now});
assert.equal(collision.trusted.length,0,"Same-venue/day new events never silently resolve multi-set identity");
assert.equal(collision.rejected.length,2);
const already=make(jack,"123456abcdef","2026-11-15T20:00:00-08:00",urlJack);
assert.equal(plan({baseline:dataset([old,first]),proposed:dataset([old,first,already]),now}).trusted.length,0,
 "Existing official URL cannot be reintroduced under a different event ID");
for(const [label,event] of [
 ["Unverified source clock",{...first,discovery:{...first.discovery,verifiedOriginalShowTime:false}}],
 ["Changed status",{...first,title:"Concert postponed"}],
 ["Unapproved original venue URL",{...first,url:"https://other.invalid/tm-event/verified-original-bill/"}],
 ["Wrong room",{...first,venue:"Different venue"}],
 ["Invented free admission",{...first,free:true}],
 ["Time might be doors",{...first,startTimeKind:"doors"}],
 ["No year/date evidence",{...first,startsAt:"2026-11-15"}],
 ["Near-term event",{...first,startsAt:"2026-11-07T20:00:00-08:00"}],
 ["Multi-performance series",{...second,sourceTicketId:"123456789"}]
]){
 const r=plan({baseline:dataset([old]),proposed:dataset([old,event]),now});
 assert.equal(r.trusted.length,0,label+" always returns to review");
 assert(r.rejected[0]?.reason,label+" must be explained in the reason queue");
}
assert.equal(plan({baseline:dataset([old]),proposed:dataset([old,first]),now,
 config:{...policy,maxAdditionsPerRun:1}}).trusted.length,1);
assert.equal(plan({baseline:dataset([old]),proposed:dataset([old,first,second]),now,
 config:{...policy,maxAdditionsPerRun:1}}).trusted.length,0,"Oversized trusted batch fails closed, not arbitrarily truncated");
assert.throws(()=>plan({baseline:dataset([old]),proposed:dataset([old,first]),now,
 config:{...policy,sources:[...policy.sources,{id:"unapproved",adapter:"whatever",venue:"Fake Venue",sourceUrl:"https://fake/"}]}}),
 /Unreviewed trusted source/);
assert.throws(()=>plan({baseline:dataset([old]),proposed:dataset([]),now}),/missing original approved records/i);
assert.throws(()=>plan({baseline:dataset([old,old]),proposed:dataset([old,first]),now}),/Duplicate IDs/i);
console.log("PASS — trusted-source append-only selection, venue/date/show clock evidence, colliding bills, old edits, artwork rights and manual fallback");
