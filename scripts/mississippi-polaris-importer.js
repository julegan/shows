"use strict";
/* Mississippi Studios official first-party listing also includes Polaris Hall.
 * Allow exact Etix room ticket path and corroborating first-party data-venue-id.
 * Only explicitly named showtimes are imported; "doors" never substitutes.
 */
const {wallToPacific,time24,artworkCandidate}=require("./priority-importers");
const MONTHS={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
const ROOM={
 "Mississippi Studios":{id:"16896",slug:"-portland-mississippi-studios"},
 "Polaris Hall":{id:"16900",slug:"-portland-polaris-hall"}
};
const HOST="https://mississippistudios.com";
const decode=s=>String(s||"").replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,h,d)=>String.fromCodePoint(parseInt(h||d,h?16:10)))
 .replace(/&(?:amp|quot|apos|nbsp|lt|gt);/gi,x=>({"&amp;":"&","&quot;":'"',"&apos;":"'","&nbsp;":" ","&lt;":"<","&gt;":">"}[x.toLowerCase()]||" ")).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
function ticketUrl(s,room){
 try{
  const u=new URL(String(s||"").replace(/&amp;/gi,"&"));
  if(!ROOM[room]||u.protocol!=="https:"||u.hostname!=="www.etix.com"||u.username||u.password||u.port||u.search||u.hash)return null;
  if(!/^\/ticket\/p\/\d{5,12}\/[a-z0-9-]+$/i.test(u.pathname)||!u.pathname.endsWith(ROOM[room].slug))return null;
  return u.href;
 }catch(_){return null}
}
function parseCard(chunk,source){
 const id=chunk.match(/<div\s+class=["']event["'][^>]*\bdata-venue-id=["'](\d+)["']/i)?.[1];
 const titleInfo=chunk.match(/<h2\b[^>]*class=["']event-title["'][^>]*>\s*<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
 const title=decode(titleInfo?.[2]).slice(0,280);
 const dateLabel=decode(chunk.match(/<h5\b[^>]*>([\s\S]*?)<\/h5>/i)?.[1]);
 const status=title.match(/\b(?:canceled|cancelled|rescheduled|postponed|moved to)\b/i);
 if(status)return {hold:"Original listing indicates change or cancellation",title};
 const time=chunk.match(/<span\b[^>]*class=["']event-doors-showtime["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]||"";
 const fields=decode(time),tm=fields.match(/\bShow:\s*(\d{1,2}(?::\d\d)?\s*[ap]m)\b/i),doors=fields.match(/\bDoors:\s*(\d{1,2}(?::\d\d)?\s*[ap]m)\b/i);
 const datem=/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(20\d{2})$/i.exec(dateLabel);
 if(!datem)return {hold:"Official card missing full date and year",title};
 const month=MONTHS[datem[2].toLowerCase()],day=Number(datem[3]),year=Number(datem[4]);
 const date=new Date(Date.UTC(year,month-1,day));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day||datem[1].toLowerCase()!==["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][date.getUTCDay()])return {hold:"Official date and weekday disagree",title};
 const matched=Object.entries(ROOM).filter(([room,r])=>r.id===id&&ticketUrl(titleInfo?.[1],room));
 if(matched.length!==1)return {hold:"Source venue ID and original ticket room disagree",title,roomId:id};
 const venue=matched[0][0],fullUrl=ticketUrl(titleInfo[1],venue);
 if(!title||!tm)return {hold:"Original listing missing title or labeled showtime",title,url:fullUrl};
 const startDate=wallToPacific(year,month,day,time24(tm[1]));
 if(!startDate)return {hold:"Invalid Pacific dated performance time",title,url:fullUrl};
 if(doors){
  const doorStart=wallToPacific(year,month,day,time24(doors[1]));
  if(!doorStart||Date.parse(startDate)<Date.parse(doorStart))return {hold:"Showtime earlier than doors",title,url:fullUrl};
 }
 const image=chunk.match(/<div\b[^>]*class=["']event__image["'][^>]*>[\s\S]*?<img\b[^>]*src=["']([^"']+)["']/i)?.[1];
 const imageUrl=image&&artworkCandidate(image,source.url);
 const supporting=decode(chunk.match(/<h4\b[^>]*>([\s\S]*?)<\/h4>/i)?.[1]);
 return {title,fullUrl,venue,startDate,address:source.addresses?.[venue]||null,neighborhood:venue==="Polaris Hall"?"Humboldt":"Boise",sourceVerifiedMusic:!!(/live band|concert|music/i.test(supporting)),
   description:"Original Mississippi/Polaris room-verified official event listing"+(supporting?". Supporting artists: "+supporting.slice(0,180):""),
   timeEvidence:"Original venue calendar explicitly labels doors and a separate showtime, plus exact date and venue",
   ...(imageUrl?{artwork:{url:imageUrl,sourceUrl:source.url,origin:"official-venue-calendar",credit:"Venue-provided event flyer",usageApproved:null}}:{})};
}
function parseMississippi(html,source){
 if(source.id!=="mississippi-polaris"||new URL(source.url).origin!==HOST)throw Error("Unexpected source");
 const raw=String(html||""),start=raw.indexOf('id="full-list"'),end=raw.indexOf('id="compact-list"');
 if(start<0||end<=start)throw Error("Expected official dated full event cards missing");
 const text=raw.slice(start,end),chunks=text.split(/<div class=["']event__item style--(?:standard|dark)["']>/i).slice(1);
 if(!chunks.length||chunks.length>180)throw Error("Unexpected number of primary event cards");
 const rows=chunks.map(c=>parseCard(c.slice(0,18000),source)),seen=new Set();
 return rows.filter(x=>{if(!x.fullUrl)return true;if(seen.has(x.fullUrl))return false;seen.add(x.fullUrl);return true});
}
module.exports={ROOM,ticketUrl,parseCard,parseMississippi};
