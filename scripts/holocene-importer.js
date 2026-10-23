"use strict";
/* Public Holocene original calendar and schema.org Event details.
 * A source-published start timestamp may mean doors rather than performance;
 * retain that caveat in review descriptions, never call it a verified showtime.
 */
const {eventArtworkFromHtml}=require("./priority-importers");
const HOST="https://www.holocene.org";
const plain=s=>String(s||"").replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,h,d)=>String.fromCodePoint(parseInt(h||d,h?16:10)))
 .replace(/&(?:amp|apos|quot|nbsp|lt|gt);/gi,x=>({"&amp;":"&","&apos;":"'","&quot;":'"',"&nbsp;":" ","&lt;":"<","&gt;":">"}[x.toLowerCase()]||" "))
 .replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
function safeUrl(raw){
 try{
  const u=new URL(String(raw||"").replace(/&amp;/gi,"&"),HOST);
  if(u.protocol!=="https:"||u.hostname!=="www.holocene.org"||u.port||u.username||u.password||u.search||u.hash)return null;
  return /^\/event\/[a-z0-9][a-z0-9-]*\/[a-z0-9-]+\/(?:portland|portland-oregon)\/?$/i.test(u.pathname)?u.href:null;
 }catch(_){return null}
}
function links(html){
 const found=[],seen=new Set();
 for(const m of String(html||"").matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)){
  const u=safeUrl(m[1]);if(u&&!seen.has(u)){seen.add(u);found.push(u)}
 }
 if(!found.length||found.length>135)throw Error("Holocene official event archive layout unexpected");
 return found;
}
function schemaEvents(html){
 const events=[];
 for(const m of String(html||"").matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try{
   const root=JSON.parse(m[1]),queue=Array.isArray(root)?root:[root];
   for(const x of queue){
    const elements=Array.isArray(x["@graph"])?x["@graph"]:[x];
    for(const e of elements)if(String(e?.["@type"]||"").split(",").some(x=>/^(Music)?Event$/i.test(x.trim())))events.push(e);
   }
  }catch(_){}
 }
 return events;
}
function parseDetail(html,url){
 const primary=safeUrl(url);
 if(!primary)return {hold:"Event URL does not match original Holocene calendar",url};
 const data=schemaEvents(html);
 if(data.length!==1)return {hold:"Missing or ambiguous source-published event schema with a year",url:primary};
 const e=data[0],title=plain(e.name).slice(0,280),loc=Array.isArray(e.location)?e.location[0]:e.location;
 if(!title)return {hold:"No official event title",url:primary};
 if(/\b(rescheduled|cancelled|canceled|postponed|moved to)\b/i.test(title)||e.eventStatus&&!/\/EventScheduled$/i.test(e.eventStatus))
  return {hold:"Source marks changed schedule or cancellation",title,url:primary};
 if(!loc||!/\bHolocene\b/i.test(String(typeof loc==="string"?loc:loc.name||"")))return {hold:"Source schema does not confirm the Holocene venue",title,url:primary};
 // Event times can be labeled as doors by the site, and this is disclosed.
 if(typeof e.startDate!=="string"||!/^20\d\d-\d\d-\d\dT\d\d:\d\d(?::\d\d)?(?:-07:00|-08:00|-0700|-0800)$/.test(e.startDate))
  return {hold:"Missing original dated event timezone",title,url:primary};
 const date=new Date(e.startDate);if(!Number.isFinite(date.valueOf()))return {hold:"Invalid original event timestamp",title,url:primary};
 const pieces=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZoneName:"shortOffset"}).formatToParts(date).map(p=>[p.type,p.value]));
 const input=e.startDate.match(/^(20\d\d-\d\d-\d\d)T(\d\d):(\d\d)/),offset=(e.startDate.match(/([+-]\d{2}:?\d{2})$/)?.[1]||"").replace(/^([+-]\d\d)(\d\d)$/,"$1:$2");
 const local=[pieces.year,pieces.month,pieces.day].join("-");
 const tz=pieces.timeZoneName==="GMT-7"?"-07:00":pieces.timeZoneName==="GMT-8"?"-08:00":"";
 if(!input||local!==input[1]||pieces.hour!==input[2]||pieces.minute!==input[3]||tz!==offset)
  return {hold:"Source timestamp disagrees with Portland timezone/DST",title,url:primary};
 if(e.url&&safeUrl(e.url)!==primary)return {hold:"Event structured URL conflicts with original page",title,url:primary};
 const artwork=eventArtworkFromHtml(html,primary);
 return {title,venue:"Holocene",fullUrl:primary,startDate:date.toISOString(),sourceVerifiedMusic:/\b(concert|punk|goth|post-punk|darkwave|dj)\b/i.test(title),
  timeEvidence:"Original Holocene structured event data publishes a date/year and time; the site may label this as doors, not performance start",
  description:"Original venue event page; confirm actual performance start versus doors, event status and image rights during review",
  ...(artwork?{artwork}:{})};
}
module.exports={safeUrl,links,schemaEvents,parseDetail};
