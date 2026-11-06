"use strict";
const {wallToPacific,time24}=require("./priority-importers");
const HOME="https://www.jacklondonrevue.com/";
const ORIGIN="https://www.jacklondonrevue.com";
const months=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
function clean(raw,max=300){
 return String(raw||"").replace(/<[^>]*>/g," ")
 .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,h,d)=>{
  const n=parseInt(h||d,h?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):" ";
 }).replace(/&(amp|quot|apos|nbsp|ndash|mdash);/gi,k=>({
  "&amp;":"&","&quot;":'"',"&apos;":"'","&nbsp;":" ","&ndash;":"–","&mdash;":"—"
 }[k.toLowerCase()])).replace(/\s+/g," ").trim().slice(0,max);
}
function eventUrl(raw){
 try{
  const u=new URL(raw,ORIGIN);
  if(u.protocol!=="https:"||u.hostname!=="www.jacklondonrevue.com"||u.username||u.password||u.port||u.search||u.hash)return null;
  return /^\/tm-event\/[a-z0-9][a-z0-9-]{1,180}\/$/i.test(u.pathname)?u.href:null;
 }catch(_){return null}
}
function field(html,cls){
 const rx=new RegExp('<(?:span|div)\\b[^>]*class="[^"]*\\b'+cls+'\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/(?:span|div)>',"i");
 return clean(rx.exec(html)?.[1]||"");
}
function clock(raw){
 const m=String(raw||"").match(/\b(\d{1,2}):(\d{2})\s*([ap])m\b/i);
 return m?time24(m[1]+":"+m[2]+m[3]+"m"):null;
}
function art(raw,source){
 try{
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.hostname!=="i.ticketweb.com"||u.username||u.password||u.port||u.hash||
   !/^\/i\/(?:\d{2}\/){4}\d+_Original\.(?:jpe?g|png|webp)$/i.test(u.pathname)||
   [...u.searchParams.keys()].some(x=>x!=="v"))return null;
  return {url:u.href,sourceUrl:source,origin:"official-event-page",credit:"Original TicketWeb artwork linked by Jack London Revue",usageApproved:null};
 }catch(_){return null}
}
function roster(html){
 if(typeof html!=="string"||html.length>900000)throw Error("Original JLR roster exceeds source size limit");
 const marker='<div id="tw-responsive" class="event-list">';
 const i=html.indexOf(marker);
 if(i<0||!html.slice(i,i+600).includes("tw-plugin-upcoming-event-list"))throw Error("Original JLR event roster missing");
 const region=html.slice(i),blocks=region.split(/<div class="tw-section">/).slice(1);
 if(!blocks.length||blocks.length>120)throw Error("Original JLR event count changed");
 const rows=[],seen=new Set();
 for(const block of blocks){
  if(!block.includes('class="tw-name"')||!block.includes('class="tw-date-time"'))continue;
  const link=block.match(/<div class="tw-name">\s*<a\b[^>]*href="([^"]+)"/i)?.[1];
  const url=eventUrl(link),title=field(block,"tw-name");
  const d=field(block,"tw-event-date").match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})$/i);
  const show=clock(field(block,"tw-event-time")),doors=clock(field(block,"tw-event-door-time"));
  if(!url||!title||!d||!show){rows.push({hold:"Source roster lacks event URL, title, date or show clock",url,title});continue;}
  const key=url+"|"+d[2]+d[3]+"|"+show;if(seen.has(key))continue;seen.add(key);
  rows.push({url,title,weekday:d[1],month:months.indexOf(d[2].toLowerCase())+1,day:Number(d[3]),show,doors});
 }
 if(!rows.some(x=>x.url&&!x.hold))throw Error("No original JLR show cards on source page");
 return {rows,partial:/<[^>]+class="[^"]*tw-paginate/i.test(region)};
}
function detail(html,item){
 if(item?.hold)return item;
 const url=eventUrl(item?.url);if(!url)return {hold:"Invalid JLR original event URL"};
 if(typeof html!=="string"||html.length>900000)return {hold:"Original JLR event detail size invalid",url};
 const at=html.indexOf('<div id="tw-responsive" class="tm-event-details">');
 if(at<0)return {hold:"JLR original detail page lacks event data",url};
 const body=html.slice(at,at+55000);
 const title=field(body,"event-title"),dateText=field(body,"tw-event-date"),venue=field(body,"tw-venue-name"),weekday=field(body,"tw-day-of-week");
 const show=clock(field(body,"tw-event-time")),doors=clock(field(body,"tw-event-door-time"));
 const date=dateText.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(20\d\d)$/i);
 const fail=hold=>({hold,title,url});
 if(!title||!date||venue!=="Jack London Revue"||!show)return fail("Missing source year, verified room, title or showtime");
 const month=months.indexOf(date[1].slice(0,3).toLowerCase())+1,day=Number(date[2]),year=Number(date[3]);
 const stamp=new Date(Date.UTC(year,month-1,day));
 if(stamp.getUTCFullYear()!==year||stamp.getUTCMonth()!==month-1||stamp.getUTCDate()!==day)return fail("Invalid original date");
 const dow=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][stamp.getUTCDay()];
 if(dow.toLowerCase()!==weekday.toLowerCase()||dow.toLowerCase()!==item.weekday.toLowerCase()||
   month!==item.month||day!==item.day||show!==item.show||(doors&&item.doors&&doors!==item.doors))return fail("Roster/detail original date or clocks disagree");
 const when=wallToPacific(year,month,day,show),doorTime=doors?wallToPacific(year,month,day,doors):null;
 if(!when||(doors&&!doorTime)||(doorTime&&Date.parse(doorTime)>Date.parse(when)))return fail("Invalid Pacific local show or doors clock");
 const norm=v=>clean(v).toLowerCase().replace(/[^a-z0-9]+/g,"");
 if(norm(title)!==norm(item.title))return fail("Original event title does not match roster");
 if(/\b(?:postponed|canceled|cancelled|rescheduled|moved to|vip upgrade)\b/i.test(title))return fail("Changed-status/add-on event");
 const image=body.match(/<img[^>]*class="event-img original"[^>]*src="([^"]+)"/i)?.[1];
 const artwork=art(image,url);
 const description=clean(body.match(/<div class="tw-description">([\s\S]*?)<\/div>/i)?.[1],450);
 const originalMusic=!/\b(?:cabaret|burly[\s-]?q|burlesque|comedy|trivia|karaoke|bingo)\b/i.test(title)&&
  /\b(?:live music|live band|jazz orchestra|live jazz|music concert)\b/i.test(description);
 return {title,fullUrl:url,venue:"Jack London Revue",startDate:when,sourceVerifiedMusic:originalMusic,
  timeEvidence:"Original JLR event detail verifies full date, venue and showtime separately from doors; the date and clocks match the first-party roster.",
  description:"Original venue event: "+description,
  ...(artwork?{artwork}:{})};
}
async function fetchEvents(src,request=fetch,options={}){
 if(src?.id!=="jack-london-revue"||src.adapter!=="jack-london-original-html"||
   src.url!==HOME||src.baseUrl!==ORIGIN)throw Error("Unexpected Jack London source");
 const get=async url=>{
  if(url!==HOME&&!eventUrl(url))throw Error("Unsafe JLR fetch URL");
  const r=await request(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},
   redirect:"error",signal:AbortSignal.timeout(17000)});
  if(!r.ok||!r.headers.get("content-type")?.includes("text/html"))throw Error("JLR original page HTTP "+r.status+" or non-HTML");
  const body=await r.text();if(body.length>900000)throw Error("JLR page too large");return body;
 };
 const parsed=roster(await get(HOME)),rows=[];
 if(parsed.partial)console.warn("JLR venue roster has pagination; this is first-page coverage only");
 for(let i=0;i<parsed.rows.length&&i<(options.maxEvents||120);i+=4){
  const batch=await Promise.all(parsed.rows.slice(i,Math.min(i+4,options.maxEvents||120)).map(async row=>{
   if(row.hold)return row;
   try{return detail(await get(row.url),row);}
   catch(e){return {hold:"JLR official event page unavailable: "+String(e.message||e),url:row.url,title:row.title};}
  }));
  rows.push(...batch);
 }
 if(!rows.some(x=>x.startDate))throw Error("JLR event source returned no fully verified dated original detail pages");
 return rows;
}
module.exports={HOME,ORIGIN,clean,eventUrl,field,clock,art,roster,detail,fetchEvents};