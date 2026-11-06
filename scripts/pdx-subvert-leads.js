#!/usr/bin/env node
"use strict";
/* PDX//SUBVERT is Black Water Records' revived public show directory.
 * Read-only original public HTML: bounded Next.js Flight show records.
 * This is an editorial lead report, NEVER canonical SHOWS event ingestion.
 * The site's React timestamp is displayed using UTC wall-clock components,
 * so a $D...Z value cannot safely be assumed to mean Pacific local time.
 */
const fs=require("node:fs");
const path=require("node:path");
const SOURCE="https://subvert.blackwaterpdx.com/";
const REPORT=path.join(__dirname,"../discovery/pdx-subvert-leads-review.md");
const MAX_BYTES=400000;
const MAX_SHOWS=80;
const MAX_DAYS=240;
const MAX_FLIGHT=45;
function clean(s){return String(s||"").replace(/[<>\r\n|]/g," ").replace(/\s+/g," ").trim().slice(0,230);}
function getFlight(html){
 const re=/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g;
 const matches=[...html.matchAll(re)];
 if(!matches.length||matches.length>MAX_FLIGHT)throw Error("PDX//SUBVERT Next.js show-data format not found or over bound");
 const data=[];
 for(const match of matches){try{data.push(JSON.parse(match[1]));}catch{throw Error("PDX//SUBVERT invalid serialized public show data");}}
 return data;
}
// Scan balanced JSON object with string/escape handling; do not evaluate JS.
function jsonObjectAfter(s,start){
 if(s[start]!=="{")return null;
 let inString=false,escaped=false,depth=0;
 for(let i=start;i<s.length&&i<start+10000;i++){
  const c=s[i];
  if(inString){if(escaped)escaped=false;else if(c==="\\")escaped=true;else if(c==='"')inString=false;}
  else{if(c==='"')inString=true;else if(c==="{")depth++;else if(c==="}"&&!--depth)return s.slice(start,i+1);}
 }
 return null;
}
function extractRecords(html){
 const scripts=getFlight(html);
 const result=[],ids=new Set();
 for(const fragment of scripts){
  let index=0;
  for(;;){
   const p=fragment.indexOf('"show":{',index);if(p<0)break;
   const value=jsonObjectAfter(fragment,p+7);
   if(!value)throw Error("PDX//SUBVERT malformed original show object");
   const end=p+7+value.length;index=end;
   let item;try{item=JSON.parse(value);}catch{throw Error("PDX//SUBVERT invalid original show JSON");}
   if(!item||typeof item!=="object"||!/^[a-f0-9]{24}$/.test(String(item.id||"")))throw Error("PDX//SUBVERT original show has no stable id");
   if(ids.has(item.id))continue;ids.add(item.id);result.push(item);
  }
 }
 if(!result.length||result.length>MAX_SHOWS)throw Error("PDX//SUBVERT had no valid original show objects (NOT proof of zero upcoming concerts)");
 return result;
}
function status(record,now=new Date()){
 const id=String(record.id||"");
 const when=/^\$D(20\d{2})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)\.000Z$/.exec(String(record.dateOfShow||""));
 const bands=Array.isArray(record.bands)?record.bands.map(clean).filter(Boolean).slice(0,16):[];
 const venue=clean(record.location),notes=clean(record.notes),other=clean(record.other);
 if(!when||!venue||!bands.length)return {id,hold:"Original listing missing full date, venue or band/format identity"};
 const yr=+when[1],mo=+when[2],day=+when[3],hours=+when[4],mins=+when[5],seconds=+when[6];
 const dt=new Date(Date.UTC(yr,mo-1,day,hours,mins,seconds));
 if(dt.getUTCFullYear()!==yr||dt.getUTCMonth()!==mo-1||dt.getUTCDate()!==day||seconds!==0)
  return {id,hold:"Invalid show date or clock"};
 const siteDate=when[1]+"-"+when[2]+"-"+when[3],siteClock=when[4]+":"+when[5];
 // A millisecond-UTC serialized date and a visual UTC-wall-clock are source
 // evidence, NOT a validated physical time in the venue's local timezone.
 const delta=(dt.getTime()-now.getTime())/86400000;
 if(delta<-3||delta>MAX_DAYS)return {id,hold:"Listing date outside upcoming review horizon"};
 const image=String(record.imageUrl||"");
 const hasArt=/^https:\/\/res\.cloudinary\.com\/gksbz5nt\/image\/upload\/v\d+\/subvert\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/.test(image);
 const age=record.isAllAges===true?"All ages (source claim)":record.isAllAges===false?"Age policy not confirmed":"Age policy unavailable";
 const row={id,sourceUrl:SOURCE,date:siteDate,displayedClock:siteClock,bands,venue,age,
  cost:clean(record.cost),notes,other,flyerReference:hasArt?image:null,
  artRights:"Not approved; original Cloudinary flyer URL is research provenance, not a reuse license",
  timeEvidence:"Original source embeds $D...Z and renders that UTC wall-clock as show time; Pacific time type and UTC offset are not independently confirmed",
  publishable:false};
 if(record.isCancelled===true)row.hold="Source marks this show canceled; do NOT publish";
 else if(hours<8)row.hold="Unusual pre-8AM displayed show clock; manual confirmation needed, no timezone conversion guesses";
 else if(/\b(?:assum|maybe|unconfirm|guess|unsure|tba|cancel|reschedul)\b/i.test(notes+" "+other))
  row.hold="Original listing has explicit uncertainty/status note; check original flyer and organizer";
 else if(/\b(?:record fair|market|bazaar)\b/i.test(bands.join(" ")))
  row.hold="Mixed record fair/DJ program: music-first editorial classification required";
 else row.hold=null;
 return row;
}
function parse(html,now=new Date()){
 if(typeof html!=="string"||html.length<1000||html.length>MAX_BYTES)throw Error("PDX//SUBVERT HTML missing or over source size limit");
 const raw=extractRecords(html);
 return {records:raw.map(v=>status(v,now)),total:raw.length};
}
// A scene-guide flyer is only a candidate for an already-listed Black Water
// bill when date, true venue and multiple named acts match uniquely.
// Never attach artwork automatically: usage and event identity need approval.
function matchBlackWaterFlyers(records,events){
 const norm=v=>String(v||"").toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g,"").replace(/\([^)]*\)/g," ")
  .replace(/[^a-z0-9]+/g," ").trim();
 const out=[];
 for(const lead of records){
  if(norm(lead.venue)!=="black water"||!lead.flyerReference||lead.hold||!lead.date)continue;
  const artists=(lead.bands||[]).map(norm).filter(x=>x.length>=4);
  if(artists.length<2)continue;
  const candidates=events.filter(e=>e.venue==="Black Water"&&e.startsAt?.slice(0,10)===lead.date&&!e.artwork
   &&artists.filter(artist=>norm(e.title).includes(artist)).length>=2);
  if(candidates.length!==1)continue;
  out.push({event:candidates[0],source:lead,matchBasis:"Same Black Water date and at least two distinct acts; still needs editorial review"});
 }
 return out;
}
function report(result,error,matches=[]){
 const lines=["# PDX//SUBVERT — Portland punk/metal original scene listings (review-only)","",
 "**Original source:** [PDX//SUBVERT](https://subvert.blackwaterpdx.com/), revived by Black Water Records in October 2026. These are **research leads**, not verified or approved SHOWS events. Source records are directly read from the public homepage's embedded show metadata; there is no login, private API or ticket checkout request.","",
 "The source serializes dates as UTC (\`$D...Z\`) while its UI displays the same clock components. This is **not proof of a Pacific-local show timestamp**: do not use the serialized offset or displayed clock as an approved show/doors time without original flyer/organizer corroboration. All-ages flags and possible locations remain source claims.",""];
 if(error){lines.push("**Source hold:** "+clean(error)+". No existing SHOWS events changed or deleted.","");return lines.join("\n")+"\n";}
 const held=result.records.filter(x=>x.hold),review=result.records.filter(x=>!x.hold);
 const blackWater=result.records.filter(x=>clean(x.venue).toLowerCase()==="black water");
 const blackWithArt=blackWater.filter(x=>x.flyerReference);
 lines.push("**Black Water priority:** "+blackWater.length+" dated source leads; "+blackWithArt.length+" original flyer references available for rights and event-identity review. PDX//SUBVERT is a cross-venue scene guide, not the official calendar for every listed venue.","");
 lines.push("## Proposed Black Water matches to already listed SHOWS events","",
  "These links are **review-only**, not approved for embedding. Match checks compare the original source date, physical venue, and multiple named artists; the original poster, time and reuse terms still need human confirmation.","");
 if(!matches.length)lines.push("No unique two-artist Black Water matches without existing artwork in the approved calendar. Review the source leads below; do not infer a missing or duplicate event.","");
 for(const x of matches)lines.push("- **"+clean(x.event.title)+"** ("+clean(x.source.date)+") — SHOWS id `"+clean(x.event.id)+"`; [original PDX//SUBVERT source]("+SOURCE+"); [view source flyer]("+x.source.flyerReference+"). **Rights not yet approved.**");
 lines.push("");
 lines.push("**"+result.total+" direct scene listings; "+review.length+" ordinary review leads, "+held.length+" explicit holds; 0 automatically approved.**","","| Source date and displayed clock (unverified) | Bands / format | Source venue | Age | Source holds and research |","| --- | --- | --- | --- | --- |");
 for(const x of [...result.records].sort((a,b)=>Number(clean(b.venue).toLowerCase()==="black water")-Number(clean(a.venue).toLowerCase()==="black water"))){
  if(!x.date){lines.push("| Unverified | Source id "+clean(x.id)+" | — | — | "+clean(x.hold)+" |");continue;}
  const note=x.hold?"**HOLD: "+clean(x.hold)+"**":"Verify date/year, lineup, actual venue and Pacific show/doors time on original bill";
  const details=[note,x.notes&&"Notes: "+clean(x.notes),x.flyerReference&&"Original source flyer for manual review (reuse rights unverified): "+x.flyerReference].filter(Boolean).join("; ");
  lines.push("| "+clean(x.date+" "+x.displayedClock)+" | "+clean(x.bands.join(" / "))+" | "+clean(x.venue)+" | "+clean(x.age)+" | "+details+" |");
 }
 lines.push("","No source flyers are copied, downloaded, hotlinked, or deemed usable. Before adding any event, verify the original event-specific artist, venue, poster or ticket announcement, any cancellation or change, the timezone/time type, address, age-policy and duplicate against SHOWS. Event counts cannot be treated as venue-feed completeness.","");
 return lines.join("\n")+"\n";
}
async function fetchLeads({request=fetch,now=new Date()}={}){
 const res=await request(SOURCE,{method:"GET",redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-review-only/0.1"},signal:AbortSignal.timeout(15000)});
 if(!res.ok||!String(res.headers.get("content-type")||"").toLowerCase().includes("text/html"))
  throw Error("Public PDX//SUBVERT source HTTP "+res.status+" (NOT evidence of zero shows)");
 const reader=res.body?.getReader();if(!reader)throw Error("PDX//SUBVERT response unreadable");
 let n=0;const chunks=[];
 for(;;){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;
  if(n>MAX_BYTES){await reader.cancel();throw Error("PDX//SUBVERT response exceeds bound");}chunks.push(Buffer.from(value));}
 return parse(Buffer.concat(chunks).toString("utf8"),now);
}
async function main(){
 let result=null,error=null;try{result=await fetchLeads();}catch(e){error=e?.message||String(e);}
 let matches=[];
 if(result){
  try{
   const text=fs.readFileSync(path.join(__dirname,"../events.js"),"utf8");
   const eventsMatch=text.match(/window\.SHOWS_EVENTS\s*=\s*(\[[\s\S]*?\]);\s*$/);
   if(eventsMatch)matches=matchBlackWaterFlyers(result.records,JSON.parse(eventsMatch[1]));
  }catch(e){console.warn("Black Water flyer match review unavailable: "+String(e.message||e));}
 }
 fs.writeFileSync(REPORT,report(result,error,matches));
 console.log("PDX//SUBVERT: "+(result?.records.length||0)+" original show listings; "+
  (result?.records.filter(x=>x.hold).length||0)+" holds; 0 published"+(error?" — source hold "+error:""));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={SOURCE,MAX_BYTES,getFlight,jsonObjectAfter,extractRecords,status,parse,report,fetchLeads,matchBlackWaterFlyers};
