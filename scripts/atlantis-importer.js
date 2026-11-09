"use strict";
/* Mississippi Pizza / Atlantis Lounge original public venue calendar.
 * Every event is checked against its own original detail page. A genre is
 * not a condition of intake. No recurring occurrence is inferred.
 */
const {wallToPacific,time24}=require("./priority-importers");
const CALENDAR="https://mississippipizza.com/events/";
const BASE="https://mississippipizza.com";
const MONTHS={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MAX_HTML=1600000;
const MAX_LINKS=160;
function clean(raw,max=1000){
 let x=String(raw||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ");
 for(let i=0;i<2;i++)x=x.replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,h,d)=>{
  const n=parseInt(h||d,h?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):" ";
 }).replace(/&(?:amp|lt|gt|quot|apos|nbsp|ndash|mdash);/gi,k=>({
  "&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'","&nbsp;":" ","&ndash;":"–","&mdash;":"—"
 }[k.toLowerCase()]));
 return x.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,max);
}
function eventUrl(raw){
 try{
  const u=new URL(raw,BASE+"/");
  if(u.protocol!=="https:"||u.hostname!=="mississippipizza.com"||u.username||u.password||u.port||
     u.search||u.hash||u.href.length>450)return null;
  return /^\/event\/[a-z0-9][a-z0-9-]{1,180}\/$/i.test(u.pathname)?u.href:null;
 }catch(_){return null;}
}
function links(html){
 if(typeof html!=="string"||html.length<500||html.length>MAX_HTML)throw Error("Atlantis calendar missing/oversize");
 const found=[],seen=new Set();
 for(const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)){
  const url=eventUrl(m[1].replace(/&amp;/gi,"&"));
  if(url&&!seen.has(url)){found.push(url);seen.add(url);}
 }
 if(!found.length||found.length>MAX_LINKS)throw Error("Atlantis event links missing or over source bounds");
 return found;
}
function detail(html,url){
 const sourceUrl=eventUrl(url);
 if(!sourceUrl)return {hold:"Invalid original Atlantis event URL",url};
 if(typeof html!=="string"||html.length<200||html.length>MAX_HTML)
  return {hold:"Atlantis detail missing or exceeds bounds",url:sourceUrl};
 const h1=/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
 if(!h1)return {hold:"No event-specific title heading",url:sourceUrl};
 const title=clean(h1[1],180);
 const at=h1.index+h1[0].length;
 const before=clean(html.slice(Math.max(0,h1.index-1700),h1.index),3000);
 const body=clean(html.slice(at,at+65000),13000);
 const fail=reason=>({hold:reason,title,url:sourceUrl});
 if(!title||!/\bThe Atlantis Lounge\b/i.test(before))
  return fail("Event-specific title/Atlantis Lounge room cannot be verified");
 if(/\b(?:cancelled|canceled|postponed|rescheduled)\b/i.test(title))return fail("Changed-status event");
 const m=/\b(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(20\d{2})\b/i.exec(body);
 if(!m)return fail("Original event date/year not verified");
 const [,dayName,monthName,dayText,yearText]=m;
 const year=Number(yearText),month=MONTHS[monthName.toLowerCase()],day=Number(dayText);
 const localDay=new Date(Date.UTC(year,month-1,day));
 if(localDay.getUTCFullYear()!==year||localDay.getUTCMonth()!==month-1||localDay.getUTCDate()!==day||
    DAYS[localDay.getUTCDay()].toLowerCase()!==dayName.toLowerCase())return fail("Invalid or weekday-conflicting original date");
 const after=body.slice(m.index+m[0].length, m.index+m[0].length+120);
 const clock=/^\s*(\d{1,2}(?::\d\d)?\s*(?:a\.?m\.?|p\.?m\.?))\b/i.exec(after);
 const t=clock?time24(clock[1].replace(/\./g,"")):null;
 if(!t)return fail("Original event detail lacks a verified start clock");
 const startDate=wallToPacific(year,month,day,t);
 if(!startDate)return fail("Invalid Pacific venue start clock");
 const description=body.slice(m.index+m[0].length+(clock?.[0].length||0))
  .replace(/^\s*(?:\$[\d.,]+(?:\s+to\s+\$[\d.,]+)?|Free!)\s*/i,"")
  .split(/\bBuy Tickets\b/i)[0].trim().slice(0,550);
 // Genre evidence comes exclusively from the detail page for THIS event.
 // Artist-name familiarity or venue associations alone do not supply a style.
 const styleHints=(description.match(/\b(?:hip[\s-]?hop|r\s*&\s*b|rnb|neo[\s-]?soul|rap(?:pers?|ping)?|funk|disco|jazz|blues|reggae|ska|metal|punk|electronic\s+music|folk\s+music)\b/gi)||[]).slice(0,8);
 const musicEvidence=/\b(?:hip[\s-]?hop|r\s*&\s*b|rnb|rap(?:pers?|ping)?|live music|live band|live performance|concert|singer|musician|music scene|musical act|original music|record release|album release|songwriters?|performer|performing|fiddle tunes)\b/i.test(description+" "+title);
 return {title,fullUrl:sourceUrl,venue:"Mississippi Pizza / Atlantis Lounge",startDate,
  sourceVerifiedMusic:musicEvidence,verifiedOriginalShowTime:false,
  tags:styleHints,
  timeEvidence:"Atlantis Lounge original event-specific page lists this full date and clock; the page does not explicitly distinguish performance time from doors.",
  description:description?"Original venue details: "+description: "Original venue event with verified date and listed time."};
}
async function fetchEvents(src,request=fetch,options={}){
 if(src?.id!=="atlantis-lounge"||src.adapter!=="atlantis-original-html"||
   src.url!==CALENDAR||src.baseUrl!==BASE)throw Error("Unapproved Atlantis original venue source");
 const get=async url=>{
  if(url!==CALENDAR&&!eventUrl(url))throw Error("Unsafe Atlantis event fetch");
  const r=await request(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},
   redirect:"error",signal:AbortSignal.timeout(17500)});
  if(!r.ok||!String(r.headers?.get("content-type")||"").includes("text/html"))
   throw Error("Atlantis original page HTTP "+r.status+" or non-HTML");
  const html=await r.text();
  if(html.length>MAX_HTML)throw Error("Atlantis original HTML size bound exceeded");
  return html;
 };
 const roster=links(await get(CALENDAR)),max=Math.min(MAX_LINKS,options.maxEvents||MAX_LINKS);
 const rows=[];
 for(let i=0;i<Math.min(roster.length,max);i+=4){
  const batch=await Promise.all(roster.slice(i,Math.min(i+4,max)).map(async url=>{
   try{return detail(await get(url),url);}
   catch(e){return {hold:"Atlantis event detail unavailable: "+String(e.message||e),url};}
  }));
  rows.push(...batch);
 }
 if(!rows.some(x=>x.startDate))throw Error("Atlantis source returned no verified original dated events");
 if(rows.some(x=>x.hold))console.warn("Atlantis original source has "+rows.filter(x=>x.hold).length+" held of "+rows.length+" candidates; inspect source review");
 return rows;
}
module.exports={CALENDAR,BASE,eventUrl,links,detail,fetchEvents};
