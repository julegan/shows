"use strict";
/* Roseland/Hawthorne official show pages have a common dated event-detail format.
 * Require an explicit year, date, showtime and event-specific primary permalink.
 * Fail closed on moved shows, contradictory times or wrong rooms. No time guessing.
 */
const {wallToPacific,time24,eventArtworkFromHtml}=require("./priority-importers");
const MONTHS={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
const NAME="January|February|March|April|May|June|July|August|September|October|November|December";
function safeEventUrl(value,source){
 try {
  const u=new URL(value.replace(/&amp;/g,"&"),source.baseUrl),base=new URL(source.baseUrl);
  if(u.protocol!=="https:"||u.hostname!==base.hostname||u.username||u.password||u.port||u.search||u.hash)return null;
  const room=source.id==="roseland"?"roseland-theater":"hawthorne-theatre";
  if(!new RegExp("^/event/[^/]+/"+room+"/portland-oregon/?$","i").test(u.pathname))return null;
  return u.href;
 }catch(_){return null;}
}
function parseHostedLinks(html,source){
 const seen=new Set(),links=[];
 for(const a of String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)){
  const url=safeEventUrl(a[1],source);
  if(url&&!seen.has(url)){seen.add(url);links.push(url);}
 }
 if(!links.length)throw Error(source.name+" calendar has no first-party event-detail links; adapter needs review");
 if(links.length>75)throw Error(source.name+" calendar has over 75 links; pagination/coverage review needed");
 return links;
}
function decode(text){
 return String(text||"").replace(/&(?:nbsp|amp|quot|apos|lt|gt);/gi,c=>({ "&nbsp;":" ","&amp;":"&","&quot;":'"',"&apos;":"'","&lt;":"<","&gt;":">"}[c.toLowerCase()]||c))
  .replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi,(_,h,d)=>{const n=parseInt(h||d,h?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):" ";});
}
function toText(html){
 return decode(String(html||"").replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi," ")
   .replace(/<[^>]*>/g," ")).replace(/\s+/g," ").trim();
}
function parseHostedDetail(html,detailUrl,source){
 const official=safeEventUrl(detailUrl,source);
 if(!official)return {hold:"Event URL outside official venue calendar",url:detailUrl};
 const page=String(html||"");
 const h1=page.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
 const title=h1?toText(h1[1]):"";
 if(!title)return {hold:"Missing event-specific heading",url:official};
 if(/\b(?:moved to|postponed|cancelled|canceled|rescheduled)\b/i.test(title))return {hold:"Venue reports show moved, canceled or postponed",title,url:official};
 if(/\b(?:vip upgrade|upgrade only|entry ticket not included)\b/i.test(title))return {hold:"Ticket add-on, not an independent event",title,url:official};
 const text=toText(page);
 // Detail content must explicitly name a date with YEAR and performance time.
 // Yearless card dates may refer to the wrong year; do not infer it.
 const dateRx=new RegExp("\\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\\s+("+NAME+")\\s+(\\d{1,2})(?:st|nd|rd|th)?[,]?\\s+(20\\d{2})\\s+(\\d{1,2}:\\d{2}\\s*[ap]m)\\b","i");
 const match=dateRx.exec(text);
 if(!match)return {hold:"No explicit year + dated performance time in venue detail",title,url:official};
 const month=MONTHS[match[1].toLowerCase()],day=Number(match[2]),year=Number(match[3]),time=time24(match[4]);
 const startDate=time&&wallToPacific(year,month,day,time);
 if(!startDate)return {hold:"Invalid dated showtime or Pacific offset",title,url:official};
 const show=text.match(/\bShow\s*:\s*(\d{1,2}(?::\d{2})?\s*[ap]m)\b/i);
 if(show&&time24(show[1])!==time)return {hold:"Listed showtime conflicts with event-detail date/time",title,url:official};
 const room=source.id==="roseland"?"Roseland Theater":"Hawthorne Theatre";
 if(source.id==="hawthorne-theatre"&&/Hawthorne Lounge/i.test(text.slice(0,match.index+100)))return {hold:"Hawthorne Lounge listing requires its own venue identity",title,url:official};
 const image=eventArtworkFromHtml(page,official);
 return {title,fullUrl:official,startDate,venue:room,sourceVerifiedMusic:!!(/\bconcert\b/i.test(text.slice(0,3000))),
  timeEvidence:"Venue event-detail page explicitly publishes the full date, year and performance time",
  description:"Official "+room+" dated event page; verify the time, format and status before approval",
  ...(image?{artwork:image}:{})};
}
module.exports={safeEventUrl,parseHostedLinks,parseHostedDetail};
