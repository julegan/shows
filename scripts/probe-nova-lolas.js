#!/usr/bin/env node
"use strict";
/* Read-only first-party source inspection for two full-priority venues.
 * Never follows third-party ticket widgets, stores images or edits events.js.
 */
const {URL}=require("node:url");
const fs=require("node:fs");
const PAGES=Object.freeze([
 {id:"nova-calendar",url:"https://www.novapdxevents.com/event-calendar",venue:"Nova PDX"},
 {id:"nova-home",url:"https://www.novapdxevents.com/",venue:"Nova PDX"},
 {id:"lolas-room",url:"https://www.mcmenamins.com/crystal-ballroom/lolas-room/music-events/",venue:"Lola's Room"}
]);
const MAX_BYTES=2_000_000;
const MONTHS="January|February|March|April|May|June|July|August|September|October|November|December";
const fullDate=new RegExp("\\b(?:"+MONTHS+")\\s+\\d{1,2},?\\s+20\\d{2}\\b","gi");
function normalizedUrl(raw,base){
 try{
  const u=new URL(raw,base);
  if(u.protocol!=="https:"||u.username||u.password||u.port||u.href.length>1700)return null;
  // Drop ticket tracking codes, widget parameters and campaign tokens.
  return u.origin+u.pathname;
 }catch(_){return null;}
}
function summarizeHtml(html,page){
 if(typeof html!=="string"||html.length>MAX_BYTES)throw Error("Unbounded or missing venue HTML");
 const dates=[...new Set(html.match(fullDate)||[])].slice(0,40);
 const isoDates=[...new Set(html.match(/\b20\d\d-\d\d-\d\d(?:T\d\d:\d\d:\d\d(?:Z|[+-]\d\d:\d\d))?/g)||[])].slice(0,40);
 const datetime=[...html.matchAll(/<time\b[^>]*datetime\s*=\s*["']([^"']{1,85})["']/gi)].map(m=>m[1]).slice(0,25);
 const jsonLd=[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
 let eventSchemaCount=0;
 for(const m of jsonLd){
  try{
   const obj=JSON.parse(m[1]);
   const queue=[obj];let scans=0;
   while(queue.length&&scans++<100){
    const x=queue.pop();
    if(!x||typeof x!=="object")continue;
    const types=Array.isArray(x["@type"])?x["@type"]:[x["@type"]];
    if(types.some(t=>typeof t==="string"&&/Event$/.test(t)))eventSchemaCount++;
    if(Array.isArray(x))queue.push(...x.slice(0,40));
    else for(const key of ["@graph","itemListElement","mainEntity","events"])if(x[key])queue.push(x[key]);
   }
  }catch(_){}
 }
 const attrs=(tag,attr)=>[...html.matchAll(new RegExp("<"+tag+"\\b[^>]*\\b"+attr+"\\s*=\\s*([\"'])(.*?)\\1","gi"))].map(m=>m[2]);
 const links=[...new Set(attrs("a","href").map(x=>normalizedUrl(x,page.url)).filter(Boolean))];
 const linksMatching=links.filter(u=>/\/(?:event|events|ticket|shows|music-events)\b/i.test(new URL(u).pathname)).slice(0,30);
 const ticketDomains=[...new Set(links.map(u=>new URL(u).hostname).filter(h=>/(?:tixr|afton|etix|ticketweb|eventbrite|axs|see?ticket)/i.test(h)))];
 const iframeHosts=[...new Set(attrs("iframe","src").map(x=>normalizedUrl(x,page.url)).filter(Boolean).map(u=>new URL(u).hostname))];
 return {id:page.id,venue:page.venue,officialPage:page.url,htmlBytes:Buffer.byteLength(html),
  fullDateSamples:dates,isoDateSamples:isoDates,dateTimeAttributes:datetime,
  eventSchemaCount,originalEventLinks:linksMatching,ticketDomains,embeddedFrameHosts:iframeHosts,
  lolaRoomMentions:(html.match(/Lola(?:&#39;|&apos;|’|')?s Room/gi)||[]).length,
  completeness:"Read-only HTML inspection only; a page mentioning dates is not proof of complete current authorized event intake."};
}
async function retrieve(page,request=fetch){
 const response=await request(page.url,{redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(17000)});
 if(!response.ok)throw Error(page.id+" official HTML HTTP "+response.status+" (source unavailable, not zero shows)");
 if(!String(response.headers.get("content-type")||"").toLowerCase().includes("text/html"))throw Error(page.id+" not HTML");
 if(!response.body?.getReader)throw Error(page.id+" body unreadable");
 const reader=response.body.getReader(),chunks=[];let bytes=0;
 for(;;){
  const {done,value}=await reader.read();if(done)break;
  bytes+=value.byteLength;
  if(bytes>MAX_BYTES){await reader.cancel();throw Error(page.id+" HTML exceeded bounded limit");}
  chunks.push(Buffer.from(value));
 }
 return summarizeHtml(Buffer.concat(chunks).toString("utf8"),page);
}
async function main(){
 let errors=0;
 for(const page of PAGES){
  try{
   const data=await retrieve(page);
   console.log(JSON.stringify(data,null,2));
   if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    "### "+page.venue+" ("+page.id+")\n"+
    "- Year-bearing date samples: "+data.fullDateSamples.length+"; machine-readable event blocks: "+data.eventSchemaCount+
    "; original event links: "+data.originalEventLinks.length+"; ticket domains: "+data.ticketDomains.join(", ")+"\n"+
    "- **Read-only research**: no import or publication. Rooms, start versus doors, timezone and cancellations require verification.\n\n");
  }catch(e){errors++;console.error("SOURCE UNAVAILABLE "+page.id+": "+String(e.message||e));}
 }
 if(errors)process.exitCode=1;
}
if(require.main===module)main();
module.exports={PAGES,MAX_BYTES,normalizedUrl,summarizeHtml,retrieve};
