"use strict";
const assert=require("node:assert/strict");
const {safeDantesUrl,parseDantesLinks,parseDantesDetail}=require("../scripts/dantes-importer");
const src=require("../discovery/sources.json").sources.find(x=>x.id==="dantes");
assert(src);
const url="https://www.danteslive.com/tm-event/metal-church-armored-saint-with-livekill/";
assert.equal(safeDantesUrl(url,src),url);
assert.equal(safeDantesUrl("https://attacker.invalid/tm-event/fake/",src),null);
assert.equal(safeDantesUrl(url+"?utm_source=unsafe",src),null);
assert.equal(safeDantesUrl("https://www.danteslive.com/tm-venue/",src),null);
const listing='<a href="/tm-event/metal-church-armored-saint-with-livekill/">Metal Church</a><a href="'+url+'">Duplicate</a><a href="https://bad.invalid/tm-event/evil/">Bad</a>';
assert.deepEqual(parseDantesLinks(listing,src),[url]);
assert.throws(()=>parseDantesLinks("<p>Loading...</p>",src),/source layout needs review/);
const page='<html><head></head><body><h1>METAL CHURCH / ARMORED SAINT with Livekill</h1>'+
 '<div>Dante&#39;s , 350 West Burnside Street, Portland, 97209, OR, US</div>'+
 '<div>Fri November 13, 2026</div><span>Doors: 06:30 pm / Show: 07:30 pm PST</span></body></html>';
const e=parseDantesDetail(page,url,src);
assert.equal(e.title,"METAL CHURCH / ARMORED SAINT with Livekill");
assert.equal(e.venue,"Dante's");
assert.equal(e.startDate,"2026-11-14T03:30:00.000Z");
assert.equal(e.fullUrl,url);
assert.equal(e.artwork,undefined);
assert.match(parseDantesDetail(page.replace("Fri November 13, 2026","Fri November 13"),url,src).hold,/full year/);
assert.match(parseDantesDetail(page.replace("PST","PDT"),url,src).hold,/timezone contradicts/);
assert.match(parseDantesDetail(page.replace("Show: 07:30 pm","Show: 07:30"),url,src).hold,/show time/);
assert.match(parseDantesDetail(page.replace("METAL CHURCH / ARMORED SAINT with Livekill","MOVED TO ANOTHER VENUE"),url,src).hold,/canceled\/moved/);
assert.match(parseDantesDetail(page.replace("Dante&#39;s","Different Venue"),url,src).hold,/identify Dante/);
console.log("PASS — Dante's official primary event links, year and Pacific showtime safeguards, source verification and changes");
