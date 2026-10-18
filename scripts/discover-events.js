#!/usr/bin/env node
"use strict";
/* Automated source discovery proposes PRs only. Never publish unreviewed listings. */
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const adapters=require("./priority-importers");
const root=path.resolve(__dirname,"..");
const zone="America/Los_Angeles";
const fmt=new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});
const tz=new Intl.DateTimeFormat("en-US",{timeZone:zone,timeZoneName:"shortOffset"});
const tidy=(v,max=280)=>String(v??"").replace(/<[^>]+>/g," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&nbsp;/gi," ").replace(/\s+/g," ").trim().slice(0,max);
const norm=v=>tidy(v).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
function localTime(value){
  let n=value;
  if(typeof n==="string"&&/^\d{10,13}$/.test(n))n=Number(n);
  if(typeof n==="number"&&n<100000000000)n*=1000;
  const d=new Date(n);
  if(!Number.isFinite(d.valueOf())||d.getUTCFullYear()<2026||d.getUTCFullYear()>2035)throw Error("Invalid source date");
  const p=Object.fromEntries(fmt.formatToParts(d).map(x=>[x.type,x.value]));
  const z=tz.formatToParts(d).find(x=>x.type==="timeZoneName")?.value||"";
  const m=/GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(z);
  if(!m)throw Error("Unknown Pacific offset");
  return [p.year,p.month,p.day].join("-")+"T"+[p.hour,p.minute,p.second].join(":")+m[1]+m[2].padStart(2,"0")+":"+(m[3]||"00");
}
const localDay=v=>localTime(v).slice(0,10);
function parseFile(src){
 const m=src.match(/window\.SHOWS_DATASET\s*=\s*(\{[\s\S]*?\});\s*window\.SHOWS_EVENTS\s*=\s*(\[[\s\S]*?\]);\s*$/);
 if(!m)throw Error("Cannot parse existing events; refusing overwrite");
 return {prefix:src.slice(0,m.index),meta:JSON.parse(m[1]),events:JSON.parse(m[2])};
}
function itemsOf(x){
 if(!x||typeof x!=="object")throw Error("Nonobject feed");
 for(const k of ["upcoming","items"]){if(Array.isArray(x[k]))return x[k];}
 if(Array.isArray(x.collection?.items))return x.collection.items;
 throw Error("No supported Squarespace event array; adapter needs review");
}
function urlOf(item,src){
 let candidate=typeof item.fullUrl==="string"?item.fullUrl:typeof item.urlId==="string"?"/events/"+item.urlId.replace(/^\/?(events\/)?/,""):null;
 if(!candidate)return null;
 try {
  const u=new URL(candidate,src.baseUrl);
  const primaryHost=u.hostname===new URL(src.baseUrl).hostname;
  const validPath=src.adapter==="squarespace-json"?u.pathname.startsWith("/events/"):src.adapter==="twilight-html"?u.pathname.startsWith("/event/"):src.adapter==="star-theater-html"?u.pathname.startsWith("/tm-event/"):false;
  const promoterLink=src.adapter==="promoter-list-html"&&u.hostname==="www.treetix.com"&&u.pathname==="/event"&&u.searchParams.get("cal")==="soundcontrol";
  if(u.protocol!=="https:")return null;
  if(!((primaryHost&&validPath)||promoterLink))return null;
  if(!promoterLink)u.search="";u.hash="";return u.href;
 }catch(_){return null;}
}
function music(item){
 const input=tidy([item.title,item.body,item.excerpt,...(Array.isArray(item.tags)?item.tags:[]),...(Array.isArray(item.categories)?item.categories:[])].filter(Boolean).join(" "),2500).toLowerCase();
 if(/\b(trivia|karaoke|open mic|comedy|bingo|quiz|brunch|screening|happy hour)\b/.test(input))return false;
 return /\b(live music|music|bands?|concert|punk|metal|hardcore|goth|rock show|touring|gig|live performance|show with|doors at)\b/.test(input);
}
function extract(item,src,now){
 if(!item||typeof item!=="object")return {hold:"Unusable source object"};
 const title=tidy(item.title),url=urlOf(item,src);
 if(!title||!url)return {hold:"Missing title or primary event permalink",title};
 if(/\b(trivia|karaoke|open mic|comedy|craft night|mask making|quiz|bingo|brunch|workshop|screening)\b/i.test(title))return {hold:"Different event category, not a confirmed live music show",title,url};
 const stamp=item.startDate??item.startTime??item.start;
 if(stamp==null)return {hold:item.dateOnly?"Verified date "+item.dateOnly+" but no performance start or doors time"+(item.detailHold?"; "+item.detailHold:""):"Event time missing",title,url,date:item.dateOnly,venue:item.venue||src.venue};
 let start;
 try{start=localTime(stamp);}catch(_){return {hold:"Bad event timestamp",title,url};}
 if(src.type==="promoter"){
  const mapped={
   "high water mark lounge":{venue:"High Water Mark Lounge",address:"6800 NE Martin Luther King Jr Blvd, Portland, OR 97211",neighborhood:"Woodlawn"},
   "twilight cafe and bar":{venue:"Twilight Cafe and Bar",address:"832 SE Grand Ave, Portland, OR 97214",neighborhood:"Central Eastside"},
   "star theater":{venue:"Star Theater",address:"13 NW Sixth Avenue, Portland, OR 97209",neighborhood:"Old Town"}
  }[String(item.venue||"").toLowerCase()];
  if(!mapped)return {hold:"Promoter venue location must be verified inside Portland",title,url,date:item.dateOnly,venue:item.venue};
  item={...item,...mapped};
 }
 const date=start.slice(0,10);
 if(date<localDay(now)||date>localDay(new Date(now.valueOf()+92*86400000)))return {skip:"Outside review period",title,url};
 const blocked=src.blockedDates?.find(x=>x.date===date);
 if(blocked)return {hold:"Historical source conflict: "+blocked.reason,title,url,date};
 if(!item.sourceVerifiedMusic&&!music(item))return {hold:"Live-music evidence not established",title,url,date};
 const asof=localDay(now);
 const id="auto-"+src.id+"-"+date+"-"+crypto.createHash("sha256").update(url).digest("hex").slice(0,12);
 const cat=Array.isArray(item.categories)?item.categories.filter(x=>typeof x==="string").slice(0,8):[];
 return {event:{
  id,title,subtitle:"Source-discovered music listing · format and time need review",category:"Music",
  tags:["Music listing","Time needs confirmation","Format needs confirmation"],musicStyles:[],eventFormat:"unverified",
  startTimeKind:"listed",startsAt:start,endsAt:null,venue:item.venue||src.venue,address:item.address===undefined?src.address:item.address,neighborhood:item.neighborhood||src.neighborhood||"Not confirmed",
  price:"See organizer for current admission",free:null,age:"Not published",
  description:"Automatically discovered from a primary venue or promoter listing. "+tidy(item.timeEvidence||"The listed time may mean doors instead of performance; confirm with organizer.")+" "+tidy(item.description||item.excerpt||item.body||""),
  source:src.name,url,icon:"♫",sourceCheckedAt:asof,verificationMethod:"Automated venue data; editorial date, time, live-show and cancellation verification required",
  sourceCategories:cat,sources:[{name:src.name,url,kind:"organizer",checkedAt:asof,originalCategories:cat}],
  ...(item.artwork?{artwork:item.artwork}:{}),
  addedIn:"auto-discovery-"+asof,discovery:{sourceId:src.id,method:"primary-source-collection"}
 }};
}
function reconcile(existing,records){
 const accepted=[],held=[],skipped=[],seen=new Set();
 for(const x of records){
  if(!x.event){(x.hold?held:skipped).push(x);continue;}
  const e=x.event,day=e.startsAt.slice(0,10);
  const key=e.venue.toLowerCase()+"|"+day+"|"+norm(e.title);
  if(seen.has(key)||existing.some(v=>v.id===e.id||(v.venue.toLowerCase()===e.venue.toLowerCase()&&v.startsAt.slice(0,10)===day&&norm(v.title)===norm(e.title)))){
   skipped.push({skip:"Already present",title:e.title,url:e.url});continue;
  }
  if(existing.some(v=>v.url===e.url&&v.startsAt.slice(0,10)!==day&&new URL(v.url).pathname.includes("/events/"))){
   held.push({hold:"Potential reschedule of an existing event URL",title:e.title,url:e.url});continue;
  }
  if([...existing,...accepted].some(v=>v.venue.toLowerCase()===e.venue.toLowerCase()&&v.startsAt.slice(0,10)===day)){
   held.push({hold:"Same venue/date; different existing bill; manual comparison",title:e.title,url:e.url});continue;
  }
  accepted.push(e);seen.add(key);
 }
 return {accepted,held,skipped};
}
async function fetchItems(source){
 const u=new URL(source.url),home=new URL(source.baseUrl);
 if(u.protocol!=="https:"||u.hostname!==home.hostname||!["squarespace-json","twilight-html","star-theater-html","promoter-list-html"].includes(source.adapter))throw Error("Unsafe or unsupported source adapter");
 const response=await fetch(u,{headers:{"Accept":source.adapter==="squarespace-json"?"application/json":"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(18000),redirect:"error"});
 if(!response.ok)throw Error("HTTP "+response.status);
 const body=await response.text();
 if(body.length>3000000)throw Error("Feed exceeds size limit");
 if(source.adapter==="twilight-html"){
  const links=adapters.parseTwilightLinks(body,source);
  if(!links.length)throw Error("Twilight calendar has no event detail links");
  const rows=[];
  for(const link of links){
   try{
    const detail=await fetch(link,{headers:{"Accept":"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(18000),redirect:"error"});
    if(!detail.ok){rows.push({hold:"Twilight event page HTTP "+detail.status,url:link});continue;}
    rows.push(adapters.parseTwilightDetail((await detail.text()).slice(0,450000),link,source));
   }catch(e){rows.push({hold:"Twilight event fetch failed: "+String(e.message||e),url:link});}
  }
  return rows;
 }
 if(source.adapter==="star-theater-html"){
  const items=adapters.parseStar(body,source);
  if(!items.length)throw Error("Star Theater layout changed; no dated events parsed");
  return items;
 }
 if(source.adapter==="promoter-list-html"){
  const items=adapters.parseSoundcontrol(body,source);
  if(!items.length)throw Error("Soundcontrol roster unavailable or changed");
  const verified=[];
  for(const item of items){
   if(item.hold||!item.fullUrl){verified.push(item);continue;}
   try{
    const u=new URL(item.fullUrl);
    if(u.protocol!=="https:"||u.hostname!=="www.treetix.com"||u.pathname!=="/event"||u.searchParams.get("cal")!=="soundcontrol")throw Error("Ticket URL outside approved provider");
    const response=await fetch(u,{headers:{"Accept":"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(15000),redirect:"error"});
    if(!response.ok){verified.push({...item,detailHold:"Ticket page HTTP "+response.status+"; date-only staging"});continue;}
    verified.push(adapters.parseSoundcontrolDetail((await response.text()).slice(0,500000),item));
   }catch(e){verified.push({...item,detailHold:"Ticket data unavailable; stage date-only: "+String(e.message||e)});}
  }
  return verified;
 }
 let json;try{json=JSON.parse(body)}catch(_){throw Error("Venue returned non-JSON response");}
 return itemsOf(json).map(item=>{
  const raw=item.assetUrl||item.image?.assetUrl||item.image?.url||item.thumbnailUrl;
  const url=adapters.artworkCandidate(raw,source.url);
  return url?{...item,artwork:{url,sourceUrl:source.url,origin:"official-event-page",credit:"Venue event listing",usageApproved:null}}:item;
 });
}
function report(r,errors,now){
 const lines=["# SHOWS automated discovery review — "+localDay(now),"",
  "Proposed entries **must be approved before publishing**. Source-listed times are NOT verified as show times.","",
  "## New candidates: "+r.accepted.length,"",
  ...[...new Set(r.accepted.map(e=>e.discovery?.sourceId).filter(Boolean))].map(id=>"- "+id+": "+r.accepted.filter(e=>e.discovery?.sourceId===id).length+" proposals"),"" ,
  "| Date | Event | Venue | Listed time | Primary listing |",
  "| --- | --- | --- | --- | --- |"];
 for(const e of r.accepted)lines.push("| "+e.startsAt.slice(0,10)+" | "+e.title.replace(/\|/g,"/")+" | "+e.venue+" | "+e.startsAt.slice(11,16)+" (doors/show unverified) | "+e.url+" |");
 lines.push("","## Held for review: "+r.held.length,"");
 for(const e of r.held)lines.push("- "+(e.sourceId?"["+e.sourceId+"] ":"")+(e.date?"("+e.date+") ":"")+(e.title||"Untitled")+" — "+e.hold+" "+(e.url||""));
 lines.push("","## Source errors: "+errors.length,"");
 for(const x of errors)lines.push("- "+x.source+": "+x.error);
 lines.push("","## Required editorial checks","",
  "- Verify actual performers and classify event format as live, DJ or another format before approval.",
  "- Distinguish doors from showtime before merging; change the listed-time label if verified.",
  "- Check duplicates, source permalink, venue/date, ticket status, age, and cancellation information.",
  "- Leave genre, cost, accessibility and end times unknown without evidence.",
  "- After approving and merging this PR, review the corresponding portfolio sync PR.");
 return lines.join("\n")+"\n";
}
async function run(opts={}){
 const registry=JSON.parse(fs.readFileSync(path.join(root,"discovery/sources.json"),"utf8"));
 const parsed=parseFile(fs.readFileSync(path.join(root,"events.js"),"utf8"));
 const sources=registry.sources.filter(s=>s.status==="pilot-enabled");
 if(!sources.length)throw Error("No active sources");
 const now=opts.now||new Date(),found=[],errors=[];
 for(const src of sources){
  try{
   const items=opts.load?await opts.load(src):await fetchItems(src);
   if(!Array.isArray(items))throw Error("Source did not return an array");
   if(process.env.SHOWS_DISCOVERY_DEBUG==="1")console.log("SOURCE SAMPLE "+JSON.stringify(items.slice(0,7).map(i=>({title:tidy(i.title),urlId:i.urlId,fields:Object.keys(i).slice(0,20),tags:i.tags,categories:i.categories,excerpt:tidy(i.excerpt,120),body:tidy(i.body,160)}))));
   for(const item of items){
    if(item?.hold){found.push({...item,sourceId:src.id});continue;}
    const record=extract(item,src,now);
    found.push(record.event?record:{...record,sourceId:src.id});
   }
   console.log(src.id+": "+items.length+" source items examined");
  }catch(e){errors.push({source:src.id,error:String(e.message||e)});console.error(src.id+": "+String(e.message||e));}
 }
 if(errors.length===sources.length)throw Error("Every source failed; no silent success");
 const result=reconcile(parsed.events,found);
 console.log(JSON.stringify({proposed:result.accepted.length,bySource:Object.fromEntries(sources.map(s=>[s.id,result.accepted.filter(e=>e.discovery?.sourceId===s.id).length])),held:result.held.length,skipped:result.skipped.length,errors}));
 if(process.env.SHOWS_DISCOVERY_DEBUG==="1")console.log("SAMPLE HELDS "+JSON.stringify(result.held.slice(0,14)));
 if(process.env.SHOWS_DISCOVERY_DEBUG==="1")console.log("PROPOSED TITLES "+JSON.stringify(result.accepted.map(e=>({date:e.startsAt.slice(0,10),title:e.title,url:e.url}))));
 if(!result.accepted.length)return {...result,errors};
 const newEvents=[...parsed.events,...result.accepted].sort((a,b)=>a.startsAt.localeCompare(b.startsAt)||a.title.localeCompare(b.title));
 const batch="auto-discovery-"+localDay(now)+"-"+(process.env.GITHUB_RUN_NUMBER||"local"),prev=[...(parsed.meta.previousBatches||[])];
 if(parsed.meta.batchId!==batch)prev.push({batchId:parsed.meta.batchId,addedOccurrences:parsed.meta.addedOccurrences});
 const meta={...parsed.meta,sourceCheckedAt:localDay(now),coverageThrough:newEvents.reduce((m,e)=>e.startsAt.slice(0,10)>m?e.startsAt.slice(0,10):m,""),
  totalOccurrences:newEvents.length,addedOccurrences:result.accepted.length,batchId:batch,previousBatches:prev,
  newLiveBills:0,newDjNights:0,musicOccurrences:newEvents.filter(e=>e.category==="Music").length,
  editorialReview:"Automatically discovered candidates require explicit human PR approval"};
 const output=parsed.prefix+"window.SHOWS_DATASET = "+JSON.stringify(meta,null,2)+";\nwindow.SHOWS_EVENTS = "+JSON.stringify(newEvents,null,2)+";\n";
 if(opts.write!==false){
  fs.writeFileSync(path.join(root,"events.js"),output);
  fs.writeFileSync(path.join(root,"discovery/latest-review.md"),report(result,errors,now));
 }
 return {...result,errors,output};
}
if(require.main===module)run().catch(e=>{console.error("Discovery failed: "+e.message);process.exitCode=1;});
module.exports={localTime,localDay,parseFile,itemsOf,urlOf,music,extract,reconcile,run};
