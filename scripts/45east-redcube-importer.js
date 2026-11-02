"use strict";
/* First-party Red Cube Presents multi-venue event roster.
 * ONLY original 45 EAST - PORTLAND cards enter SHOWS. Do not request ticket
 * checkout, infer start times, use Seattle events, or copy poster rights.
 */
const CALENDAR_URL="https://www.redcubepresents.com/events/";
const MAX_BYTES=800000;
const MONTHS={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
const WEEKDAYS=["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
function textOnly(html){
 return String(html||"").replace(/<[^>]*>/g," ").replace(/&amp;|&#38;/gi,"&")
  .replace(/&#0*39;|&#x0*27;|&apos;/gi,"'").replace(/&nbsp;/gi," ")
  .replace(/\s+/g," ").trim();
}
function ticketUrl(raw){
 try{
  const u=new URL(String(raw||""));
  if(u.protocol!=="https:"||u.hostname!=="tixr.com"||u.username||u.password||u.port||
    !/^\/groups\/45east\/[a-z0-9][a-z0-9-]{1,145}\/?$/i.test(u.pathname))return null;
  return u.origin+u.pathname;
 }catch{return null;}
}
function officialArt(raw){
 try{
  const u=new URL(String(raw||""));
  if(u.protocol!=="https:"||u.hostname!=="www.redcubepresents.com"||u.username||u.password||u.port||
     !/^\/wp-content\/uploads\/20\d\d\/\d\d\/[a-zA-Z0-9_().%-]+\.(?:png|jpe?g|webp)$/i.test(u.pathname))return null;
  return {url:u.origin+u.pathname,sourceUrl:CALENDAR_URL,
   origin:"organizer-published-promo-art",credit:"Red Cube Presents original event image",usageApproved:null};
 }catch{return null;}
}
function parseDate(text){
 const m=/^(SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)\s+(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2})\s+(20\d\d)$/i.exec(textOnly(text));
 if(!m)return null;
 const year=Number(m[4]),month=MONTHS[m[2].toLowerCase()],day=Number(m[3]);
 const date=new Date(Date.UTC(year,month-1,day));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day||
    WEEKDAYS[date.getUTCDay()]!==m[1].toUpperCase())return null;
 return [year,String(month).padStart(2,"0"),String(day).padStart(2,"0")].join("-");
}
function parse(html){
 const content=String(html||"");
 if(content.length<5000||content.length>MAX_BYTES)throw Error("Red Cube source missing or unexpectedly large");
 const sections=[...content.matchAll(/<div class="elementor-column elementor-col-33 elementor-top-column[^"]*"[^>]*>/g)];
 if(!sections.length||sections.length>250)throw Error("Promoter card structure changed; NOT an empty venue calendar");
 const result=[],seen=new Map();
 for(let i=0;i<sections.length;i++){
  const part=content.slice(sections[i].index,sections[i+1]?.index||content.length).slice(0,12500);
  const headers=[...part.matchAll(/<h2\b[^>]*class="[^"]*\belementor-heading-title\b[^"]*"[^>]*>([\s\S]*?)<\/h2>/gi)].map(x=>textOnly(x[1]));
  if(!headers.includes("45 EAST - PORTLAND"))continue; // Other Portland rooms AND Seattle are excluded.
  const placeIndex=headers.indexOf("45 EAST - PORTLAND");
  const date=parseDate(headers[placeIndex-1]);
  const title=headers[placeIndex-2]||"";
  // Elementor cards have an original ticket link after the venue heading.
  const afterVenue=part.slice(part.indexOf("45 EAST - PORTLAND")+15);
  const href=afterVenue.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1]||"";
  const original=ticketUrl(href);
  if(!title||!date||!original){
   result.push({hold:"Original 45 East card missing verified title/year/date or group-specific ticket link",title,url:original});continue;
  }
  const img=part.match(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/i)?.[1]||
   part.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
  const poster=officialArt(img);
  const row={title,fullUrl:original,venue:"45 East",dateOnly:date,sourceDateOnly:true,
   sourceVerifiedMusic:true,
   timeEvidence:"Red Cube Presents confirms the full date and 45 East venue. Event show/doors start clock is NOT published on this card; no clock was inferred.",
   description:"Original Red Cube Presents 45 East show; music style, doors, show start, admission, cancellation and flyer permission need editorial review.",
   ...(poster?{artwork:poster}:{})};
  if(seen.has(original)){
    const prev=seen.get(original);
    if(prev.title!==row.title||prev.dateOnly!==row.dateOnly){
      const held={hold:"Conflicting original Red Cube cards for a shared ticket link",title,url:original};
      const ix=result.indexOf(prev);if(ix>=0)result[ix]=held;
      seen.set(original,held);
    }
    continue;
  }
  seen.set(original,row);result.push(row);
 }
 if(!result.some(x=>x.fullUrl))throw Error("No original 45 East cards validated; source may have changed, NOT evidence of zero events");
 return result;
}
async function fetchEvents(source,{request=fetch}={}){
 if(source.id!=="45-east"||source.adapter!=="45east-redcube-original"||
    source.url!==CALENDAR_URL||source.baseUrl!=="https://www.redcubepresents.com")
  throw Error("Unapproved original Red Cube promoter source configuration");
 const response=await request(CALENDAR_URL,{redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(17000)});
 if(!response.ok||!String(response.headers.get("content-type")||"").toLowerCase().includes("text/html"))
   throw Error("Red Cube promoter HTML unavailable "+response.status+", not zero shows");
 const reader=response.body?.getReader();if(!reader)throw Error("Red Cube body unreadable");
 let bytes=0;const chunks=[];
 for(;;){const {done,value}=await reader.read();if(done)break;
  bytes+=value.byteLength;if(bytes>MAX_BYTES){await reader.cancel();throw Error("Red Cube source exceeded bounded size");}
  chunks.push(Buffer.from(value));
 }
 return parse(Buffer.concat(chunks).toString("utf8"));
}
module.exports={CALENDAR_URL,MAX_BYTES,textOnly,ticketUrl,officialArt,parseDate,parse,fetchEvents};
