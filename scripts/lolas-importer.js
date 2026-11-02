"use strict";
/* McMenamins Lola's Room: independent original room calendar. Validate the
 * roster's year-bearing autocomplete search index against each labelled card,
 * then read original details to hold multiroom, moved or changed bookings.
 * Do not conflate with Crystal Ballroom main stage.
 */
const mission=require("./mission-importer");
const {wallToPacific,artworkCandidate}=require("./priority-importers");
const ROOT="https://www.mcmenamins.com";
const CALENDAR_URL=ROOT+"/crystal-ballroom/lolas-room/music-events/";
const VENUE="Lola's Room";
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const norm=s=>mission.eventUrl(String(s||""))||null;
const plain=s=>String(s||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
 .replace(/<[^>]*>/g," ").replace(/&(?:amp|#38);/gi,"&")
 .replace(/&(?:apos|#39|#x27);/gi,"'").replace(/&(?:nbsp|#160);/gi," ")
 .replace(/\s+/g," ").trim();
const token=s=>plain(s).toLowerCase().replace(/[^a-z0-9]/g,"");
function dateFromRecord(record,weekdayText){
 if(!/^\d{1,2}\/\d{1,2}\/20\d\d$/.test(record?.date||""))return null;
 const [month,day,year]=record.date.split("/").map(Number),dt=new Date(Date.UTC(year,month-1,day));
 if(dt.getUTCFullYear()!==year||dt.getUTCMonth()!==month-1||dt.getUTCDate()!==day)return null;
 const expected=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dt.getUTCDay()]+", "+MONTHS[month-1]+" "+day;
 if(expected!==weekdayText)return null;
 return {year,month,day,fullDate:[year,String(month).padStart(2,"0"),String(day).padStart(2,"0")].join("-"),expected};
}
function roster(html){
 const raw=String(html||"");
 const blocks=[...raw.matchAll(/<div class="[^"]*\bevent detailed(?: movie)?"[^>]*>/g)];
 if(!blocks.length||blocks.length>110)throw Error("Lola original calendar cards absent or oversized; not zero events");
 const indexed=mission.sourceIndex(raw),items=[],seen=new Map(),counts=new Map();
 for(let i=0;i<blocks.length;i++){
  const block=raw.slice(blocks[i].index,blocks[i+1]?.index||raw.length).slice(0,26000);
  const title=plain(block.match(/<h3 class="uk-panel-title">([\s\S]*?)<\/h3>/)?.[1]);
  const url=mission.eventUrl(block.match(/<a\b[^>]*href=["']([^"']+)["']/)?.[1]||"");
  const venue=plain(block.match(/at\s*<span>([^<]+)<\/span>/)?.[1]);
  if(venue!==VENUE){items.push({skip:"Non-Lola event card excluded",title,venue});continue;}
  if(!url||!title){items.push({hold:"Lola card lacks original event identity",title});continue;}
  const heads=[...block.matchAll(/<h3 class="uk-panel-title">([\s\S]*?)<\/h3>/g)].map(x=>plain(x[1]));
  const weekday=heads.find(x=>/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),/.test(x));
  const record=indexed.get(url);
  const date=dateFromRecord(record,weekday);
  const time=plain(block.match(/<p class="uk-panel-time[^\"]*">([\s\S]*?)<\/p>/)?.[1]);
  let hold=null;
  if(!record||!date||token(record.title)!==token(title))hold="Official Lola card title, weekday and full-year search record disagree";
  if(/\b(?:cancelled|canceled|postponed|rescheduled|moved to)\b/i.test(title))hold="Original booking status changed";
  if(/\b\d{1,2}\s*[-–]\s*\d{1,2}\s*[ap]m\b/i.test(time)||/\b(?:TBA|TBD)\b/i.test(time))hold="Time range or TBA is not a published event start";
  const parsed=mission.times(time);
  if(!parsed||!parsed.clock)hold="No unique show, dance, presentation or listed event clock";
  const stamp=date&&parsed&&!hold?wallToPacific(date.year,date.month,date.day,parsed.clock):null;
  if(!hold&&!stamp)hold="Invalid or ambiguous Pacific date/time";
  // Source-confirmed November 21 2010s dance is a combined Crystal + Lola
  // admission; New Year's Eve roster explicitly names 2010s in Lola and a
  // shared Y2K Ball. Hold them rather than duplicate a complex-wide event.
  if(url&&/(?:\/events\/278428-|\/events\/278503-)/.test(url))
   hold="Shared Crystal Ballroom and Lola's Room event needs room-specific review";
  if(!hold&&parsed?.doors){
   const doors=wallToPacific(date.year,date.month,date.day,require("./priority-importers").time24(parsed.doors));
   if(!doors||Date.parse(doors)>Date.parse(stamp))hold="Doors cannot occur after published event time";
  }
  const image=block.match(/background-image:url\('([^']+)'\)/)?.[1];
  let artwork;
  if(image){try{
   const u=new URL(image);
   if(u.protocol==="https:"&&u.hostname==="cdn.mcmenamins.com"&&u.pathname.startsWith("/system/uploads/MadborgAssets/")&&artworkCandidate(u.href,url))
    artwork={url:u.href,sourceUrl:url,origin:"official-venue-calendar",credit:"McMenamins Lola's Room original event-card image",usageApproved:null};
  }catch(_){}}
  const row=hold?{hold,title,url}:{
   title,fullUrl:url,startDate:stamp,venue:VENUE,
   rosterDate:date.fullDate,rosterTime:time,sourceVerifiedMusic:false,
   categories:parsed.kind==="presentation"?["Presentation"]:parsed.kind==="film"?["Film screening"]:[],
   timeEvidence:"Original Lola's Room calendar date, year-bearing search record and event card agree; time labelled "+parsed.kind+".",
   description:"Official Lola's Room event; confirm multiroom venue, format, time and artwork permission before publication.",
   ...(artwork?{artwork}:{})
  };
  if(seen.has(url)){
   const old=seen.get(url);
   if(JSON.stringify(old)!==JSON.stringify(row)){
    const conflicted={hold:"Conflicting duplicate Lola's Room cards",title,url};
    const at=items.indexOf(old);if(at>=0)items[at]=conflicted;
    seen.set(url,conflicted);
   }
   continue;
  }
  seen.set(url,row);items.push(row);counts.set(url,(counts.get(url)||0)+1);
 }
 if(!seen.size)throw Error("Lola original roster did not identify any venue-owned event cards");
 for(const [url,rec] of indexed){if(!seen.has(url))items.push({hold:"Official indexed Lola event lacks matching room-specific card",title:rec.title,url});}
 return items;
}
function detail(html,row){
 if(row.hold||row.skip)return row;
 const page=String(html||"");
 // The original event page includes an unrelated sidebar of future Lola events;
 // only the FIRST full date and headline in the main content are authoritative.
 const text=plain(page);
 const m=/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(20\d{2})\b/.exec(text);
 if(!m)return {hold:"Original Lola event detail has no full dated headline",title:row.title,url:row.fullUrl};
 const month=MONTHS.indexOf(m[2])+1,day=Number(m[3]),year=Number(m[4]);
 const date=[year,String(month).padStart(2,"0"),String(day).padStart(2,"0")].join("-");
 if(row.rosterDate!==date)return {hold:"Event detail date disagrees with Lola calendar",title:row.title,url:row.fullUrl};
 const after=text.slice(m.index+m[0].length,m.index+m[0].length+1200);
 const name=plain(page.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)?.[1]);
 if(!name||token(name)!==token(row.title))return {hold:"Official event title differs from Lola-specific card",title:row.title,url:row.fullUrl};
 if(/\b(?:cancelled|canceled|postponed|rescheduled|moved to)\b/i.test(after.slice(0,250)))return {hold:"Original event schedule or room changed",title:row.title,url:row.fullUrl};
 const printed=after.match(/(\d{1,2}(?::\d\d)?\s*[ap]m\s*doors,\s*\d{1,2}(?::\d\d)?\s*[ap]m\s*(?:show|dancing|dance|first lesson))/i);
 if(printed){
  const dt=mission.times(printed[0]);
  if(dt?.clock&&dt.clock!==row.rosterTime.match(/\d{1,2}(?::\d{2})?\s*[ap]m/gi)?.slice(-1).map(x=>require("./priority-importers").time24(x))?.[0])
   return {hold:"Official detail clock conflicts with Lola calendar",title:row.title,url:row.fullUrl};
 }
 const multiroom=/\bCrystal Ballroom\b.{0,140}\bAND\b.{0,140}\bLola['’]s Room\b/i.test(after.slice(0,850))
   ||/\bLola['’]s Room\b.{0,140}\bAND\b.{0,140}\bCrystal Ballroom\b/i.test(after.slice(0,850))
   ||/\b(?:four floors|all floors|multiple rooms|whole building)\b/i.test(after.slice(0,850))
   ||/Crystal Ballroom.{0,100}\bAND\b.{0,100}Lola['’]s Room/i.test(after.slice(0,850));
 if(multiroom)return {hold:"Event advertised across multiple Crystal complex rooms; needs manual room/deduplication review",title:row.title,url:row.fullUrl};
 return {...row,timeEvidence:row.timeEvidence+" Original event-specific full date and title also match."};
}
async function read(url,request=fetch){
 if(url!==CALENDAR_URL&&!mission.eventUrl(url))throw Error("Lola request is outside allowlisted official pages");
 const response=await request(url,{redirect:"error",signal:AbortSignal.timeout(18000),headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"}});
 if(!response.ok||!String(response.headers.get("content-type")||"").toLowerCase().includes("text/html"))throw Error("Lola source unavailable HTTP "+response.status+"; never equate this with zero events");
 const reader=response.body?.getReader();if(!reader)throw Error("Lola body unreadable");
 const chunks=[];let length=0;
 for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;
  if(length>550000){await reader.cancel();throw Error("Lola HTML unexpectedly large");}
  chunks.push(Buffer.from(value));
 }
 return Buffer.concat(chunks).toString("utf8");
}
async function fetchEvents(source,{request=fetch}={}){
 if(source.id!=="lolas-room"||source.url!==CALENDAR_URL||source.baseUrl!==ROOT)throw Error("Lola source config not authorized");
 // The official venue-owned roster already supplies two independent date
 // evidences (card weekday/month/day and autocomplete full year), Lola's Room
 // venue identity, original event link and labelled time. Probing 13 details
 // triggered HTTP 429/timeouts in a live runner, so do NOT fan out daily.
 const rows=roster(await read(CALENDAR_URL,request));
 if(!rows.some(x=>x.startDate))throw Error("No valid official Lola venue records; source unavailable, not zero shows");
 return rows;
}
module.exports={ROOT,CALENDAR_URL,VENUE,dateFromRecord,roster,detail,read,fetchEvents};
