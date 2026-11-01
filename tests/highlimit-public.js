#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const {safeLink,summarize,URL}=require("../scripts/probe-highlimit-public");
assert.equal(URL,"https://highlimitroompdx.com/shows/");
assert.equal(safeLink("https://tickets.example/path?token=dont-include"),"https://tickets.example/path");
assert.equal(safeLink("http://unsafe.example/path"),null);
assert.equal(safeLink("https://user:password@unsafe.example/path"),null);
assert.equal(safeLink("//other.example/embed"),null);
const html=String.raw`<!doctype html><html><head>
<script src="https://static.aftontickets.com/js/embed.js?widget=public-and-ignored"></script>
<script type="application/ld+json">{"@type":"MusicEvent","name":"Example","startDate":"2026-11-05T20:00:00-08:00"}</script>
</head><body><iframe src="https://tickets.afton.example/calendar/highlimit?apikey=not-for-logs"></iframe>
<a href="https://aftontickets.com/event/123?x=excluded">Tickets</a>
<time datetime="2026-11-05T20:00:00-08:00">Nov 5</time></body></html>`;
const result=summarize(html);
assert.equal(result.frameSources[0],"https://tickets.afton.example/calendar/highlimit");
assert.equal(result.externalScripts[0],"https://static.aftontickets.com/js/embed.js");
assert.equal(result.ticketProviderLinks[0],"https://aftontickets.com/event/123");
assert.equal(result.eventSchemaBlocks,1);
assert.equal(result.datedTimeMarkers,1);
assert.equal(result.aftonMentioned,true);
assert.equal(result.rawEventCountTrusted,false);
assert(!JSON.stringify(result).includes("apikey"));
assert(!JSON.stringify(result).includes("not-for-logs"));
assert.throws(()=>summarize("x".repeat(1_800_001)),/page size/);
console.log("PASS — first-party High Limit HTML diagnostic respects URL safety, redaction and non-publication");
