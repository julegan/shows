"use strict";
// Per-source evidence audit, not a genre quota or a complete upstream inventory.
const TARGETS=["a-beat-happening","atlantis-lounge","alberta-street-pub","the-off-beat","jack-london-revue"];
const dayOf=x=>String(x?.event?.startsAt||x?.date||"").slice(0,10);
const safe=x=>String(x??"").replace(/[\r\n|<>\[\]*_]/g," ").replace(/\s+/g," ").trim().slice(0,220);
function addDays(day,n){
 const d=new Date(day+"T12:00:00Z");
 if(!/^20\d\d-\d\d-\d\d$/.test(day)||!Number.isFinite(d.valueOf())||d.toISOString().slice(0,10)!==day)
  throw Error("Invalid audit date");
 d.setUTCDate(d.getUTCDate()+n);
 return d.toISOString().slice(0,10);
}
function analyze({today,sources=[],approved=[],found=[],reconciled={},sourceRuns=[]}){
 addDays(today,0);
 const active=new Map(sources.filter(s=>TARGETS.includes(s.id)).map(s=>[s.id,s.name]));
 const health=new Map(sourceRuns.map(s=>[s.id,s.status]));
 const published=new Map(),proposed=new Map(),holds=new Map();
 for(const e of approved){if(!e.url)continue;published.set(e.url,[...(published.get(e.url)||[]),e]);}
 for(const e of reconciled.accepted||[]){if(!e.url)continue;proposed.set(e.url,[...(proposed.get(e.url)||[]),e]);}
 for(const e of reconciled.held||[]){if(e.url)holds.set(e.url,e.hold);}
 const rows=[];
 for(const id of active.keys()){
  const seen=new Set();
  for(const r of found.filter(v=>(v.sourceId||v.event?.discovery?.sourceId)===id)){
   const url=r.event?.url||r.url||"",day=dayOf(r),title=r.event?.title||r.title||"Unverified title";
   if(url&&seen.has(url))continue;
   if(url)seen.add(url);
   if(/^\d{4}-\d\d-\d\d$/.test(day)&&(day<today||day>addDays(today,90)))continue;
   const pub=published.get(url)||[],draft=proposed.get(url)||[];
   let disposition,reason="";
   if(r.hold){disposition="source-hold";reason=r.hold;}
   else if(r.skip){disposition="source-exclusion";reason=r.skip;}
   else if(!r.event){disposition="unverified";reason="No verified original event record";}
   else if(pub.some(e=>e.startsAt?.slice(0,10)===day))disposition="published";
   else if(pub.length){disposition="date-conflict";reason="Original permalink changed date";}
   else if(draft.some(e=>e.startsAt?.slice(0,10)===day))disposition="proposed";
   else if(holds.has(url)){disposition="reconciliation-hold";reason=holds.get(url);}
   else{disposition="unaccounted";reason="No published, proposed or held explanation";}
   rows.push({id,source:active.get(id),url,day:/^20\d\d-\d\d-\d\d$/.test(day)?day:null,title,disposition,reason,
    missingStyle:r.event?.category==="Unclassified"||(r.event?.category==="Music"&&!(r.event?.musicStyles||[]).length),
    musicStyles:r.event?.musicStyles||[]});
  }
 }
 const windows=[30,60,90].map(days=>({days,through:addDays(today,days),
  groups:[...active].map(([id,name])=>{
   const subset=rows.filter(r=>r.id===id&&r.day&&r.day>=today&&r.day<=addDays(today,days));
   return {id,name,health:health.get(id)||"not-run",observed:subset.length,
    published:subset.filter(r=>r.disposition==="published").length,
    proposed:subset.filter(r=>r.disposition==="proposed").length,
    exceptions:subset.filter(r=>!["published","proposed"].includes(r.disposition)).length,
    unknown:subset.filter(r=>r.missingStyle).length};
  })
 }));
 return {today,rows,windows,health:[...active].map(([id,name])=>({
  id,name,status:health.get(id)||"not-run",undated:rows.filter(r=>r.id===id&&!r.day).length
 }))};
}
function report(a){
 const lines=["# Independent original music source reconciliation — "+a.today,"",
  "This audit covers observed first-party dated events at selected independent music and community sources. It is not a genre quota. Source responses may be incomplete; an empty or failed feed is not evidence of no upcoming events.","",
  "## Source health","",
  "| Original source | Source status | Undated holds |","| --- | --- | ---: |"];
 for(const h of a.health)lines.push("| "+safe(h.name)+" | "+safe(h.status)+" | "+h.undated+" |");
 for(const w of a.windows){
  lines.push("","## "+w.days+"-day window through "+w.through,"",
    "| Source | Observed | Published by original identity | Proposed | Exceptions | Unknown music style / category |",
    "| --- | ---: | ---: | ---: | ---: | ---: |");
  for(const g of w.groups)lines.push("| "+safe(g.name)+" | "+g.observed+" | "+g.published+" | "+g.proposed+" | "+g.exceptions+" | "+g.unknown+" |");
 }
 lines.push("","## Original event exceptions (earliest first)","");
 const pending=a.rows.filter(r=>!["published","proposed"].includes(r.disposition))
  .sort((x,y)=>(x.day||"9999").localeCompare(y.day||"9999"));
 if(!pending.length)lines.push("No observed exceptions; upstream completeness remains unverified.");
 for(const r of pending)lines.push("- "+(r.day||"Date unverified")+" · "+safe(r.source)+" · "+safe(r.title)+
  " · **"+r.disposition+"**"+(r.reason?": "+safe(r.reason):"")+(r.url&&/^https:\/\//.test(r.url)?" · "+r.url:""));
 lines.push("","## Verified original match samples","");
 const samples=a.rows.filter(r=>["published","proposed"].includes(r.disposition))
  .sort((x,y)=>(x.day||"9999").localeCompare(y.day||"9999")).slice(0,8);
 if(!samples.length)lines.push("No matched future original-source dates observed.");
 for(const r of samples)lines.push("- "+r.day+" · "+safe(r.source)+" · "+safe(r.title)+" · "+r.disposition+
  " · "+safe(r.musicStyles.join(", ")||"Style not verified"));
 lines.push("","Unknown music style is a metadata gap, never a reason to suppress verified events. Tentative same-night cross-source matches still need original identity review.","");
 return lines.join("\n")+"\n";
}
module.exports={TARGETS,addDays,analyze,report};
