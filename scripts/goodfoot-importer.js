"use strict";
/* Read-only original Goodfoot music-calendar importer. All source-dated cards
 * are eligible regardless of genre; detail pages provide the event identity.
 * Never infer recurring dates or treat doors as a verified performance start.
 */
const {wallToPacific,time24}=require("./priority-importers");
const CALENDAR="https://thegoodfoot.com/music/";
const BASE="https://thegoodfoot.com";
const MAX_HTML=1_600_000, MAX_LINKS=180;
const venue="The Goodfoot";
function clean(raw,max=1600){
 let s=String(raw??"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ");
 for(let i=0;i<2;i++)s=s.replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,h,d)=>{
   const n=parseInt(h||d,h?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):" ";
 }).replace(/&(?:amp|lt|gt|quot|apos|nbsp|ndash|mdash);/gi,k=>({
  "&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'","&nbsp;":" ","&ndash;":"–","&mdash;":"—"
 }[k.toLowerCase()]));
 return s.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,max);
}
const normalized=s=>clean(s).toLowerCase().replace(/[^a-z0-9]+/g,"");
function eventUrl(raw){
 try {
  const u=new URL(raw,BASE+"/");
  if(u.protocol!=="https:"||u.hostname!=="thegoodfoot.com"||u.username||u.password||u.port||u.search||u.hash||u.href.length>500)return null;
  return /^\/events\/[a-z0-9][a-z0-9-]{1,180}\/$/i.test(u.pathname)?u.href:null;
 }catch(_){return null;}
}
function links(html){
 if(typeof html!=="string"||html.length<450||html.length>MAX_HTML)throw Error("Goodfoot music calendar missing/oversize");
 const out=[],seen=new Set();
 for(const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)){
  const url=eventUrl(m[1].replace(/&amp;/gi,"&"));
  if(url&&!seen.has(url)){out.push(url);seen.add(url);}
 }
 if(!out.length||out.length>MAX_LINKS)throw Error("Goodfoot original music event links missing or over source bounds");
 return out;
}
function schemaEvents(html){
 const found=[];
 function walk(obj){
  if(!obj||typeof obj!=="object")return;
  if(Array.isArray(obj)){for(const item of obj)walk(item);return;}
  if(obj["@type"]){
   const types=Array.isArray(obj["@type"])?obj["@type"]:[obj["@type"]];
   if(types.some(t=>/^(?:https?:\/\/schema\.org\/)?(?:MusicEvent|Event)$/i.test(String(t))))found.push(obj);
  }
  if(obj["@graph"])walk(obj["@graph"]);
 }
 for(const m of String(html).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(!/\btype\s*=\s*["']application\/ld\+json["']/i.test(m[1]))continue;
  try{walk(JSON.parse(m[2]));}catch(_){}
 }
 return found;
}
function startInstant(value){
 const raw=String(value||"");
 const m=/^(20\d{2})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?(Z|[+-]\d{2}:\d{2})?$/.exec(raw);
 if(!m)return null;
 const year=Number(m[1]),month=Number(m[2]),day=Number(m[3]),hh=Number(m[4]),min=Number(m[5]);
 const clock=String(hh).padStart(2,"0")+":"+m[5];
 const local=wallToPacific(year,month,day,clock);
 if(!local)return null;
 // The Events Calendar may serialize either a wall time or an offset-aware
 // instant. Reject dates where its declared offset contradicts Portland time.
 if(m[6]&&Date.parse(raw)!==Date.parse(local))return null;
 return {instant:local,year,month,day,hour:hh,minute:min};
}
function detail(html,url){
 const originalUrl=eventUrl(url);
 if(!originalUrl)return {hold:"Invalid original Goodfoot event URL",url};
 if(typeof html!=="string"||html.length<220||html.length>MAX_HTML)return {hold:"Goodfoot event detail missing/oversize",url:originalUrl};
 const heading=/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
 const title=heading?clean(heading[1],220):"";
 const hold=reason=>({hold:reason,title,url:originalUrl});
 if(!title)return hold("Goodfoot original event title missing");
 const candidates=schemaEvents(html).filter(s=>normalized(s.name)===normalized(title));
 if(candidates.length!==1)return hold("Original Goodfoot event-specific schema missing or ambiguous");
 const schema=candidates[0];
 const statedUrl=schema.url||schema["@id"];
 // Ticket-provider links can live elsewhere, but an original-schema URL should
 // not silently substitute a different Goodfoot event for the detail permalink.
 if(statedUrl&&eventUrl(statedUrl)&&eventUrl(statedUrl)!==originalUrl)return hold("Original detail URL and event identity disagree");
 const start=startInstant(schema.startDate);
 if(!start)return hold("Original Goodfoot calendar start date/time or timezone invalid");
 const {year,month,day,instant}=start;
 const suppliedVenue=typeof schema.location==="string"?schema.location:schema.location?.name||"";
 if(suppliedVenue&&!/\bgoodfoot\b/i.test(clean(suppliedVenue)))return hold("Original event location does not match Goodfoot");
 const status=String(schema.eventStatus||"");
 if(status&&/\b(?:Cancelled|Canceled|Postponed|Rescheduled)\b/i.test(status))return hold("Original Goodfoot event has changed status");
 if(/\b(?:cancelled|canceled|postponed|rescheduled)\b/i.test(title))return hold("Original Goodfoot event title has changed status");
 // Confirm the text shown on the event detail agrees with the schema's month
 // and date (do not infer a missing year from the current calendar month).
 const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
 const visible=clean(html.slice(heading.index,Math.min(html.length,heading.index+8500)),8500);
 const visibleDate=new RegExp("\\b"+months[month-1]+"\\s+"+day+"\\b","i");
 if(!visibleDate.test(visible))return hold("Goodfoot visible event date disagrees with original schema");
 const localClock=String(start.hour%12||12)+(start.minute?":"+String(start.minute).padStart(2,"0"):"")+(start.hour>=12?"pm":"am");
 const doors=/\b(\d{1,2}(?::\d{2})?)\s*(am|pm)\s*Doors\b/i.exec(title);
 let timeKind="listed";
 if(doors){
  const clock=time24(doors[1]+doors[2]);
  const schemaClock=String(start.hour).padStart(2,"0")+":"+String(start.minute).padStart(2,"0");
  if(!clock||clock!==schemaClock)return hold("Original detail start time conflicts with title's doors clock");
  timeKind="doors";
 }
 const description=clean(schema.description||"",1050);
 const text=description||clean(visible.slice(visible.search(visibleDate)+months[month-1].length+3),1050);
 const nonMusic=/\b(?:trivia|comedy|stand[\s-]?up|karaoke|bingo|quiz|board games?|open[\s-]?mic comedy)\b/i.test(title+" "+text);
 const styleHints=(text.match(/\b(?:hip[\s-]?hop|r\s*&\s*b|rnb|neo[\s-]?soul|soul|rap(?:pers?|ping)?|funk|disco|jazz|blues|afrobeat|reggae|ska|electronic\s+music|punk|metal|folk\s+music|bluegrass)\b/gi)||[]).slice(0,8);
 const music=/\b(?:live music|live band|singers?|musicians?|DJ(?:s|\s+set)?|dance\s+night|concert|performing|music|jazz|blues|hip[\s-]?hop|r\s*&\s*b|rnb|soul|funk|disco|reggae|bluegrass|rock band)\b/i.test(text+" "+title);
 return {title,fullUrl:originalUrl,venue,startDate:instant,
  tags:nonMusic?[]:styleHints,
  sourceVerifiedMusic:!nonMusic&&music,
  sourceTimeKind:timeKind,verifiedOriginalShowTime:false,
  timeEvidence:timeKind==="doors"?"Goodfoot original title explicitly labels the listed clock as doors, not the performance start.":"Goodfoot original event schema verifies date and listed clock, but does not establish a performance start versus doors.",
  description:"Original Goodfoot venue details: "+(text||"Event-specific date and venue confirmed from original listing.")};
}
async function fetchEvents(src,request=fetch,options={}){
 if(src?.id!=="the-goodfoot"||src.adapter!=="goodfoot-original-html"||
   src.url!==CALENDAR||src.baseUrl!==BASE)throw Error("Unapproved Goodfoot original source");
 const get=async url=>{
  if(url!==CALENDAR&&!eventUrl(url))throw Error("Unsafe Goodfoot URL");
  const r=await request(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},
   redirect:"error",signal:AbortSignal.timeout(18000)});
  if(!r.ok||!String(r.headers?.get("content-type")||"").includes("text/html"))
   throw Error("Goodfoot original page HTTP "+r.status+" or non-HTML");
  const body=await r.text();if(body.length>MAX_HTML)throw Error("Goodfoot page too large");
  return body;
 };
 const roster=links(await get(CALENDAR)),limit=Math.min(roster.length,options.maxEvents||MAX_LINKS,MAX_LINKS),rows=[];
 for(let i=0;i<limit;i+=4){
  const batch=await Promise.all(roster.slice(i,Math.min(i+4,limit)).map(async url=>{
   try{return detail(await get(url),url);}catch(e){return {hold:"Original Goodfoot page unavailable: "+String(e.message||e),url};}
  }));
  rows.push(...batch);
 }
 if(!rows.some(x=>x.startDate))throw Error("Goodfoot source returned no valid original event detail dates");
 if(rows.some(x=>x.hold))console.warn("Goodfoot venue source held "+rows.filter(x=>x.hold).length+" of "+rows.length+" candidates");
 console.log("Goodfoot original first-page coverage: "+rows.length+" cards checked; additional calendar pagination, if present, is not asserted as complete");
 return rows;
}
module.exports={CALENDAR,BASE,eventUrl,links,schemaEvents,startInstant,detail,fetchEvents};
