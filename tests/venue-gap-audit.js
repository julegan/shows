"use strict";
const assert=require("node:assert/strict");
const {addDays,analyze,report}=require("../scripts/report-venue-gap");
assert.equal(addDays("2026-11-03",29),"2026-12-02");
assert.equal(addDays("2026-11-03",55),"2026-12-28");
assert.equal(addDays("2026-11-03",89),"2027-01-31");
const venueRegistry={
 editorialPreferenceGroups:{preferred:["black-water","coffin"],scene:["azoth"]},
 venues:[
  {id:"black-water",name:"Black Water",aliases:["Black Water Bar"]},
  {id:"coffin",name:"The Coffin Club",aliases:["The Coffin"]},
  {id:"azoth",name:"AZØTH",aliases:[]}
 ]
};
const sourceRegistry={
 sources:[
  {id:"black-water",venueRegistryId:"black-water",status:"pilot-enabled"},
  {id:"coffin",venueRegistryId:"coffin",status:"adapter-needed"},
  {id:"azoth",venueRegistryId:"azoth",status:"pilot-enabled"}
 ],sharedSourceCoverage:{}
};
const make=(id,venue,day,title,url,category="Music",musicStyles=[])=>({
 id,venue,startsAt:day+"T20:00:00-08:00",title,url,category,musicStyles,
 discovery:{sourceId:"black-water"}
});
const official="https://venue.example/events/one";
const represented=make("approved","Black Water Bar","2026-11-05","Live bill one",official,"Music",["Punk"]);
const unclassified=make("u","Black Water","2026-11-07","Untyped official bill","https://venue.example/events/u","Unclassified");
const another=make("else","AZØTH","2026-12-20","Experimental show","https://venue.example/events/azoth","Music");
const late=make("later","AZØTH","2027-04-01","Later date","https://venue.example/events/later","Music");
const proposed=make("new","Black Water","2026-11-10","New original show","https://venue.example/events/new");
const conflict=make("conflict","Black Water","2026-11-15","Same-day unresolved","https://venue.example/events/conflict");
const outside=make("outside","Black Water","2027-03-02","Outside horizon","https://venue.example/events/outside");
const found=[
 {event:{...represented,venue:"Black Water"}},
 {event:proposed},
 {event:conflict},
 {event:outside},
 {sourceId:"black-water",hold:"Time unspecified",title:"Future hold",date:"2026-11-15"},
 {sourceId:"black-water",hold:"Date missing",title:"Untimed hold"},
 {sourceId:"black-water",skip:"Historical event outside review period",title:"Past listing"},
];
const analysis=analyze({events:[represented,unclassified,another,late],
 sourceRegistry,venueRegistry,found,
 reconciled:{accepted:[proposed],held:[{sourceId:"black-water",title:conflict.title,url:conflict.url,hold:"Same venue/date"}]},
 sourceRuns:[{id:"black-water",status:"checked",examined:8},{id:"azoth",status:"failed",examined:0}],
 today:"2026-11-03"});
assert.equal(analysis.periods[1].end,"2026-12-28");
assert.deepEqual(analysis.periods.map(x=>x.total),[2,3,3]);
assert.deepEqual(analysis.periods.map(x=>x.unclassified),[1,1,1]);
const black=analysis.rows.find(r=>r.venueId==="black-water");
assert.equal(black.source,"checked");
assert.equal(black.approved,2);
assert.equal(black.music,1);
assert.equal(black.unclassified,1);
assert.equal(black.parsedOfficial,3);
assert.equal(black.represented,1,"An exact original URL and venue alias represent the approved show");
assert.equal(black.proposed,1);
assert.equal(black.unresolved,1,"Same-day conflict requires review, not automatic missing-event status");
assert.equal(black.datedHolds,1);
assert.equal(black.undatedHolds,1);
const coffin=analysis.rows.find(r=>r.venueId==="coffin");
assert.equal(coffin.source,"adapter-needed");
assert.equal(coffin.parsedOfficial,0);
assert.equal(coffin.sourceItemsChecked,null);
const azoth=analysis.rows.find(r=>r.venueId==="azoth");
assert.equal(azoth.source,"failed");
assert.equal(azoth.approved,1);
assert.equal(azoth.musicWithoutStyles,1);
const output=report(analysis);
assert.match(output,/The Coffin Club\s+\| adapter-needed/);
assert.match(output,/unknown \|/);
assert.match(output,/2026-11-15/);
assert.match(output,/Same-day unresolved/);
assert(!output.includes("2027-03-02"),"Do not report distant events as 56-day gaps");
assert.match(output,/not confirmed missing shows/i);
console.log("PASS — 30/56/90-day priority venue audit, official-source match, proposed/held separation, and unknown connectors");
