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
// Extract artwork only from the same event's official listing, not sitewide generic art.
function artworkCandidate(raw,pageUrl){
 try{
  if(typeof raw==="object"&&raw)raw=raw.url||raw.contentUrl;
  if(typeof raw!=="string"||!raw.trim())return null;
  const u=new URL(raw,pageUrl);
  if(u.protocol!=="https:"||u.username||u.password||u.href.length>1100)return null;
  if(/\.(?:svg|gif)(?:[?#]|$)/i.test(u.pathname)||/(?:logo|favicon|avatar|placeholder|default|pixel|tracking|site-icon)/i.test(u.pathname))return null;
  return u.href;
 }catch(_){return null;}
}
function eventArtworkFromHtml(html,pageUrl){
 const page=new URL(pageUrl);
 const fromSchema=[];
 for(const m of String(html).matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try{
   const data=JSON.parse(m[1]);
   const candidates=[...Array.isArray(data)?data:[data]];
   for(const obj of candidates.flatMap(x=>Array.isArray(x["@graph"])?x["@graph"]:[x])){
    if(!/Event$/.test(String(obj?.["@type"]||"")))continue;
    for(const candidate of Array.isArray(obj.image)?obj.image:[obj.image])if(candidate)fromSchema.push(candidate);
   }
  }catch(_){}
 }
 const metas=[...String(html).matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
 for(const m of metas){
  const attrs=Object.fromEntries([...m.matchAll(/([A-Za-z:-]+)\s*=\s*["']([^"']*)["']/g)].map(x=>[x[1].toLowerCase(),x[2]]));
  const key=(attrs.property||attrs.name||"").toLowerCase();
  if(key==="og:image"||key==="twitter:image")fromSchema.push(attrs.content);
 }
 const seen=new Set();
 for(const raw of fromSchema){
  const url=artworkCandidate(raw,pageUrl);
  if(!url||seen.has(url))continue;
  seen.add(url);
  // Accept organizer-supplied event-specific art, not a generic page thumbnail.
  return {url,sourceUrl:page.href,origin:"official-event-page",credit:"Official event page",usageApproved:null};
 }
 return null;
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
    sourceVerifiedMusic:true,description:"Official Star Theater event calendar listing",artwork:eventArtworkFromHtml(chunk,url)});
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
   description:"Official Twilight event schema",artwork:eventArtworkFromHtml(html,official),timeEvidence:"Twilight publishes this as performance start",eventFormat:"unverified",venue:source.venue};
}
function parseSoundcontrol(html,source){
 const out=[];
 for(const m of String(html).matchAll(/<a class="append-refer" href="(https:\/\/www\.treetix\.com\/event\?[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)){
  const card=m[2];
  const date=card.match(/<p class="event-date">\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+([A-Za-z]+)\s+(\d{1,2})\s*<br\s*\/?>\s*at\s+([^<]+)<\/p>/i);
  const band=card.match(/<p class="event-header">([\s\S]*?)<\/p>/i);
  const image=card.match(/\/(20\d\d)-(\d\d)-(\d\d)-[^"'\s]*\.(?:jpe?g|png|webp)/i);
  const imgUrls=[...card.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(x=>x[1]);
  const posterUrl=imgUrls.find(x=>/\/images\/events\//i.test(x)&&image&&x.includes(image[0].slice(1)))||null;
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
   timeEvidence:"Soundcontrol roster provides no verified show time",artwork:posterUrl&&artworkCandidate(posterUrl,source.baseUrl)?{url:artworkCandidate(posterUrl,source.baseUrl),sourceUrl:source.url,origin:"official-event-page",credit:"Official promoter event listing",usageApproved:null}:null});
 }
 return out;
}
function parseSoundcontrolDetail(html,record){
 const text=clean(html);
 const date=text.match(/\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+([A-Za-z]+)\s+(\d{1,2}),\s*(20\d\d)\b/i);
 if(!date)return {...record,detailHold:"Ticket page doesn't confirm a full date"};
 const year=Number(date[3]),month=months[date[1].toLowerCase()],day=Number(date[2]);
 const matchDate=[year,String(month).padStart(2,"0"),String(day).padStart(2,"0")].join("-");
 if(matchDate!==record.dateOnly)return {...record,detailHold:"Ticketing date conflicts with promoter listing"};
 if(record.venue&&!text.toLowerCase().includes(record.venue.toLowerCase()))return {...record,detailHold:"Ticketing venue differs from promoter listing"};
 const explicit=text.match(/\b(?:show(?:time)?|music)\s*(?:starts?|at|:)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
 const time=explicit?time24(explicit[1]):null;
 if(!time)return {...record,detailHold:"Ticket page has no explicit AM/PM showtime; stage date-only"};
 const start=wallToPacific(year,month,day,time);
 if(!start)return {...record,detailHold:"Ticket showtime could not be resolved in Portland local time"};
 return {...record,artwork:eventArtworkFromHtml(html,record.fullUrl)||record.artwork,startDate:start,dateOnly:null,timeEvidence:"Explicit show/music time on source-linked TreeTix event page, to be editorially reviewed",
  description:"Promoter and official ticket page both confirm the venue and event date. Performance time appears on ticketing detail."};
}


/* Google Calendar's public iCalendar export is the venue's own announced feed.
   Recurrent masters are never extrapolated; each dated instance must appear in the feed. */
function unfoldIcs(raw){
 return String(raw||"").replace(/\r\n[ \t]|\n[ \t]/g,"").split(/\r?\n/);
}
function icsValue(x){
 return String(x||"").replace(/\\[nN]/g,"\n").replace(/\\,/g,",").replace(/\\;/g,";").replace(/\\\\/g,"\\").trim();
}
function parseBlackWaterIcs(raw,source,minDate){
 if(!/^BEGIN:VCALENDAR\r?\n/.test(raw)||!/\r?\nEND:VCALENDAR\s*$/.test(raw))throw Error("Invalid public Google Calendar iCalendar feed");
 const chunks=unfoldIcs(raw).join("\n").split("BEGIN:VEVENT").slice(1);
 const rows=[],seen=new Set();
 for(const chunk of chunks){
  const lines=chunk.split("END:VEVENT")[0].split("\n");
  const fields=lines.map(l=>{const i=l.indexOf(":");return i<0?null:{key:l.slice(0,i).toUpperCase(),value:l.slice(i+1)}}).filter(Boolean);
  const field=name=>fields.find(f=>f.key.split(";")[0]===name);
  const start=field("DTSTART"),summary=field("SUMMARY"),uid=field("UID");
  if(!start||!summary||!uid)continue;
  if(/^CANCELLED$/i.test(field("STATUS")?.value||""))continue;
  const m=/^(\d{4})(\d\d)(\d\d)(?:T(\d\d)(\d\d)(\d\d)?(Z)?)?$/.exec(start.value);
  if(!m)continue;
  const date=m[1]+"-"+m[2]+"-"+m[3],time=m[4]&&m[5]?m[4]+":"+m[5]:null;
  if(minDate&&date<minDate)continue;
  if(field("RRULE")){rows.push({hold:"Recurring calendar rule needs dated individual instances; no inferred dates",title:icsValue(summary.value)});continue;}
  let startDate=null;
  if(time){
   const tz=start.key.match(/TZID="?([^";]+)"?/i)?.[1];
   if(m[7])startDate=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+(m[6]||0))).toISOString();
   else if(tz==="America/Los_Angeles"||tz==="US/Pacific")startDate=wallToPacific(+m[1],+m[2],+m[3],time);
   else{rows.push({hold:"Timed calendar event with unknown timezone",title:icsValue(summary.value),date});continue;}
  }
  const location=icsValue(field("LOCATION")?.value);
  if(location && !/black\s*water|5115\s*ne\s*sandy|portland/i.test(location)){
   rows.push({hold:"Calendar event may be at another venue",title:icsValue(summary.value),date,location});continue;
  }
  const identity=uid.value+"|"+date;
  if(seen.has(identity))continue;seen.add(identity);
  const title=icsValue(summary.value);
  const desc=icsValue(field("DESCRIPTION")?.value).slice(0,1300);
  rows.push({
    title,uid:uid.value,fullUrl:source.baseUrl+"/",dateOnly:startDate?null:date,
    startDate,sourceVerifiedMusic:false,description:desc||"Official Black Water public calendar entry",
    venue:source.venue,timeEvidence:startDate?"Venue calendar provided a time":"Date confirmed by venue; no time published",
    sourceDateOnly:!startDate,sourceVerifiedEvent:true
  });
 }
 return rows;
}

module.exports={parseStar,parseTwilightLinks,parseTwilightDetail,parseSoundcontrol,parseSoundcontrolDetail,wallToPacific,time24,eventArtworkFromHtml,artworkCandidate,parseBlackWaterIcs};
