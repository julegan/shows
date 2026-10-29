#!/usr/bin/env node
"use strict";
/* Automated source discovery proposes PRs only. Never publish unreviewed listings. */
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const adapters=require("./priority-importers");
const hosted=require("./hosted-venue-importers");
const dantes=require("./dantes-importer");
const coffin=require("./coffin-venuepilot");
const wonder=require("./wonder-importer");
const revolution=require("./revolution-importer");
const crystal=require("./crystal-importer");
const indie=require("./mississippi-polaris-importer");
const holocene=require("./holocene-importer");
const starday=require("./starday-importer");
const kenton=require("./kenton-importer");
const turn=require("./turnturnturn-opendate");
const offbeat=require("./offbeat-importer");
const {classifyEvent}=require("./event-classification");
const reviewed=require("./reviewed-classifications");
const {sourceHealthSummary}=require("./source-health");
const {detectPublishedChanges,renderChangeReview}=require("./source-change-review");
const root=path.resolve(__dirname,"..");
const zone="America/Los_Angeles";
const fmt=new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});
const tz=new Intl.DateTimeFormat("en-US",{timeZone:zone,timeZoneName:"shortOffset"});
const tidy=(v,max=280)=>String(v??"").replace(/<[^>]+>/g," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&nbsp;/gi," ").replace(/\s+/g," ").trim().slice(0,max);
const norm=v=>tidy(v).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
function localTime(value){
  let n=value;
  if(typeof n==="string"&&/^\d{10,13}$/.test(n))n=Number(n);
  if(typeof n==="number"&&n<100000000000)n*=1000;
  const d=new Date(n);
  if(!Number.isFinite(d.valueOf())||d.getUTCFullYear()<2026||d.getUTCFullYear()>2035)throw Error("Invalid source date");
  const p=Object.fromEntries(fmt.formatToParts(d).map(x=>[x.type,x.value]));
  const z=tz.formatToParts(d).find(x=>x.type==="timeZoneName")?.value||"";
  const m=/GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(z);
  if(!m)throw Error("Unknown Pacific offset");
  return [p.year,p.month,p.day].join("-")+"T"+[p.hour,p.minute,p.second].join(":")+m[1]+m[2].padStart(2,"0")+":"+(m[3]||"00");
}
const localDay=v=>localTime(v).slice(0,10);
const DISCOVERY_HORIZON_DAYS=400;
function discoveryEndDay(now,days=DISCOVERY_HORIZON_DAYS){
 const end=new Date(localDay(now)+"T12:00:00Z");
 end.setUTCDate(end.getUTCDate()+days);
 return end.toISOString().slice(0,10);
}
function parseFile(src){
 const m=src.match(/window\.SHOWS_DATASET\s*=\s*(\{[\s\S]*?\});\s*window\.SHOWS_EVENTS\s*=\s*(\[[\s\S]*?\]);\s*$/);
 if(!m)throw Error("Cannot parse existing events; refusing overwrite");
 return {prefix:src.slice(0,m.index),meta:JSON.parse(m[1]),events:JSON.parse(m[2])};
}
function itemsOf(x){
 if(!x||typeof x!=="object")throw Error("Nonobject feed");
 for(const k of ["upcoming","items"]){if(Array.isArray(x[k]))return x[k];}
 if(Array.isArray(x.collection?.items))return x.collection.items;
 throw Error("No supported Squarespace event array; adapter needs review");
}
function urlOf(item,src){
 let candidate=typeof item.fullUrl==="string"?item.fullUrl:typeof item.urlId==="string"?"/events/"+item.urlId.replace(/^\/?(events\/)?/,""):null;
 if(!candidate)return null;
 try {
  const u=new URL(candidate,src.baseUrl);
  // The shared venue calendar platform also hosts other venues and add-on offers.
  // Revalidate event-specific paths and room identity for every discovered URL.
  if(src.adapter==="hosted-venue-html")return hosted.safeEventUrl(u.href,src);
  if(src.adapter==="dantes-live-html")return dantes.safeDantesUrl(u.href,src);
  if(src.adapter==="kenton-official-html")return u.href===kenton.SOURCE_URL?u.href:null;
  if(src.adapter==="turnturnturn-opendate")return turn.officialEventUrl(u.href);
  if(src.adapter==="offbeat-official-html")return offbeat.eventUrl(u.href);
  if(src.adapter==="venuepilot-public-api")return coffin.primaryTicketUrl(u.href);
  if(src.adapter==="wonder-ballroom-html")return wonder.safeWonderUrl(u.href,src);
  if(src.adapter==="crystal-official-html")return crystal.safeCrystalUrl(u.href);
  if(src.adapter==="mississippi-polaris-html")return indie.ticketUrl(u.href,item.venue);
  if(src.adapter==="holocene-event-html")return holocene.safeUrl(u.href);
  if(src.adapter==="starday-google-html")return starday.sourceUrl(u.href,item.google_event_id);
  if(src.adapter==="revolution-events-html"){
   const room=item.venue==="Revolution Hall"?"revolution-hall":item.venue==="Show Bar at Revolution Hall"?"show-bar-at-revolution-hall":null;
   return room?revolution.validatedTicket(u.href,room)?.url||null:null;
  }
  const primaryHost=u.hostname===new URL(src.baseUrl).hostname;
  const validPath=src.adapter==="squarespace-json"?u.pathname.startsWith("/events/"):src.adapter==="twilight-html"?u.pathname.startsWith("/event/"):src.adapter==="star-theater-html"?u.pathname.startsWith("/tm-event/"):false;
  const promoterLink=src.adapter==="promoter-list-html"&&u.hostname==="www.treetix.com"&&u.pathname==="/event"&&u.searchParams.get("cal")==="soundcontrol";
  if(u.protocol!=="https:")return null;
  if(src.adapter==="black-water-ics"&&u.href===new URL(src.baseUrl+"/").href)return u.href;
  if(!((primaryHost&&validPath)||promoterLink))return null;
  if(!promoterLink)u.search="";u.hash="";return u.href;
 }catch(_){return null;}
}
function music(item){return classifyEvent(item).category==="Music";}
function categoryOf(item){return classifyEvent(item).category;}
function extract(item,src,now){
 if(!item||typeof item!=="object")return {hold:"Unusable source object"};
 const title=tidy(item.title),url=urlOf(item,src);
 if(!title||!url)return {hold:"Missing title or primary event permalink",title};
 // Every dated venue event is eligible; classify rather than discard unrelated categories.
 const stamp=item.startDate??item.startTime??item.start;
 const dateOnly=["black-water-ics","kenton-official-html"].includes(src.adapter)&&item.sourceDateOnly===true&&/^\d{4}-\d{2}-\d{2}$/.test(item.dateOnly||"");
 if(stamp==null&&!dateOnly)return {hold:item.dateOnly?"Verified date "+item.dateOnly+" but no performance start or doors time"+(item.detailHold?"; "+item.detailHold:""):"Event time missing",title,url,date:item.dateOnly,venue:item.venue||src.venue};
 let start;
 if(dateOnly){
   try {
    const [y,m,d]=item.dateOnly.split("-").map(Number);
    const anchor=adapters.wallToPacific(y,m,d,"00:00");
    if(!anchor)throw Error("Invalid source date");
    start=localTime(anchor); // Sorting anchor only. The event has no reported start time.
   }catch(_){return {hold:"Bad date-only event",title,url};}
 }else{
   try{start=localTime(stamp);}catch(_){return {hold:"Bad event timestamp",title,url};}
 }
 if(src.type==="promoter"){
  const mapped={
   "high water mark lounge":{venue:"High Water Mark Lounge",address:"6800 NE Martin Luther King Jr Blvd, Portland, OR 97211",neighborhood:"Woodlawn"},
   "twilight cafe and bar":{venue:"Twilight Cafe and Bar",address:"832 SE Grand Ave, Portland, OR 97214",neighborhood:"Central Eastside"},
   "star theater":{venue:"Star Theater",address:"13 NW Sixth Avenue, Portland, OR 97209",neighborhood:"Old Town"}
  }[String(item.venue||"").toLowerCase()];
  if(!mapped)return {hold:"Promoter venue location must be verified inside Portland",title,url,date:item.dateOnly,venue:item.venue};
  item={...item,...mapped};
 }
 const date=start.slice(0,10);
 if(date<localDay(now)||date>discoveryEndDay(now))return {skip:"Outside review period",title,url};
 const blocked=src.blockedDates?.find(x=>x.date===date);
 if(blocked)return {hold:"Historical source conflict: "+blocked.reason,title,url,date};
 const sourceMatch=reviewed.forEvent({url,title,venue:item.venue||src.venue,date});
 const classification=sourceMatch||classifyEvent(item),category=classification.category;
 const asof=localDay(now);
 const identity=src.adapter==="black-water-ics"?String(item.uid||url)+"|"+date:src.adapter==="kenton-official-html"?url+"|"+norm(title):url;
 const id="auto-"+src.id+"-"+date+"-"+crypto.createHash("sha256").update(identity).digest("hex").slice(0,12);
 const cat=Array.isArray(item.categories)?item.categories.filter(x=>typeof x==="string").slice(0,8):[];
 return {event:{
  id,title,subtitle:"Source-discovered venue event · details need review",category,
  tags:[category==="Unclassified"?"Category needs review":"Source-listed "+category,...classification.musicStyles.map(style=>"Source-mentioned "+style),"Time needs confirmation","Format needs confirmation"],
  musicStyles:classification.musicStyles,eventFormat:"unverified",
  classificationEvidence:classification.evidence,
  ...(classification.evidenceUrl?{classificationSourceUrl:classification.evidenceUrl}:{}),
  startTimeKind:dateOnly?"date-only":"listed",startsAt:start,endsAt:null,venue:item.venue||src.venue,address:item.address===undefined?src.address:item.address,neighborhood:item.neighborhood||src.neighborhood||"Not confirmed",
  price:"See organizer for current admission",free:null,age:"Not published",
  description:"Automatically discovered from a primary venue or promoter listing. "+tidy(item.timeEvidence||"The listed time may mean doors instead of performance; confirm with organizer.")+" "+tidy(item.description||item.excerpt||item.body||""),
  source:src.name,url,icon:category==="Music"?"♫":"◇",sourceCheckedAt:asof,verificationMethod:"Automated venue data; editorial date, time, event type and cancellation verification required",
  sourceCategories:cat,sources:[{name:src.name,url,kind:"organizer",checkedAt:asof,originalCategories:cat}],
  ...(item.artwork?{artwork:item.artwork}:{}),
  addedIn:"auto-discovery-"+asof,discovery:{sourceId:src.id,method:"primary-source-collection"}
 }};
}
function reconcile(existing,records){
 const accepted=[],held=[],skipped=[],seen=new Set();
 // Wonder can schedule separate early/late performances by the same artist.
 // Do not discard independent, first-party, explicitly timed listings;
 // all other same-venue/date conflicts remain held for editorial comparison.
 const distinctTimedVenueShows=(a,b)=>{
  if(a.venue!==b.venue||a.startTimeKind!=="listed"||b.startTimeKind!=="listed"||a.startsAt===b.startsAt||a.url===b.url)return false;
  const source=a.discovery?.sourceId;
  return source===b.discovery?.sourceId&&["wonder-ballroom","mississippi-polaris","starday-tavern","turn-turn-turn","the-off-beat"].includes(source)
    &&(source!=="mississippi-polaris"||[a.url,b.url].every(url=>/^https:\/\/www\.etix\.com\/ticket\/p\/\d{5,12}\//.test(url)))
    &&(source!=="starday-tavern"||[a.url,b.url].every(url=>/^https:\/\/www\.google\.com\/calendar\/event\?eid=/.test(url)));
 };
 for(const x of records){
  if(!x.event){(x.hold?held:skipped).push(x);continue;}
  const e=x.event,day=e.startsAt.slice(0,10);
  const key=e.venue.toLowerCase()+"|"+day+"|"+norm(e.title)+"|"+(["wonder-ballroom","mississippi-polaris","starday-tavern","turn-turn-turn","the-off-beat"].includes(e.discovery?.sourceId)?e.startsAt.slice(11,16):"");
  if(seen.has(key)||existing.some(v=>v.id===e.id||(v.venue.toLowerCase()===e.venue.toLowerCase()&&v.startsAt.slice(0,10)===day&&norm(v.title)===norm(e.title)&&!distinctTimedVenueShows(v,e)))){
   skipped.push({sourceId:e.discovery?.sourceId,skip:"Already present",title:e.title,url:e.url});continue;
  }
  if(existing.some(v=>v.url===e.url&&v.startsAt.slice(0,10)!==day&&new URL(v.url).pathname.includes("/events/"))){
   held.push({sourceId:e.discovery?.sourceId,hold:"Potential reschedule of an existing event URL",title:e.title,url:e.url});continue;
  }
  if([...existing,...accepted].some(v=>v.venue.toLowerCase()===e.venue.toLowerCase()&&v.startsAt.slice(0,10)===day && !(v.startTimeKind==="date-only"&&e.startTimeKind==="date-only")&&!distinctTimedVenueShows(v,e))){
   held.push({sourceId:e.discovery?.sourceId,hold:"Same venue/date; different existing bill; manual comparison",title:e.title,url:e.url});continue;
  }
  accepted.push(e);seen.add(key);
 }
 return {accepted,held,skipped};
}
async function fetchItems(source){
 // Official read-only GraphQL connection requires a separate, provisioned app id.
 // This adapter is intentionally disabled until an authorized integration exists.
 if(source.adapter==="offbeat-official-html")return offbeat.fetchEvents(source);
 if(source.adapter==="venuepilot-public-api")return coffin.fetchCoffinEvents();
 if(source.adapter==="starday-google-html")return starday.fetchOfficialStarday(source);
 if(source.adapter==="turnturnturn-opendate"){
  if(source.url!==turn.CALENDAR_URL||source.baseUrl!=="https://turnturnturnpdx.com")throw Error("Unapproved venue calendar host");
  const check=async url=>{
   const u=new URL(url);
   if(u.protocol!=="https:"||u.hostname!=="app.opendate.io"||u.username||u.password)throw Error("Unapproved OpenDate host");
   const response=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},
    signal:AbortSignal.timeout(14000),redirect:"error"});
   if(!response.ok||!response.headers.get("content-type")?.includes("text/html"))throw Error("OpenDate public event page returned "+response.status);
   const body=await response.text();
   if(body.length>1400000)throw Error("OpenDate public document too large");
   return body;
  };
  const official=turn.parseRoster(await check(source.url)),reviewed=[];
  for(let i=0;i<official.length;i+=4){
   const batch=await Promise.all(official.slice(i,i+4).map(async item=>{
    if(item.hold)return item;
    try{return turn.parseDetail(await check(item.fullUrl),item);}
    catch(e){return {hold:"Official event page unavailable: "+String(e.message||e),url:item.fullUrl,title:item.title};}
   }));
   reviewed.push(...batch);
  }
  if(!reviewed.some(x=>x.startDate))throw Error("No valid original OpenDate event-detail records");
  return reviewed;
 }

 const u=new URL(source.url),home=new URL(source.baseUrl);
 const blackWaterIcs=source.adapter==="black-water-ics" && u.href==="https://calendar.google.com/calendar/ical/blackwater.venue.calendar%40gmail.com/public/basic.ics"
   && home.origin==="https://bar.blackwaterpdx.com";
 if(u.protocol!=="https:"||(!blackWaterIcs&&u.hostname!==home.hostname)||!["squarespace-json","twilight-html","star-theater-html","promoter-list-html","black-water-ics","hosted-venue-html","dantes-live-html","wonder-ballroom-html","revolution-events-html","crystal-official-html","mississippi-polaris-html","holocene-event-html","starday-google-html","kenton-official-html"].includes(source.adapter))throw Error("Unsafe or unsupported source adapter");
 const response=await fetch(u,{headers:{"Accept":source.adapter==="squarespace-json"?"application/json":blackWaterIcs?"text/calendar":"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(18000),redirect:blackWaterIcs?"follow":"error"});
 if(blackWaterIcs&&new URL(response.url).hostname!=="calendar.google.com")throw Error("Public calendar redirected outside approved Google host");
 if(!response.ok)throw Error("HTTP "+response.status);
 const body=await response.text();
 if(body.length>3000000)throw Error("Feed exceeds size limit");
 if(source.adapter==="black-water-ics")return adapters.parseBlackWaterIcs(body,source,localDay(new Date()));
 if(source.adapter==="kenton-official-html")return kenton.parseKenton(body);
 if(source.adapter==="mississippi-polaris-html")return indie.parseMississippi(body,source);
 if(source.adapter==="starday-google-html")return starday.parseStarday(body,source);
 if(source.adapter==="holocene-event-html"){
  const original=holocene.links(body),rows=[];
  for(let i=0;i<original.length;i+=4){
   const found=await Promise.all(original.slice(i,i+4).map(async link=>{
    try{
     const response=await fetch(link,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},redirect:"error",signal:AbortSignal.timeout(14000)});
     if(!response.ok)return {hold:"Original Holocene detail HTTP "+response.status,url:link};
     if(!response.headers.get("content-type")?.includes("text/html"))return {hold:"Original Holocene page is not HTML",url:link};
     const html=await response.text();if(html.length>1300000)return {hold:"Holocene event detail too large",url:link};
     return holocene.parseDetail(html,link);
    }catch(e){return {hold:"Official Holocene detail fetch failed: "+String(e.message||e),url:link};}
   }));
   rows.push(...found);
  }
  if(!rows.some(x=>x.startDate))throw Error("Holocene venue events lack verified Pacific dated source schema");
  return rows;
 }
 if(source.adapter==="crystal-official-html"){
  const visited=new Set(),queue=[{url:source.url,html:body}],eventLinks=new Set();
  // McMenamins' independent Crystal site, not the multivenue corporate calendar.
  while(queue.length){
   const current=queue.shift();
   if(visited.has(current.url))continue;
   visited.add(current.url);
   const next=crystal.pages(current.html);
   if(/\/events\/page\/(?:1[3-9]|[2-9]\d+)\//i.test(current.html))throw Error("Crystal primary archive exceeds the bounded 12-page coverage; review pagination before importing");
   for(const url of crystal.links(current.html))eventLinks.add(url);
   for(const link of next){
    if(visited.has(link)||queue.some(v=>v.url===link))continue;
    if(visited.size+queue.length>=12)throw Error("Crystal event pagination exceeds 12 pages; manual coverage audit required");
    const res=await fetch(link,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(16000),redirect:"error"});
    if(!res.ok||!res.headers.get("content-type")?.includes("text/html"))throw Error("Crystal archive pagination returned invalid response");
    const text=await res.text();if(text.length>2500000)throw Error("Crystal archive exceeds 2.5MB page limit");
    queue.push({url:link,html:text});
   }
  }
  if(eventLinks.size>144)throw Error("Crystal official archive too large; hold for source audit");
  const original=[...eventLinks],rows=[];
  for(let i=0;i<original.length;i+=4){
   const found=await Promise.all(original.slice(i,i+4).map(async link=>{
    try{
     const response=await fetch(link,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(16000),redirect:"error"});
     if(!response.ok)return {hold:"Crystal first-party event detail HTTP "+response.status,url:link};
     if(!response.headers.get("content-type")?.includes("text/html"))return {hold:"Crystal event detail is not HTML",url:link};
     const html=await response.text();if(html.length>1500000)return {hold:"Crystal event detail exceeds 1.5MB",url:link};
     return crystal.parseDetail(html,link);
    }catch(e){return {hold:"Crystal official detail unavailable: "+String(e.message||e),url:link};}
   }));
   rows.push(...found);
  }
  if(!rows.some(x=>x.startDate))throw Error("Crystal venue archive yielded no confirmed dated events");
  return rows;
 }
 if(source.adapter==="revolution-events-html"){
  const rows=revolution.parseRevolution(body,source);
  if(!rows.some(x=>x.startDate))throw Error("Revolution Hall official calendar returned no verified full-date show cards");
  return rows;
 }
 if(source.adapter==="twilight-html"){
  const links=adapters.parseTwilightLinks(body,source);
  if(!links.length)throw Error("Twilight calendar has no event detail links");
  const rows=[];
  for(const link of links){
   try{
    const detail=await fetch(link,{headers:{"Accept":"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(18000),redirect:"error"});
    if(!detail.ok){rows.push({hold:"Twilight event page HTTP "+detail.status,url:link});continue;}
    rows.push(adapters.parseTwilightDetail((await detail.text()).slice(0,450000),link,source));
   }catch(e){rows.push({hold:"Twilight event fetch failed: "+String(e.message||e),url:link});}
  }
  return rows;
 }
 if(source.adapter==="wonder-ballroom-html"){
  const links=wonder.parseWonderLinks(body,source),rows=[];
  for(let i=0;i<links.length;i+=4){
   const group=await Promise.all(links.slice(i,i+4).map(async link=>{
    try{
     const detail=await fetch(link,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(14000),redirect:"error"});
     if(!detail.ok)return {hold:"Wonder Ballroom detail HTTP "+detail.status,url:link};
     if(!detail.headers.get("content-type")?.includes("text/html"))return {hold:"Wonder Ballroom detail did not return HTML",url:link};
     const page=await detail.text();
     if(page.length>1000000)return {hold:"Wonder Ballroom detail exceeds size limit",url:link};
     return wonder.parseWonderDetail(page,link,source);
    }catch(e){return {hold:"Wonder Ballroom detail unavailable: "+String(e.message||e),url:link};}
   }));
   rows.push(...group);
  }
  if(!rows.some(x=>x.startDate))throw Error("Wonder Ballroom calendar returned no year-confirmed dated shows");
  return rows;
 }
 if(source.adapter==="dantes-live-html"){
  const links=dantes.parseDantesLinks(body,source);
  const rows=[];
  for(let i=0;i<links.length;i+=4){
   const group=await Promise.all(links.slice(i,i+4).map(async link=>{
    try{
     const detail=await fetch(link,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(14000),redirect:"error"});
     if(!detail.ok)return {hold:"Dante's detail HTTP "+detail.status,url:link};
     if(!detail.headers.get("content-type")?.includes("text/html"))return {hold:"Dante's detail did not return HTML",url:link};
     const html=await detail.text();
     if(html.length>1000000)return {hold:"Dante's detail exceeds size limit",url:link};
     return dantes.parseDantesDetail(html,link,source);
    }catch(e){return {hold:"Dante's detail unavailable: "+String(e.message||e),url:link};}
   }));
   rows.push(...group);
  }
  if(!rows.some(x=>x.startDate))throw Error("Dante's calendar returned no verified event dates and showtimes");
  return rows;
 }
 if(source.adapter==="hosted-venue-html"){
  const links=hosted.parseHostedLinks(body,source);
  const rows=[];
  // Bound parallelism and stop on unparseable primary source changes.
  for(let i=0;i<links.length;i+=4){
   const group=await Promise.all(links.slice(i,i+4).map(async link=>{
    try{
     const detail=await fetch(link,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(14000),redirect:"error"});
     if(!detail.ok)return {hold:"Official detail returned HTTP "+detail.status,url:link};
     if(!detail.headers.get("content-type")?.includes("text/html"))return {hold:"Official detail is not HTML",url:link};
     const page=await detail.text();
     if(page.length>1000000)return {hold:"Venue detail exceeds size limit",url:link};
     return hosted.parseHostedDetail(page,link,source);
    }catch(e){return {hold:"Official detail fetch failed: "+String(e.message||e),url:link};}
   }));
   rows.push(...group);
  }
  if(!rows.some(x=>x.startDate))throw Error("No verified time-bearing show details from official venue");
  return rows;
 }
 if(source.adapter==="star-theater-html"){
  const items=adapters.parseStar(body,source);
  if(!items.length)throw Error("Star Theater layout changed; no dated events parsed");
  for(const item of items){
    try{
      const response=await fetch(item.fullUrl,{headers:{Accept:"text/html","User-Agent":"SHOWS-artwork-review/0.1"},signal:AbortSignal.timeout(14000),redirect:"error"});
      if(response.ok){
        const html=(await response.text()).slice(0,550000);
        item.artwork=adapters.eventArtworkFromHtml(html,item.fullUrl)||item.artwork;
      }
    }catch(_){}
  }
  return items;
 }
 if(source.adapter==="promoter-list-html"){
  const items=adapters.parseSoundcontrol(body,source);
  if(!items.length)throw Error("Soundcontrol roster unavailable or changed");
  const verified=[];
  for(const item of items){
   if(item.hold||!item.fullUrl){verified.push(item);continue;}
   try{
    const u=new URL(item.fullUrl);
    if(u.protocol!=="https:"||u.hostname!=="www.treetix.com"||u.pathname!=="/event"||u.searchParams.get("cal")!=="soundcontrol")throw Error("Ticket URL outside approved provider");
    const response=await fetch(u,{headers:{"Accept":"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(15000),redirect:"error"});
    if(!response.ok){verified.push({...item,detailHold:"Ticket page HTTP "+response.status+"; date-only staging"});continue;}
    verified.push(adapters.parseSoundcontrolDetail((await response.text()).slice(0,500000),item));
   }catch(e){verified.push({...item,detailHold:"Ticket data unavailable; stage date-only: "+String(e.message||e)});}
  }
  return verified;
 }
 let json;try{json=JSON.parse(body)}catch(_){throw Error("Venue returned non-JSON response");}
 return itemsOf(json).map(item=>{
  const raw=item.assetUrl||item.image?.assetUrl||item.image?.url||item.thumbnailUrl;
  const url=adapters.artworkCandidate(raw,source.url);
  return url?{...item,artwork:{url,sourceUrl:source.url,origin:"official-event-page",credit:"Venue event listing",usageApproved:null}}:item;
 });
}
function report(r,errors,now,sourceRuns=[],sourceRegistry=[],changeReview=null){
 const lines=["# SHOWS automated discovery review — "+localDay(now),"",
  "Proposed entries **must be approved before publishing**. Source-listed times are NOT verified as show times.","",
  sourceHealthSummary({sourceRuns,sourceRegistry,accepted:r.accepted,held:r.held,skipped:r.skipped,errors}),
  renderChangeReview(changeReview),
  "## New candidates: "+r.accepted.length,"",
  ...[...new Set(r.accepted.map(e=>e.discovery?.sourceId).filter(Boolean))].map(id=>"- "+id+": "+r.accepted.filter(e=>e.discovery?.sourceId===id).length+" proposals"),"" ,
  "| Date | Event | Venue | Listed time | Primary listing |",
  "| --- | --- | --- | --- | --- |"];
 for(const e of r.accepted)lines.push("| "+e.startsAt.slice(0,10)+" | "+e.title.replace(/\|/g,"/")+" | "+e.venue+" | "+e.startsAt.slice(11,16)+" (doors/show unverified) | "+e.url+" |");
 lines.push("","## Held for review: "+r.held.length,"");
 for(const e of r.held)lines.push("- "+(e.sourceId?"["+e.sourceId+"] ":"")+(e.date?"("+e.date+") ":"")+(e.title||"Untitled")+" — "+e.hold+" "+(e.url||""));
 lines.push("","## Source errors: "+errors.length,"");
 for(const x of errors)lines.push("- "+x.source+": "+x.error);
 lines.push("","## Required editorial checks","",
  "- Verify event type, actual performers and classify musical events as live, DJ or another format before approval.",
  "- Distinguish doors from showtime before merging; change the listed-time label if verified.",
  "- Check duplicates, source permalink, venue/date, ticket status, age, and cancellation information.",
  "- Leave genre, cost, accessibility and end times unknown without evidence.",
  "- After approving and merging this PR, review the corresponding portfolio sync PR.");
 return lines.join("\n")+"\n";
}
async function run(opts={}){
 const registry=JSON.parse(fs.readFileSync(path.join(root,"discovery/sources.json"),"utf8"));
 const parsed=parseFile(fs.readFileSync(path.join(root,"events.js"),"utf8"));
 const sources=registry.sources.filter(s=>s.status==="pilot-enabled");
 if(!sources.length)throw Error("No active sources");
 const now=opts.now||new Date(),found=[],errors=[],sourceRuns=[];
 for(const src of sources){
  try{
   const items=opts.load?await opts.load(src):await fetchItems(src);
   if(!Array.isArray(items))throw Error("Source did not return an array");
   sourceRuns.push({id:src.id,status:items.length?"checked":"empty",examined:items.length});
   if(process.env.SHOWS_DISCOVERY_DEBUG==="1")console.log("SOURCE SAMPLE "+JSON.stringify(items.slice(0,7).map(i=>({title:tidy(i.title),urlId:i.urlId,fields:Object.keys(i).slice(0,20),tags:i.tags,categories:i.categories,excerpt:tidy(i.excerpt,120),body:tidy(i.body,160)}))));
   for(const item of items){
    if(item?.hold){found.push({...item,sourceId:src.id});continue;}
    const record=extract(item,src,now);
    found.push(record.event?record:{...record,sourceId:src.id});
   }
   console.log(src.id+": "+items.length+" source items examined");
  }catch(e){errors.push({source:src.id,error:String(e.message||e)});sourceRuns.push({id:src.id,status:"failed",examined:0});console.error(src.id+": "+String(e.message||e));}
 }
 if(errors.length===sources.length)throw Error("Every source failed; no silent success");
 const changes=detectPublishedChanges(parsed.events,found,{today:localDay(now)});
 const result=reconcile(parsed.events,found);
 console.log(JSON.stringify({proposed:result.accepted.length,bySource:Object.fromEntries(sources.map(s=>[s.id,result.accepted.filter(e=>e.discovery?.sourceId===s.id).length])),held:result.held.length,skipped:result.skipped.length,errors}));
 if(process.env.SHOWS_DISCOVERY_DEBUG==="1")console.log("SAMPLE HELDS "+JSON.stringify(result.held.slice(0,14)));
 if(process.env.SHOWS_DISCOVERY_DEBUG==="1")console.log("PROPOSED TITLES "+JSON.stringify(result.accepted.map(e=>({date:e.startsAt.slice(0,10),title:e.title,url:e.url}))));
 if(opts.write!==false)fs.writeFileSync(path.join(root,"discovery/latest-review.md"),report(result,errors,now,sourceRuns,registry.sources,changes));
 if(!result.accepted.length)return {...result,errors,sourceRuns,changes};
 const newEvents=[...parsed.events,...result.accepted].sort((a,b)=>a.startsAt.localeCompare(b.startsAt)||a.title.localeCompare(b.title));
 const batch="auto-discovery-"+localDay(now)+"-"+(process.env.GITHUB_RUN_NUMBER||"local"),prev=[...(parsed.meta.previousBatches||[])];
 if(parsed.meta.batchId!==batch)prev.push({batchId:parsed.meta.batchId,addedOccurrences:parsed.meta.addedOccurrences});
 const meta={...parsed.meta,sourceCheckedAt:localDay(now),coverageThrough:newEvents.reduce((m,e)=>e.startsAt.slice(0,10)>m?e.startsAt.slice(0,10):m,""),
  totalOccurrences:newEvents.length,addedOccurrences:result.accepted.length,batchId:batch,previousBatches:prev,
  newLiveBills:0,newDjNights:0,musicOccurrences:newEvents.filter(e=>e.category==="Music").length,
  editorialReview:"Automatically discovered candidates require explicit human PR approval"};
 const output=parsed.prefix+"window.SHOWS_DATASET = "+JSON.stringify(meta,null,2)+";\nwindow.SHOWS_EVENTS = "+JSON.stringify(newEvents,null,2)+";\n";
 if(opts.write!==false){
  fs.writeFileSync(path.join(root,"events.js"),output);
 }
 return {...result,errors,sourceRuns,changes,output};
}
if(require.main===module)run().catch(e=>{console.error("Discovery failed: "+e.message);process.exitCode=1;});
module.exports={localTime,localDay,discoveryEndDay,DISCOVERY_HORIZON_DAYS,parseFile,itemsOf,urlOf,music,categoryOf,extract,reconcile,fetchItems,run};
