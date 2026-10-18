"use strict";
/* Public venue HTML importers. No authentication, browser-evasion, or guessed dates/times. */
const months={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
const clean=s=>String(s||"").replace(/<br\s*\/?>/gi," • ").replace(/<[^>]*>/g," ").replace(/&#0?39;|&apos;/gi,"'").replace(/&quot;/gi,'"').replace(/&amp;/gi,"&").replace(/&nbsp;/gi," ").replace(/\s+/g," ").trim();
const htmlBlocks=(s,start)=>String(s||"").split(start).slice(1);
function time24(text){
 const m=/^\s*(\d{1,2})(?::(\d\d))?\s*(am|pm)\s*$/i.exec(text||"");
 if(!m)return null;
 let h=Number(m[1])%12;if(m[3].toLowerCase()==="pm")h+=12;
 return String(h).padStart(2,"0")+":"+(m[2]||"00");
}
function wallToPacific(year,month,day,tm){
 if(!tm||month<1||month>12||day<1||day>31)return null;
 const [hh,mm]=tm.split(":").map(Number);
 if(hh>23||mm>59||year<2026||year>2035)return null;
 const guess=Date.UTC(year,month-1,day,hh+8,mm);
 const date=new Date(guess);
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);
 const obj=Object.fromEntries(parts.map(p=>[p.type,p.value]));
 const off=obj.hour===String(hh).padStart(2,"0")&&obj.minute===String(mm).padStart(2,"0")?8:7;
 const utc=new Date(Date.UTC(year,month-1,day,hh+off,mm));
 const p=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(utc).map(p=>[p.type,p.value]));
 if(p.year!==String(year)||p.month!==String(month).padStart(2,"0")||p.day!==String(day).padStart(2,"0")||p.hour!==String(hh).padStart(2,"0")||p.minute!==String(mm).padStart(2,"0"))return null;
 return utc.toISOString(); // Equivalent instant; canonical importer converts to explicit Pacific offset.
}
function primaryUrl(raw,source,path){
 try{
  const u=new URL(raw,source.baseUrl);
  const base=new URL(source.baseUrl);
  if(u.protocol!=="https:"||u.hostname!==base.hostname||!u.pathname.startsWith(path))return null;
  u.search="";u.hash="";return u.href;
 }catch(_){return null;}
}
function parseStar(html,source){
 const chunks=htmlBlocks(html,/<div class="tw-section">/i);
 const out=[];
 for(const chunk of chunks){
  const name=chunk.match(/<div class="tw-name">\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  const dm=chunk.match(/<span class="tw-event-date">\s*([A-Za-z]+)\s+(\d{1,2}),\s*(20\d{2})\s*<\/span>/i);
  const t=clean(chunk.match(/<span class="tw-event-time">\s*([\s\S]*?)<\/span>/i)?.[1]);
  const url=primaryUrl(name?.[1],source,"/tm-event/");
  if(!name||!dm||!url){continue;}
  const title=clean(name[2]),month=months[dm[1].toLowerCase()],day=Number(dm[2]),year=Number(dm[3]),tm=time24(t);
  const iso=wallToPacific(year,month,day,tm);
  out.push({title,fullUrl:url,startDate:iso,dateOnly:iso?null:[year,String(month).padStart(2,"0"),String(day).padStart(2,"0")].join("-"),
    timeEvidence:tm?"Official Star Theater listing identifies show time":"No verified Star Theater performance time",
    sourceVerifiedMusic:true,description:"Official Star Theater event calendar listing"});
 }
 return out;
}
function parseTwilightLinks(html,source){
 const result=[],seen=new Set();
 for(const m of String(html).matchAll(/href=["'](\/event\/\d+\/[^"'?#]+)["']/gi)){
  const url=primaryUrl(m[1],source,"/event/");
  if(url&&!seen.has(url)){seen.add(url);result.push(url);}
 }
 return result.slice(0,75);
}
function parseTwilightDetail(html,detailUrl,source){
 const scripts=[...String(html).matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
 let event;
 for(const match of scripts){
  try{
   const obj=JSON.parse(match[1]);
   if(obj["@type"]==="Event"){event=obj;break;}
   if(Array.isArray(obj["@graph"]))event=obj["@graph"].find(x=>x["@type"]==="Event");
   if(event)break;
  }catch(_){}
 }
 if(!event||!event.name||!event.startDate)return {hold:"Missing event JSON-LD schema",url:detailUrl};
 const official=primaryUrl(detailUrl,source,"/event/");
 if(!official)return {hold:"Event URL outside official venue host",url:detailUrl};
 const start=new Date(event.startDate);
 if(!Number.isFinite(start.valueOf()))return {hold:"Invalid event schema start date",url:official};
 const status=String(event.eventStatus||"").toLowerCase();
 if(/cancelled|canceled|postponed|rescheduled|moved/.test(status))return {hold:"Venue event status requires cancellation/reschedule review",title:clean(event.name),url:official};
 const location=typeof event.location?.name==="string"?event.location.name:"";
 if(location&&!/twilight/i.test(location))return {hold:"Event location is no longer Twilight",title:clean(event.name),url:official};
 return {title:clean(event.name),startDate:event.startDate,fullUrl:official,sourceVerifiedMusic: !!(event.performer||/live|music|concert/i.test(event.description||"")),
   description:"Official Twilight event schema",timeEvidence:"Twilight publishes this as performance start",eventFormat:"unverified",venue:source.venue};
}
function parseSoundcontrol(html,source){
 const out=[];
 for(const m of String(html).matchAll(/<a class="append-refer" href="(https:\/\/www\.treetix\.com\/event\?[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)){
  const card=m[2];
  const date=card.match(/<p class="event-date">\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+([A-Za-z]+)\s+(\d{1,2})\s*<br\s*\/?>\s*at\s+([^<]+)<\/p>/i);
  const band=card.match(/<p class="event-header">([\s\S]*?)<\/p>/i);
  const image=card.match(/\/(20\d\d)-(\d\d)-(\d\d)-[^"'\s]*\.(?:jpe?g|png|webp)/i);
  if(!date||!band||!image)continue;
  const month=months[date[1].toLowerCase()],day=Number(date[2]),year=Number(image[1]);
  if(month!==Number(image[2])||day!==Number(image[3])){out.push({hold:"Poster filename date conflicts with event card",title:clean(band[1]),url:m[1]});continue;}
  const u=new URL(m[1]);
  if(u.hostname!=="www.treetix.com"||u.searchParams.get("cal")!=="soundcontrol")continue;
  const venue=clean(date[3]);
  const title=clean(band[1]);
  // Source lists the year, date and venue, but not a showtime: stage for review, do not fabricate.
  out.push({title,fullUrl:u.href,dateOnly:[year,String(month).padStart(2,"0"),String(day).padStart(2,"0")].join("-"),
   venue,sourceVerifiedMusic:true,description:"Promoter's own event listing; time must be verified at original ticket page",
   timeEvidence:"Soundcontrol roster provides no verified show time"});
 }
 return out;
}
module.exports={parseStar,parseTwilightLinks,parseTwilightDetail,parseSoundcontrol,wallToPacific,time24};
