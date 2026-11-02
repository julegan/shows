"use strict";
/* The Showdown — original public WordPress/TicketWeb venue pages.
 * A listing gives weekday, month/day and show/doors clocks, but NO YEAR.
 * The event's own +Google Calendar link provides a full local date and time.
 * Both must agree; a missing detail or 429 is a hold, never an inferred year.
 */
const {wallToPacific,time24,artworkCandidate}=require("./priority-importers");
const ROOT="https://www.showdownpdx.com";
const HOME=ROOT+"/";
const MONTHS={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const MAX_PAGES=8,MAX_DETAILS=90,MAX_BYTES=1200000;
function textOf(x){return String(x||"").replace(/<[^>]*>/g," ").replace(/&(?:amp|#38);/gi,"&").replace(/&#0*39;|&#x0*27;|&#8217;|&(?:apos|rsquo);/gi,"'").replace(/&quot;/gi,'"').replace(/&nbsp;/gi," ").replace(/\s+/g," ").trim();}
function normal(x){return textOf(x).toLowerCase().replace(/[^a-z0-9]/g,"");}
function eventUrl(raw){
 try{
  const u=new URL(raw,ROOT);
  if(u.protocol!=="https:"||u.origin!==ROOT||u.username||u.password||u.port||u.search||u.hash||!/^\/tm-event\/[a-z0-9][a-z0-9-]{1,160}\/?$/.test(u.pathname))return null;
  return u.href;
 }catch{return null;}
}
function pageUrl(raw){
 try{
  const u=new URL(raw,ROOT);
  if(u.protocol!=="https:"||u.origin!==ROOT||u.username||u.password||u.port||u.search||u.hash)return null;
  if(u.href===HOME)return HOME;
  const m=/^\/page\/([2-8])\/?$/.exec(u.pathname);
  return m?ROOT+"/page/"+m[1]+"/":null;
 }catch{return null}
}
function art(raw,original){
 try{
  const u=new URL(raw);
  if(!eventUrl(original)||u.protocol!=="https:"||u.hostname!=="i.ticketweb.com"||u.username||u.password||u.port||!/\/i\/[a-z0-9/]+_Original\.(?:jpg|jpeg|png|webp)$/i.test(u.pathname)||!artworkCandidate(u.href,original))return null;
  return {url:u.origin+u.pathname,sourceUrl:original,origin:"official-venue-calendar",credit:"Original Showdown event artwork, distributed by TicketWeb",usageApproved:null};
 }catch{return null;}
}
function parsePage(html){
 const s=String(html||""),matches=[...s.matchAll(/<div class="tw-section">/g)];
 if(!matches.length||matches.length>20)throw Error("Original Showdown calendar section count changed or exceeded bounds");
 const entries=[],seen=new Map();
 for(let i=0;i<matches.length;i++){
  const part=s.slice(matches[i].index,matches[i+1]?.index||s.length).slice(0,18000);
  const name=part.match(/<div class="tw-name">\s*<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
  const original=eventUrl(name?.[1]),title=textOf(name?.[2]).slice(0,250);
  const day=textOf(part.match(/<span class="tw-day-of-week">([\s\S]*?)<\/span>/i)?.[1]);
  const date=textOf(part.match(/<span class="tw-event-date">([\s\S]*?)<\/span>/i)?.[1]);
  const m=/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})$/i.exec(date);
  const showLabel=textOf(part.match(/<span class="tw-event-time">([\s\S]*?)<\/span>/i)?.[1]);
  const doorLabel=textOf(part.match(/<span class="tw-event-door-time">([\s\S]*?)<\/span>/i)?.[1]);
  const showMatch=/^Show:\s*(\d{1,2}(?::\d{2})?\s*[ap]m)$/i.exec(showLabel),clock=showMatch?time24(showMatch[1]):null;
  const doorClock=doorLabel?time24(doorLabel):null;
  if(!original||!title||!m||!["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].includes(day)||!clock||(doorLabel&&!doorClock)){
   entries.push({hold:"Official Showdown card lacks original permalink, weekday, date or unambiguous show/door clocks",title,url:original});continue;
  }
  if(/\b(?:cancelled|canceled|postponed|rescheduled|moved to)\b/i.test(title)){
   entries.push({hold:"Original Showdown event status needs review",title,url:original});continue;
  }
  const image=part.match(/<img\b[^>]*class="[^"]*\bevent-img\b[^"]*"[^>]*src=["']([^"']+)["']/i)?.[1]||
    part.match(/<img\b[^>]*src=["']([^"']+)["'][^>]*class="[^"]*\bevent-img\b/i)?.[1];
  const row={title,fullUrl:original,month:MONTHS[m[1].toLowerCase()],day:Number(m[2]),weekDay:day,
    showClock:clock,doorClock,venue:"The Showdown",sourceVerifiedMusic:false,
    timeEvidence:"Showdown original event card separately labels show and doors; full year must be confirmed on the matching event detail",
    description:"Official The Showdown event listing; editorially verify category and genre.",
    ...(art(image,original)?{artwork:art(image,original)}:{})};
  if(seen.has(original)){
   const prev=seen.get(original);
   if(prev.title!==title||prev.month!==row.month||prev.day!==row.day||prev.showClock!==row.showClock)throw Error("Contradictory original Showdown event cards");
   continue;
  }
  seen.set(original,row);entries.push(row);
 }
 if(!entries.some(x=>x.fullUrl))throw Error("No original Showdown event cards: source changed, not empty");
 const pagination=[...new Set([...s.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(m=>pageUrl(m[1])).filter(x=>x&&x!==HOME))];
 return {entries,pagination};
}
function calendarLink(html){
 const m=[...String(html||"").matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].filter(x=>/\+?\s*Google Calendar/i.test(textOf(x[2])));
 if(m.length!==1)return null;
 try{
  const raw=m[0][1].replace(/&amp;/gi,"&"),url=new URL(raw);
  if(url.origin!=="https://www.google.com"||url.pathname!=="/calendar/event"||url.searchParams.get("action")!=="TEMPLATE")return null;
  const fields=[...url.searchParams.getAll("dates")];
  if(fields.length!==1)return null;
  const dt=/^(20\d{2})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)\/20\d{2}\d{4}T\d{6}$/.exec(fields[0]);
  if(!dt)return null;
  return {title:url.searchParams.get("text")||"",dates:fields[0],location:url.searchParams.get("location")||"",
    year:+dt[1],month:+dt[2],day:+dt[3],clock:dt[4]+":"+dt[5],second:+dt[6]};
 }catch{return null;}
}
function parseDetail(html,row){
 if(row.hold||row.skip)return row;
 const title=row.title,url=row.fullUrl;
 const link=calendarLink(html);
 if(!link)return {hold:"Original event detail lacks unambiguous full-year Google Calendar date",title,url};
 const w=new Date(Date.UTC(link.year,link.month-1,link.day));
 if(w.getUTCFullYear()!==link.year||w.getUTCMonth()!==link.month-1||w.getUTCDate()!==link.day)
  return {hold:"Invalid Showdown event date",title,url};
 const weekday=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][w.getUTCDay()];
 if(row.month!==link.month||row.day!==link.day||row.weekDay!==weekday||row.showClock!==link.clock||link.second!==0)
  return {hold:"Original Showdown calendar listing and event-specific full-year date/time disagree",title,url};
 if(normal(link.title)!==normal(title))return {hold:"Original Showdown calendar title conflicts with event-specific detail",title,url};
 if(!/1195\s+SE\s+Powell\s+Blvd/i.test(link.location)||!/Portland/i.test(link.location)||!/\bOR\b/.test(link.location))
  return {hold:"Google Calendar event location is not verified 1195 SE Powell Portland",title,url};
 const date=wallToPacific(link.year,link.month,link.day,row.showClock);
 if(!date)return {hold:"Showdown full-year local show time invalid or ambiguous",title,url};
 if(row.doorClock){
  const doors=wallToPacific(link.year,link.month,link.day,row.doorClock);
  if(!doors||Date.parse(doors)>Date.parse(date))return {hold:"Published Showdown doors are later than show time",title,url};
 }
 const h=String(html||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ");
 const headline=textOf(h.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||"");
 if(/\b(?:cancelled|canceled|postponed|rescheduled|moved to)\b/i.test(headline))
  return {hold:"Showdown detail announces schedule change",title,url};
 return {title,fullUrl:url,startDate:date,venue:"The Showdown",sourceVerifiedMusic:false,
   timeEvidence:"Original Showdown listing explicitly says Show "+row.showClock+" (Doors "+(row.doorClock||"not listed")+"); original event-specific Google Calendar confirms "+link.year+" date and time.",
   description:row.description,...(row.artwork?{artwork:row.artwork}:{})};
}
async function read(url,request=fetch){
 if(url!==HOME&&!pageUrl(url)&&!eventUrl(url))throw Error("Unapproved Showdown first-party URL");
 const response=await request(url,{redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(15000)});
 if(!response.ok||!String(response.headers.get("content-type")||"").toLowerCase().includes("text/html"))
  throw Error("Showdown source unavailable HTTP "+response.status+", NOT evidence of zero shows");
 const reader=response.body?.getReader();if(!reader)throw Error("Showdown body unreadable");
 const pieces=[];let n=0;
 for(;;){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;
  if(n>MAX_BYTES){await reader.cancel();throw Error("Showdown original page exceeds size limit");}
  pieces.push(Buffer.from(value));}
 return Buffer.concat(pieces).toString("utf8");
}
async function fetchEvents(source,{request=fetch,maxDetails=MAX_DETAILS}={}){
 if(source.id!=="showdown"||source.url!==HOME||source.baseUrl!==ROOT)
  throw Error("Unapproved Showdown source registry");
 const first=parsePage(await read(HOME,request)),maxPage=first.pagination.reduce((max,u)=>Math.max(max,Number(u.match(/\/page\/(\d+)\//)?.[1]||1)),1);
 if(maxPage<1||maxPage>MAX_PAGES)throw Error("Unexpected Showdown pagination bound");
 const byId=new Map(),holds=[];
 const gather=part=>{for(const item of part.entries){if(item.hold){holds.push(item);continue;}
   if(!byId.has(item.fullUrl))byId.set(item.fullUrl,item);
   else{const prev=byId.get(item.fullUrl);
    if(prev.month!==item.month||prev.day!==item.day||prev.showClock!==item.showClock||normal(prev.title)!==normal(item.title))
     byId.set(item.fullUrl,{hold:"Showdown cards from different pages conflict",title:item.title,url:item.fullUrl});
   }}};
 gather(first);
 for(let number=2;number<=maxPage;number++){gather(parsePage(await read(ROOT+"/page/"+number+"/",request)));}
 if(byId.size>MAX_DETAILS)throw Error("Showdown calendar exceeds bounded detail requests");
 const result=[...holds],list=[...byId.values()],limit=Math.min(list.length,maxDetails);
 // Low-volume batches; no credentials, widget calls, browser-evasion or retry on 429.
 for(let i=0;i<limit;i+=2){
  const out=await Promise.all(list.slice(i,i+2).map(async row=>{
    if(row.hold)return row;
    try{return parseDetail(await read(row.fullUrl,request),row)}
    catch(e){return {hold:"Showdown event detail unavailable: "+String(e.message||e),title:row.title,url:row.fullUrl};}
  }));
  result.push(...out);
 }
 if(maxDetails<list.length)result.push({skip:"Manual source probe bounded to "+maxDetails+" of "+list.length+" unique event details; not a complete import"});
 if(!result.some(x=>x.startDate)&&maxDetails===MAX_DETAILS)throw Error("No original Showdown event details validated; source unavailable");
 return result;
}
module.exports={ROOT,HOME,MAX_PAGES,MAX_DETAILS,MAX_BYTES,normal,eventUrl,pageUrl,art,parsePage,calendarLink,parseDetail,read,fetchEvents};
