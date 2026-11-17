"use strict";
/*
 * A Beat Happening original Squarespace event collection.
 * Events are independently dated organizer announcements, never generated
 * from monthly programming or third-party social calendar estimates.
 */
const SOURCE="https://abeathappening.org/events?format=json";
const ORIGIN="https://abeathappening.org";
const MAX_BYTES=2500000;
const clean=(value,limit=1000)=>String(value??"")
 .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
 .replace(/<[^>]*>/g," ")
 .replace(/&(?:amp|lt|gt|quot|apos|nbsp);/gi,c=>({
  "&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'","&nbsp;":" "
 }[c.toLowerCase()]))
 .replace(/\s+/g," ").trim().slice(0,limit);
function eventUrl(value){
 try{
  const u=new URL(value,ORIGIN);
  if(u.protocol!=="https:"||!["abeathappening.org","www.abeathappening.org"].includes(u.hostname)||
     u.username||u.password||u.port||u.search||u.hash||u.href.length>440)return null;
  return /^\/events\/20\d\d\/(?:[1-9]|1[0-2])\/(?:[1-9]|[12]\d|3[01])\/[a-z0-9][a-z0-9-]{1,180}\/?$/i.test(u.pathname)?u.href:null;
 }catch(_){return null;}
}
function record(raw){
 if(!raw||typeof raw!=="object")return {hold:"Malformed original organizer record"};
 const title=clean(raw.title,200),url=eventUrl(raw.fullUrl);
 if(!title||!url)return {title,hold:"Missing original dated organizer event URL or title"};
 const fail=hold=>({title,url,hold});
 if(/\b(?:cancelled|canceled|postponed|rescheduled)\b/i.test(title)||
    /^(?:cancelled|canceled|postponed|rescheduled)$/i.test(String(raw.status||"")))
  return fail("Original organizer marks this event changed or cancelled; manual review required");
 const start=raw.startDate,end=raw.endDate;
 if(!Number.isSafeInteger(start)||start<1700000000000||start>2400000000000||
    !Number.isSafeInteger(end)||end<start||end-start>72*3600000)
  return fail("Original organizer event has incomplete or contradictory start/end timestamps");
 if(raw.timeZone&& !["America/Los_Angeles","US/Pacific"].includes(raw.timeZone))
  return fail("Original event timezone is not verified as Pacific");
 const loc=raw.location||{};
 const place=clean(loc.addressTitle||loc.name,140).replace(/[’‘]/g,"'");
 const street=clean(loc.addressLine1||loc.streetAddress,180);
 // The original ABH October 2026 calendar supplies this venue and address.
 // Different original venues must be reviewed before being mapped to Portland.
 if(!/^l'atelier yaffe$/i.test(place)||!/\b111\b.*\bmartin luther king\b/i.test(street))
  return fail("New or unverified organizer venue/location; check city, street and original event page");
 const detail=clean(raw.excerpt||raw.body,600);
 const explicitMusic=/\b(?:hip[\s-]?hop|rap(?:pers?|ping)?|r\s*&\s*b|beatmakers?|producer\s+(?:and|&)\s+DJ|DJ\s+(?:and|&)\s+producer|DJ\s+sets?|live\s+music|live\s+beats?|concert|music\s+showcase)\b/i.test(
   [title,clean(raw.body,1800),detail].join(" "));
 const sourceTags=[...(Array.isArray(raw.categories)?raw.categories:[]),
  ...(Array.isArray(raw.tags)?raw.tags:[])].filter(v=>typeof v==="string").map(x=>clean(x,70)).slice(0,10);
 const hints=(detail.match(/\b(?:hip[\s-]?hop|r\s*&\s*b|rnb|neo[\s-]?soul|rap|funk|jazz)\b/gi)||[]).slice(0,5);
 return {title,fullUrl:url,venue:"L'Atelier Yaffe",
  address:"111 NE Martin Luther King Jr Blvd, Portland, OR 97232",
  neighborhood:"Central Eastside",startDate:start,sourceEventId:String(raw.id||""),
  sourceVerifiedMusic:explicitMusic,tags:[...new Set([...sourceTags,...hints])],
  description:"Original A Beat Happening event details: "+detail,
  timeEvidence:"Original organizer calendar specifies an individual dated event clock; doors versus performance start is not independently confirmed."};
}
function parse(payload,{now=new Date()}={}){
 if(!payload||typeof payload!=="object"||
    payload.collection?.fullUrl!=="/events"||payload.collection?.urlId!=="events")
  throw Error("Unexpected A Beat Happening original events collection identity");
 const items=Array.isArray(payload.upcoming)?payload.upcoming:payload.items;
 if(!Array.isArray(items)||items.length>400)throw Error("Original organizer calendar lacks a bounded event batch");
 const rows=[],seen=new Set();
 for(const item of items){
  // Some Squarespace versions return historical items as well as upcoming.
  // Historical rows are not mistaken for new pending shows.
  const ts=item?.startDate;
  if(Number.isSafeInteger(ts)&&ts<now.valueOf()-86400000)continue;
  const result=record(item),key=result.fullUrl||result.url;
  if(key&&seen.has(key)){rows.push({...result,hold:"Duplicate original organizer permalink in collection"});continue;}
  if(key)seen.add(key);
  rows.push(result);
 }
 return rows;
}
async function fetchEvents(source,request=fetch,now=new Date()){
 if(source?.id!=="a-beat-happening"||source.adapter!=="a-beat-happening-squarespace"||
    source.url!==SOURCE||source.baseUrl!==ORIGIN)throw Error("Unapproved A Beat Happening source");
 const response=await request(SOURCE,{method:"GET",redirect:"error",
  headers:{Accept:"application/json","User-Agent":"SHOWS-event-review/0.1"},
  signal:AbortSignal.timeout(18000)});
 if(!response.ok||!String(response.headers?.get("content-type")||"").toLowerCase().includes("json"))
  throw Error("Original A Beat Happening events JSON unavailable: HTTP "+response.status);
 const body=await response.text();
 if(body.length>MAX_BYTES)throw Error("Original organizer calendar exceeds 2.5MB");
 let data;
 try{data=JSON.parse(body)}catch(_){throw Error("Original organizer calendar was not JSON");}
 const rows=parse(data,{now});
 if(data.pagination?.nextPage===true)
  console.warn("ABH original calendar indicates additional pages; collected source batch is partial");
 return rows;
}
module.exports={SOURCE,ORIGIN,eventUrl,clean,record,parse,fetchEvents};
