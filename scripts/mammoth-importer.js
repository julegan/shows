"use strict";
/* Mammoth Northwest is a regional multi-venue promoter, NOT a venue.
 * This deliberately narrow source closes two uncovered Portland rooms only:
 * Hawthorne Theatre Lounge and High Limit Room. Larger Hawthorne Theatre
 * and Roseland already have direct primary feeds and are not duplicated here.
 */
const {wallToPacific,time24,eventArtworkFromHtml}=require("./priority-importers");
const BASE="https://mammothnw.com";
const CALENDAR=BASE+"/events/";
const ROOMS={
 "hawthorne-theatre-lounge":{
  venue:"Hawthorne Theatre Lounge",
  label:/\bHawthorne (?:Theatre )?Lounge\b/i,
  address:"1507 SE 39th Ave, Portland, OR 97214",
  neighborhood:"Sunnyside"
 },
 "high-limit-room":{
  venue:"High Limit Room",
  label:/\bHigh Limit Room\b/i,
  address:"720 SE Hawthorne Blvd, Portland, OR 97214",
  neighborhood:"Buckman"
 }
};
const MONTHS={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
const WEEK=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const clean=s=>String(s||"").replace(/<[^>]*>/g," ").replace(/&(?:nbsp|amp|quot|apos|lt|gt);/gi,c=>({"&nbsp;":" ","&amp;":"&","&quot;":'"',"&apos;":"'","&lt;":"<","&gt":">"}[c.toLowerCase()]||c))
 .replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi,(_,hex,dec)=>{const cp=parseInt(hex||dec,hex?16:10);return cp>0&&cp<=0x10ffff?String.fromCodePoint(cp):" ";})
 .replace(/\s+/g," ").trim();
const textOf=html=>clean(String(html||"").replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi," "));
function safeUrl(raw){
 try{
  const u=new URL(String(raw||"").replace(/&amp;/g,"&"),BASE);
  if(u.protocol!=="https:"||!["mammothnw.com","www.mammothnw.com"].includes(u.hostname)||u.username||u.password||u.port||u.search||u.hash)return null;
  const m=/^\/event\/([a-z0-9][a-z0-9-]*)\/([a-z0-9-]+)\/portland-oregon\/?$/i.exec(u.pathname);
  if(!m||!ROOMS[m[2]])return null;
  return u.href;
 }catch(_){return null;}
}
function links(html){
 const found=new Set();
 for(const m of String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)){
  const url=safeUrl(m[1]);if(url)found.add(url);
 }
 if(found.size>30)throw Error("Mammoth room links unexpectedly exceed bounded review window");
 return [...found];
}
function detail(html,url){
 const official=safeUrl(url);
 if(!official)return {hold:"Not a verified promoter permalink for a supported Portland room",url};
 const roomId=new URL(official).pathname.split("/")[3],room=ROOMS[roomId];
 const page=String(html||"");
 const h1=/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(page);
 const title=clean(h1?.[1]);
 if(!title)return {hold:"No event-specific Mammoth heading",url:official};
 if(/\b(?:cancelled|canceled|postponed|rescheduled|moved to)\b/i.test(title))return {hold:"Promoter announces a moved, cancelled or rescheduled bill; manual review",title,url:official};
 if(/\b(?:vip upgrade|upgrade only|ticket add-on)\b/i.test(title))return {hold:"Not a standalone event",title,url:official};
 const visible=textOf(page.slice((h1?.index||0)+h1[0].length));
 const d=/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\s+(\d{1,2}:\d{2}\s*[ap]m)\b/i.exec(visible);
 if(!d)return {hold:"No explicit weekday + full year + performance clock in original Mammoth detail",title,url:official};
 const year=Number(d[4]),month=MONTHS[d[2].toLowerCase()],day=Number(d[3]),clock=time24(d[5]);
 const utc=new Date(Date.UTC(year,month-1,day));
 if(utc.getUTCFullYear()!==year||utc.getUTCMonth()!==month-1||utc.getUTCDate()!==day||
  WEEK[utc.getUTCDay()].toLowerCase()!==d[1].toLowerCase())return {hold:"Full-year event date and weekday disagree",title,url:official};
 const startDate=wallToPacific(year,month,day,clock);
 if(!startDate)return {hold:"Original showtime is invalid or has an ambiguous Pacific clock",title,url:official};
 const after=visible.slice(d.index+d[0].length,d.index+d[0].length+120);
 if(!room.label.test(after))return {hold:"Mammoth detail venue is not the URL's precise Portland room",title,url:official};
 const show=/\bShow\s*:\s*(\d{1,2}(?::\d{2})?\s*[ap]m)\b/i.exec(visible.slice(0,d.index));
 if(!show||time24(show[1])!==clock)return {hold:"Promoter showtime label missing or conflicts with full-year detail timestamp",title,url:official};
 if(/\b(?:cancelled|canceled|postponed|rescheduled|moved to)\b/i.test(visible.slice(0,d.index)))
   return {hold:"Promoter indicates status change in event header",title,url:official};
 const artwork=eventArtworkFromHtml(page,official,title);
 return {title,fullUrl:official,startDate,venue:room.venue,address:room.address,
  neighborhood:room.neighborhood,
  timeEvidence:"Mammoth original promoter detail independently confirms weekday, full date/year, room, and Show clock; Doors is not used as start time",
  description:"First-party Mammoth Northwest promoter listing for "+room.venue+". Verify status and event format before publication.",
  ...(artwork?{artwork}:{})
 };
}
async function page(url,fetchFn=fetch){
 const r=await fetchFn(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},redirect:"error",signal:AbortSignal.timeout(18000)});
 if(!r.ok||!r.headers.get("content-type")?.includes("text/html"))throw Error("Mammoth original event HTML unavailable, status "+r.status);
 const html=await r.text();
 if(html.length>2500000)throw Error("Mammoth event page exceeds 2.5MB");
 return html;
}
async function fetchEvents(fetchFn=fetch){
 const listing=await page(CALENDAR,fetchFn);
 const original=links(listing);
 if(!original.length)throw Error("No supported Portland room details in Mammoth promoter roster");
 const found=[];
 for(let i=0;i<original.length;i+=3){
  const group=await Promise.all(original.slice(i,i+3).map(async u=>{
   try{return detail(await page(u,fetchFn),u);}
   catch(e){return {hold:"Official Mammoth page fetch failed: "+String(e.message||e),url:u};}
  }));
  found.push(...group);
 }
 if(!found.some(x=>x.startDate))throw Error("No Mammoth original Portland room show dates verified");
 return found;
}
module.exports={CALENDAR,ROOMS,safeUrl,links,detail,fetchEvents};
