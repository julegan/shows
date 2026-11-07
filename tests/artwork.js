"use strict";
const assert=require("node:assert/strict");
const {eventArtworkFromHtml,artworkCandidate,parseTwilightDetail}=require("../scripts/priority-importers");
const {originalUrl,pendingForArtwork,planLookups,addDays,titleMatches,summarize}=require("../scripts/backfill-artwork");
const source=require("../discovery/sources.json").sources.find(x=>x.id==="twilight");
const url="https://www.twilightcafeandbar.com/event/1234/sample-show";
assert.equal(artworkCandidate("javascript:alert(1)",url),null);
assert.equal(artworkCandidate("https://example.com/favicon.svg",url),null);
const schema='<script type="application/ld+json">'+JSON.stringify({"@type":"Event",name:"Sample",startDate:"2026-11-03T20:00:00-08:00",image:"https://www.twilightcafeandbar.com/media/sample-show-poster.jpg",location:{name:"Twilight Cafe and Bar"}})+'</script>';
const art=eventArtworkFromHtml(schema,url);
assert.equal(art.url,"https://www.twilightcafeandbar.com/media/sample-show-poster.jpg");
assert.equal(art.sourceUrl,url);
assert.equal(art.origin,"official-event-page");
assert.equal(parseTwilightDetail(schema,url,source).artwork.url,art.url);
assert.equal(eventArtworkFromHtml("<p>No event photo</p>",url),null);
const og='<meta property="og:image" content="https://www.startheaterportland.com/images/poster.webp">';
assert.equal(eventArtworkFromHtml(og,"https://www.startheaterportland.com/tm-event/one").url,"https://www.startheaterportland.com/images/poster.webp");

const same=(venue,uri)=>originalUrl({venue,url:uri})===uri;
assert(same("Dante's","https://www.danteslive.com/tm-event/blitzkid-modern-hel-tour-2026-with-guests/"));
assert(same("Hawthorne Theatre","https://hawthornetheatre.com/event/pain-of-truth/hawthorne-theatre/portland-oregon/"));
assert(same("Hawthorne Lounge","https://hawthornetheatre.com/event/christian-death/hawthorne-lounge/portland-oregon/"));
assert(same("Crystal Ballroom","https://www.mcmenamins.com/events/276827-everclear"));
assert(same("Twilight Cafe and Bar","https://twilightcafeandbar.com/event/466370/Houkago-Grind-Time-w-Kostnateni-Biology"));
assert(same("Star Theater","https://www.startheaterportland.com/tm-event/exhumed-with-jarhead-fertilizer-savage-master-molder/"));
assert(same("The Coffin Club","https://tickets.venuepilot.com/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb"));
assert(same("High Limit Room","https://aftontickets.com/event/buyticket/57jml3v89v"));
assert(same("Turn! Turn! Turn!","https://app.opendate.io/e/mania-mnemonic-pulse-andrew-black-dj-music-medieval-october-26-2026-755388"));
assert.equal(originalUrl({venue:"The Coffin Club",url:"https://tickets.venuepilot.com/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb?direct=true"}),"https://tickets.venuepilot.com/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb");
assert.equal(originalUrl({venue:"High Water Mark Lounge",url:"https://www.treetix.com/event?cal=highwatermark&id=204795"}),"https://www.treetix.com/event?cal=highwatermark&id=204795");
assert.equal(originalUrl({venue:"Black Water",url:"https://bar.blackwaterpdx.com/"}),null,"Venue home page is not event artwork evidence");
assert.equal(originalUrl({venue:"Roseland Theater",url:"https://roselandpdx.com/events/"}),null,"Venue-wide calendar is not event artwork evidence");
assert.equal(originalUrl({venue:"Hawthorne Theatre",url:"https://hawthornetheatre.com/event/example/hawthorne-lounge/portland-oregon/"}),null,"Wrong room");
assert.equal(originalUrl({venue:"No Fun",url:"https://www.danteslive.com/tm-event/blitzkid-modern-hel-tour-2026-with-guests/"}),null,"Wrong venue");
assert.equal(originalUrl({venue:"Dante's",url:"https://www.danteslive.com/tm-event/blitzkid/?token=secret"}),null,"Unapproved query");
const hawthornePage='<h1>PAIN OF TRUTH</h1><figure><img loading="lazy" alt="PAIN OF TRUTH" src="https://hawthornetheatre.com/wp-content/uploads/2026/08/pain-of-truth.jpeg"></figure>';
const eventUrl="https://hawthornetheatre.com/event/pain-of-truth/hawthorne-theatre/portland-oregon/";
assert(titleMatches(hawthornePage,{title:"Pain of Truth with Missing Link"}),"Independent event title confirmation");
assert(!titleMatches(hawthornePage,{title:"Metal Church with Livekill"}),"Wrong headliner must be rejected");
const photo=eventArtworkFromHtml(hawthornePage,eventUrl,"Pain of Truth");
assert.equal(photo.url,"https://hawthornetheatre.com/wp-content/uploads/2026/08/pain-of-truth.jpeg");
assert.equal(photo.origin,"official-event-page");
assert.equal(eventArtworkFromHtml(hawthornePage,eventUrl,"Metal Church"),null,"Do not use another event photo");

