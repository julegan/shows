"use strict";
/* Original Alberta Street Pub Squarespace /music?format=json event source.
 * Never infer occurrence dates from reusable URLs: recurring shows often keep
 * historic /music/2023/... page slugs while source startDate is current.
 */
const CALENDAR="https://www.albertastreetpub.com/music?format=json";
const ORIGIN="https://www.albertastreetpub.com";
function eventUrl(raw){
 try{
  const u=new URL(raw,ORIGIN);
  if(u.protocol!=="https:"||u.hostname!=="www.albertastreetpub.com"||u.username||u.password||u.port||u.search||u.hash)return null;
  return /^\/music\/20\d\d\/(?:[1-9]|1[0-2])\/(?:[1-9]|[12]\d|3[01])\/[a-z0-9][a-z0-9-]{1,220}\/?$/i.test(u.pathname)?u.href:null;
 }catch(_){return null}
}
function clean(raw,limit=800){
 return String(raw||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," ")
  .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,h,d)=>{
   const n=parseInt(h||d,h?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):" ";
  })
  .replace(/&(?:amp|lt|gt|quot|apos|nbsp);/gi,x=>({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'","&nbsp;":" "}[x.toLowerCase()])).replace(/\s+/g," ").trim().slice(0,limit);
}
function originalArtwork(raw,source){
 try{
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.hostname!=="images.squarespace-cdn.com"||u.username||u.password||u.port||
    !/^\/content\/v1\/54109e68e4b06b163549a8dc\//.test(u.pathname)||!/\.(?:png|jpe?g|webp)$/i.test(u.pathname))return null;
  return {url:u.href,sourceUrl:source,origin:"official-venue-calendar",credit:"Alberta Street Pub official event calendar",usageApproved:null};
 }catch(_){return null}
}
function record(x){
 if(!x||typeof x!=="object")return {hold:"Malformed original venue event"};
 const title=clean(x.title,220),url=eventUrl(x.fullUrl);
 if(!title||!url)return {hold:"No event-specific title or public venue URL",title};
 const loc=x.location||{};
 if(clean(loc.addressTitle,100)!=="Alberta Street Pub"||clean(loc.addressLine1,100)!=="1036 NE Alberta Street")
  return {hold:"Source location does not identify Alberta Street Pub",title,url};
 const start=x.startDate,end=x.endDate;
 if(!Number.isSafeInteger(start)||start<1700000000000||start>2400000000000||!Number.isSafeInteger(end)||end<start||end-start>86400000*3)
  return {hold:"Original venue event has invalid or contradictory dates",title,url};
 if(/\b(?:cancelled|canceled|postponed|rescheduled|moved to)\b/i.test(title))
  return {hold:"Event is cancelled, postponed or moved; requires review",title,url};
 const description=clean(x.body||x.excerpt,650);
 const explicitMusic=/\b(?:live\s+(?:music|band|jazz)|DJ(?:\s+set)?|bands?\s+(?:performing|playing)|music\s+by\s+DJ|hip[\s-]?hop\s+(?:show|concert))\b/i.test([title,description].join(" "));
 const categories=Array.isArray(x.categories)?x.categories.filter(y=>typeof y==="string").slice(0,6):[];
 const tags=Array.isArray(x.tags)?x.tags.filter(y=>typeof y==="string").slice(0,6):[];
 const art=originalArtwork(x.assetUrl,url);
 return {title,fullUrl:url,venue:"Alberta Street Pub",startDate:start,
  sourceEventId:String(x.id||""),sourceVerifiedMusic:explicitMusic,categories,tags,
  description:"Original venue event listing. "+description,
  timeEvidence:"Alberta Street Pub's original Squarespace event record supplies the start and end timestamp; exact performance-versus-doors distinction is unconfirmed.",
  ...(art?{artwork:art}:{})
 };
}
function parse(payload){
 if(!payload||typeof payload!=="object"||!Array.isArray(payload.upcoming)||!payload.upcoming.length||payload.upcoming.length>200)
  throw Error("Original Alberta Street Pub upcoming venue calendar unavailable");
 if(payload.collection?.fullUrl!=="/music"||payload.collection?.urlId!=="music")
  throw Error("Unexpected Alberta Street Pub collection identity "+JSON.stringify({fullUrl:payload.collection?.fullUrl,urlId:payload.collection?.urlId,title:payload.collection?.title}));
 const seen=new Set(),records=[];
 for(const item of payload.upcoming){
  const parsed=record(item);
  const key=parsed.fullUrl+"|"+String(item.startDate||"");
  if(seen.has(key))continue;
  seen.add(key);records.push(parsed);
 }
 if(!records.some(r=>r.startDate))throw Error("Alberta Street Pub public event batch contains no verified source dates");
 return {records,partial:payload.pagination?.nextPage===true};
}
async function fetchEvents(src,request=fetch){
 if(src?.id!=="alberta-street-pub"||src.adapter!=="alberta-squarespace-json"||
   src.url!==CALENDAR||src.baseUrl!==ORIGIN)throw Error("Unexpected Alberta original venue source config");
 const r=await request(CALENDAR,{headers:{Accept:"application/json","User-Agent":"SHOWS-event-review/0.1"},
   redirect:"error",signal:AbortSignal.timeout(18000)});
 if(!r.ok||!r.headers.get("content-type")?.includes("json"))throw Error("Alberta original venue source returned HTTP "+r.status+" or non-JSON");
 const raw=await r.text();
 if(raw.length>3000000)throw Error("Alberta calendar exceeded 3 MB source limit");
 const result=parse(JSON.parse(raw));
 if(result.partial)console.warn("ALBERTA: Squarespace collection indicates additional pages, so reported coverage is a bounded upcoming batch, not full archive");
 return result.records;
}
module.exports={CALENDAR,ORIGIN,eventUrl,clean,originalArtwork,record,parse,fetchEvents};
