"use strict";
/* Primary Dante's listings from the official website, not third-party estimates.
 * Only /tm-event/<slug>/ on danteslive.com, with a stated full date and SHOW time.
 * No automatic publishing, inferred years, or guessed doors/show times.
 */
const {wallToPacific,time24,eventArtworkFromHtml}=require("./priority-importers");
const months={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
const monthPattern="January|February|March|April|May|June|July|August|September|October|November|December";
function safeDantesUrl(raw,source){
 try{
  const u=new URL(String(raw).replace(/&amp;/gi,"&"),source.baseUrl),home=new URL(source.baseUrl);
  if(u.protocol!=="https:"||u.hostname!==home.hostname||u.username||u.password||u.port||u.search||u.hash)return null;
  if(!/^\/tm-event\/[a-z0-9][a-z0-9-]*\/?$/i.test(u.pathname))return null;
  return u.href;
 }catch(_){return null;}
}
function parseDantesLinks(html,source){
 const links=[],seen=new Set();
 for(const match of String(html).matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)){
  const url=safeDantesUrl(match[1],source);
  if(url&&!seen.has(url)){seen.add(url);links.push(url);}
 }
 if(!links.length)throw Error("Dante's homepage contains no allowlisted dated event detail links; source layout needs review");
 if(links.length>100)throw Error("Dante's listing exceeds the verified 100-event link limit; audit pagination rather than truncate");
 return links;
}
function unescapeHtml(s){
 return String(s||"").replace(/&(?:amp|quot|apos|nbsp|lt|gt);/gi,x=>({"&amp;":"&","&quot;":'"',"&apos;":"'","&nbsp;":" ","&lt;":"<","&gt":">"}[x.toLowerCase()]||" "))
  .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,hex,decimal)=>{const n=parseInt(hex||decimal,hex?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):" ";});
}
function cleanText(s){
 return unescapeHtml(String(s||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ")).replace(/\s+/g," ").trim();
}
function parseDantesDetail(html,detailUrl,source){
 const url=safeDantesUrl(detailUrl,source);
 if(!url)return {hold:"Non-primary Dante's event URL",url:detailUrl};
 const page=String(html||"");
 const h1=page.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
 const title=cleanText(h1?.[1]||page.match(/<meta\b[^>]*\bproperty=["']og:title["'][^>]*\bcontent=["']([^"']+)["']/i)?.[1]||"");
 if(!title||/^Dante's|calendar|home$/i.test(title))return {hold:"No event-specific heading on primary event detail",url};
 if(/\b(moved to|postponed|cancelled|canceled|rescheduled)\b/i.test(title))return {hold:"Venue show canceled/moved/postponed",title,url};
 if(/\b(vip upgrade|upgrade only|ticket not included)\b/i.test(title))return {hold:"Add-on admission is not a standalone show",title,url};
 const text=cleanText(page);
 const rx=new RegExp("\\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:day)?\\s+("+monthPattern+")\\s+(\\d{1,2}),\\s*(20\\d{2})\\s+Doors:\\s*(\\d{1,2}:\\d\\d\\s*[ap]m)\\s*\\/\\s*Show:\\s*(\\d{1,2}:\\d\\d\\s*[ap]m)\\s*(PDT|PST)?\\b","i");
 const m=rx.exec(text);
 if(!m)return {hold:"Official event detail missing full year/date and distinct show time",title,url};
 const mo=months[m[1].toLowerCase()],day=Number(m[2]),year=Number(m[3]),show=time24(m[5]);
 const startDate=show&&wallToPacific(year,mo,day,show);
 if(!startDate)return {hold:"Bad official showtime or Pacific local date",title,url};
 const localAbbr=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",timeZoneName:"short"}).formatToParts(new Date(startDate)).find(x=>x.type==="timeZoneName")?.value;
 if(m[6]&&m[6].toUpperCase()!==localAbbr)return {hold:"Venue-listed Pacific timezone contradicts event date",title,url};
 if(!/\bDante's\b/i.test(text))return {hold:"Detail page does not identify Dante's as venue",title,url};
 const art=eventArtworkFromHtml(page,url);
 return {title,fullUrl:url,startDate,venue:source.venue,sourceVerifiedMusic:false,
  timeEvidence:"Primary Dante's event detail explicitly specifies showtime and Pacific date",
  description:"Official Dante's event detail listing; show type, performance time and cancellation status remain subject to editorial review",
  ...(art?{artwork:art}:{})};
}
module.exports={safeDantesUrl,parseDantesLinks,parseDantesDetail};
