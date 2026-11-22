#!/usr/bin/env node
"use strict";
/* Original calendar gap diagnostic for The Get Down. Research-only:
 * no event dates or show clocks inferred, no image copying or dataset writes.
 */
const fs=require("node:fs"),path=require("node:path");
const SOURCE="https://www.thegetdownpdx.com/calendar";
const MAX_BYTES=1500000;
function plain(s){return String(s||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
 .replace(/<[^>]+>/g," ").replace(/&amp;/gi,"&").replace(/&nbsp;|&#160;/gi," ")
 .replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/\s+/g," ").trim();}
function normalized(s){return plain(s).toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}
function sourceLinks(html){
 const out=[],seen=new Set();
 for(const m of String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  const label=plain(m[2]);let url;
  try{url=new URL(m[1].replace(/&amp;/g,"&"),SOURCE);}catch{continue;}
  if(url.protocol!=="https:"||url.username||url.password||url.href.length>1200)continue;
  if(!/^(?:www\.)?(?:tixr\.com|thegetdownpdx\.com|ticketmaster\.com|axs\.com)$/i.test(url.hostname))continue;
  if(!/(?:\/events?\/|\/groups\/thegetdownpdx|\/calendar)/i.test(url.pathname))continue;
  url.hash="";
  if(!label)continue;
  // Generic CTA labels are common on original calendars. Retain their
  // independently allowed ticket URLs as unpaired research leads rather
  // than discarding them or attaching them to a nearby artist name.
  const generic=/^(?:buy tickets|tickets|more info|view event|buy now|details|learn more)$/i.test(label);
  if(seen.has(url.href))continue;
  seen.add(url.href);out.push({label,url:url.href,association:generic?"unpaired-ticket-link":"labelled-link"});
 }
 return out.slice(0,150);
}
function inspect(html,events=[]){
 if(typeof html!=="string"||html.length<300||html.length>MAX_BYTES)throw Error("Missing or oversized original calendar HTML");
 const body=plain(html);
 if(!/the get down/i.test(body)||!/680\s*(?:se|southeast)\s*6th/i.test(body))
  throw Error("Venue identity/address not verified: hold entire source");
 const links=sourceLinks(html);
 // Do not assume ticket button links uniquely identify a bill, or assume a
 // generic ticket label proves its nearby event title.
 const venueEvents=events.filter(e=>/^(?:the get down|the get down music venue)$/i.test(e.venue||""));
 const hints=[...body.matchAll(/(?:The Get Down Presents|The Get Down & KMHD Present|Orlove by Night Presents)\s+(.{8,120}?)(?=\s+DOORS:|\s+buy tickets|$)/gi)]
  .map(m=>plain(m[1])).filter(Boolean).slice(0,100);
 const seen=new Set(),observations=[];
 for(const hint of hints){
  const key=normalized(hint);if(!key||seen.has(key))continue;seen.add(key);
  const exact=venueEvents.filter(e=>normalized(e.title)===key);
  observations.push({titleHint:hint,status:exact.length?"possible-existing-title-review":"missing-or-title-different-review",
   existingIds:exact.map(e=>e.id)});
 }
 return {source:SOURCE,identity:"The Get Down, 680 SE 6th Ave, Portland",observations,sourceLinks:links,
  canonicalVenueCount:venueEvents.length,proposedEvents:[],artwork:[],
  limitations:"Page hints and ticket links are research evidence only. Generic ticket links are deliberately unpaired: their position does not establish which artist or event they represent. Calendar may omit the year; doors are not performance start. Verify original event permalink, full date/year, local clock, actual bill, status and room individually before intake."};
}
function loadEvents(file=path.join(__dirname,"../events.js")){
 const data=fs.readFileSync(file,"utf8");
 const m=data.match(/window\.SHOWS_EVENTS\s*=\s*(\[[\s\S]*?\]);\s*$/);
 if(!m)throw Error("Canonical events format unreadable");
 return JSON.parse(m[1]);
}
async function run(opts={}){
 const request=opts.request||fetch;
 const r=await request(SOURCE,{redirect:"error",headers:{accept:"text/html"},signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error("Original calendar HTTP "+r.status);
 if(!/text\/html/i.test(r.headers?.get?.("content-type")||""))throw Error("Original calendar did not return HTML");
 const result=inspect(await r.text(),opts.events||loadEvents());
 if(opts.write!==false){
  const report=["# The Get Down — first-party calendar coverage diagnostic","",
   "Checked: "+new Date().toISOString(),"Original source: "+SOURCE,"",
   "Research only; zero proposed events, inferred genres, dates, performance times or copied flyers.","",
   "Canonical events already at this venue: "+result.canonicalVenueCount,
   "Original calendar title hints: "+result.observations.length,"Allowed original ticket/event links: "+result.sourceLinks.length,"",
   "| Source title hint | Existing exact-title match |","| --- | --- |",
   ...result.observations.map(o=>"| "+o.titleHint.replace(/[|\r\n]/g,"/").slice(0,140)+" | "+o.status+" |"),
   "","## Source links (research only)","",
   ...result.sourceLinks.map(l=>"- ["+l.association+"] "+l.label.replace(/[\r\n]/g," ").slice(0,100)+": "+l.url),
   "","## Holds","",result.limitations,
   "Do not treat a missing title as a canceled show. Reconcile date-specific official tickets and source cards with canonical IDs before creating any review-only proposals."];
  fs.writeFileSync(path.join(__dirname,"../discovery/get-down-source-diagnostic.md"),report.join("\n")+"\n");
 }
 return result;
}
if(require.main===module)run().then(x=>console.log(JSON.stringify({source:x.source,hints:x.observations.length,links:x.sourceLinks.length,canonical:x.canonicalVenueCount,proposed:0}))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={SOURCE,plain,normalized,sourceLinks,inspect,loadEvents,run};
