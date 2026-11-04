#!/usr/bin/env node
"use strict";
/* Portland underground/DIY scene source SCOUT, not an event importer.
 * Only curated HTTPS seed pages are fetched. Discovered links are NOT fetched,
 * claimed to be events, or used to copy images or infer event dates.
 */
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const seeds=require("../discovery/scene-scout-seeds.json");
const EVENT_RX=/\b(?:event|market|bazaar|fair|festival|fest|show|pop[\s-]?up|holiday|calendar|vendors?|exhibition|makers?)\b/i;
const SCENE_RX=/\b(?:goth(?:ic)?|darkwave|punk|hardcore|metal|indie|independent|zines?|small.press|oddities|oddity|curiosities|peculiar|occult|witch(?:y)?|spooky|horror|weird|diy|queer|lgbtq|vintage|flea|record|vinyl|makers?|arts?|comics?|nerdy?|geeks?|book(?:s)?|media)\b/i;
const STRONG_RX=/\b(?:goth(?:ic)?|darkwave|punk|hardcore|metal|indie|independent|zines?|small.press|oddities|oddity|curiosities|peculiar|occult|witch(?:y)?|spooky|horror|weird|diy|queer|lgbtq|vintage|flea|record|vinyl|comics?|nerdy?|geeks?|book(?:s)?|media)\b/i;
const FALSE_URL=/\.(?:jpg|jpeg|png|webp|gif|svg|pdf|woff|css|js|mp3|mp4|ics)(?:$|[?#])/i;
const TRACKING=/^(?:utm_.+|fbclid|gclid|mc_cid|mc_eid)$/i;
const LIMIT=2_600_000,MAX_ANCHORS=1800,MAX_PER_SEED=20,MAX_NEW=100;
const statePath=path.join(root,"discovery/scene-scout-leads.json");
const reportPath=path.join(root,"discovery/scene-scout-review.md");
const plain=s=>String(s||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
 .replace(/<[^>]*>/g," ").replace(/&(?:nbsp|#160);/gi," ").replace(/&(?:amp|#38);/gi,"&")
 .replace(/&(?:quot|#34);/gi,'"').replace(/&#(?:39|x27);|&apos;/gi,"'").replace(/\s+/g," ").trim();
const short=s=>plain(s).replace(/[|\r\n]/g,"/").slice(0,160);
function canon(raw,base){
 try{
  const u=new URL(String(raw||"").replace(/&amp;/g,"&"),base);
  if(u.protocol!=="https:"||u.username||u.password||u.port||u.href.length>1000||
     FALSE_URL.test(u.pathname)||/^(?:localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.)/i.test(u.hostname))return null;
  if(/(?:^|\.)instagram\.com$/i.test(u.hostname))u.search=""; // Social permalink, not tracking or private API state.
  else for(const key of [...u.searchParams.keys()])if(TRACKING.test(key))u.searchParams.delete(key);
  u.hash="";
  if(/^\/(?:tag|tags|category|categories|author|login|wp-admin|cart|checkout|privacy|terms|about|contact|subscribe|search)\b/i.test(u.pathname))return null;
  return u.href;
 }catch{return null;}
}
function anchors(html){
 const visible=String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ");
 const rows=[];
 for(const m of visible.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  if(rows.length>=MAX_ANCHORS)break;
  rows.push({rawUrl:m[1],label:short(m[2]),context:short(visible.slice(Math.max(0,m.index-240),m.index+m[0].length+140))});
 }
 return rows;
}
function inspect(seed,html,knownUrls=new Set()){
 const results=new Map(),seedUrl=canon(seed.url,seed.url);
 // An independently documented first-party event page is a research lead itself.
 // The scouting PR merely records its original URL; year/time still need review.
 if(seed.kind.startsWith("original-")&&seedUrl&&!knownUrls.has(seedUrl))
  results.set(seedUrl,{url:seedUrl,titleHint:seed.label,source:seed.id,from:seed.url,
   type:seed.kind==="original-event"?"original-event-page":"original-organizer-or-vendor-source",
   confidence:"research-only",why:short(seed.focus)});
 for(const a of anchors(html)){
  const url=canon(a.rawUrl,seed.url);
  if(!url||url===seedUrl||knownUrls.has(url))continue;
  // Marketing, rental and application forms are not event announcements.
  if(/\b(?:apply to|vendor application|vendor sign.?up|host your event|rent (?:our|a) space|venue rental|photo (?:credit|courtesy)|courtesy |recap)\b/i.test(a.label))continue;
  if(/(?:hello\.dubsado\.com|forms\.gle|typeform\.com|form\.jotform\.com|google\.com\/forms|\/producers\/|\/pam-venues\/|\/event-recap\/)/i.test(url))continue;
  const parsed=new URL(url),origin=new URL(seed.url),external=parsed.hostname!==origin.hostname;
  const title=a.label||new URL(url).pathname.split("/").filter(Boolean).pop()?.replace(/[-_]/g," ")||"";
  const hint=(title+" "+parsed.pathname.replace(/[-_/]/g," ")).slice(0,500);
  const e=EVENT_RX.test(hint),scene=STRONG_RX.test(hint);
  const near=SCENE_RX.test(a.context);
  const vendor=seed.kind==="original-vendor-directory"||seed.kind==="original-vendor";
  const curated=seed.kind==="original-organizer"||seed.kind==="original-event";
  const directory=seed.kind==="secondary-discovery";
  // Secondary indexes contain ordinary shopping/holiday advertisements:
  // restrict them to independently scene-signaling anchor/URL text.
  if(directory&&!(e&&scene))continue;
  if(vendor&&!(external&&near&&(scene||/\b(?:website|organizer|publisher|press|artist)\b/i.test(a.label))))continue;
  if(curated&&!(e&&(scene||near)||external&&scene))continue;
  if(!(directory||vendor||curated))continue;
  if(/^(?:home|about|shop|contact|privacy|terms|menu|instagram|facebook|tiktok|subscribe|sign up|learn more)$/i.test(a.label)&&!scene&&!vendor)continue;
  const rank=(scene?3:0)+(e?2:0)+(near?1:0)+(curated?1:0)+(vendor&&external&&near?2:0);
  if(rank<3)continue;
  const type=e?"possible-event-or-market-link":"possible-organizer-source";
  const row={url,titleHint:short(title),source:seed.id,from:seed.url,
   type,confidence:"research-only",why:short(a.context),rank};
  if(!results.has(url)||rank>results.get(url).rank)results.set(url,row);
 }
 return [...results.values()].sort((a,b)=>(b.rank||0)-(a.rank||0)||a.url.localeCompare(b.url)).slice(0,MAX_PER_SEED);
}
function localDay(now=new Date()){
 const p=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now).map(x=>[x.type,x.value]));
 return p.year+"-"+p.month+"-"+p.day;
}
function readState(file){
 if(!file||!fs.existsSync(file))return {schemaVersion:1,leads:[]};
 const j=JSON.parse(fs.readFileSync(file,"utf8"));
 if(j.schemaVersion!==1||!Array.isArray(j.leads))throw Error("Invalid source-scout review state");
 return j;
}
function baselineKnown(){
 const urls=new Set(),add=u=>{const c=canon(u,"https://example.org/");if(c)urls.add(c);};
 const events=fs.readFileSync(path.join(root,"events.js"),"utf8").match(/window\.SHOWS_EVENTS\s*=\s*(\[[\s\S]*?\]);\s*$/);
 if(!events)throw Error("Canonical SHOWS event data is unreadable");
 for(const e of JSON.parse(events[1]))add(e.url);
 const canonical=require("../discovery/sources.json");
 for(const s of canonical.sources){add(s.url);add(s.baseUrl);}
 const backlog=require("../discovery/scene-source-backlog.json");
 for(const s of backlog.sources)add(s.officialSourceUrl);
 // Don't reintroduce URLs already designated as canonical events, source leads or review records.
 return urls;
}
async function retrieve(seed,request=fetch){
 const u=canon(seed.url,seed.url);
 if(!u||u!==seed.url)throw Error("Unapproved or non-canonical seed URL");
 const r=await request(u,{headers:{Accept:"text/html","User-Agent":"SHOWS-scene-source-research/0.1"},
  redirect:"error",signal:AbortSignal.timeout(15000)});
 if(!r.ok||!String(r.headers?.get("content-type")||"").includes("text/html"))throw Error("Seed source returned non-HTML or HTTP "+r.status);
 const text=await r.text();
 if(text.length>LIMIT)throw Error("Seed source exceeded size cap");
 if(text.length<300)throw Error("Seed source is empty/incomplete");
 return text;
}
function render({checked,failures,newLeads,allLeads,day}){
 const out=["# Portland DIY & alternative-market source scout — "+day,"",
  "**Research leads only.** Links in this report are NOT approved SHOWS events, proof of a future date, a verified Portland location, permission to use images or a full inventory of any organizer. Venue and date-specific evidence must be checked separately before any canonical event proposal.","",
  "This scout reads a bounded, editorially selected mix of original organizer, original vendor and secondary Portland listing pages. It never automatically visits new outbound URLs, accesses Instagram private endpoints, or edits the public calendar.","",
  "**"+checked.length+" source pages attempted; "+failures.length+" inaccessible/changed; "+newLeads.length+" newly discovered links; "+allLeads.length+" total recorded research leads.**","",
  "## Source health","",
  "| Page | Result | Candidate links |","| --- | --- | ---: |"];
 for(const s of checked)out.push("| "+short(s.label)+" | "+(s.error?"Error — "+short(s.error):"Read-only check succeeded")+" | "+s.count+" |");
 out.push("","## Newly surfaced unverified leads","",
  "| Found at | Page or possible organizer | Type | Context |","| --- | --- | --- | --- |");
 if(!newLeads.length)out.push("| — | No new unverified URLs beyond previously recorded sources | — | — |");
 for(const x of newLeads.slice(0,65))
  out.push("| "+short(x.source)+" | ["+short(x.titleHint||"Open source")+"]("+x.url+") | "+short(x.type)+" | "+short(x.why)+" |");
 if(newLeads.length>65)out.push("","**"+(newLeads.length-65)+" additional links omitted from brief view; consult the JSON research queue.**");
 out.push("","## Research requirements","",
 "- Determine if the linked page is the original organizer/venue announcement or a secondary directory/vendor mention.",
 "- Confirm Portland city/room, future local date with **explicit year**, actual event time semantics, event category and cancellation status. Inaccessible sources do not imply zero upcoming events.",
 "- Distinguish one-time announcements and repeating market series; do not turn a posted date or a vendor application deadline into an event date.",
 "- Deduplicate against canonical SHOWS by exact event permalink, venue/date and identity. Keep multiple independent events when genuinely separate.",
 "- Don't scrape private Instagram, bypass blocks, mirror flyers without rights, or automatically enable new event source adapters.",
 "- Prioritize zines, independent music, DIY creators, oddities, gothic/queer markets and unusual holiday pop-ups; generic farmers markets and routine bazaars are not the goal.",
 "");
 return out.join("\n")+"\n";
}
async function run({request=fetch,now=new Date(),write=true,pendingFile=process.env.SCOUT_PENDING_FILE}={}){
 const approved=baselineKnown(),existing=readState(statePath),pending=readState(pendingFile);
 const known=new Map([...existing.leads,...pending.leads].map(x=>[x.url,x]));
 const checked=[],found=new Map();
 for(const seed of seeds.seeds){
  try{
   const html=await retrieve(seed,request);
   const leads=inspect(seed,html,approved);
   checked.push({id:seed.id,label:seed.label,count:leads.length});
   for(const x of leads)if(!known.has(x.url)&&!found.has(x.url))found.set(x.url,x);
  }catch(e){checked.push({id:seed.id,label:seed.label,count:0,error:String(e.message||e)});}
 }
 const day=localDay(now),newLeads=[...found.values()].slice(0,MAX_NEW).map(x=>({...x,firstSeenOn:day}));
 if(found.size>MAX_NEW)throw Error("Unexpectedly many source-scout leads; review changing source HTML before storing");
 const allLeads=[...known.values(),...newLeads].sort((a,b)=>a.url.localeCompare(b.url));
 if(allLeads.length>700)throw Error("Research queue cap exceeded; consolidate reviewed or stale leads");
 const report=render({checked,failures:checked.filter(x=>x.error),newLeads,allLeads,day});
 if(write){fs.writeFileSync(statePath,JSON.stringify({schemaVersion:1,leads:allLeads},null,2)+"\n");fs.writeFileSync(reportPath,report);}
 if(checked.every(x=>x.error))throw Error("Every curated scene-discovery source failed: report retained; do not infer there are no events");
 console.log("SCENE SCOUT "+JSON.stringify({checked:checked.length,failed:checked.filter(x=>x.error).length,new:newLeads.length,total:allLeads.length,bySource:Object.fromEntries(checked.map(x=>[x.id,x.count]))}));
 for(const x of newLeads.slice(0,30))console.log("SCENE LEAD "+x.source+" | "+x.type+" | "+x.titleHint+" | "+x.url);
 return {checked,newLeads,allLeads,report};
}
if(require.main===module)run().catch(e=>{console.error("SCENE SOURCE SCOUT FAILED: "+e.message);process.exitCode=1});
module.exports={canon,anchors,inspect,localDay,readState,baselineKnown,retrieve,render,run};
