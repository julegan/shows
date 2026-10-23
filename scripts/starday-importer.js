"use strict";
/* Starday publishes public Google Calendar event objects in an Elementor
 * data-events attribute. Read-only: no credentials or private endpoints.
 * Validate unique per-event public Google calendar links, full date,
 * Pacific timezone/offset and event title; never guess dates or showtimes.
 */
function htmlDecode(s){
 return String(s||"").replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,h,d)=>{const cp=parseInt(h||d,h?16:10);return cp>0&&cp<=0x10ffff?String.fromCodePoint(cp):" "})
  .replace(/&(?:quot|amp|apos|nbsp|lt|gt);/gi,c=>({"&quot;":'"',"&amp;":"&","&apos;":"'","&nbsp;":" ","&lt;":"<","&gt;":">"}[c.toLowerCase()]||" ")).replace(/\s+/g," ").trim();
}
function sourceUrl(raw,id){
 try{
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.hostname!=="www.google.com"||u.pathname!=="/calendar/event"||u.username||u.password||u.port||u.hash||[...u.searchParams.keys()].some(k=>k!=="eid"))return null;
  const key=u.searchParams.get("eid");
  if(!key||key.length>600||!/^[-_+\/A-Za-z0-9=]+$/.test(key))return null;
  const decoded=Buffer.from(key.replace(/-/g,"+").replace(/_/g,"/"),"base64").toString("utf8");
  if(!decoded.startsWith(id+" ")||!/@(?:gmail|group\.calendar\.google)\.com$/.test(decoded.split(" ").slice(1).join(" ")))return null;
  return u.href;
 }catch(_){return null}
}
function startISO(value){
 if(typeof value!=="string"||!/^20\d\d-\d\d-\d\dT\d\d:\d\d(?::\d\d)?(?:-07:00|-08:00)$/.test(value))return null;
 const d=new Date(value);if(!Number.isFinite(d.valueOf()))return null;
 const p=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZoneName:"shortOffset"}).formatToParts(d).map(x=>[x.type,x.value]));
 const m=value.match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/);
 const local=[p.year,p.month,p.day,p.hour,p.minute].join("-");
 if(!m||local!==m.slice(1).join("-"))return null;
 const offset=p.timeZoneName==="GMT-7"?"-07:00":p.timeZoneName==="GMT-8"?"-08:00":"";
 if(!offset||!value.endsWith(offset))return null;
 return d.toISOString();
}
function records(html){
 if(typeof html!=="string"||html.length>2500000)throw Error("Unexpected original Starday page size");
 const tags=[...html.matchAll(/<div\b[^>]*\bid="eael-event-calendar-[a-z0-9]+"[^>]*\bdata-events="([^"]*)"/gi)];
 if(tags.length!==1)throw Error("Starday venue calendar missing or ambiguously repeated");
 const value=JSON.parse(htmlDecode(tags[0][1]));
 if(!Array.isArray(value)||value.length<1||value.length>1400)throw Error("Unexpected original calendar event count");
 return value;
}
function parseItem(x){
 if(!x||typeof x!=="object")return {hold:"Invalid source event"};
 const title=htmlDecode(x.title).replace(/<[^>]*>/g," ").slice(0,280);
 if(!title)return {hold:"Missing source event title"};
 if(/\b(?:CLOSED|postponed|cancelled|canceled|rescheduled|moved to)\b/i.test(title))return {hold:"Source lists closure or schedule change",title};
 if(x.start_timezone!=="America/Los_Angeles"||x.allDay===true||x.allDay==="true"||x.allDay==="on")return {hold:"Event lacks independently verified timed Portland start",title};
 const startDate=startISO(x.start);
 const url=sourceUrl(x.url,x.google_event_id);
 if(!startDate||!url)return {hold:"Invalid source timezone, date or public Google Calendar permalink",title};
 if(x.end&&(!startISO(x.end)||Date.parse(x.end)<Date.parse(startDate)))return {hold:"Invalid source event end time",title,url};
 return {title,fullUrl:url,google_event_id:x.google_event_id,startDate,venue:"Starday Tavern",
  sourceVerifiedMusic:false,
  timeEvidence:"Original Starday public Google calendar publishes the event start and timezone; verify whether this is doors or showtime",
  description:"Original venue calendar entry; lineup, genre, doors/show distinction and original event status require editorial verification"};
}
function parseStarday(html,source){
 if(source.id!=="starday-tavern"||new URL(source.url).origin!=="https://stardaytavern.com")throw Error("Unexpected Starday source");
 const seen=new Set(),out=[];
 for(const item of records(html)){
  const value=parseItem(item);
  const key=value.fullUrl||String(item.id||"")+"|"+String(item.start||"");
  if(seen.has(key))continue;
  seen.add(key);out.push(value);
 }
 return out;
}
module.exports={htmlDecode,sourceUrl,startISO,records,parseItem,parseStarday};
