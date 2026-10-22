"use strict";
/* Original Crystal Ballroom-only calendar. First-party pagination and detail
 * pages, explicit venue in event-specific OG metadata, source-published
 * schema.org Event startDate, no inferred year or showtimes.
 */
const {eventArtworkFromHtml}=require("./priority-importers");
const ROOT="https://www.crystalballroompdx.com";
function safeCrystalUrl(value){
 try{
  const u=new URL(String(value||"").replace(/&amp;/gi,"&"),ROOT);
  if(u.protocol!=="https:"||u.hostname!=="www.crystalballroompdx.com"||u.username||u.password||u.port||u.search||u.hash)return null;
  return /^\/events\/\d{4,8}-[a-z0-9][a-z0-9-]*\/?$/i.test(u.pathname)?u.href:null;
 }catch(_){return null}
}
function safePageUrl(value){
 try{
  const u=new URL(value,ROOT);
  if(u.protocol!=="https:"||u.hostname!=="www.crystalballroompdx.com"||u.username||u.password||u.port||u.search||u.hash)return null;
  const match=/^\/events\/page\/([2-9]|1[0-2])\/?$/.exec(u.pathname);
  return match?u.href:null;
 }catch(_){return null}
}
function links(html){
 const found=[],seen=new Set();
 for(const m of String(html||"").matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)){
  const u=safeCrystalUrl(m[1]);
  if(u&&!seen.has(u)){seen.add(u);found.push(u)}
 }
 if(!found.length)throw Error("Crystal official page exposes no first-party event links; audit changed layout");
 if(found.length>60)throw Error("Unexpected event link count; hold archive until audited");
 return found;
}
function pages(html){
 const seen=new Set(),out=[];
 for(const m of String(html||"").matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)){
  const u=safePageUrl(m[1]);if(u&&!seen.has(u)){seen.add(u);out.push(u)}
 }
 return out;
}
function decode(s){
 return String(s||"").replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,h,d)=>{const n=parseInt(h||d,h?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):" "})
 .replace(/&(?:amp|apos|quot|nbsp|lt|gt);/gi,t=>({"&amp;":"&","&apos;":"'","&quot;":'"',"&nbsp;":" ","&lt;":"<","&gt;":">"}[t.toLowerCase()]||t);
}
function metadata(page){
 const attrs=[...String(page).matchAll(/<meta\b[^>]*>/gi)];
 const res={};
 for(const m of attrs){
  const attributes=Object.fromEntries([...m[0].matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gi)].map(x=>[x[1].toLowerCase(),decode(x[3])]));
  const key=attributes.property||attributes.name;
  if(key==="og:title"||key==="og:description"||key==="og:url")res[key]=attributes.content;
 }
 return res;
}
function schemas(page){
 const out=[];
 for(const m of String(page).matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try{
   const root=JSON.parse(m[1]);
   for(const item of (Array.isArray(root)?root:[root]).flatMap(x=>Array.isArray(x["@graph"])?x["@graph"]:[x])){
    if(String(item?.["@type"]||"").split(",").some(t=>/^(?:Music)?Event$/i.test(t.trim())))out.push(item);
   }
  }catch(_){}
 }
 return out;
}
function validPacificInstant(value){
 if(typeof value!=="string"||!/^20\d{2}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?(?:-07:00|-08:00)$/.test(value))return null;
 const dt=new Date(value);if(!Number.isFinite(dt.valueOf()))return null;
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZoneName:"shortOffset"}).formatToParts(dt).map(x=>[x.type,x.value]));
 const m=/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(value);if(!m)return null;
 if([parts.year,parts.month,parts.day,parts.hour,parts.minute].join("-")!==m.slice(1).join("-"))return null;
 const z=parts.timeZoneName==="GMT-7"?"-07:00":parts.timeZoneName==="GMT-8"?"-08:00":null;
 if(!z||!value.endsWith(z))return null;
 return dt.toISOString();
}
function parseDetail(html,url){
 const official=safeCrystalUrl(url);
 if(!official)return {hold:"Not a first-party Crystal event permalink",url};
 const page=String(html||""),meta=metadata(page);
 if(meta["og:url"]&&safeCrystalUrl(meta["og:url"])!==official)return {hold:"Canonical event page does not match original source URL",url:official};
 if(!/[-–—]\s*Crystal Ballroom\s*$/i.test(meta["og:title"]||"")||
   !/\bat Crystal Ballroom in Portland,\s*OR\b/i.test(meta["og:description"]||""))
  return {hold:"Event page does not explicitly identify the Crystal Ballroom performance room",url:official};
 if(/\b(?:moved to|rescheduled|cancelled|canceled|postponed)\b/i.test(meta["og:title"]||""))return {hold:"Official page reports venue move, cancellation or reschedule",url:official};
 const candidates=schemas(page);
 if(candidates.length!==1)return {hold:"Missing or ambiguous original schema.org Event with a year-bearing date",url:official};
 const e=candidates[0];
 if(typeof e.name!=="string"||!e.name.trim()||!e.startDate)return {hold:"Event is missing name or dated start",url:official};
 if(e.eventStatus&&!/\/EventScheduled$/i.test(e.eventStatus))return {hold:"Event no longer scheduled at this venue",title:e.name,url:official};
 if(/\b(?:moved to|rescheduled|cancelled|canceled|postponed)\b/i.test(e.name))return {hold:"Source title reports changed schedule",title:e.name,url:official};
 const title=decode(e.name.replace(/<[^>]*>/g," ")).replace(/\s+/g," ").trim().slice(0,280);
 const startDate=validPacificInstant(e.startDate);
 if(!startDate)return {hold:"No valid source-published Pacific year, date and performance time",title,url:official};
 if(e["@id"]&&String(e["@id"]).split("#")[0].replace(/\/$/,"")!==official.replace(/\/$/,""))
  return {hold:"Event schema is not for original page permalink",title,url:official};
 const art=eventArtworkFromHtml(page,official);
 return {title,fullUrl:official,startDate,venue:"Crystal Ballroom",
  sourceVerifiedMusic:false,timeEvidence:"Original Crystal Ballroom Event structured data publishes exact Pacific date/year and starting time",
  description:"Original Crystal Ballroom event page; verify doors versus event start, lineup, event status and artwork rights before approval",
  ...(art?{artwork:art}:{})};
}
module.exports={ROOT,safeCrystalUrl,safePageUrl,links,pages,metadata,schemas,validPacificInstant,parseDetail};
