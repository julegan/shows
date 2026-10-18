"use strict";
const assert=require("node:assert/strict");
const {parseBlackWaterIcs}=require("../scripts/priority-importers");
const {extract,urlOf,reconcile}=require("../scripts/discover-events");
const source=require("../discovery/sources.json").sources.find(s=>s.id==="black-water");
const text=[
 "BEGIN:VCALENDAR","VERSION:2.0",
 "BEGIN:VEVENT","UID:event-1@calendar.google.com","SUMMARY:IRON LUNG / SOLITARY RUIN / DEFIANT BODY",
 "DTSTART;VALUE=DATE:20261022","DTEND;VALUE=DATE:20261023",
 "DESCRIPTION:Original venue calendar with no published time",
 "STATUS:CONFIRMED","END:VEVENT",
 "BEGIN:VEVENT","UID:event-2@calendar.google.com",
 "SUMMARY:HABAK / MALAKILI / VERDANT FORCE / LAUGHTER",
 "DTSTART;VALUE=DATE:20261107","DTEND;VALUE=DATE:20261108",
 "DESCRIPTION:All ages\\n$15",
 "END:VEVENT",
 "BEGIN:VEVENT","UID:repeat@calendar.google.com","SUMMARY:Every Thursday",
 "DTSTART;VALUE=DATE:20261029","RRULE:FREQ=WEEKLY;COUNT=20","END:VEVENT",
 "BEGIN:VEVENT","UID:cancelled@calendar.google.com","SUMMARY:Cancelled Show",
 "DTSTART;VALUE=DATE:20261110","STATUS:CANCELLED","END:VEVENT",
 "END:VCALENDAR"
].join("\r\n")+"\r\n";
const list=parseBlackWaterIcs(text,source);
assert.equal(list.length,3);
assert.equal(list.filter(x=>x.hold).length,1);
const usable=list.filter(x=>!x.hold);
assert.deepEqual(usable.map(x=>x.dateOnly),["2026-10-22","2026-11-07"]);
const proposed=usable.map(x=>extract(x,source,new Date("2026-10-18T10:00:00-07:00")));
assert(proposed.every(x=>x.event));
assert(proposed.every(x=>x.event.startTimeKind==="date-only"));
assert(proposed.every(x=>x.event.startsAt.endsWith("-07:00")||x.event.startsAt.endsWith("-08:00")));
assert.equal(proposed[0].event.startsAt,"2026-10-22T00:00:00-07:00");
assert.equal(proposed[1].event.startsAt,"2026-11-07T00:00:00-08:00");
assert.equal(proposed[0].event.url,"https://bar.blackwaterpdx.com/");
assert.notEqual(proposed[0].event.id,proposed[1].event.id);
assert.equal(reconcile([],proposed).accepted.length,2);
assert.equal(reconcile([proposed[0].event],proposed).accepted.length,1);
assert.equal(urlOf(usable[0],source),"https://bar.blackwaterpdx.com/");
assert.throws(()=>parseBlackWaterIcs("<h1>Not a feed</h1>",source));
console.log("PASS — Black Water public iCal: date-only, timezone change, cancellation, recurrence holds, stable IDs, and no invented time");
