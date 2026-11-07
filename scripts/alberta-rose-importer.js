"use strict";
/* Alberta Rose Theatre: original public RHP Events calendar mobile list.
 * The rendered calendar itself supplies explicit month+year group headers,
 * event-specific venue URLs, and independently labeled show vs doors clocks.
 * Series performances use unique room-scoped Etix ticket links. No recurrence
 * is manufactured from informal venue schedule descriptions.
 */
const {wallToPacific,time24}=require("./priority-importers");
const CALENDAR="https://albertarosetheatre.com/calendar/";
const BASE="https://albertarosetheatre.com";
const MONTHS={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
const SHORT_MONTHS=Object.fromEntries(Object.entries(MONTHS).map(([name,month])=>[name.slice(0,3),month]));
function clean(raw,max=260){
 let s=String(raw||"");
 for(let i=0;i<2;i++)s=s.replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,h,d)=>{
  const n=parseInt(h||d,h?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):" ";
 }).replace(/&(?:amp|lt|gt|quot|apos|nbsp|ndash|mdash);/gi,c=>({
  "&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'","&nbsp;":" ","&ndash;":"–","&mdash;":"—"
 }[c.toLowerCase()]));
 return s.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,max);
}
function eventUrl(raw){
 try{
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.hostname!=="albertarosetheatre.com"||u.username||u.password||u.port||u.search||u.hash)return null;
  return /^\/event\/[a-z0-9][a-z0-9-]{1,220}\/alberta-rose-theatre\/portland-oregon\/$/i.test(u.pathname)?u.href:null;
 }catch(_){return null}
}
function ticketUrl(raw){
 try{
  const u=new URL(clean(raw,600));
  if(u.protocol!=="https:"||u.hostname!=="www.etix.com"||u.username||u.password||u.port||u.hash)return null;
  const m=u.pathname.match(/^\/ticket\/p\/(\d{5,12})\/([a-z0-9-]+)-portland-alberta-rose-theatre\/?$/i);
  if(!m||[...u.searchParams.keys()].some(x=>x!=="partner_id")||u.searchParams.get("partner_id")!== "100")return null;
  return {url:u.origin+u.pathname,eventId:m[1]};
 }catch(_){return null}
}
function artwork(raw,source){
 try{
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.hostname!=="albertarosetheatre.com"||u.username||u.password||u.port||u.search||u.hash||
   !/^\/wp-content\/uploads\/20\d\d\/(?:0[1-9]|1[0-2])\/[^/?#]+\.(?:jpe?g|jfif|png|webp)$/i.test(u.pathname))return null;
  return {url:u.href,sourceUrl:source,origin:"official-venue-calendar",credit:"Alberta Rose Theatre original event artwork",usageApproved:null};
 }catch(_){return null}
}
function clockText(body){
 const shown=clean(body,200),s=shown.match(/\bShow:\s*(\d{1,2}(?::\d\d)?\s*[ap]m)\b/i),
  d=shown.match(/\bDoors:\s*(\d{1,2}(?::\d\d)?\s*[ap]m)\b/i);
 return {show:s?time24(s[1]):null,doors:d?time24(d[1]):null,
  conflicting:(!s||shown.includes("Doors:")&&!d)||(!d&&shown.includes("Doors:"))};
}
function dateFor(month,year,day,weekday,show,doors){
 const n=Number(day),stamp=new Date(Date.UTC(year,month-1,n));
 if(!Number.isInteger(year)||!month||n<1||n>31||stamp.getUTCFullYear()!==year||
    stamp.getUTCMonth()!==month-1||stamp.getUTCDate()!==n)return null;
 if(weekday&&["sun","mon","tue","wed","thu","fri","sat"][stamp.getUTCDay()]!==weekday.toLowerCase().slice(0,3))return null;
 const startDate=wallToPacific(year,month,n,show);
 if(!startDate)return null;
 if(doors){
  const doorStamp=wallToPacific(year,month,n,doors);
  if(!doorStamp||Date.parse(startDate)<Date.parse(doorStamp))return null;
 }
 return startDate;
}
function titleIn(block){
 return clean(block.match(/<h2\b[^>]*class=["'][^"']*\brhp-event__title--list\b[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i)?.[1],220);
}
function artIn(block,source){
 const raw=block.match(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i)?.[1];
 return artwork(raw,source);
}
function single(block,group){
 const title=titleIn(block);
 const link=block.match(/<a\b[^>]*id\s*=\s*["']eventTitle["'][^>]*href=["']([^"']+)["']/i)?.[1];
 const url=eventUrl(link);
 if(!title||!url)return {hold:"Original Alberta Rose single event title/URL unverified",title};
 if(!/id=["']eventVenueId-12630["']/.test(block))return {hold:"Original Alberta Rose venue identity missing or changed",title,url};
 if(/\b(?:canceled|cancelled|postponed|rescheduled|moved to|vip upgrade)\b/i.test(title))
  return {hold:"Original event status changed or event is an add-on",title,url};
 const date=clean(block.match(/<div\b[^>]*id\s*=\s*["']eventDate["'][^>]*>([\s\S]*?)<\/div>/i)?.[1],70);
 const dm=date.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat),?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})$/i);
 const time=clockText(block.match(/<span\b[^>]*class=["'][^"']*\brhp-event__time-text--list\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]);
 if(!dm||!group||group.month!==SHORT_MONTHS[dm[2].toLowerCase()]||!time.show||time.conflicting)
  return {hold:"Original event missing calendar year/date or explicit SHOW clock",title,url};
 const startDate=dateFor(group.month,group.year,dm[3],dm[1],time.show,time.doors);
 if(!startDate)return {hold:"Original month/year, weekday or doors/show conflict",title,url};
 const art=artIn(block,url);
 return {title,fullUrl:url,venue:"Alberta Rose Theatre",startDate,sourceVerifiedMusic:false,
  timeEvidence:"Original Alberta Rose dated calendar month/year, weekday, exact room and separately labeled SHOW time; doors not substituted.",
  description:"Original theatre calendar; music style and format require event-specific editorial assessment.",
  ...(art?{artwork:art}:{})};
}
function series(block,group){
 const title=titleIn(block);
 const link=block.match(/<div\b[^>]*class=["'][^"']*\beventSeriesTitle\b[^"']*["'][^>]*>[\s\S]*?<a\b[^>]*href=["']([^"']+)["']/i)?.[1];
 const seriesUrl=(()=>{try{const u=new URL(link);return u.protocol==="https:"&&u.hostname==="albertarosetheatre.com"&&!u.search&&!u.hash&&
  /^\/calendar\/category\/series\/[a-z0-9-]+\/alberta-rose-theatre\/portland-oregon\/$/i.test(u.pathname)?u.href:null;}catch(_){return null}})();
 if(!title||!seriesUrl||!group)return [{hold:"Unverified original Alberta Rose event series",title}];
 const items=[...block.matchAll(/<li\b[^>]*class=["'][^"']*\brhp-event-series-individual\b[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi)];
 if(!items.length||items.length>40)return [{hold:"Missing or unexpectedly large original series performance list",title,url:seriesUrl}];
 const art=artIn(block,seriesUrl);
 return items.map((match)=>{
  const html=match[1],date=clean(html.match(/<div\b[^>]*class=["'][^"']*\brhp-event-series-date\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1],70);
  const dm=date.match(/^(?:(Sun|Mon|Tue|Wed|Thu|Fri|Sat),?\s+)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})$/i);
  const raw=html.match(/<a\b[^>]*href=["'](https:\/\/www\.etix\.com\/ticket\/p\/[^"']+)["']/i)?.[1];
  const ticket=ticketUrl(raw);
  if(!dm||!ticket)return {hold:"Original series performance date or independent ticket ID missing",title,url:seriesUrl};
  // Do not assign January 2027 from a November 2026 series header alone.
  // A differing month requires its own explicit month+year source.
  if(SHORT_MONTHS[dm[2].toLowerCase()]!==group.month)return {hold:"Cross-month series performance lacks its own year header",title,url:ticket.url};
  const time=clockText(html.match(/<div\b[^>]*class=["'][^"']*\brhp-event-series-time\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]);
  if(!time.show||time.conflicting)return {hold:"Series performance has no verified SHOW clock",title,url:ticket.url};
  const startDate=dateFor(group.month,group.year,dm[3],dm[1],time.show,time.doors);
  if(!startDate)return {hold:"Series date and source time conflict",title,url:ticket.url};
  const eventTitle=title+" — "+formatClock(time.show)+" show";
  return {title:eventTitle,fullUrl:ticket.url,venue:"Alberta Rose Theatre",startDate,
   sourceVerifiedMusic:false,sourceTicketId:ticket.eventId,
   timeEvidence:"Original Alberta Rose month/year heading plus individually scheduled series date, SHOW clock and room-scoped Etix performance ID.",
   description:"Original multi-performance series: "+title+". Event-specific ticket URL uniquely identifies this session; classify its format from verified source evidence.",
   ...(art?{artwork:{...art,sourceUrl:seriesUrl}}:{})};
 });
}
function formatClock(tm){
 const [h,m]=tm.split(":").map(Number);
 return (h%12||12)+":"+String(m).padStart(2,"0")+(h>=12?" PM":" AM");
}
function parse(html){
 if(typeof html!=="string"||html.length<1000||html.length>1900000)throw Error("Original Alberta Rose calendar page absent or oversized");
 const start=html.indexOf('generalView rhp-mobile-list');
 const end=html.indexOf('generalView rhp-',start+18);
 if(start<0||end<0||end<=start)throw Error("Original Alberta Rose dated mobile calendar or desktop delimiter missing");
 const region=html.slice(start,end);
 const marks=[];
 for(const m of region.matchAll(/<span class=['"]rhp-events-list-separator-month[^>]*><span>([^<]+)<\/span><\/span>/gi))
  marks.push({at:m.index,kind:"month",text:clean(m[1])});
 for(const m of region.matchAll(/<div class\s*=\s*["']([^"']*\beventWrapper\b[^"']*)["'][^>]*>/gi)){
  const cls=m[1],kind=/\brhpSingleEvent\b/.test(cls)?"single":/\brhpEventSeries\b/.test(cls)?"series":null;
  if(kind)marks.push({at:m.index,kind});
 }
 marks.sort((a,b)=>a.at-b.at);
 const monthCount=marks.filter(x=>x.kind==="month").length,cardCount=marks.filter(x=>x.kind!=="month").length;
 if(!monthCount||monthCount>18||!cardCount||cardCount>130)throw Error("Alberta Rose event calendar has unexpected number of month groups or cards");
 const records=[],seen=new Set();let group=null;
 for(let i=0;i<marks.length;i++){
  const token=marks[i];
  if(token.kind==="month"){
   const m=token.text.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d\d)$/i);
   if(!m)throw Error("Alberta Rose original calendar month/year heading missing");
   group={month:MONTHS[m[1].toLowerCase()],year:Number(m[2])};continue;
  }
  const chunk=region.slice(token.at,marks[i+1]?.at??region.length);
  const found=token.kind==="single"?[single(chunk,group)]:series(chunk,group);
  for(const r of found){
   if(r.fullUrl){
    const key=r.fullUrl+"|"+r.startDate;
    if(seen.has(key))continue;
    seen.add(key);
   }
   records.push(r);
  }
 }
 if(!records.some(x=>x.startDate))throw Error("Original Alberta Rose calendar lacks any individually verifiable shows: "+JSON.stringify(records.slice(0,9).map(x=>({hold:x.hold,title:x.title,url:x.url}))));
 return {records,meta:{monthGroups:monthCount,calendarCards:cardCount,verified:records.filter(x=>x.startDate).length,
  held:records.filter(x=>x.hold).length}};
}
async function fetchEvents(src,request=fetch){
 if(src?.id!=="alberta-rose-theatre"||src.adapter!=="alberta-rose-original-html"||
  src.url!==CALENDAR||src.baseUrl!==BASE)throw Error("Unexpected Alberta Rose source configuration");
 const r=await request(CALENDAR,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},
  redirect:"error",signal:AbortSignal.timeout(20000)});
 if(!r.ok||!r.headers.get("content-type")?.includes("text/html"))throw Error("Alberta Rose original calendar returned HTTP "+r.status);
 const html=await r.text();
 const result=parse(html);
 console.log("ALBERTA ROSE ORIGINAL "+JSON.stringify(result.meta));
 return result.records;
}
module.exports={CALENDAR,BASE,clean,eventUrl,ticketUrl,artwork,clockText,dateFor,single,series,parse,fetchEvents};