"use strict";
// Review-only per-source health. A successful page fetch is NOT proof of complete venue coverage.
const escapeCell=value=>String(value??"").replace(/\|/g,"/").replace(/\r?\n/g," ").slice(0,130);
function sourceHealthSummary({sourceRuns=[],sourceRegistry=[],accepted=[],held=[],skipped=[],errors=[]}={}){
 const byRun=new Map(sourceRuns.map(r=>[r.id,r]));
 const byError=new Map(errors.map(e=>[e.source,e.error]));
 const count=(items,id)=>items.filter(x=>(x.discovery?.sourceId||x.sourceId)===id).length;
 const out=["## Source health (this run)","",
  "A successful fetch only confirms the configured endpoint responded; it does **not** establish complete venue coverage. Empty sources and failures require investigation. Held records include missing/ambiguous data, not just new-event conflicts.","",
  "| Source | Result | Items checked | New | Music | Unclassified | With art | Held | Skipped |",
  "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"];
 for(const src of sourceRegistry.filter(s=>s.status==="pilot-enabled")){
  const run=byRun.get(src.id),newEvents=accepted.filter(e=>e.discovery?.sourceId===src.id);
  const status=run?.status==="failed"?"FAILED":run?.status==="empty"?"EMPTY":run?.status==="checked"?"Checked":"NOT RUN";
  out.push("| "+escapeCell(src.name)+" | "+status+" | "+(run?.examined??0)+" | "+newEvents.length+" | "+
   newEvents.filter(e=>e.category==="Music").length+" | "+newEvents.filter(e=>e.category==="Unclassified").length+" | "+
   newEvents.filter(e=>!!e.artwork?.url).length+" | "+count(held,src.id)+" | "+count(skipped,src.id)+" |");
 }
 const categories=[...new Set(accepted.map(e=>e.category))].sort().map(category=>{
  const count=accepted.filter(e=>e.category===category).length;
  return "**"+escapeCell(category)+"** "+count;
 });
 const unclassified=accepted.filter(e=>e.category==="Unclassified");
 out.push("","### Classification review","",
  "New candidate categories: "+(categories.join(" · ")||"none")+".",
  "**"+unclassified.length+" unclassified** candidates need evidence-based review; artist names and venue reputation alone are not genre evidence. Do not auto-label all venue events as Music.","");
 for(const e of unclassified.slice(0,10))out.push("- "+escapeCell(e.venue)+": "+escapeCell(e.title)+" — "+e.url);
 if(unclassified.length>10)out.push("- Plus "+(unclassified.length-10)+" other unclassified candidates in the full event table below.");
 out.push("","### Connections requiring work","",
  ...sourceRegistry.filter(s=>s.status==="adapter-needed"||s.status==="source-blocked").map(s=>
   "- "+escapeCell(s.name)+": **"+s.status+"**"+(s.priority==="highest"?" (priority venue)":"")+"."),
  "");
 if(byError.size)out.push("### Failed source checks","",...[...byError].map(([id,error])=>"- "+escapeCell(id)+": "+escapeCell(error)),"");
 return out.join("\n")+"\n";
}
module.exports={sourceHealthSummary};