const fixtures=[
 {id:"no-fun",category:"Music",venue:"No Fun",url:"https://www.nofunportland.com/events/test-show",startsAt:"2026-11-07T20:00:00-08:00"},
 {id:"high-limit",category:"Music",venue:"High Limit Room",url:"https://aftontickets.com/event/buyticket/57jml3v89v",startsAt:"2026-11-07T20:00:00-08:00"},
 {id:"coffin",category:"Music",venue:"The Coffin Club",url:"https://tickets.venuepilot.com/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb",startsAt:"2026-11-07T20:00:00-08:00"},
 {id:"other",category:"Markets",venue:"No Fun",url:"https://www.nofunportland.com/events/market",startsAt:"2026-11-06T20:00:00-08:00"},
 {id:"past",category:"Music",venue:"No Fun",url:"https://www.nofunportland.com/events/early",startsAt:"2026-10-01T20:00:00-07:00"},
 {id:"art",category:"Music",venue:"No Fun",url:"https://www.nofunportland.com/events/illustrated",startsAt:"2026-11-07T20:00:00-08:00",artwork:{url:"https://www.nofunportland.com/poster.jpg"}},
 {id:"wrong-url",category:"Music",venue:"No Fun",url:"https://external.invalid/events/test",startsAt:"2026-11-07T20:00:00-08:00"}
];
const pending=pendingForArtwork(fixtures,{today:"2026-10-24"});
assert.deepEqual(pending.map(e=>e.id),["coffin","high-limit","no-fun"],"Music-only candidates, venue priority and no past events");
const stats=summarize(fixtures,"2026-10-24");
assert.equal(stats.music,5);
assert.equal(stats.withArt,1);
assert.equal(stats.missing,4);
assert.equal(stats.eligible,3);
assert.equal(stats.unsupported,1);

