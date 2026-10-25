"use strict";
/* Official Kenton Club roster. Its public show calendar has weekdays and dates,
 * but generally does not publish start times, year, or event-specific URLs.
 * Never fabricate showtimes. Review-only import, with the roster linked as source.
 */
const SOURCE_URL="https://www.kentonclub.com/";
const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const TIME_ZONE="America/Los_Angeles";
const localDate=now=>{
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:TIME_ZONE,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now).map(p=>[p.type,p.value]));
 return [parts.year,parts.month,parts.day].join("-");
};
const escapeHtml=s=>String(s).replace(/&(?:amp|quot|apos|nbsp|lt|gt|#\d+|#x[\da-f]+);/gi,v=>{
 const entities={"&amp;":"&","&quot;":'"',"&apos;":"'","&nbsp;":" ","&lt;":"<","&gt;":">"};
 const key=v.toLowerCase();
 if(entities[key])return entities[key];
 if(/^&#x/i.test(key))return String.fromCodePoint(parseInt(key.slice(3,-1),16));
 if(/^&#/.test(key))return String.fromCodePoint(parseInt(key.slice(2,-1),10));
 return v;
});
function visibleLines(html){
 const noNoise=String(html||"")
  .replace(/<!--[\s\S]*?-->/g,"")
  .replace(/<(script|style|svg|noscript|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,"")
  .replace(/<br\b[^>]*\/?>/gi,"\n")
  .replace(/<\/(?:p|h[1-6]|div|li|section|article|header|footer)>/gi,"\n")
  .replace(/<[^>]*>/g," ");
 return escapeHtml(noNoise).split(/\r?\n/).map(s=>s.replace(/\s+/g," ").trim()).filter(Boolean);
}
const HEADING=/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:\s*\([^)]{0,100}\))?$/i;
function resolvedDay(weekday,month,day,now){
 const today=localDate(now),thisYear=Number(today.slice(0,4));
 const m=MONTHS.findIndex(x=>x.toLowerCase()===month.toLowerCase())+1;
 const d=Number(day);
 if(!m||d<1||d>31)return null;
 const candidates=[];
 for(const year of [thisYear,thisYear+1]){
  const date=new Date(Date.UTC(year,m-1,d,12));
  if(date.getUTCMonth()!==m-1||date.getUTCDate()!==d)continue;
  if(DAYS[date.getUTCDay()].toLowerCase()!==weekday.toLowerCase())continue;
  const iso=[year,String(m).padStart(2,"0"),String(d).padStart(2,"0")].join("-");
  const days=(Date.parse(iso+"T00:00:00Z")-Date.parse(today+"T00:00:00Z"))/86400000;
  if(days>=0&&days<=120)candidates.push(iso);
 }
 return candidates.length===1?candidates[0]:null;
}
function parseKenton(html,{now=new Date()}={}){
 const lines=visibleLines(html);
 const start=lines.findIndex(s=>/^all shows \$10 cover unless noted$/i.test(s));
 if(start<0||!lines.some(s=>/Kenton Club/i.test(s)))throw Error("Official Kenton show-roster heading missing");
 const rows=[],holds=[];
 let active=null;
 const finish=()=>{
  if(!active)return;
  const title=active.title.filter(x=>!/^\s*$/.test(x)).join(" ").replace(/\s+/g," ").trim();
  if(!title||title.length>250){holds.push({hold:"Missing or implausibly long bill title",dateOnly:active.date,title:title.slice(0,100)});active=null;return;}
  const unsafe=/^(?:https?:\/\/|mailto:|contact|wfkcbooking|copyright|2025 N Kilpatrick)/i;
  if(unsafe.test(title)){active=null;return;}
  rows.push({
    title,fullUrl:SOURCE_URL,dateOnly:active.date,sourceDateOnly:true,venue:"Kenton Club",
    sourceVerifiedMusic:true,
    timeEvidence:"Official Kenton Club roster lists the date, but no verified showtime. Midnight is a sorting anchor only.",
    description:"Official Kenton Club published upcoming show roster; schedule year verified by weekday and a 120-day rolling boundary. Check lineup and showtime with the venue. Individual event permalink is not available."
  });
  active=null;
 };
 for(let i=start+1;i<lines.length;i++){
  const line=lines[i];
  if(/(?:wfkcbooking\s*@|2025 N Kilpatrick|^Copyright\b|^Current Hours$)/i.test(line))break;
  const match=line.match(HEADING);
  if(match){
   finish();
   const date=resolvedDay(match[1],match[2],match[3],now);
   active=date?{date,title:[]}:null;
   continue;
  }
  // Malformed date-like headings and missing day numbers must never be swallowed into a previous bill.
  if(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+[A-Z][a-z]+(?:\s|$)/.test(line)){finish();active=null;continue;}
  if(active&&active.title.length<8)active.title.push(line);
 }
 finish();
 if(rows.length>45)throw Error("Kenton public show roster exceeds 45 entries; review parser bounds");
 return [...rows,...holds];
}
module.exports={SOURCE_URL,visibleLines,resolvedDay,parseKenton};
