"use strict";
/* The 1905 first-party Turntable Tickets event importer.
 * Read-only, bounded server-rendered first batch (hasMore can indicate
 * additional pages). Every performance ID is an independent ticketed set.
 */
const {wallToPacific}=require("./priority-importers");
const BASE="https://the1905.turntabletickets.com";
function clean(raw,max=600){
 return String(raw||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]*>/g," ").replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,h,d)=>{
   const n=parseInt(h||d,h?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):" ";
  }).replace(/&(amp|lt|gt|quot|apos|nbsp);/gi,x=>({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'","&nbsp;":" "}[x.toLowerCase()])).replace(/\s+/g," ").trim().slice(0,max);
}
function showUrl(raw){
 try{
  const u=new URL(raw,BASE+"/");
  if(u.protocol!=="https:"||u.hostname!=="the1905.turntabletickets.com"||u.username||u.password||u.port||u.search||u.hash)return null;
  return /^\/shows\/[1-9]\d{2,8}\/20\d\d-\d\d-\d\d$/.test(u.pathname)?u.href:null;
 }catch(_){return null}
}
function image(imageUrl,showId,source){
 try{
  const u=new URL(imageUrl);
  if(u.protocol!=="https:"||u.hostname!=="assets-prod.turntabletickets.com"||u.username||u.password||u.port||u.search||u.hash||
      !u.pathname.startsWith("/media/the1905/show-"+showId+"/")||!/\.(?:jpe?g|png|webp)$/i.test(u.pathname))return null;
  return {url:u.href,sourceUrl:source,origin:"official-event-page",credit:"The 1905 original ticket listing",usageApproved:null};
 }catch(_){return null}
}
function stateOf(html){
 if(typeof html!=="string"||html.length>1600000||!/<title>Shows\s+-\s+The 1905<\/title>/i.test(html))
  throw Error("The 1905 original ticket page changed or exceeds size bounds");
 const m=[...html.matchAll(/<script\b[^>]*>\s*window\.__pinia\s*=\s*(\{[\s\S]*?\});\s*<\/script>/gi)];
 if(m.length!==1)throw Error("Original public SSR state missing or ambiguous");
 const state=JSON.parse(m[0][1]),pp=state.performancePaginate;
 if(!pp||pp.ssrPrefetchDone!==true||!Array.isArray(pp.performances)||pp.performances.length<1||pp.performances.length>80||typeof pp.hasMore!=="boolean")
  throw Error("The 1905 public event batch unavailable or unexpected");
 return {performances:pp.performances,hasMore:pp.hasMore};
}
function pacificDay(now){
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",
  year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now).map(x=>[x.type,x.value]));
 return parts.year+"-"+parts.month+"-"+parts.day;
}
function row(p,permittedLinks,today){
 const show=p?.show;
 if(!p||!show||typeof show!=="object"||!Number.isSafeInteger(p.id)||p.id<1||
     !Number.isSafeInteger(p.show_id)||p.show_id<1||show.id!==p.show_id)
  return {hold:"Original performance and show IDs disagree"};
 const title=clean(show.name,190),date=p.date,time=p.time;
 if(!title||!/^20\d\d-\d\d-\d\d$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
  return {hold:"Original ticket show is missing a title, date or clock"};
 const url=showUrl("/shows/"+p.show_id+"/"+date);
 if(!url||!permittedLinks.has(new URL(url).pathname)){
  // The SSR batch sometimes includes earlier performances no longer linked
  // from the public upcoming list. Those are historical, not broken future
  // listings. Never apply this exception to a current or future performance.
  if(today&&date<today)return {skip:"Historical performance no longer linked in the upcoming calendar",
   title,url,sourcePerformanceId:String(p.id)};
  return {hold:"Original ticket performance lacks a linked event-specific page",title,url};
 }
 const [y,m,d]=date.split("-").map(Number);
 const instant=wallToPacific(y,m,d,time);
 if(!instant||!p.datetime||!Number.isFinite(Date.parse(p.datetime))||Date.parse(instant)!==Date.parse(p.datetime))
  return {hold:"Original show clock and Pacific date conflict with source UTC instant",title,url};
 if(/\b(?:cancelled|canceled|postponed|rescheduled|moved to)\b/i.test(title))
  return {hold:"Original source indicates schedule change",title,url};
 const readable=new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",timeZone:"UTC"}).format(new Date("2026-01-01T"+time+":00Z"));
 const description=String(show.description||"").slice(0,2200),categories=[];
 if(/\bjazz\b/i.test(description))categories.push("Jazz");
 if(/\bblues\b/i.test(description))categories.push("Blues");
 const art=image(show.image,p.show_id,url);
 return {
  title:title+" — "+readable+" show",fullUrl:url,venue:"The 1905",startDate:instant,
  sourcePerformanceId:String(p.id),sourceShowId:String(p.show_id),
  sourceVerifiedMusic:true,categories,
  timeEvidence:"Original The 1905 performance "+p.id+" supplies a ticketed show time (not doors) with independently matching Pacific and UTC timestamps.",
  description:"Original ticketed performance. "+clean(description,600)+
   ((p.sold===true||p.availability_state==="sold_out")?" Original tickets currently display sold out.":""),
  ...(art?{artwork:art}:{})
 };
}
function parse(html,opts={}){
 const {performances,hasMore}=stateOf(html);
 const links=new Set([...html.matchAll(/<a\b[^>]*href=["'](\/shows\/[1-9]\d{2,8}\/20\d\d-\d\d-\d\d)["'][^>]*>/gi)].map(x=>x[1]));
 if(!links.size)throw Error("Original venue show permalinks not found");
 const records=[],seen=new Set(),today=pacificDay(opts.now||new Date());
 for(const item of performances){
  if(seen.has(item?.id))continue;
  seen.add(item?.id);
  records.push(row(item,links,today));
 }
 if(!records.some(r=>r.startDate))
  // Preserve all observed holds and skips in the editorial review report.
  // A temporarily inconsistent first SSR batch must not erase its evidence
  // by throwing away the whole venue result.
  console.warn("THE 1905 original source has zero verified performances this batch: "+
   JSON.stringify({checked:records.length,held:records.filter(x=>x.hold).length,
    historical:records.filter(x=>x.skip).length,reasons:records.filter(x=>x.hold).map(x=>x.hold).slice(0,8)}));

 return {records,partial:hasMore};
}
async function fetchEvents(src,request=fetch,opts={}){
 if(src?.id!=="the-1905"||src.adapter!=="turntable-1905-ssr"||src.baseUrl!==BASE||src.url!==BASE+"/")
  throw Error("Unexpected The 1905 source configuration");
 const res=await request(src.url,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},
  redirect:"error",signal:AbortSignal.timeout(17000)});
 if(!res.ok||!res.headers.get("content-type")?.includes("text/html"))throw Error("Original The 1905 ticket source returned HTTP "+res.status);
 const html=await res.text(),out=parse(html,opts);
 if(out.partial)console.warn("THE 1905 source is paginated: only verified first SSR batch checked; NOT complete calendar coverage");
 return out.records;
}
module.exports={BASE,clean,showUrl,image,stateOf,row,pacificDay,parse,fetchEvents};
