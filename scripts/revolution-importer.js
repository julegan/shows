"use strict";
/* Public official Revolution Hall show-listing importer, no browser or credentials.
 * Venue wrappers and ticket URLs must independently agree on room.
 * Full dated performance time and weekday are mandatory; relative Today/Tomorrow held.
 */
const {wallToPacific,time24,artworkCandidate}=require("./priority-importers");
const MONTHS={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
const ROOM={
 "revolution-hall":{venue:"Revolution Hall",id:"16897",suffix:"-portland-revolution-hall"},
 "show-bar-at-revolution-hall":{venue:"Show Bar at Revolution Hall",id:"21322",suffix:"-portland-show-bar-at-revolution-hall"}
};
function decode(x){
 return String(x||"").replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,h,d)=>{const n=parseInt(h||d,h?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):" "})
 .replace(/&(?:amp|quot|apos|nbsp|lt|gt);/gi,s=>({"&amp;":"&","&quot;":'"',"&apos;":"'","&nbsp;":" ","&lt;":"<","&gt;":">"}[s.toLowerCase()]||" ")).replace(/\s+/g," ").trim();
}
const plain=s=>decode(String(s||"").replace(/<[^>]*>/g," "));
const attr=(tag,key)=>String(tag||"").match(new RegExp("\\b"+key+"\\s*=\\s*([\"'])(.*?)\\1","i"))?.[2]||"";
function validatedTicket(raw,room){
 try{
  const u=new URL(decode(raw));
  if(u.protocol!=="https:"||u.hostname!=="www.etix.com"||u.username||u.password||u.port||u.search||u.hash)return null;
  const m=/^\/ticket\/p\/(\d{5,12})\/([a-z0-9-]+)\/?$/.exec(u.pathname);
  if(!m||!m[2].endsWith(ROOM[room].suffix))return null;
  return {url:u.href,eventId:m[1]};
 }catch(_){return null}
}
function parseCard(block,room,source){
 if(!ROOM[room])return {hold:"Unknown Revolution Hall room; source review needed"};
 const tags=block.match(/<div\b[^>]*itemtype=["']http:\/\/schema\.org\/Event["'][^>]*>/i)?.[0]||"";
 const id=attr(tags,"data-event-id"),venueId=attr(tags,"data-venue-id");
 const name=block.match(/<h3\b[^>]*itemprop=["']name["'][^>]*>\s*<a\b([^>]+)>([\s\S]*?)<\/a>/i);
 const title=plain(name?.[2]).slice(0,280);
 const ticket=validatedTicket(attr(name?.[1],"href"),room);
 if(!title||!ticket)return {hold:"Missing original Etix ticket URL, exact room or title",title,venue:ROOM[room].venue};
 if(!id||ticket.eventId!==id||venueId!==ROOM[room].id)return {hold:"Official event id or room id differs from original ticket URL",title,url:ticket.url};
 if(/\b(?:rescheduled|postponed|cancelled|canceled|moved to|vip upgrade|ticket not included)\b/i.test(title))return {hold:"Rescheduled, canceled or non-show listing",title,url:ticket.url};
 const date=plain(block.match(/<span\b[^>]*class=["']event-date--full["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]||"");
 const dm=/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})$/i.exec(date);
 const tmTag=block.match(/<span\b[^>]*class=["']event-doors-showtime["'][^>]*>[\s\S]*?<\/span>/i)?.[0]||"";
 const reported=plain(tmTag),attrDoors=attr(tmTag,"data-event-doors");
 const doors=reported.match(/\bDoors:\s*(\d{1,2}(?::\d{2})?\s*[ap]m)\b/i);
 const showMatch=reported.match(/\bShow:\s*(\d{1,2}(?::\d{2})?\s*[ap]m)\b/i);
 const show=showMatch&&time24(showMatch[1]);
 if(!show)return {hold:"No explicit performance time on official show card",title,url:ticket.url};
 let year,month,day;
 if(dm){
  year=Number(dm[3]);month=MONTHS[dm[1].toLowerCase()];day=Number(dm[2]);
  const check=new Date(Date.UTC(year,month-1,day));
  if(check.getUTCFullYear()!==year||check.getUTCMonth()!==month-1||check.getUTCDate()!==day||date.slice(0,3).toLowerCase()!==["sun","mon","tue","wed","thu","fri","sat"][check.getUTCDay()])return {hold:"Official weekday and calendar date conflict",title,url:ticket.url};
 }else if(/^(Today|Tomorrow)$/i.test(date)&&doors&&/^20\d{2}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(attrDoors)){
  // Date comes ONLY from the venue's explicit UTC doors timestamp.
  // The relative display label is not used to infer today's date.
  const parsed=new Date(attrDoors);
  if(!Number.isFinite(parsed.valueOf()))return {hold:"Unusable official UTC doors timestamp",title,url:ticket.url};
  const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(parsed).map(p=>[p.type,p.value]));
  year=Number(parts.year);month=Number(parts.month);day=Number(parts.day);
 }else return {hold:"Missing full weekday/year or source-provided UTC date on official show card",title,url:ticket.url};
 const startDate=wallToPacific(year,month,day,show);
 if(!startDate)return {hold:"Invalid time-bearing performance start on official show card",title,url:ticket.url};
 if(doors){
  const utc=wallToPacific(year,month,day,time24(doors[1]));
  if(!utc||(attrDoors&&(!Number.isFinite(Date.parse(attrDoors))||utc!==new Date(attrDoors).toISOString())))return {hold:"Doors timestamp conflicts with venue's visible Pacific time",title,url:ticket.url};
  if(Date.parse(startDate)<Date.parse(utc))return {hold:"Showtime earlier than official doors time",title,url:ticket.url};
 }
 const imageSrc=block.match(/<div\b[^>]*class=["']event__image["'][^>]*>[\s\S]*?<img\b[^>]*src=["']([^"']+)["']/i)?.[1];
 const art=imageSrc&&artworkCandidate(imageSrc,source.url);
 const supporting=plain(block.match(/<h4\b[^>]*>([\s\S]*?)<\/h4>/i)?.[1]||"");
 return {title,fullUrl:ticket.url,venue:ROOM[room].venue,address:source.address,neighborhood:source.neighborhood,
   startDate,sourceVerifiedMusic:false,timeEvidence:"Original Revolution Hall event card with complete year, exact room and explicitly labeled show time",
   description:"Official venue listing; lineup and show format need editorial review."+(supporting?" Supporting artists: "+supporting.slice(0,240):""),
   ...(art?{artwork:{url:art,sourceUrl:source.url,origin:"official-event-page",credit:"Official Revolution Hall event flyer via venue-linked Etix",usageApproved:null}}:{})};
}
function parseRevolution(html,source){
 if(source.id!=="revolution-hall"||new URL(source.url).hostname!=="www.revolutionhall.com")throw Error("Unexpected Revolution Hall source configuration");
 const text=String(html||""),regex=/<div\s+class=["']event-wrapper\s+([a-z0-9-]+)["']\s*>/gi;
 const cards=[...text.matchAll(regex)],out=[],seen=new Set();
 if(!cards.length)throw Error("Official page has no room-specific show cards; layout changed");
 if(cards.length>140)throw Error("Too many show cards; pagination/coverage requires review");
 for(let i=0;i<cards.length;i++){
  const group=cards[i][1];
  if(!ROOM[group]){out.push({hold:"Unrecognized venue room: "+group});continue;}
  const block=text.slice(cards[i].index,cards[i+1]?.index||text.length).slice(0,12000);
  const result=parseCard(block,group,source);
  if(result.fullUrl){
   if(seen.has(result.fullUrl))continue;
   seen.add(result.fullUrl);
  }
  out.push(result);
 }
 return out;
}
module.exports={ROOM,validatedTicket,parseCard,parseRevolution};
