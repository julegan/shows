#!/usr/bin/env node
"use strict";
/* First-party calendar -> original ticket detail research for The Get Down.
 * Review-only; never mutates events.js, guesses a room or copies a flyer.
 */
const fs=require("node:fs"),path=require("node:path");
const {sourceLinks,SOURCE}=require("./get-down-source-diagnostic");
const CALENDAR_HOST="www.thegetdownpdx.com";
const MAX_BYTES=1500000,MAX_DETAILS=16;
function originalTicket(raw){
 try{
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.username||u.password||u.port||u.search||u.hash||u.href.length>900)return null;
  if(u.hostname!=="www.tixr.com"&&u.hostname!=="tixr.com")return null;
  return /^\/groups\/thegetdownpdx\/events\/[a-z0-9][a-z0-9-]{2,180}\/?$/i.test(u.pathname)?u.href:null;
 }catch{return null;}
}
function text(s){return String(s||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ")
 .replace(/&(?:amp|nbsp|quot|apos);/gi," ").replace(/\s+/g," ").trim();}
function nodes(html){
 const found=[];
 for(const m of String(html).matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try{
   const root=JSON.parse(m[1]);
   const visit=(obj,depth=0)=>{
    if(depth>5||!obj||typeof obj!=="object")return;
    if(Array.isArray(obj)){for(const x of obj)visit(x,depth+1);return;}
    if(/(?:^|\/)Event$/.test(String(obj["@type"]||""))||obj["@type"]==="Event")found.push(obj);
    if(obj["@graph"])visit(obj["@graph"],depth+1);
   };
   visit(root);
  }catch{}
 }
 return found.slice(0,20);
}
function inspectTicket(html,url){
 const official=originalTicket(url);
 if(!official)return {url,hold:"Ticket URL not scoped to The Get Down's original Tixr group"};
 if(typeof html!=="string"||html.length<100||html.length>MAX_BYTES)
  return {url:official,hold:"Missing or oversized original ticket HTML"};
 const candidates=nodes(html);
 const matches=candidates.filter(e=>{
  const loc=e.location||{},place=typeof loc==="string"?loc:loc.name||"";
  const addr=typeof loc==="object"?loc.address||{}:{};
  const street=text(typeof addr==="string"?addr:addr.streetAddress||"");
  return /^the get down$/i.test(text(place))&&/^680\s+(?:SE|Southeast)\s+(?:6th|Sixth)\s+(?:Ave\.?|Avenue)(?:\s*,|$)/i.test(street);
 });
 if(!matches.length)return {url:official,hold:"No original event schema independently verifies venue AND street address",
  schemaEvents:candidates.length};
 const e=matches[0];
 const name=text(e.name||"").slice(0,200),start=String(e.startDate||"");
 if(!name||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(start)||
    !Number.isFinite(Date.parse(start))||!/(?:Z|[+-]\d{2}:\d{2})$/.test(start))
  return {url:official,hold:"Original event schema lacks title or offset-aware full date and time"};
 const status=String(e.eventStatus||"");
 if(/cancel|postpon|resched|moved/i.test(status))return {url:official,hold:"Original ticket status requires manual review",title:name,status};
 return {url:official,title:name,observedStart:start,observedStatus:status||"Not provided",
  status:"original-ticket-evidence-only",source:"original event JSON-LD",proposedEvents:0,
  note:"Ticket schema time semantics (doors vs show) and room remain unverified; no automatic publication"};
}
async function retrieve(url,request=fetch){
 if(!originalTicket(url))throw Error("Unapproved ticket URL");
 const response=await request(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-original-ticket-research/0.1"},
  redirect:"error",signal:AbortSignal.timeout(12000)});
 if(!response.ok||!/text\/html/i.test(response.headers?.get?.("content-type")||""))
  throw Error("Original ticket page HTTP "+response.status+" or non-HTML");
 const html=await response.text();
 if(html.length>MAX_BYTES)throw Error("Original ticket HTML exceeds bound");
 return html;
}
async function run({request=fetch,write=true}={}){
 const response=await request(SOURCE,{headers:{Accept:"text/html"},redirect:"error",
  signal:AbortSignal.timeout(12000)});
 if(!response.ok||!/text\/html/i.test(response.headers?.get?.("content-type")||""))
  throw Error("Original venue calendar unavailable");
 const html=await response.text();
 if(html.length<300||html.length>MAX_BYTES||!/\bThe Get Down\b/i.test(text(html))||
  !/680\s*(?:SE|Southeast)\s*6th/i.test(text(html)))throw Error("Original venue calendar identity not confirmed");
 const links=[...new Set(sourceLinks(html).map(l=>originalTicket(l.url)).filter(Boolean))].slice(0,MAX_DETAILS);
 const findings=[];
 for(let i=0;i<links.length;i+=4){
  const group=await Promise.all(links.slice(i,i+4).map(async url=>{
   try{return inspectTicket(await retrieve(url,request),url);}
   catch(e){return {url,hold:String(e.message||e)};}
  }));
  findings.push(...group);
 }
 const report=["# The Get Down — original ticket evidence (review only)","",
  "Checked: "+new Date().toISOString(),"Venue calendar: "+SOURCE,
  "No events, dates, genres or flyers were written to canonical datasets.","",
  "Allowed event ticket links: "+links.length+" (maximum "+MAX_DETAILS+"); verified original event schema: "+
  findings.filter(x=>x.status==="original-ticket-evidence-only").length+"; held: "+findings.filter(x=>x.hold).length,"",
  "| Original ticket | Title observed | Date/time observed | Disposition |",
  "| --- | --- | --- | --- |",
  ...findings.map(x=>"| "+x.url+" | "+(x.title||"—").replace(/[|\r\n]/g,"/")+" | "+
   (x.observedStart||"—")+" | "+(x.hold||"Review original ticket; showtime semantics unverified").replace(/[|\r\n]/g,"/")+" |"),
  "","Ticket links without schema or a verified exact venue address remain holds, not missing or canceled events.",
  "A ticket page with matching schema is evidence for editorial reconciliation only. Verify performance time, cancellation status, room and canonical duplicate identity before any event proposal."].join("\n")+"\n";
 if(write)fs.writeFileSync(path.join(__dirname,"../discovery/get-down-ticket-evidence.md"),report);
 return {findings,links,report};
}
if(require.main===module)run().then(x=>console.log("Get Down original ticket evidence: "+x.findings.length+
 " checked, "+x.findings.filter(f=>f.hold).length+" held (review only)")).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={originalTicket,nodes,inspectTicket,retrieve,run};
