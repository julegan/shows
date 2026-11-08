#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const {providerIdentity,dayValid,analyze,report,errorReport,pacificToday}=require("../scripts/treetix-coverage");
const item=(id,calendar,venue,extra={})=>({
 event_id:id,event_url:"https://www.treetix.com/event/"+id+"/"+calendar,
 venue_name:venue,city:"Portland",state_abbr:"OR",start_date:"2026-11-14",
 start_time:"08:00 PM",tz:"US/Pacific",event_title:"Open Mic, Karaoke & Drag",
 ...extra
});
const listed=(id,url,date,title,venue,extra={})=>({
 id,url,venue,title,startsAt:date+"T20:00:00-08:00",category:"Other",
 ...extra
});
assert.deepEqual(providerIdentity("https://www.treetix.com/event/204946/highwatermark"),{
 id:204946,calendar:"highwatermark",url:"https://www.treetix.com/event/204946/highwatermark"
});
for(const url of [
 "http://www.treetix.com/event/123/highwatermark",
 "https://attacker.invalid/event/123/highwatermark",
 "https://www.treetix.com/event/123/highwatermark?preview=true",
 "https://www.treetix.com/event/123/highwatermark#note",
 "https://www.treetix.com/event?cal=highwatermark&id=123",
 "https://www.treetix.com/event/0/soundcontrol"
])assert.equal(providerIdentity(url),null,"Reject unverified original event link "+url);
assert(dayValid("2026-11-14"));
assert(!dayValid("2026-11-31"));
assert.equal(pacificToday(new Date("2026-11-08T23:00:00Z")),"2026-11-08");
const venueRegistry={venues:[
 {name:"High Water Mark Lounge",aliases:["High Water Mark"]},
 {name:"Dante's",aliases:[]},
 {name:"Wonder Ballroom",aliases:[]}
]};
const approved=[
 listed("approved", "https://www.treetix.com/event/100101/highwatermark","2026-11-14","Open Mic, Karaoke & Drag","High Water Mark Lounge"),
 listed("other-venue","https://official-venue.example/events/old","2026-11-14","Open Mic, Karaoke & Drag","Dante's"),
 listed("another","https://different.example/id/5","2026-11-14","Night Music","Wonder Ballroom",
  {sourceEventId:100106,sourceCalendar:"soundcontrol"}),
 listed("rescheduled","https://www.treetix.com/event/100110/soundcontrol","2026-11-21","Night Music","Dante's")
];
const proposed=[
 ...approved,
 listed("proposed","https://www.treetix.com/event/100102/soundcontrol","2026-11-14","Experimental workshop","Dante's")
];
const feed={events:[
 item(100101,"highwatermark","High Water Mark Lounge"),
 item(100102,"soundcontrol","Dante's",{event_title:"Experimental workshop"}),
 item(100103,"highwatermark","High Water Mark Lounge",{event_title:"Synth Yoga"}),
 item(100104,"whatssofunny","Portland Stage",{event_title:"Comedy night"}),
 item(100105,"soundcontrol","Hallowed Halls",{event_title:"DIY Benefit"}),
 item(100106,"soundcontrol","Wonder Ballroom",{event_title:"Night Music"}),
 item(100107,"highwatermark","Dante's",{event_title:"Open Mic, Karaoke & Drag"}),
 item(100108,"soundcontrol","Dante's",{event_title:"Unknown clock",start_time:null}),
 item(100109,"highwatermark","Dante's",{event_title:"Out of town",city:"Vancouver",state_abbr:"WA"}),
 item(100110,"soundcontrol","Dante's",{event_title:"Night Music"}),
 item(100111,"highwatermark","High Water Mark Lounge",{event_title:"Beyond horizon",start_date:"2028-12-01"}),
 item(100112,"highwatermark","Dante's",{event_title:"Invalid date",start_date:"2026-11-31"}),
 item(100113,"highwatermark","Dante's",{event_title:"Malformed ID",event_id:123}),
 item(100103,"highwatermark","High Water Mark Lounge",{event_title:"Duplicated source row"}),
 item(100114,"peacock","Unverified Venue",{event_title:"Outside",city:"Seattle",state_abbr:"WA"})
]};
const a=analyze({feed,approved,proposed,venueRegistry,today:"2026-11-08"});
const status=id=>a.rows.find(x=>x.eventId===id).disposition;
assert.equal(status(100101),"approved");
assert.equal(status(100102),"proposed");
assert.equal(status(100103),"unaccounted-connected","Music/genre is not required for a prioritized venue event");
assert.equal(status(100104),"unconnected-producer","Different Portland producer remains visible for source research");
assert.equal(status(100105),"venue-needs-verification");
assert.equal(status(100106),"approved","Original sourceCalendar/sourceEventId are sufficient when URL is a venue permalink");
assert.equal(status(100107),"possible-cross-source-match","Matching title/date/venue alone is not confirmed coverage");
assert.equal(status(100108),"time-needs-verification");
assert.equal(status(100109),"outside-geography");
assert.equal(status(100110),"date-conflict","A rescheduled original event is not silently accepted");
assert.equal(status(100111),"outside-horizon");
assert.equal(status(100112),"invalid-date");
assert.equal(a.rows.find(x=>x.title==="Malformed ID").disposition,"invalid-identity");
assert.equal(a.rows.filter(x=>x.disposition==="duplicate-provider-id").length,1);
assert.equal(a.sourceRecords,15);
assert.equal(a.counts["unconnected-producer"],1);
const summary=report(a);
assert.match(summary,/provider-wide/i);
assert.match(summary,/unconnected-producer/);
assert.match(summary,/whatssofunny/);
assert.match(summary,/Synth Yoga/);
assert.match(summary,/Comedy night/);
assert.match(summary,/No source-specific exceptions|Event-by-event exceptions/);
assert(!summary.includes("Out of town"),"Do not present out-of-geography records as pending Portland shows");
assert(!summary.includes("Beyond horizon"),"Distant events are counted but not part of current exception worklist");
// Actual November 8, 2026 live audit: Soundcontrol originals were already
// represented under separate original venue URLs with title variations.
// This is a possible cross-source match, NOT a verified provider-ID match.
const separateSources=[
 listed("dantes-bill","https://www.danteslive.com/tm-event/mustard-plug-with-the-planet-smashers-the-venomous-pinks/",
  "2027-01-15","MUSTARD PLUG with The Planet Smashers & The Venomous Pinks","Dante's"),
 listed("wonder-bill","https://wonderballroom.com/event/wolves-in-the-throne-room/wonder-ballroom/portland-oregon/",
  "2027-02-09","Wolves In The Throne Room","Wonder Ballroom")
];
const alternate=analyze({feed:{events:[
 item(204952,"soundcontrol","Dante's",{start_date:"2027-01-15",event_title:"Mustard Plug, The Planet Smashers, The Venomous Pinks"}),
 item(204942,"soundcontrol","Wonder Ballroom",{start_date:"2027-02-09",event_title:"Wolves in the Throne Room, Stygian Bough, Spirit Possession"}),
 item(204999,"soundcontrol","Dante's",{start_date:"2027-01-15",event_title:"Completely Different Show"}),
 item(205000,"soundcontrol","Wonder Ballroom",{start_date:"2027-02-09",event_title:"Wolves at the Ballroom"})
]},approved:separateSources,venueRegistry,today:"2026-11-08"});
assert.equal(alternate.rows[0].disposition,"possible-cross-source-match");
assert.equal(alternate.rows[1].disposition,"possible-cross-source-match");
assert.equal(alternate.rows[2].disposition,"unaccounted-connected",
 "Completely unrelated same-night bills are not matched just because of venue/date");
assert.equal(alternate.rows[3].disposition,"unaccounted-connected",
 "A single common artist-like token alone cannot infer the same bill");
assert.equal(alternate.counts.approved||0,0,
 "Cross-source fuzzy matches must NOT be labeled verified provider-ID matches");
assert.match(report(alternate),/Likely same bill at the same venue/);
assert.match(errorReport("2026-11-08",Error("HTTP 503")),/unavailable\\/unknown/);
assert.throws(()=>analyze({feed:{events:null},today:"2026-11-08"}),/inventory is unknown/);
assert.throws(()=>analyze({feed,approved,proposed,venueRegistry,today:"2026-11-32"}),/Reporting date/);
console.log("PASS — TreeTix full-provider event-by-ID reconciliation, scope, unconnected producers, all event types, uncertain matches, and source failures");
