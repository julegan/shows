"use strict";
/* Wonder Ballroom primary event-page importer.
 * Visible cards omit the year. Use the event page's year-bearing Official Info
 * document title AND matching visible weekday/month/day and showtime.
 * Never infer an event year from current date or from other shows on the page.
 */
const {wallToPacific,time24,eventArtworkFromHtml}=require("./priority-importers");
const months={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const fullMonths=["January","February","March","April","May","June","July","August","September","October","November","December"];
function clean(text){
 return String(text||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
 .replace(/<[^>]*>/g," ").replace(/&(?:amp|nbsp|quot|apos|lt|gt);/gi,t=>({"&amp;":"&","&nbsp;":" ","&quot;":'"',"&apos;":"'","&lt;":"<","&gt;":">"}[t.toLowerCase()]||t))
 .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,h,d)=>{const n=parseInt(h||d,h?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):" "})
 .replace(/\s+/g," ").trim();
}
function safeWonderUrl(raw,source){
 try{
  const url=new URL(String(raw).replace(/&amp;/gi,"&"),source.baseUrl);
  if(url.protocol!=="https:"||url.hostname!==new URL(source.baseUrl).hostname||url.username||url.password||url.port||url.search||url.hash)return null;
  return /^\/event\/[a-z0-9][a-z0-9-]*\/wonder-ballroom\/portland-oregon\/?$/i.test(url.pathname)?url.href:null;
 }catch(_){return null}
}
function parseWonderLinks(html,source){
 const links=[],seen=new Set();
 for(const m of String(html).matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)){
  const url=safeWonderUrl(m[1],source);
  if(url&&!seen.has(url)){seen.add(url);links.push(url)}
 }
 if(!links.length)throw Error("Wonder Ballroom source has no first-party event links; layout requires review");
 if(links.length>100)throw Error("Wonder Ballroom calendar has more than 100 links; pagination coverage needs inspection");
 return links;
}
function parseWonderDetail(html,detailUrl,source){
 const url=safeWonderUrl(detailUrl,source);
 if(!url)return {hold:"Not a first-party Wonder Ballroom event page",url:detailUrl};
 const page=String(html||"");
 const heading=page.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
 const pageTitle=clean(page.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"");
 const title=clean(heading?.[1]||pageTitle.split(/\s+[I|]\s+Official Info\b/i)[0]).replace(/\s+[-–—]\s+Wonder Ballroom\s*$/i,"");
 if(!title||/^All Shows$|^Wonder Ballroom$|^Events$/i.test(title))return {hold:"No event-specific primary-page title",url};
 if(/\b(?:moved to|postponed|cancelled|canceled|rescheduled)\b/i.test(title))return {hold:"Moved, postponed or canceled show; not at Wonder Ballroom",title,url};
 if(/\b(?:VIP upgrade|upgrade only|ticket not included|entry not included)\b/i.test(title))return {hold:"Admission add-on, not a show listing",title,url};
 // "Oct 21, 2026" in this primary EVENT document's title supplies the
 // year; the body must independently confirm the date and showtime.
 const inTitle=pageTitle.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),\s*(20\d{2})\b/i);
 if(!inTitle||!/Wonder Ballroom/i.test(pageTitle))return {hold:"Primary event title does not publish a full dated year",title,url};
 const month=months[inTitle[1].slice(0,3).toLowerCase()],day=Number(inTitle[2]),year=Number(inTitle[3]);
 const text=clean(page),dateRx=new RegExp("\\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\\s+"+fullMonths[month-1]+"\\s+"+day+"\\b","i");
 const visibleDate=dateRx.exec(text);
 if(!visibleDate)return {hold:"Event body date does not match the official title date",title,url};
 const expected=new Intl.DateTimeFormat("en-US",{timeZone:"UTC",weekday:"long"}).format(new Date(Date.UTC(year,month-1,day)));
 if(visibleDate[1].toLowerCase()!==expected.toLowerCase())return {hold:"Event weekday does not match the published year",title,url};
 const afterDate=text.slice(visibleDate.index+visibleDate[0].length,visibleDate.index+visibleDate[0].length+240);
 const show=afterDate.match(/\bShow\s*:\s*(\d{1,2}(?::\d{2})?\s*[ap]m)\b/i);
 if(!show)return {hold:"No showtime associated with this dated event card",title,url};
 const tm=time24(show[1]);
 const startDate=tm&&wallToPacific(year,month,day,tm);
 if(!startDate)return {hold:"Invalid showtime or Pacific local date",title,url};
 const image=eventArtworkFromHtml(page,url);
 return {title,fullUrl:url,venue:"Wonder Ballroom",startDate,sourceVerifiedMusic:false,
  timeEvidence:"Official event-specific page title publishes year; visible dated event card publishes performance time",
  description:"Official Wonder Ballroom event page; review lineup, date, cancellation status and genre before publishing",
  ...(image?{artwork:image}:{})};
}
module.exports={safeWonderUrl,parseWonderLinks,parseWonderDetail};
