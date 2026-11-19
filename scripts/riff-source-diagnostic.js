#!/usr/bin/env node
"use strict";
// Read-only primary-source diagnostic; never proposes dated events or mirrors artwork.
const fs=require("node:fs"),path=require("node:path");
const SOURCE="https://bsiderecordsvintage.com/events";
const LIMIT=1000000;
function plain(html){
 return String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]+>/g," ").replace(/&amp;/gi,"&")
  .replace(/&nbsp;|&#160;/gi," ").replace(/\s+/g," ").trim();
}
const BILLS=[
 {id:"jonathan-ray",date:"Fri Nov 20",name:"Jonathan Ray, Redfishbluefish, Lane Amore, Alter of Hireath",time:"6:30 PM"},
 {id:"pickle-al",date:"Sun Nov 22",name:"Songs & Stories with Pickle Al & Friends",time:"5:30 PM"},
 {id:"interchange",date:"Sat Nov 28",name:"INTERCHANGE",time:"7:00 PM"}
];
function inspect(html){
 if(typeof html!=="string"||html.length<250||html.length>LIMIT)throw Error("Invalid or oversized source HTML");
 const text=plain(html);
 if(!/Events at The Riff/i.test(text)||!/B-Side Records & Vintage/i.test(text))
  throw Error("Official venue identity not confirmed");
 const checks=BILLS.map(b=>{
  const titleAt=text.toLowerCase().indexOf(b.name.toLowerCase());
  const dateAt=text.toLowerCase().lastIndexOf(b.date.toLowerCase(),titleAt);
  const timeAt=text.toLowerCase().indexOf(b.time.toLowerCase(),titleAt);
  const matched=titleAt>=0&&dateAt>=0&&titleAt-dateAt<220&&timeAt>titleAt&&timeAt-titleAt<160;
  return {id:b.id,status:matched?"first-party-calendar-text-observed":"hold-source-changed-or-missing",
   evidence:matched?text.slice(dateAt,Math.min(timeAt+b.time.length,dateAt+350)):null};
 });
 return {source:SOURCE,checks,proposedEvents:[],artwork:[],
  limitation:"Calendar text is evidence for research only; original dated event links, year, venue identity, status and poster rights need independent verification before intake."};
}
async function run(opts={}){
 const request=opts.request||fetch;
 const response=await request(SOURCE,{redirect:"error",headers:{accept:"text/html"}});
 if(!response.ok)throw Error("Riff official calendar HTTP "+response.status);
 if(!/text\/html/i.test(response.headers?.get?.("content-type")||""))throw Error("Source is not HTML");
 const result=inspect(await response.text());
 if(opts.write!==false){
  const lines=["# The Riff / B-Side — first-party music coverage diagnostic","",
   "Original source: "+SOURCE,"Checked: "+new Date().toISOString(),"",
   "Review-only research. No event records, genre labels, individual show times or flyers are imported.","",
   "| Original bill | Observation |","| --- | --- |",
   ...result.checks.map(c=>"| "+c.id+" | "+c.status+" |"),"",
   "The calendar lists events in Milwaukie, not at the similarly named Portland B-Side bar.",
   "Hold until original per-event permalink, full year, exact venue and cancellation status are independently established.",
   "Do not infer genres from band names, treat recurring programming as individual shows, or copy images.",
   "The three reference bills were observed on the original November 2026 calendar; a mismatch is a research alert, not evidence of cancellation."];
  fs.writeFileSync(path.join(__dirname,"../discovery/riff-source-diagnostic.md"),lines.join("\n")+"\n");
 }
 return result;
}
if(require.main===module)run().then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={SOURCE,BILLS,plain,inspect,run};
