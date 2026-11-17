#!/usr/bin/env node
"use strict";
/* Keys Lounge first-party PROGRAMMING diagnostic, not an event importer.
 * A weekly schedule is not evidence of an individual dated occurrence.
 * No inferred dates, invented performers, copied artwork or dataset writes.
 */
const fs=require("node:fs"),path=require("node:path");
const SOURCE="https://www.keyspdx.com/";
const MAX_BYTES=900000;
function plain(html){
 return String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]+>/g," ").replace(/&(?:nbsp|#160);/gi," ")
  .replace(/&amp;/gi,"&").replace(/\s+/g," ").trim();
}
const SLOTS=[
 {id:"tuesday-jazz",day:"Tuesday",heading:/the session at keys/i,genre:"Jazz",time:/8\s*pm\s*[-–]\s*11\s*pm/i},
 {id:"wednesday-dj",day:"Wednesday",heading:/DJ Set/i,genre:"DJ / unclassified",time:/6\s*pm\s*[-–]\s*10\s*pm/i},
 {id:"thursday-residency",day:"Thursday",heading:/Lounge Vibrations/i,genre:"Live music / unclassified",time:/8\s*pm\s*[-–]\s*10\s*pm/i},
 {id:"friday-dj",day:"Friday",heading:/vinyl dj/i,genre:"DJ / unclassified",time:/5:30\s*pm\s*[-–]\s*12:30\s*am/i},
 {id:"saturday-dj",day:"Saturday",heading:/vinyl dj/i,genre:"DJ / unclassified",time:/5\s*pm\s*[-–]\s*9\s*pm/i},
 {id:"saturday-jazz",day:"Saturday",heading:/LIVE Jazz social/i,genre:"Jazz",time:/10\s*pm\s*[-–]\s*Midnight/i}
];
function analyze(html){
 if(typeof html!=="string"||html.length<300||html.length>MAX_BYTES)throw Error("Missing or oversized official Keys HTML");
 const text=plain(html),lower=text.toLowerCase(),observations=[],holds=[];
 if(!/keys lounge|keys world famous back room|the session at keys/i.test(text))throw Error("Source identity not verified");
 for(const slot of SLOTS){
  const start=lower.indexOf(slot.day.toLowerCase()+"s");
  if(start<0){holds.push({slot:slot.id,reason:"Day section absent"});continue;}
  const nextDays=["tuesdays","wednesdays","thursdays","fridays","saturdays","sundays","mondays"]
   .map(d=>lower.indexOf(d,start+slot.day.length+1)).filter(i=>i>start);
  const segment=text.slice(start,Math.min(...nextDays,Math.min(text.length,start+650)));
  if(!slot.heading.test(segment)||!slot.time.test(segment)){
   holds.push({slot:slot.id,reason:"Named programming or published clock missing / changed"});continue;
  }
  observations.push({slot:slot.id,day:slot.day,genre:slot.genre,sourceUrl:SOURCE,
   status:"recurring-programming-only",eventDate:null,eventTime:null,
   evidence:segment.slice(0,200)});
 }
 return {source:SOURCE,observations,holds,proposedEvents:[],note:"Weekly programming does not confirm any specific calendar occurrence, lineup, exception or holiday schedule."};
}
async function run(options={}){
 const request=options.request||fetch;
 const response=await request(SOURCE,{redirect:"error",headers:{accept:"text/html"}});
 if(!response.ok)throw Error("Official Keys source HTTP "+response.status);
 const type=response.headers?.get?.("content-type")||"";
 if(!/text\/html/i.test(type))throw Error("Official Keys source is not HTML");
 const html=await response.text();
 const result=analyze(html);
 if(options.write!==false){
  const dest=path.join(__dirname,"../discovery/keys-lounge-programming-review.md");
  const report=["# Keys Lounge — first-party weekly programming diagnostic","",
   "Original source: "+SOURCE,"Checked: "+new Date().toISOString(),"",
   "**No dated events proposed.** A recurring schedule is not an individual event listing. Do not infer dates or performers.","",
   "| Official programming | Day | Status |","| --- | --- | --- |",
   ...result.observations.map(o=>"| "+o.slot+" | "+o.day+" | Weekly only; dated event evidence needed |"),
   ...result.holds.map(h=>"| "+h.slot+" | — | HOLD: "+h.reason+" |"),"",
   "## Publication requirements","",
   "Find original venue/artist/promoter date-specific evidence for each occurrence, exact local clock and artist, including holiday exceptions. Deduplicate against existing Keys events. No source poster is copied."];
  fs.writeFileSync(dest,report.join("\n")+"\n");
 }
 return result;
}
if(require.main===module)run().then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={SOURCE,SLOTS,plain,analyze,run};
