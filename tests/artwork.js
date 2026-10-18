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

const {originalUrl}=require("../scripts/backfill-artwork");
assert.equal(originalUrl({venue:"The Coffin Club",url:"https://tickets.venuepilot.com/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb?direct=true"}),"https://tickets.venuepilot.com/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb");
assert.equal(originalUrl({venue:"High Limit Room",url:"https://aftontickets.com/event/buyticket/57jml3v89v"}),"https://aftontickets.com/event/buyticket/57jml3v89v");
assert.equal(originalUrl({venue:"High Water Mark Lounge",url:"https://www.treetix.com/event?cal=highwatermark&id=204795"}),"https://www.treetix.com/event?cal=highwatermark&id=204795");
assert.equal(originalUrl({venue:"No Fun",url:"https://tickets.venuepilot.com/e/soft-vein-2026-11-07-the-coffin-portland-7e7bbb"}),null);
assert.equal(originalUrl({venue:"The Coffin Club",url:"https://tickets.venuepilot.com/e/unrelated-event-portland-7e7bbb"}),null);
assert.equal(originalUrl({venue:"High Limit Room",url:"https://aftontickets.com/event/buyticket/57jml3v89v?token=abc"}),null);

console.log("PASS — primary-event artwork extraction and safe URL limits");
