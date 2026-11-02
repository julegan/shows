#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const {ENDPOINT,eventCalendar,artworkEvidence,parse,fetchSnapshot,fetchEvents}=require("../scripts/treetix-importer");
const {extract,reconcile}=require("../scripts/discover-events");
const sources=require("../discovery/sources.json").sources;
const water=sources.find(s=>s.id==="high-water"),sound=sources.find(s=>s.id==="soundcontrol-pdx");
assert.equal(ENDPOINT,"https://api.treetix.com/events.json");
assert.equal(water.adapter,"treetix-public-json");
assert.equal(sound.adapter,"treetix-public-json");
assert.deepEqual(eventCalendar("https://www.treetix.com/event/204946/highwatermark").id,204946);
for(const url of [
  "http://www.treetix.com/event/204946/highwatermark",
  "https://attacker.invalid/event/204946/highwatermark",
  "https://www.treetix.com/event/204946/peacock",
  "https://www.treetix.com/event?cal=soundcontrol&id=204946",
  "https://www.treetix.com/event/204946/soundcontrol?preview=1"
])assert.equal(eventCalendar(url),null,"Reject unauthorized or ambiguous event link: "+url);
assert.equal(artworkEvidence("https://www.treetix.com/templates/soundcontrol/images/events/2027-01-15-204952-test.jpg","soundcontrol")!==null,true);
assert.equal(artworkEvidence("https://other.example/test.jpg","soundcontrol"),null);
const event=(id,calendar,venue,other={})=>({
 event_id:id,start_date:"2026-11-06",start_time:"08:30 PM",tz:"US/Pacific",
 event_title:null,talent:"Underground Metal, DIY Punk",
 venue_name:venue,city:"Portland",state_abbr:"OR",
 event_url:"https://www.treetix.com/event/"+id+"/"+calendar,
 image_url:"https://www.treetix.com/templates/"+calendar+"/images/events/2026-11-06-"+id+"-flyer.jpg",
 ...other
});
const fixture={updated:"2026-11-02T20:00:00Z",events:[
 event(204941,"highwatermark","High Water Mark Lounge"),
 event(204929,"soundcontrol","High Water Mark Lounge",{start_date:"2026-12-20",talent:"Early Moods, H.O.G., Stainless"}),
 event(204952,"soundcontrol","Dante's",{start_date:"2027-01-15",talent:"Mustard Plug, The Planet Smashers, The Venomous Pinks"}),
 event(204942,"soundcontrol","Wonder Ballroom",{start_date:"2027-02-09",talent:"Wolves in the Throne Room, Stygian Bough, Spirit Possession"}),
 event(300000,"peacock","Peacock Lounge"),
 event(400001,"highwatermark","Peacock Lounge"),
 event(400002,"highwatermark","High Water Mark Lounge",{start_time:"8:30"}),
 event(400003,"highwatermark","High Water Mark Lounge",{tz:"UTC"}),
 event(400004,"highwatermark","High Water Mark Lounge",{event_id:5})
]};
const h=parse(fixture,water),s=parse(fixture,sound);
assert.equal(h.filter(x=>x.startDate).length,1);
assert.equal(h.filter(x=>x.hold).length,4);
assert.equal(s.filter(x=>x.startDate).length,3);
assert.equal(h[0].fullUrl,"https://www.treetix.com/event/204941/highwatermark");
assert.equal(h[0].sourceArtworkUrl,"https://www.treetix.com/templates/highwatermark/images/events/2026-11-06-204941-flyer.jpg");
assert.equal(s.find(x=>x.venue==="Dante's").startDate,"2027-01-16T05:00:00.000Z");
const now=new Date("2026-11-02T20:00:00Z");
const proposal=extract(h[0],water,now);
assert(proposal.event,"High Water Mark source record converts to candidate");
assert.equal(proposal.event.startsAt,"2026-11-06T20:30:00-08:00");
assert.equal(proposal.event.startTimeKind,"listed");
assert.equal(proposal.event.artwork,undefined,"No unauthorized poster hotlinks");
assert.equal(proposal.event.sourceArtworkUrl,h[0].sourceArtworkUrl);
const promoter=extract(s.find(x=>x.venue==="Wonder Ballroom"),sound,now);
assert(promoter.event,"Soundcontrol original Wonder bill gets its actual venue");
assert.equal(promoter.event.venue,"Wonder Ballroom");
assert.equal(promoter.event.address,"128 NE Russell St, Portland, OR 97212");
assert.equal(reconcile([proposal.event],[proposal]).skipped.length,1,"Existing identical bill not duplicated");
assert.throws(()=>parse({events:{}},water),/events array/);
assert.throws(()=>parse({events:[]},water),/No target/);
const mockFetch=async (url,options)=>{assert.equal(url,ENDPOINT);assert.equal(options.redirect,"error");return new Response(JSON.stringify(fixture),{status:200,headers:{"Content-Type":"application/json"}})};
(async()=>{
 const body=await fetchSnapshot(mockFetch);
 assert.equal(body.events.length,fixture.events.length);
 assert.equal((await fetchEvents(sound,{request:mockFetch})).filter(x=>x.startDate).length,3);
 await assert.rejects(fetchSnapshot(async()=>new Response("denied",{status:403})),/HTTP 403/);
 console.log("PASS — TreeTix calendar scoping, IDs, venue mapping, DST, source holds, original art evidence, and read-only fetch");
})().catch(e=>{console.error(e);process.exitCode=1});
