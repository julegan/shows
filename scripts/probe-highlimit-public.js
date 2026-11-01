#!/usr/bin/env node
"use strict";
/* Read-only inspection of High Limit Room's OWN public shows page.
 * No calls to third-party iframe/widget endpoints, no credentials, and
 * no extraction of private checkout data. This is not an event importer.
 */
const URL="https://highlimitroompdx.com/shows/";
const MAX_BYTES=1_800_000;
function safeLink(raw) {
 try{
  if(!raw||raw.startsWith("//"))return null;
  const u=new URL(raw,URL);
  if(u.protocol!=="https:"||u.username||u.password||u.port)return null;
  // Ignore query/hash, which may include tracking or provider configuration.
  return u.origin+u.pathname;
 }catch(_){return null;}
}
function summarize(html) {
 if(typeof html!=="string"||html.length>MAX_BYTES)throw Error("Unexpected High Limit page size");
 const attrs=(tag,attr)=>[...html.matchAll(new RegExp("<"+tag+"\\b[^>]*\\b"+attr+"\\s*=\\s*([\"'])(.*?)\\1","gi"))].map(m=>m[2]);
 const frames=[...new Set(attrs("iframe","src").map(safeLink).filter(Boolean))].slice(0,20);
 const scripts=[...new Set(attrs("script","src").map(safeLink).filter(Boolean))].filter(x=>!x.startsWith("https://highlimitroompdx.com/")).slice(0,20);
 const links=[...new Set(attrs("a","href").map(safeLink).filter(Boolean))];
 const ticketLinks=links.filter(x=>/(?:afton|tickets|ticketweb|etix|eventbrite|dice|venuepilot)/i.test(new URL(x).hostname)).slice(0,20);
 const ld=[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
 let eventSchemaBlocks=0;
 for(const [,json] of ld){
  try{
   const parsed=JSON.parse(json);
   if(JSON.stringify(parsed).match(/"@type"\s*:\s*"[^"]*Event"/))eventSchemaBlocks++;
  }catch(_){}
 }
 const timeMarkers=[...html.matchAll(/<time\b[^>]*datetime\s*=\s*["']([^"']+)["']/gi)].map(x=>x[1]).filter(x=>/^\d{4}-\d\d-\d\d/.test(x));
 return {page:URL,frameSources:frames,externalScripts:scripts,ticketProviderLinks:ticketLinks,
  eventSchemaBlocks,datedTimeMarkers:timeMarkers.length,
  aftonMentioned:/afton/i.test(html),
  rawEventCountTrusted:false,
  interpretation:"Diagnostic only: DOM widget references do not establish authorized complete dated-event coverage."};
}
async function fetchPage(request=fetch){
 const response=await request(URL,{
  method:"GET",redirect:"error",
  headers:{Accept:"text/html","User-Agent":"SHOWS-official-venue-review/0.1"},
  signal:AbortSignal.timeout(16000)
 });
 if(!response.ok)throw Error("High Limit official page HTTP "+response.status+"; source unavailable, NOT an empty calendar");
 if(!String(response.headers.get("content-type")||"").toLowerCase().includes("text/html"))
   throw Error("High Limit official shows page did not return HTML");
 const reader=response.body?.getReader();
 if(!reader)throw Error("High Limit response has no readable body");
 const chunks=[];let length=0;
 for(;;){
  const {done,value}=await reader.read();if(done)break;
  length+=value.byteLength;
  if(length>MAX_BYTES){await reader.cancel();throw Error("High Limit page exceeds bounded inspection limit");}
  chunks.push(Buffer.from(value));
 }
 return summarize(Buffer.concat(chunks).toString("utf8"));
}
async function main(){
 try{
  const result=await fetchPage();
  console.log(JSON.stringify({checkedAt:new Date().toISOString(),...result},null,2));
  if(process.env.GITHUB_STEP_SUMMARY){
   require("node:fs").appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    "## High Limit Room official shows page — source inspection only\n\n"+
    "Public iframe references: "+result.frameSources.length+
    "; external script references: "+result.externalScripts.length+
    "; official page dated time markers: "+result.datedTimeMarkers+
    "; JSON-LD event blocks: "+result.eventSchemaBlocks+".\n\n"+
    "This check does **not** retrieve Afton checkout/widget endpoints, discover confirmed events or publish anything.\n");
  }
 }catch(e){console.error("HIGH LIMIT SOURCE INSPECTION: "+String(e.message||e));process.exitCode=1;}
}
if(require.main===module)main();
module.exports={URL,MAX_BYTES,safeLink,summarize,fetchPage};
