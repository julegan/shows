"use strict";
/* Turn! Turn! Turn! embeds its own official OpenDate event roster.
 * Read-only, bounded HTML fetches. No guessed dates, genres or usage rights.
 * Every candidate requires a matching event-specific official ticketing page.
 */
const {wallToPacific,time24}=require("./priority-importers");
const CALENDAR_URL="https://app.opendate.io/v/turn-turn-turn-3116?layout=iframe";
const VENUE="Turn! Turn! Turn!";
const ADDRESS="8 NE Killingsworth St, Portland, OR 97211";
const months=["january","february","march","april","may","june","july","august","september","october","november","december"];
function decode(value){
 return String(value||"").replace(/&(?:amp|quot|apos|lt|gt|nbsp|#\d+|#x[\da-f]+);/gi,raw=>{
  const entity={"&amp;":"&","&quot;":'"',"&apos;":"'","&lt;":"<","&gt;":">","&nbsp;":" "}[raw.toLowerCase()];
  if(entity!==undefined)return entity;
  const n=raw.toLowerCase().startsWith("&#x")?parseInt(raw.slice(3,-1),16):Number(raw.slice(2,-1));
  return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):"";
 });
}
function textOf(html){
 return decode(String(html||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ")).trim();
}
function officialEventUrl(raw){
 try{
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.hostname!=="app.opendate.io"||u.port||u.username||u.password||u.search||u.hash||
   !/^\/e\/[a-z0-9][a-z0-9-]*-(?:20\d{2})-\d{5,12}$/i.test(u.pathname))return null;
  return u.href;
 }catch(_){return null;}
}
function officialArtwork(raw,eventUrl){
 if(!raw)return null;
 try{
  const u=new URL(decode(raw));
  if(u.protocol!=="https:"||u.username||u.password||u.hostname!=="s3.amazonaws.com"||u.port||
   !/^\/opendate-aws-assets\/confirms\/main_event_images\/\d{3}\/\d{3}\/\d{3}\/compressed\/[^/]+\.(?:jpg|jpeg|png|webp)$/i.test(u.pathname)||
   u.href.length>1100)return null;
  return {url:u.href,sourceUrl:eventUrl,origin:"official-event-page",credit:"Organizer-provided OpenDate event image",usageApproved:null};
 }catch(_){return null;}
}
function rosterDate(raw){
 const m=/^([A-Za-z]+)\s+(\d{1,2}),\s+(20\d{2})$/.exec(raw);
 const month=months.indexOf((m?.[1]||"").toLowerCase())+1,day=Number(m?.[2]),year=Number(m?.[3]);
 if(!month||year<2026||year>2035||!day)return null;
 const date=new Date(Date.UTC(year,month-1,day,12));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
 return {year,month,day,iso:[year,String(month).padStart(2,"0"),String(day).padStart(2,"0")].join("-")};
}
function dateAndTime(raw){
 const m=/^Doors:\s*(\d{1,2}(?::\d\d)?\s*(?:AM|PM))\s*-\s*Show:\s*(\d{1,2}(?::\d\d)?\s*(?:AM|PM))$/i.exec(raw);
 if(!m)return null;
 const doors=time24(m[1]),show=time24(m[2]);
 return doors&&show?{doors,show}:null;
}
function parseRoster(html){
 const body=String(html||"");
 if(!/Turn!\s*Turn!\s*Turn!/.test(body)||!/public-listing-date/.test(body))throw Error("Unexpected Turn OpenDate roster, refusing to import");
 const chunks=body.split(/<div\s+class=['"]col-12 col-sm-6 col-md-4 col-xl-3['"][^>]*>/i).slice(1);
 if(!chunks.length||chunks.length>110)throw Error("OpenDate roster has no safe event-card section or exceeds 110 items");
 const rows=[],held=[];
 for(const chunk of chunks){
  const a=chunk.match(/<a\b[^>]*\bhref=['"](https:\/\/app\.opendate\.io\/e\/[^'"]+)['"][^>]*>\s*<strong>([\s\S]*?)<\/strong>/i);
  if(!a)continue;
  const url=officialEventUrl(a[1]),title=textOf(a[2]);
  const dates=[...chunk.matchAll(/<p\b[^>]*class=['"][^'"]*\bpublic-listing-date\b[^'"]*['"][^>]*>([\s\S]*?)<\/p>/gi)].map(m=>textOf(m[1]));
  const date=rosterDate(dates[0]),times=dateAndTime(dates[1]);
  const img=chunk.match(/<img\b[^>]*\bsrc=['"]([^'"]+)['"]/i)?.[1];
  const venueVerified=/Turn!\s*Turn!\s*Turn!\s*(?:•|&bull;|&#8226;)\s*Portland,\s*OR/i.test(textOf(chunk));
  if(!url||!title||title.length>260||!date||!times||!venueVerified){
   held.push({hold:"OpenDate card identity, location, date or explicitly labeled time cannot be verified",title,url});
   continue;
  }
  const iso=wallToPacific(date.year,date.month,date.day,times.show);
  if(!iso){held.push({hold:"Invalid or nonexistent Portland-local performance time",title,url});continue;}
  rows.push({title,fullUrl:url,startDate:iso,doorsLocal:times.doors,dateOnly:date.iso,venue:VENUE,
   artwork:officialArtwork(img,url),
   timeEvidence:"Official venue-embedded OpenDate listing explicitly labels separate doors and show times; scheduled show time is the event start.",
   description:"Official Turn! Turn! Turn! show/ticket listing. Separate source-event format verification pending."});
 }
 if(!rows.length&&!held.length)throw Error("No dated or held original OpenDate event cards; inspect provider template");
 const seen=new Set(),dedup=[];
 for(const r of rows){
  if(seen.has(r.fullUrl)){held.push({hold:"Repeated OpenDate event permalink in one roster",url:r.fullUrl,title:r.title});continue;}
  seen.add(r.fullUrl);dedup.push(r);
 }
 return [...dedup,...held];
}
function eventSchema(html){
 const found=[...String(html).matchAll(/<script\b[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gi)];
 for(const m of found)try{
  const data=JSON.parse(m[1]);
  const objects=[data,...(Array.isArray(data["@graph"])?data["@graph"]:[])];
  const e=objects.find(x=>x&&["Event","MusicEvent"].includes(x["@type"]));
  if(e)return e;
 }catch(_){}
 return null;
}
function parseDetail(html,card){
 const schema=eventSchema(html);
 const date=card.dateOnly, url=card.fullUrl;
 if(!schema)return {hold:"Original OpenDate detail lacks valid event schema",title:card.title,url};
 const place=schema.location||{},addr=place.address||{};
 const target=officialEventUrl(schema.offers?.url);
 if(place.name!==VENUE||!/^8\s+NE\s+Killingsworth\s+St/i.test(addr.streetAddress||"")||
  addr.addressLocality!=="Portland"||addr.addressRegion!=="OR"||
  (target&&target!==url)||String(schema.startDate||"").slice(0,10)!==date)
  return {hold:"Original ticket event venue, URL or published date disagrees with venue roster",title:card.title,url};
 const oldName=textOf(card.title).toLowerCase().replace(/[^a-z0-9]/g,"");
 const newName=textOf(schema.name).toLowerCase().replace(/[^a-z0-9]/g,"");
 if(!newName||newName!==oldName)return {hold:"Original ticket event headline disagrees with calendar",title:card.title,url};
 const status=String(schema.eventStatus||"").toLowerCase();
 if(/cancel|postpon|resched|moved/.test(status))
  return {hold:"Official OpenDate event status requires cancellation/reschedule review: "+status,title:card.title,url};
 if(!/EventScheduled$/.test(status))return {hold:"Missing or unsupported official ticket-event status",title:card.title,url};
 const description=textOf(schema.description||"").slice(0,950);
 const explicitMusic=/\b(?:live music|live band|bands?|concert|musician|music performance|punk show|music set|DJ set|live show)\b/i.test(description);
 return {...card,sourceVerifiedMusic:schema["@type"]==="MusicEvent"||explicitMusic,
  sourceEventType:schema["@type"],
  description:"Original OpenDate event detail: "+(description||"Event-specific description not published."),
  artwork:officialArtwork(schema.image,url)||card.artwork};
}
module.exports={CALENDAR_URL,VENUE,ADDRESS,officialEventUrl,officialArtwork,rosterDate,dateAndTime,parseRoster,eventSchema,parseDetail};
