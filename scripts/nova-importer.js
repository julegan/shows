"use strict";
/* Read-only original Nova venue importer. Official JSON-LD supplies event
 * identity and date; the venue homepage may corroborate an exact-day clock.
 * Do not equate published card time with performance/doors until reviewed.
 */
const {wallToPacific}=require("./priority-importers");
const CALENDAR_URL="https://www.novapdxevents.com/event-calendar";
const HOME_URL="https://www.novapdxevents.com/";
const MONTHS={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const MAX_BYTES=1500000;
const tidy=x=>String(x||"").replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&(?:nbsp|#160);/g," ").replace(/\s+/g," ").trim();
function dateOf(raw){
 const m=/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),\s*(20\d\d)$/.exec(String(raw||""));
 if(!m)return null;
 const y=Number(m[3]),mo=MONTHS[m[1].toLowerCase()],d=Number(m[2]);
 const check=new Date(Date.UTC(y,mo-1,d));
 if(check.getUTCFullYear()!==y||check.getUTCMonth()!==mo-1||check.getUTCDate()!==d)return null;
 return [String(y),String(mo).padStart(2,"0"),String(d).padStart(2,"0")].join("-");
}
function tixrUrl(raw){
 try{
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.hostname!=="tixr.com"||u.username||u.password||u.port||!/^\/e\/\d{4,10}\/?$/.test(u.pathname))return null;
  u.search="";u.hash="";return u.href;
 }catch(_){return null;}
}
function art(raw){
 try{
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.hostname!=="cdn.prod.website-files.com"||u.username||u.password||u.port||!/\.(?:png|jpe?g|webp)$/i.test(u.pathname)||u.href.length>1300)return null;
  u.search="";u.hash="";return {url:u.href,sourceUrl:CALENDAR_URL,origin:"official-event-page",credit:"Nova PDX official calendar artwork",usageApproved:null};
 }catch(_){return null;}
}
function cardsFromHome(html){
 const visible=tidy(String(html||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," "));
 const pattern=/\b(Nov|Dec|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct)\s+(\d{1,2}),\s*(20\d{2})\s+(\d{1,2})(?::(\d\d))?\s*(am|pm)\b/gi;
 const rows=[];
 for(const m of visible.matchAll(pattern)){
  const prefix=visible.slice(Math.max(0,m.index-150),m.index).trim();
  const day=dateOf(m[1]+" "+m[2]+", "+m[3]);
  const hour24=Number(m[4])%12+(m[6].toLowerCase()==="pm"?12:0);
  const clock=String(hour24).padStart(2,"0")+":"+(m[5]||"00");
  if(day)rows.push({day,clock,before:prefix});
 }
 return rows;
}
function findClock(title,day,cards){
 const key=tidy(title).toLowerCase();
 const matches=cards.filter(x=>x.day===day&&x.before.toLowerCase().endsWith(key));
 const clocks=[...new Set(matches.map(x=>x.clock))];
 return clocks.length===1?clocks[0]:null;
}
function rawEvents(html){
 const all=[];
 for(const m of String(html||"").matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try{
   const parsed=JSON.parse(m[1]);const nodes=Array.isArray(parsed)?parsed:Array.isArray(parsed["@graph"])?parsed["@graph"]:[parsed];
   for(const x of nodes){
    if(!x||typeof x!=="object")continue;
    const type=Array.isArray(x["@type"])?x["@type"]:[x["@type"]];
    if(type.some(v=>/Event$/.test(String(v||""))))all.push(x);
   }
  }catch(_){}
 }
 return all;
}
function toCandidate(x,cards=[]){
 const title=tidy(x?.name).slice(0,240),date=dateOf(x?.startDate),url=tixrUrl(x?.offers?.url);
 if(!title||!date||!url)return {hold:"Missing title, valid dated venue event, or allowlisted original Tixr ticket link",title,date};
 const loc=x.location||{},addr=loc.address||{},status=String(x.eventStatus||"");
 if(!/^Nova PDX$/i.test(String(loc.name||"").trim())||
  !/^722\s+(?:e|east)\s+burnside\s+(?:st|street)\b/i.test(String(addr.streetAddress||"").trim())||
  !/^Portland$/i.test(String(addr.addressLocality||"").trim()))
  return {hold:"Not verified as Nova PDX at 722 E Burnside, Portland",title,date,url};
 if(addr.addressRegion&&!/^(?:OR|Oregon)$/i.test(addr.addressRegion))
  return {hold:"Venue is outside Oregon",title,date,url};
 if(status&&!/\/EventScheduled$/.test(status))
  return {hold:"Official venue status needs cancellation or reschedule review",title,date,url};
 const clk=findClock(title,date,cards),artwork=art(x.image);
 const fields={title,fullUrl:url,venue:"Nova PDX",sourceVerifiedMusic:false,
  description:"Nova original event calendar has this dated listing and original ticket link; format and genres need classification.",
  timeEvidence:clk?"Nova homepage card displays a time; whether doors or performance needs editorial confirmation":"Nova calendar provides date only; no corroborated performance clock",
  ...(artwork?{artwork}:{})};
 if(clk){
  const [y,mo,d]=date.split("-").map(Number);
  const stamp=wallToPacific(y,mo,d,clk);
  if(stamp)return {...fields,startDate:stamp};
 }
 return {...fields,dateOnly:date,sourceDateOnly:true};
}
function parseNova(calendarHtml,homeHtml){
 const raw=rawEvents(calendarHtml);
 if(!raw.length)throw Error("No official Nova event JSON-LD; source unavailable or changed, NOT an empty calendar");
 if(raw.length>150)throw Error("Nova calendar exceeded bounded events count");
 const cards=cardsFromHome(homeHtml||""),items=raw.map(x=>toCandidate(x,cards));
 const seen=new Set(),out=[];
 for(const row of items){
  const key=row.fullUrl||row.title+"|"+(row.dateOnly||row.date||"");
  if(!seen.has(key)){seen.add(key);out.push(row)}
 }
 return out;
}
async function page(url,request=fetch){
 if(url!==CALENDAR_URL&&url!==HOME_URL)throw Error("Request outside allowlisted Nova pages");
 const r=await request(url,{redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(17000)});
 if(!r.ok)throw Error("Nova official venue page HTTP "+r.status+"; unavailable, not zero events");
 if(!String(r.headers.get("content-type")||"").toLowerCase().includes("text/html"))throw Error("Nova venue response not HTML");
 const reader=r.body?.getReader();if(!reader)throw Error("Nova source unreadable");
 const chunks=[];let n=0;
 for(;;){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;
  if(n>MAX_BYTES){await reader.cancel();throw Error("Nova page exceeded bounded size");}
  chunks.push(Buffer.from(value));
 }
 return Buffer.concat(chunks).toString("utf8");
}
async function fetchNovaEvents({request=fetch}={}){
 const calendar=await page(CALENDAR_URL,request);
 let home="";
 try{home=await page(HOME_URL,request)}
 catch(_){/* Keep date-only leads; never manufacture clock when homepage unavailable. */}
 return parseNova(calendar,home);
}
module.exports={CALENDAR_URL,HOME_URL,MAX_BYTES,dateOf,tixrUrl,art,cardsFromHome,findClock,rawEvents,toCandidate,parseNova,fetchNovaEvents};
