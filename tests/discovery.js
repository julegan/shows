"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {localTime,discoveryEndDay,DISCOVERY_HORIZON_DAYS,parseFile,itemsOf,urlOf,music,extract,reconcile,run}=require("../scripts/discover-events");
const root=path.resolve(__dirname,"..");
const source=JSON.parse(fs.readFileSync(path.join(root,"discovery/sources.json"),"utf8")).sources.find(x=>x.id==="no-fun");
const now=new Date("2026-10-17T21:00:00-07:00");
assert.equal(localTime("2026-10-26T03:00:00Z"),"2026-10-25T20:00:00-07:00");
assert.equal(localTime("2026-11-03T04:00:00Z"),"2026-11-02T20:00:00-08:00");
assert.equal(localTime(Date.parse("2026-11-03T04:00:00Z")),"2026-11-02T20:00:00-08:00");
assert.equal(DISCOVERY_HORIZON_DAYS,400);
assert.equal(discoveryEndDay(now),"2027-11-21");
assert.deepEqual(itemsOf({upcoming:[{title:"Concert"}]}),[{title:"Concert"}]);
assert.throws(()=>itemsOf({unknown:[]}),/No supported/);
assert.equal(urlOf({urlId:"test-gig"},source),"https://www.nofunportland.com/events/test-gig");
assert.equal(urlOf({fullUrl:"https://attacker.invalid/events/evil"},source),null);
assert(!music({title:"Tuesday Trivia and Karaoke"}));
assert(music({title:"Metal bands live music at No Fun"}));
const item={title:"Underground metal band live concert",urlId:"fixture-live-show",startDate:Date.parse("2026-11-03T04:00:00Z"),excerpt:"Band performance 8pm"};
assert.equal(extract({...item,title:"Independent Karaoke Night",sourceVerifiedMusic:false},source,now).event?.category,"Karaoke");
assert.equal(extract({...item,title:"Screenprinting Workshop",sourceVerifiedMusic:false},source,now).event?.category,"Workshops");
const candidate=extract(item,source,now);
assert(candidate.event);
assert(extract({...item,startDate:Date.parse("2027-04-16T03:00:00Z")},source,now).event,"Future-year event within 400 days is eligible");
assert.equal(extract({...item,startDate:Date.parse("2027-12-16T04:00:00Z")},source,now).skip,"Outside review period");
assert.equal(extract({...item,startDate:"2025-10-16T20:00:00-07:00"},source,now).skip,
  "Historical event outside review period",
  "Valid old venue calendar entries are skipped instead of inflating invalid future holds");
assert.equal(extract({...item,startDate:"not-a-date"},source,now).hold,"Bad event timestamp");
const e=candidate.event;
assert.equal(e.startsAt,"2026-11-02T20:00:00-08:00");
assert.equal(e.startTimeKind,"listed");
assert.equal(e.free,null);
assert.equal(e.age,"Not published");
assert.deepEqual(e.musicStyles,["Metal"],"Explicit metal wording in the original event title is valid source evidence");
assert(!e.artwork);
const blocked=extract({...item,title:"A live concert bill",startDate:Date.parse("2026-11-14T04:00:00Z")},source,now);
assert.equal(blocked.hold?.startsWith("Historical source conflict"),true);
assert.match(e.verificationMethod,/editorial/i);
const original=parseFile(fs.readFileSync(path.join(root,"events.js"),"utf8"));
assert(Array.isArray(original.events));
// Test duplicate handling in isolation: live discovery can add another No Fun bill
// on this fixture date, which should not invalidate a deterministic unit test.
const pair=reconcile([],[candidate,candidate]);
assert.equal(pair.accepted.length,1);
assert.equal(pair.skipped.length,1);
const sameDay=reconcile([{...e,id:"existing",title:"Different show",url:"https://www.nofunportland.com/events/else"}],[candidate]);
assert.equal(sameDay.accepted.length,0);
assert.equal(sameDay.held.length,1);
// Different original first-party permalinks can establish separate same-day
// events without requiring any genre classification.
const officialEarly={...e,id:"dantes-official-early",title:"Iron Forest with guests",
 venue:"Dante's",startsAt:"2026-11-07T18:00:00-08:00",startTimeKind:"listed",
 url:"https://www.danteslive.com/tm-event/iron-forest-with-guests/",
 discovery:{sourceId:"dantes"}};
const officialLate={...officialEarly,id:"dantes-official-late",title:"Static Press Noise Night",
 startsAt:"2026-11-07T21:00:00-08:00",
 url:"https://www.danteslive.com/tm-event/static-press-noise-night/"};
const separateDantes=reconcile([officialEarly],[{event:officialLate}]);
assert.equal(separateDantes.accepted.length,1,"Two distinct source-linked bills at different times reach editorial review");
assert.equal(separateDantes.held.length,0);
assert(separateDantes.accepted[0].tags.includes("Separate same-day source listing; review bill and room"));
const renamed={...officialLate,id:"dantes-renamed",title:"Iron Forest, special guests",
 url:officialEarly.url};
const originalIdentity=reconcile([officialEarly],[{event:renamed}]);
assert.equal(originalIdentity.skipped.length,1,"Reworded original event URL is already represented");
assert.match(originalIdentity.skipped[0].skip,/same original event permalink/);
assert.equal(originalIdentity.held.length,0);
const similarHeadliner={...officialLate,id:"dantes-similar-headliner",title:"Iron Forest w Special Guest"};
assert.equal(reconcile([officialEarly],[{event:similarHeadliner}]).held.length,1,
 "Different original URL but substantially same bill without a separate session stays in review");
