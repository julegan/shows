"use strict";
const assert=require("node:assert/strict");
const {monthlyCoverage,report}=require("../scripts/report-calendar-horizon");
const samples=[
 {startsAt:"2026-12-31T20:00:00-08:00",category:"Music",artwork:{url:"https://example.org/flyer.jpg"}},
 {startsAt:"2027-04-15T20:00:00-07:00",category:"Music"},
 {startsAt:"2027-05-01T19:00:00-07:00",category:"Markets"},
 {startsAt:"2028-01-01T19:00:00-08:00",category:"Music"}
];
const result=monthlyCoverage(samples,"2026-10-17");
assert.equal(result.end,"2027-11-21");
assert.equal(result.months.get("2026-12").artwork,1);
assert.equal(result.months.get("2027-04").music,1);
assert.equal(result.months.get("2027-05").total,1);
assert(!result.months.has("2028-01"));
assert.match(report(result),/not.*complete venue schedules/i);
console.log("PASS — 400-day monthly event, music and artwork reporting spans 2027 without invented dates");
