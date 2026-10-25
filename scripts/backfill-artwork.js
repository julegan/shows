#!/usr/bin/env node
"use strict";
// Review-only artwork collection. Only fetch known public, event-specific source pages.
const fs = require("node:fs");
const path = require("node:path");
const {eventArtworkFromHtml} = require("./priority-importers");
const root = path.resolve(__dirname,"..");
const eventsFile = path.join(root,"events.js");
const reportFile = path.join(root,"discovery/artwork-backfill-review.md");

// Explicit source/venue pairing prevents a listing for another room or venue
// from silently becoming evidence for a SHOWS event.
const permitted = [
 {host:"www.twilightcafeandbar.com",route:/^\/event\/\d+\/[^/]+\/?$/i,venues:["Twilight Cafe and Bar"]},
 {host:"twilightcafeandbar.com",route:/^\/event\/\d+\/[^/]+\/?$/i,venues:["Twilight Cafe and Bar"]},
 {host:"www.startheaterportland.com",route:/^\/tm-event\/[^/]+\/?$/i,venues:["Star Theater"]},
 {host:"www.danteslive.com",route:/^\/tm-event\/[^/]+\/?$/i,venues:["Dante's"]},
 {host:"hawthornetheatre.com",route:/^\/event\/[^/]+\/hawthorne-theatre\/portland-oregon\/?$/i,venues:["Hawthorne Theatre"]},
 {host:"hawthornetheatre.com",route:/^\/event\/[^/]+\/hawthorne-lounge\/portland-oregon\/?$/i,venues:["Hawthorne Lounge"]},
 {host:"wonderballroom.com",route:/^\/event\/[^/]+\/wonder-ballroom\/portland-oregon\/?$/i,venues:["Wonder Ballroom"]},
 {host:"roselandpdx.com",route:/^\/event\/[^/]+\/roseland-theater\/portland-oregon\/?$/i,venues:["Roseland Theater"]},
 {host:"www.mcmenamins.com",route:/^\/events\/\d+-[^/]+\/?$/i,venues:["Crystal Ballroom"]},
 {host:"app.opendate.io",route:/^\/e\/[^/]+\/?$/i,venues:["Turn! Turn! Turn!"]},
 {host:"www.nofunportland.com",route:/^\/events\/[^/]+\/?$/i,venues:["No Fun"]},
 {host:"tickets.venuepilot.com",route:/^\/e\/[^/]+-the-coffin-portland-[a-z0-9]+\/?$/i,venues:["The Coffin Club"]},
 {host:"aftontickets.com",route:/^\/event\/buyticket\/[a-z0-9]+\/?$/i,venues:["High Limit Room"]},
 {host:"www.treetix.com",route:/^\/event$/,venues:["High Water Mark Lounge"]},
 {host:"www.rosequarter.com",route:/^\/calendar-events\/[^/]+\/?$/i,venues:["Moda Center"]}
];
const venuePriority = ["Black Water","High Water Mark Lounge","Twilight Cafe and Bar",
 "The Coffin Club","Star Theater","Dante's","Hawthorne Theatre","Hawthorne Lounge",
 "Wonder Ballroom","Roseland Theater","Crystal Ballroom","Turn! Turn! Turn!",
 "High Limit Room","Moda Center","No Fun"];
