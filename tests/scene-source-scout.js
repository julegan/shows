"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const scout=require("../scripts/scene-source-scout");
const seeds=require("../discovery/scene-scout-seeds.json");
const state=require("../discovery/scene-scout-leads.json");
assert.equal(seeds.schemaVersion,1);
assert.equal(state.schemaVersion,1);
assert(seeds.seeds.length>=7,"Independent market research must span multiple organizers and discovery surfaces");
assert(seeds.seeds.some(s=>s.kind==="original-vendor-directory"),"Artist/vendor cross-links reveal otherwise unknown organizers");
assert(seeds.seeds.some(s=>s.kind==="secondary-discovery"),"New unknown sources can emerge from independently curated indexes");
assert(seeds.seeds.some(s=>s.id==="nopo-creatives"),"Small local DIY maker organizers deserve coverage");
for(const id of ["music-the-1905","music-jack-london","music-goodfoot","music-alberta-street","music-alberta-rose","music-keys","music-the-thesis"])
 assert(seeds.seeds.some(s=>s.id===id),"Original music discovery seed: "+id);
assert(seeds.seeds.every(s=>s.url.startsWith("https://")&&s.url===scout.canon(s.url,s.url)),"Only explicitly canonical HTTPS seed pages");
assert.equal(scout.canon("javascript:alert(1)","https://example.com/"),null);
assert.equal(scout.canon("https://localhost/admin","https://example.com/"),null);
assert.equal(scout.canon("https://example.com/poster.png","https://example.com/"),null);
assert.equal(scout.canon("https://example.com/market/?utm_source=ig#photos","https://example.com/"),"https://example.com/market/");
assert.equal(scout.canon("https://example.com/?event_id=0123","https://example.com/"),"https://example.com/?event_id=0123",
  "Event identity query parameters must not be dropped");
const original={id:"tiny-diy",label:"Portland Tiny DIY Market",url:"https://tiny.example.org/event/2026/november",kind:"original-event",
 focus:"Independent queer DIY zine market",relevance:"high"};
let results=scout.inspect(original,"<html><body>"+"x".repeat(400)+"</body></html>");
assert.equal(results.length,1,"Original event page is a review lead even when no outbound event links exist");
assert.equal(results[0].type,"original-event-page");
const secondary={id:"secondary",label:"Secondary listings",url:"https://guides.example.org/markets",kind:"secondary-discovery"};
const html='<a href="https://events.example.org/generic-holiday-market">Generic Holiday Market</a>'+
 '<a href="https://events.example.org/goth-oddities-market">Goth Oddities Market</a>'+
 '<a href="https://events.example.org/punk-record-fair">Punk Record Fair</a>'+
 '<a href="https://events.example.org/2025-school-craft-bazaar">School Craft Bazaar</a>';
results=scout.inspect(secondary,html);
assert.equal(results.length,2,"A secondary index must not elevate every routine holiday market");
assert(results.some(x=>x.url.endsWith("/goth-oddities-market")));
assert(results.some(x=>x.url.endsWith("/punk-record-fair")));
const primary={id:"venue",label:"Original indie market",url:"https://makers.example.org/",kind:"original-organizer",
 focus:"Queer DIY makers"};
results=scout.inspect(primary,'<a href="/events/goth-record-market">Goth Record Market</a>'+
 '<a href="/contact">Contact</a>'+
 '<a href="https://instagram.com/dotspdx/">Instagram</a>'+
 '<a href="/events/goth-record-market?utm_campaign=test">duplicate</a>');
assert(results.some(x=>x.url==="https://makers.example.org/events/goth-record-market"));
assert(!results.some(x=>x.url.includes("/contact")),"Do not treat informational navigation as event discovery");
const musicVenue={id:"jazz-original",label:"Jazz original tickets",url:"https://jazz.example.org/calendar/",
 kind:"original-venue",focus:"Jazz and improvised music"};
results=scout.inspect(musicVenue,'<a href="/events/2026-11-15-jazz-trio">Original Jazz Trio Tickets</a>'+
 '<a href="/contact">Contact</a><a href="/events/2026-11-16-blues-quintet">Live Blues Quintet</a>');
assert(results.some(x=>x.url==="https://jazz.example.org/events/2026-11-15-jazz-trio"),
 "Original music venue event-specific links are now scouted without requiring punk or market language");
assert(!results.some(x=>x.url==="https://jazz.example.org/contact"),"Routine venue navigation is not a show lead");
assert(results.some(x=>x.type==="original-venue-calendar"),"Original music calendar itself is retained for review");
const vendor={id:"vendor",label:"Oddities vendor",url:"https://vendor.example.org/2026-tour",
 kind:"original-vendor",focus:"Oddities and zine events"};
results=scout.inspect(vendor,"<p>Independent zine press and oddities market organizers</p>"+
 '<a href="https://unknownpublisher.example.org/">Website</a>');
assert(results.some(x=>x.url==="https://unknownpublisher.example.org/"),
  "Artist/vendor outbound sources become research leads, not published events");
const known=new Set(["https://events.example.org/goth-oddities-market"]);
assert(!scout.inspect(secondary,html,known).some(x=>known.has(x.url)),"Previously approved events/sources are excluded");
const report=scout.render({checked:[{label:"Dot's Cafe",error:"HTTP 403",count:0}],
 failures:[{error:"HTTP 403"}],newLeads:results,allLeads:results,day:"2026-11-03"});
assert.match(report,/Research leads only/);
assert.match(report,/inaccessible\/changed/);
assert.match(report,/NOT approved SHOWS events/);
assert.match(report,/don't|Don.t automatically|Don't scrape/i);
const workflow=fs.readFileSync(path.join(__dirname,"../.github/workflows/scout-scene-sources.yml"),"utf8");
assert(workflow.includes("automation/source-scout-"),"Separate review queue for new sources rather than overwriting events.js");
assert(workflow.includes("gh pr create"),"New source discoveries prepare an editorial PR");
assert(workflow.includes("gh pr edit"),"One rolling review is maintained");
assert(workflow.includes("--force-with-lease"),"Bot only updates the current branch with a lease");
assert(!workflow.includes("gh pr merge")&&!workflow.includes("git push origin main"),"Source research cannot publish directly");
assert(workflow.includes("SCOUT_PENDING_FILE"),"Keep unmerged new leads when the next scout runs");
assert(workflow.includes("actions/upload-artifact@"),"Retain a source-health report even when there are no new leads");
console.log("PASS — seeded source scouting, niche filtering, vendor graph discovery, HTTPS safety, no event publication");
