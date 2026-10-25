"use strict";
const assert=require("node:assert/strict");
const {eventArtworkFromHtml,artworkCandidate,parseTwilightDetail}=require("../scripts/priority-importers");
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


const {originalUrl,pendingForArtwork,titleMatches,summarize}=require("../scripts/backfill-artwork");
assert.equal(originalUrl({venue:"The Coffin Club",url:"https://tickets.venuepilot.com/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb?direct=true"}),"https://tickets.venuepilot.com/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb");
assert.equal(originalUrl({venue:"High Limit Room",url:"https://aftontickets.com/event/buyticket/57jml3v89v"}),"https://aftontickets.com/event/buyticket/57jml3v89v");
assert.equal(originalUrl({venue:"High Water Mark Lounge",url:"https://www.treetix.com/event?cal=highwatermark&id=204795"}),"https://www.treetix.com/event?cal=highwatermark&id=204795");
assert.equal(originalUrl({venue:"No Fun",url:"https://tickets.venuepilot.com/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb"}),null);
assert.equal(originalUrl({venue:"The Coffin Club",url:"https://tickets.venuepilot.com/e/unrelated-event-portland-7e7bbb"}),null);
assert.equal(originalUrl({venue:"High Limit Room",url:"https://aftontickets.com/event/buyticket/57jml3v89v?token=abc"}),null);
assert.equal(originalUrl({venue:"Twilight Cafe and Bar",url:"https://twilightcafeandbar.com/event/466370/Houkago-Grind-Time-w-Kostnateni-Biology"}),"https://twilightcafeandbar.com/event/466370/Houkago-Grind-Time-w-Kostnateni-Biology");
assert.equal(originalUrl({venue:"Hawthorne Theatre",url:"https://hawthornetheatre.com/event/pain-of-truth/hawthorne-theatre/portland-oregon/"}),"https://hawthornetheatre.com/event/pain-of-truth/hawthorne-theatre/portland-oregon/");
assert.equal(originalUrl({venue:"Dante's",url:"https://www.danteslive.com/tm-event/blitzkid-modern-hel-tour-2026-with-guests/"}),"https://www.danteslive.com/tm-event/blitzkid-modern-hel-tour-2026-with-guests/");
assert.equal(originalUrl({venue:"Crystal Ballroom",url:"https://www.mcmenamins.com/events/276827-everclear"}),"https://www.mcmenamins.com/events/276827-everclear");
assert.equal(originalUrl({venue:"Black Water",url:"https://bar.blackwaterpdx.com/"}),null,"Venue home page cannot identify one event poster");
assert.equal(originalUrl({venue:"Roseland Theater",url:"https://roselandpdx.com/events/"}),null,"Venue-wide calendar must not be treated as single event media");
assert.equal(originalUrl({venue:"No Fun",url:"https://www.danteslive.com/tm-event/blitzkid-modern-hel-tour-2026-with-guests/"}),null,"Venue ownership matters");
assert.equal(originalUrl({venue:"Dante's",url:"https://www.danteslive.com/tm-event/blitzkid/?token=secret"}),null);
assert(titleMatches('<title>Pain of Truth at Hawthorne Theatre</title>',{title:"Pain of Truth"}));
assert(!titleMatches('<title>Completely different show</title>',{title:"Pain of Truth"}));
const page='<title>Pain of Truth</title><img alt="Pain of Truth" src="https://hawthornetheatre.com/wp-content/uploads/2026/08/pain-of-truth.jpeg">';
assert.equal(eventArtworkFromHtml(page,"https://hawthornetheatre.com/event/pain-of-truth/hawthorne-theatre/portland-oregon/","Pain of Truth").url,
 "https://hawthornetheatre.com/wp-content/uploads/2026/08/pain-of-truth.jpeg");
assert.equal(eventArtworkFromHtml(page,"https://hawthornetheatre.com/event/pain-of-truth/hawthorne-theatre/portland-oregon/","An unrelated show"),null);
const rows=[
 {id:"market",venue:"No Fun",category:"Markets",url:"https://www.nofunportland.com/events/market-one",startsAt:"2026-11-08T20:00:00-08:00"},
 {id:"music",venue:"Dante's",category:"Music",url:"https://www.danteslive.com/tm-event/sample-show/",startsAt:"2026-11-08T20:00:00-08:00"},
 {id:"coffin",venue:"The Coffin Club",category:"Music",url:"https://tickets.venuepilot.com/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb",startsAt:"2026-11-07T20:00:00-08:00"},
 {id:"illustrated",venue:"No Fun",category:"Music",url:"https://www.nofunportland.com/events/illustrated",startsAt:"2026-11-07T20:00:00-08:00",artwork:{url:"https://www.nofunportland.com/poster.jpg"}}
];
assert.deepEqual(pendingForArtwork(rows,{today:"2026-11-01"}).map(e=>e.id),["coffin","music"],"Only missing music artwork from supported individual pages");
const stats=summarize(rows,"2026-11-01");
assert.equal(stats.music,3);
assert.equal(stats.missing,2);
assert.equal(stats.eligible,2);
console.log("PASS — artwork candidate extraction, source URL safety, event title verification, music-first priority and reporting");
