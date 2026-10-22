#!/usr/bin/env node
"use strict";
// Revisit existing official source pages to propose flyer URLs; never publish automatically.
const fs=require("node:fs");
const path=require("node:path");
const {eventArtworkFromHtml}=require("./priority-importers");
const root=path.resolve(__dirname,"..");
const eventsFile=path.join(root,"events.js");
const original=fs.readFileSync(eventsFile,"utf8");
const match=original.match(/window\.SHOWS_EVENTS\s*=\s*(\[[\s\S]*?\]);\s*$/);
if(!match)throw new Error("Cannot locate source event array");
const events=JSON.parse(match[1]);
// Only public event detail pages already supplied by a verified venue/promoter may be read.
const permitted=[
 {host:"www.twilightcafeandbar.com",route:/^\/event\/\d+\//,venues:["Twilight Cafe and Bar"]},
 {host:"www.startheaterportland.com",route:/^\/tm-event\//,venues:["Star Theater"]},
 {host:"www.nofunportland.com",route:/^\/events\/[^/]+\/?$/,venues:["No Fun"]},
 {host:"tickets.venuepilot.com",route:/^\/e\/[^/]+-the-coffin-portland-[a-z0-9]+$/i,venues:["The Coffin Club"]},
 {host:"aftontickets.com",route:/^\/event\/buyticket\/[a-zA-Z0-9]+$/,venues:["High Limit Room"]},
 {host:"www.treetix.com",route:/^\/(?:event|\d+\/highwatermark)\/?$/,venues:["High Water Mark Lounge"]}
];
function originalUrl(event){
 try{
  const u=new URL(event.url);
  if(u.protocol!=="https:"||u.username||u.password)return null;
  if(u.hostname==="tickets.venuepilot.com"&&u.searchParams.get("direct")==="true"&&[...u.searchParams.keys()].length===1)u.search="";
  const treetix=u.hostname==="www.treetix.com"&&u.pathname==="/event"
   &&/^\d+$/.test(u.searchParams.get("id")||"")
   &&u.searchParams.get("cal")==="highwatermark"&&[...u.searchParams.keys()].length===2;
  if(u.search&&!treetix)return null;
  if(!permitted.some(x=>u.hostname===x.host&&x.route.test(u.pathname)&&x.venues.includes(event.venue)))return null;
  return u.href;
 }catch(_){return null;}
}
// Define sorting dependencies before invoking Array.sort (its comparator executes immediately).
const distinctSourceOwners=["The Coffin Club","High Limit Room","High Water Mark Lounge","Twilight Cafe and Bar","Star Theater","No Fun"];
function priority(venue){const i=distinctSourceOwners.indexOf(venue);return i<0?999:i;}
function pendingForArtwork(input){
 return input.filter(e=>!e.artwork&&originalUrl(e))
  .sort((a,b)=>priority(a.venue)-priority(b.venue)||a.startsAt.localeCompare(b.startsAt)||a.id.localeCompare(b.id));
}
async function main(){
 const pending=pendingForArtwork(events);
 const requestedBatch=Math.max(0,Number(process.env.ARTWORK_BATCH)||0);
 const max=Math.max(1,Math.min(35,Number(process.env.MAX_ARTWORK_LOOKUPS)||35));
 const batchCount=Math.max(1,Math.ceil(pending.length/max));
 const batch=process.env.ARTWORK_BATCH_MODE==="rotate"?requestedBatch%batchCount:requestedBatch;
 let attempted=0,proposed=0;
 const failures=[];
 const cache=new Map();
 for(const e of pending.slice(batch*max,(batch+1)*max)){
  attempted++;
  const url=originalUrl(e);
  try{
   if(!cache.has(url)){
    const response=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-artwork-review/0.1"},signal:AbortSignal.timeout(14000),redirect:"error"});
    if(!response.ok)throw new Error("HTTP "+response.status);
    const body=await response.text();
    if(body.length>1000000)throw new Error("Page too large");
    cache.set(url,eventArtworkFromHtml(body,url));
   }
   const artwork=cache.get(url);
   if(artwork){e.artwork=artwork;proposed++;}
   else failures.push(e.id+": no event artwork on source page");
  }catch(err){failures.push(e.id+": "+String(err.message||err));}
 }
 if(proposed){
  const prefix=original.slice(0,match.index);
  fs.writeFileSync(eventsFile,prefix+"window.SHOWS_EVENTS = "+JSON.stringify(events,null,2)+";\n");
 }
 const report=[
  "# Source artwork backfill review","",
  "This file contains external artwork links from official event pages. Review usage terms before publishing; the image files are not copied.","",
  "Batch: "+batch+" (zero-indexed)",
  "Attempted listings: "+attempted,
  "New event artwork references: "+proposed,
  "Remaining eligible event pages: "+Math.max(0,pending.length-(batch*max+attempted)),
  "Not found or unavailable: "+failures.length,
  "",
  ...events.filter(e=>e.artwork&&e.artwork.origin==="official-event-page").slice(-proposed).map(e=>"- "+e.title+" — "+e.artwork.sourceUrl+" — "+e.artwork.url),
  "",
  "## Unavailable or unclear","",...failures.map(x=>"- "+x)
 ].join("\n")+"\n";
 fs.mkdirSync(path.join(root,"discovery"),{recursive:true});
 fs.writeFileSync(path.join(root,"discovery","artwork-backfill-review.md"),report);
 console.log(JSON.stringify({attempted,proposed,remaining:pending.length-attempted,failures:failures.length}));
}
if(require.main===module)main().catch(err=>{console.error(err);process.exitCode=1});
module.exports={originalUrl,pendingForArtwork};