const nearTime={...officialLate,id:"dantes-near",startsAt:"2026-11-07T18:45:00-08:00"};
assert.equal(reconcile([officialEarly],[{event:nearTime}]).held.length,1,
 "Near times might be doors/show or competing room listings");
const unsafeLink={...officialLate,id:"dantes-unsafe",url:"https://example.invalid/tm-event/fake-show/"};
assert.equal(reconcile([officialEarly],[{event:unsafeLink}]).held.length,1,
 "Arbitrary domains do not establish independently ticketed shows");
const sharedCalendar={...officialEarly,url:"https://www.danteslive.com/"};
assert.equal(reconcile([sharedCalendar],[{event:officialLate}]).held.length,1,
 "Generic venue homepage does not provide a unique competing event ID");
const revEarly={...officialEarly,id:"revolution-early",title:"Ron Funches",
 venue:"Revolution Hall",startsAt:"2026-11-15T19:00:00-08:00",url:"https://www.etix.com/ticket/p/46185869/ron-funches-portland-revolution-hall",
 discovery:{sourceId:"revolution-hall"}};
const revLate={...revEarly,id:"revolution-late",title:"Ron Funches (Late Show)",
 startsAt:"2026-11-15T22:00:00-08:00",
 url:"https://www.etix.com/ticket/p/95442431/ron-funches-late-show-portland-revolution-hall"};
assert.equal(reconcile([revEarly],[{event:revLate}]).accepted.length,1,
 "Distinct original Etix event IDs and an explicitly late performance deserve review");
const sameTitleOtherTicket={...revLate,title:"Ron Funches"};
assert.equal(reconcile([revEarly],[{event:sameTitleOtherTicket}]).accepted.length,1,
 "Separately timed Etix show IDs at the same verified room are not silently removed as title duplicates");
const sameBatchSessions=reconcile([],[{event:revEarly},{event:sameTitleOtherTicket}]);
assert.equal(sameBatchSessions.accepted.length,2,
 "Independently ticketed same-headliner sessions from one discovery batch are not collapsed by title/date");
const sameTitleNear={...sameTitleOtherTicket,startsAt:"2026-11-15T19:30:00-08:00"};
const nearCollision=reconcile([revEarly],[{event:sameTitleNear}]);
assert.equal(nearCollision.skipped.length,0,"Different official show IDs are not silently skipped on matching titles");
assert.equal(nearCollision.held.length,1,"Near-time same-headliner shows still require manual comparison");
const wrongRoomTicket={...revLate,url:"https://www.etix.com/ticket/p/95442431/ron-funches-late-show-portland-show-bar-at-revolution-hall"};
assert.equal(reconcile([revEarly],[{event:wrongRoomTicket}]).held.length,1,
 "Distinct Show Bar tickets cannot be silently attributed to the main hall");
const holoceneEarly={...e,id:"holocene-early",title:"Shanghai Qiutian with Dabda",
  venue:"Holocene",startsAt:"2026-11-06T18:00:00-08:00",
  url:"https://www.holocene.org/event/shanghai-qiutian-with-dabda/holocene/portland/",
  discovery:{sourceId:"holocene"}};
const holoceneLate={...e,id:"holocene-late",title:"Emo Nite at Holocene",
  venue:"Holocene",startsAt:"2026-11-06T21:00:00-08:00",
  url:"https://www.holocene.org/events/2026-11-06-emo-nite-at-holocene",
  discovery:{sourceId:"holocene"}};
const separateHolocene=reconcile([holoceneEarly],[{event:holoceneLate}]);
assert.equal(separateHolocene.accepted.length,1,
  "Distinct official Holocene early/late bills must reach editorial review");
assert.equal(separateHolocene.held.length,0);
const alternateTitle={...holoceneLate,id:"holocene-alternate",title:"Shanghai Qiutian w Dabda"};
assert.equal(reconcile([holoceneEarly],[{event:alternateTitle}]).held.length,1,
  "A title variant of the same bill must not become a second show");
const overlappingTime={...holoceneLate,startsAt:"2026-11-06T19:00:00-08:00"};
assert.equal(reconcile([holoceneEarly],[{event:overlappingTime}]).held.length,1,
  "Nearby start times could mean doors vs showtime and must remain held");
const unsupportedUrl={...holoceneLate,url:"https://example.invalid/events/another-show"};
assert.equal(reconcile([holoceneEarly],[{event:unsupportedUrl}]).held.length,1,
  "Unverified event-specific domains cannot bypass the same-night hold");
const moved=reconcile([{...e,id:"existing",startsAt:"2026-11-03T20:00:00-08:00"}],[candidate]);
assert.equal(moved.held.length,1);
(async()=>{
 // End-to-end fixture uses an enabled priority venue, not the now-paused No Fun pilot.
 const twilightFixture={title:item.title,fullUrl:"https://www.twilightcafeandbar.com/event/987123/fixture-live-show",startDate:item.startDate};
 const result=await run({now,write:false,load:async src=>src.id==="twilight"?[twilightFixture]:[]});
 // A dated fixture may conflict with a previously approved venue bill; both outcomes are safe.
 assert.equal(result.accepted.length+result.held.length+result.skipped.length,1);
 console.log("PASS — source discovery parsing, primary URL policy, music holds, exact Pacific/DST, duplicate safety and review statuses");
})().catch(e=>{console.error(e);process.exitCode=1});