const priority = name => {const i=venuePriority.indexOf(name);return i<0?999:i;};
function originalUrl(event) {
 try {
  const u=new URL(event.url);
  if(u.protocol!=="https:"||u.username||u.password||u.hash)return null;
  // Ticket platform adds a known tracking hint; remove it before fetching.
  if(u.hostname==="tickets.venuepilot.com" && u.searchParams.get("direct")==="true" &&
      [...u.searchParams.keys()].length===1)u.search="";
  const treetix=u.hostname==="www.treetix.com" && u.pathname==="/event" &&
      /^\d+$/.test(u.searchParams.get("id")||"") &&
      u.searchParams.get("cal")==="highwatermark" && [...u.searchParams.keys()].length===2;
  if(u.search&&!treetix)return null;
  if(!permitted.some(x=>u.hostname===x.host&&x.route.test(u.pathname)&&x.venues.includes(event.venue)))return null;
  return u.href;
 }catch(_){return null;}
}
function pacificDay(now=new Date()) {
 const p=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
 const get=t=>p.find(x=>x.type===t).value;
 return get("year")+"-"+get("month")+"-"+get("day");
}
function pendingForArtwork(input,options={}) {
 const today=options.today||pacificDay();
 return input.filter(e=>e.category==="Music"&&!e.artwork&&e.startsAt.slice(0,10)>=today&&originalUrl(e))
  .sort((a,b)=>priority(a.venue)-priority(b.venue)||a.startsAt.localeCompare(b.startsAt)||a.id.localeCompare(b.id));
}
function clean(s) {
 return String(s||"").replace(/<[^>]*>/g," ").replace(/&(?:amp|nbsp|quot|apos);/gi," ")
  .replace(/&#(?:\d+|x[0-9a-f]+);/gi," ").normalize("NFKD")
  .replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}
function titleEvidence(html) {
 const titles=[];
 for(const m of String(html).matchAll(/<(?:title|h1)\b[^>]*>([\s\S]*?)<\/(?:title|h1)>/gi))titles.push(m[1]);
 for(const m of String(html).matchAll(/<meta\b[^>]*>/gi)){
  const attrs=Object.fromEntries([...m[0].matchAll(/([A-Za-z:-]+)\s*=\s*["']([^"']*)["']/g)].map(x=>[x[1].toLowerCase(),x[2]]));
  if(["og:title","twitter:title"].includes((attrs.property||attrs.name||"").toLowerCase()))titles.push(attrs.content);
 }
 for(const m of String(html).matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try {
   const json=JSON.parse(m[1]);
   const nodes=Array.isArray(json)?json:[json];
   for(const node of nodes.flatMap(x=>Array.isArray(x["@graph"])?x["@graph"]:[x])){
    if(/Event$/.test(String(node?.["@type"]||""))&&node.name)titles.push(node.name);
   }
  }catch(_){}
 }
 return titles.map(clean).filter(Boolean);
}
function titleMatches(html,event) {
 const candidates=titleEvidence(html);
 const stop=new Set(["the","and","with","live","show","tour","presents","present","guest",
  "guests","feat","featuring","night","at","plus","for","from","w","a","of"]);
 const tokens=clean(event.title).split(" ").filter(x=>x.length>=4&&!stop.has(x)).slice(0,6);
 // Source pages are linked to specific events. Require at least one distinctive
 // headliner/title token in event-specific title evidence (not the full site body).
 return !!tokens.length&&candidates.some(title=>tokens.some(token=>title.split(" ").includes(token)));
}
function reason(error) {
 const s=String(error?.message||error||"Fetch failed");
 if(/^HTTP \d+/.test(s))return s.replace(" ","_");
 if(/redirect/i.test(s))return "REDIRECT_BLOCKED";
 if(/timed?out|abort/i.test(s))return "TIMEOUT";
 return "FETCH_ERROR";
}
function summarize(events,today,eligible) {
 const music=events.filter(e=>e.category==="Music"&&e.startsAt.slice(0,10)>=today);
 const missing=music.filter(e=>!e.artwork);
 const supported=missing.filter(e=>originalUrl(e));
 const counts=new Map();
 for(const e of missing){
  const key=e.venue;
  if(!counts.has(key))counts.set(key,{venue:key,missing:0,eligible:0});
  counts.get(key).missing++;
  if(originalUrl(e))counts.get(key).eligible++;
 }
 return {music:music.length,withArt:music.length-missing.length,missing:missing.length,
  eligible:supported.length,unsupported:missing.length-supported.length,
  venues:[...counts.values()].sort((a,b)=>b.missing-a.missing||a.venue.localeCompare(b.venue))};
}
function markdownRow(s){return String(s||"").replace(/\|/g,"/").replace(/\r?\n/g," ");}
async function main(){
 const original=fs.readFileSync(eventsFile,"utf8");
 const match=original.match(/window\.SHOWS_EVENTS\s*=\s*(\[[\s\S]*?\]);\s*$/);
 if(!match)throw Error("Cannot locate source event array");
 const events=JSON.parse(match[1]);
 const today=pacificDay();
 const pending=pendingForArtwork(events,{today});
 const baseline=summarize(events,today,pending);
 const max=Math.max(1,Math.min(35,Number(process.env.MAX_ARTWORK_LOOKUPS)||35));
 const requestedBatch=Math.max(0,Math.floor(Number(process.env.ARTWORK_BATCH)||0));
 const batchCount=Math.max(1,Math.ceil(pending.length/max));
 const batch=process.env.ARTWORK_BATCH_MODE==="rotate"?requestedBatch%batchCount:requestedBatch;
 const batchEvents=pending.slice(batch*max,(batch+1)*max);
 const failures=[],successes=[];
 const count=new Map();
 const cache=new Map();
 const tally=(key)=>count.set(key,(count.get(key)||0)+1);
 // Limit parallel requests; do not follow redirects to unapproved hosts.
 for(let i=0;i<batchEvents.length;i+=4){
  await Promise.all(batchEvents.slice(i,i+4).map(async e=>{
   const url=originalUrl(e);
   let outcome="UNKNOWN",artwork=null;
   try {
    if(!cache.has(url)){
     const response=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-artwork-review/0.2"},
      signal:AbortSignal.timeout(14000),redirect:"error"});
     if(!response.ok)throw Error("HTTP "+response.status);
     const body=await response.text();
     if(body.length>1000000)throw Error("Page too large");
     cache.set(url,body);
    }
    const html=cache.get(url);
    if(!titleMatches(html,e))outcome="TITLE_NOT_VERIFIED";
    else {
     artwork=eventArtworkFromHtml(html,url,e.title);
     outcome=artwork?"PROPOSED":"NO_EVENT_IMAGE";
    }
   }catch(error){outcome=reason(error);}
   tally(outcome);
   if(artwork){e.artwork=artwork;successes.push({event:e,artwork});}
   else failures.push({event:e,reason:outcome});
  }));
 }
 if(successes.length){
  const prefix=original.slice(0,match.index);
  fs.writeFileSync(eventsFile,prefix+"window.SHOWS_EVENTS = "+JSON.stringify(events,null,2)+";\n");
 }
 const report=[
  "# SHOWS artwork backfill — review report","",
  "Generated "+new Date().toISOString()+"; Portland date: "+today+". This workflow does not publish images.",
  "Image URLs must be reviewed for event identity, attribution, suitability and usage terms before approval. No files are mirrored.","",
  "## Outcome","",
  "- Upcoming music listings: **"+baseline.music+"**",
  "- Already have image references: **"+baseline.withArt+"**",
  "- Missing artwork: **"+baseline.missing+"**",
  "- Missing listings with supported individual source pages: **"+baseline.eligible+"**",
  "- Missing listings needing another source or individual permalink: **"+baseline.unsupported+"**",
  "- Batch: **"+batch+"** of **"+(batchCount-1)+"** (zero-indexed; "+max+" lookups maximum)",
  "- Attempted: **"+batchEvents.length+"**; proposed: **"+successes.length+"**; no proposal: **"+failures.length+"**","",
  "## Why pages did not produce artwork","",
  ...(count.size?[...count].sort((a,b)=>b[1]-a[1]).map(([key,n])=>"- "+key+": "+n):["- No eligible pages in this batch. Try a different batch, or extend approved event-specific sources."]),
  "",
  "## Missing music artwork by venue","",
  "| Venue | Missing | Eligible individual pages |",
  "| --- | ---: | ---: |",
  ...baseline.venues.map(x=>"| "+markdownRow(x.venue)+" | "+x.missing+" | "+x.eligible+" |"),
  "",
  "## Proposed source-linked artwork","",
  ...(successes.length?successes.map(x=>"- **"+markdownRow(x.event.title)+"** ("+x.event.venue+"): "+x.artwork.sourceUrl+" — image: "+x.artwork.url):
    ["No new verified images proposed in this batch. The action completed successfully but created no PR."]),
  "",
  "## Unsupported or unavailable source pages","",
  ...failures.map(x=>"- "+markdownRow(x.event.title)+" ("+x.event.venue+") — "+x.reason+" — "+x.event.url),
  "",
  "## Next steps","",
  "1. If no PR is produced, open this run's attached \`shows-artwork-report\` artifact or summary to inspect the reasons.",
  "2. Manually dispatch another zero-indexed batch (0 through "+(batchCount-1)+") to inspect other pages.",
  "3. Add verified event-specific URLs for venues marked ineligible; do not substitute generic venue photography.",
  "4. Merge a review PR only after confirming the event images and source attribution.",
  "5. Following canonical approval, merge the corresponding reviewed portfolio snapshot PR."
 ];
 fs.mkdirSync(path.dirname(reportFile),{recursive:true});
 fs.writeFileSync(reportFile,report.join("\n")+"\n");
 console.log(JSON.stringify({today,batch,batchCount,attempted:batchEvents.length,proposed:successes.length,
  missing:baseline.missing,eligible:baseline.eligible,unsupported:baseline.unsupported,
  reasons:Object.fromEntries(count)},null,2));
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={originalUrl,pendingForArtwork,pacificDay,titleEvidence,titleMatches,summarize};