// Priority is the date someone needs the information, not a venue ranking.
assert.equal(addDays("2026-12-31",1),"2027-01-01");
assert.equal(addDays("2026-11-07",1),"2026-11-08");
assert.throws(()=>addDays("2026-02-30",1),/Invalid Pacific date/);
const highLimitTonight={
 id:"roman-candle-today",category:"Music",title:"Roman Candle + Postdrome + Asthelifeleavesyoureyes + XcaliberX",
 venue:"High Limit Room",url:"https://aftontickets.com/event/buyticket/57jml3v89v",
 startsAt:"2026-11-07T19:00:00-08:00",sourceCheckedAt:"2026-10-17"
};
const nextDayUnknown={
 id:"tomorrow-unknown",category:"Unclassified",title:"Type not yet confirmed",
 venue:"No Fun",url:"https://www.nofunportland.com/events/unknown",
 startsAt:"2026-11-08T19:00:00-08:00"
};
const illustratedTonight={
 id:"already-illustrated",category:"Music",title:"Flyer already present",
 venue:"No Fun",url:"https://www.nofunportland.com/events/with-flyer",
 startsAt:"2026-11-07T20:00:00-08:00",artwork:{url:"https://www.nofunportland.com/flyer.jpg"}
};
const laterPriorityRoom={
 id:"later-priority-venue",category:"Music",title:"Future event",
 venue:"The Coffin Club",url:"https://tickets.venuepilot.com/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb",
 startsAt:"2026-11-15T20:00:00-08:00"
};
const thisWeek={
 id:"this-week",category:"Music",title:"Next week",
 venue:"No Fun",url:"https://www.nofunportland.com/events/this-week",
 startsAt:"2026-11-10T20:00:00-08:00"
};
const oldEnded={
 id:"expired",category:"Music",title:"Already ended",
 venue:"No Fun",url:"https://www.nofunportland.com/events/past",
 startsAt:"2026-11-06T20:00:00-08:00"
};
const all=[laterPriorityRoom,nextDayUnknown,thisWeek,highLimitTonight,oldEnded,illustratedTonight];
const near=planLookups(all,{today:"2026-11-07",max:5,batch:57});
assert.equal(near.selected[0].id,highLimitTonight.id,"Tonight's High Limit Room show beats later preferred-venue shows");
assert.equal(near.selected[1].id,illustratedTonight.id,"Recheck an already-illustrated tonight event for original-source title/status");
assert.equal(near.selected[2].id,nextDayUnknown.id,"Unclassified tomorrow listings get the same source-verification priority");
assert(near.selected.some(x=>x.id==="this-week"),"Upcoming week follows near-term rechecks");
assert(near.selected.some(x=>x.id==="later-priority-venue"),"Longer-term art is still collected when capacity permits");
assert(!near.selected.some(x=>x.id==="expired"),"Past events never waste artwork lookups");
assert.equal(near.nearTermTotal.length,3);
assert.equal(near.urgent.length,3);
assert.equal(near.selected.length,5,"Out-of-range workflow run number must not yield an empty artwork batch");
const tiny=planLookups(all,{today:"2026-11-07",max:2,batch:57});
assert.deepEqual(tiny.selected.map(x=>x.id),["roman-candle-today","already-illustrated"],
 "A full near-term queue takes precedence over all older event searches");
assert.equal(tiny.nearTermOverflow,1,"Excess tomorrow sources are visible for follow-up");
assert(pendingForArtwork(all,{today:"2026-11-07"}).some(x=>x.id==="tomorrow-unknown"),
 "All near-term default-feed event categories receive art coverage");
assert(!pendingForArtwork(all,{today:"2026-11-07"}).some(x=>x.id==="already-illustrated"),
 "Already-illustrated event is source-rechecked, but not a new artwork candidate");
// A weekly rotating queue must not starve tomorrow's show even with a far
// larger future-venue inventory and an arbitrary GitHub run number.
const future=Array.from({length:25},(_,i)=>({
 ...thisWeek,id:"future-"+i,url:"https://www.nofunportland.com/events/future-"+i,
 startsAt:"2026-11-"+String(10+i%20).padStart(2,"0")+"T20:00:00-08:00"
}));
for(const batch of [0,1,17,57,1000]){
 const result=planLookups([highLimitTonight,...future],{today:"2026-11-07",max:5,batch});
 assert.equal(result.selected.length,5);
 assert.equal(result.selected[0].id,highLimitTonight.id);
}
console.log("PASS — today/tomorrow source rechecks precede future flyer collection and no run-number batch can be empty");

console.log("PASS — verified event photos, official venue match, missing-image coverage and review-only music priority");
