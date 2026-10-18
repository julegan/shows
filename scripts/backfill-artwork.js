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
const permitted=[
 {host:"www.twilightcafeandbar.com",route:/^\/event\/\d+\//},
 {host:"www.startheaterportland.com",route:/^\/tm-event\//},
 {host:"www.nofunportland.com",route:/^\/events\/[^/]+\/?$/}
];
function originalUrl(raw){
 try{
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.username||u.password||u.search)return null;
  if(!permitted.some(x=>u.hostname===x.host&&x.route.test(u.pathname)))return null;
  return u.href;
 }catch(_){return null;}
}
async function main(){
 const pending=events.filter(e=>!e.artwork&&originalUrl(e.url));
 const requestedBatch=Math.max(0,Number(process.env.ARTWORK_BATCH)||0);
 const max=Math.max(1,Math.min(35,Number(process.env.MAX_ARTWORK_LOOKUPS)||35));
 const batchCount=Math.max(1,Math.ceil(pending.length/max));
 const batch=process.env.ARTWORK_BATCH_MODE==="rotate"?requestedBatch%batchCount:requestedBatch;
 let attempted=0,proposed=0;
 const failures=[];
 const cache=new Map();
 for(const e of pending.slice(batch*max,(batch+1)*max)){
  attempted++;
  const url=originalUrl(e.url);
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
module.exports={originalUrl};
