#!/usr/bin/env node
"use strict";
/* Backfill only evidence-supported event-format and genre labels.
 * No dates, titles, venues, ticket URLs, recurrence or image rights change.
 * Run with --write to apply; default dry run prints a summary.
 */
const fs=require("node:fs"),path=require("node:path");
const {classifyEvent}=require("./event-classification");
const reviewed=require("./reviewed-classifications");
const root=path.resolve(__dirname,".."),file=path.join(root,"events.js");
function backfill(text){
 const m=text.match(/window\.SHOWS_DATASET\s*=\s*(\{[\s\S]*?\});\s*window\.SHOWS_EVENTS\s*=\s*(\[[\s\S]*?\]);\s*$/);
 if(!m)throw Error("Canonical source data unavailable");
 const meta=JSON.parse(m[1]),events=JSON.parse(m[2]),changed=[],counts={format:0,style:0,reviewed:0};
 const existingIds=new Set();
 for(const e of events){
  if(!e.id||existingIds.has(e.id))throw Error("Unstable event id");
  existingIds.add(e.id);
  // Curated events keep original manual styling. Only importer events are eligible.
  if(!e.discovery?.sourceId)continue;
  const localDate=e.startsAt?.slice(0,10);
  const manual=reviewed.forEvent({url:e.url,title:e.title,venue:e.venue,date:localDate});
  const derived=manual||classifyEvent({title:e.title,categories:e.sourceCategories||[]});
  const former=e.category,styles=e.musicStyles||[];
  if(former==="Unclassified"&&derived.category==="Music"){
   e.category="Music";e.icon="♫";
   e.tags=(e.tags||[]).filter(x=>x!=="Category needs review");
   e.tags.unshift(manual?"Editorially verified Music":"Source-title Music");
   e.classificationEvidence=derived.evidence;
   if(manual)e.classificationSourceUrl=manual.evidenceUrl;
   counts.format++;
  }
  if(e.category==="Music"&&derived.musicStyles?.length){
   const newStyles=derived.musicStyles.filter(s=>!styles.includes(s));
   if(newStyles.length){
    e.musicStyles=[...styles,...newStyles];
    e.tags=[...new Set([...(e.tags||[]),...newStyles.map(style=>(manual?"Editorially verified ":"Source-mentioned ")+style)])];
    e.classificationEvidence=derived.evidence;
    if(manual)e.classificationSourceUrl=manual.evidenceUrl;
    counts.style+=newStyles.length;
   }
  }
  if(manual&&former!=="Music"&&e.category==="Music")counts.reviewed++;
  if(former!==e.category||JSON.stringify(styles)!==JSON.stringify(e.musicStyles))changed.push({id:e.id,title:e.title,before:former,after:e.category,styles:e.musicStyles});
 }
 if(meta.totalOccurrences!==events.length)throw Error("Do not backfill corrupt event metadata");
 meta.musicOccurrences=events.filter(e=>e.category==="Music").length;
 const output=text.slice(0,m.index)+"window.SHOWS_DATASET = "+JSON.stringify(meta,null,2)+";\nwindow.SHOWS_EVENTS = "+JSON.stringify(events,null,2)+";\n";
 return {output,changed,counts,meta};
}
if(require.main===module){
 const input=fs.readFileSync(file,"utf8"),result=backfill(input);
 console.log(JSON.stringify({count:result.changed.length,counts:result.counts,nowMusic:result.meta.musicOccurrences,examples:result.changed}));
 if(process.argv.includes("--write")&&result.changed.length)fs.writeFileSync(file,result.output);
}
module.exports={backfill};
