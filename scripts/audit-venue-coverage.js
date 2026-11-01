#!/usr/bin/env node
"use strict";
/* Venue inventory coverage: count actual records, never equate count with complete source coverage. */
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const registry=JSON.parse(fs.readFileSync(path.join(root,"discovery/venues.json"),"utf8"));
const raw=fs.readFileSync(path.join(root,"events.js"),"utf8");
const events=JSON.parse(raw.match(/window\.SHOWS_EVENTS\s*=\s*(\[[\s\S]*?\]);\s*$/)?.[1]||"null");
const norm=s=>String(s||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
function pacificDay(){
 const p=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).map(x=>[x.type,x.value]));
 return p.year+"-"+p.month+"-"+p.day;
}
function audit(today=pacificDay()){
 const rows=registry.venues.map(venue=>{
  const names=[venue.name,...venue.aliases].map(norm);
  const all=events.filter(e=>names.includes(norm(e.venue))&&e.startsAt?.slice(0,10)>=today);
  return {...venue,futureCount:all.length,futureMusic:all.filter(e=>e.category==="Music").length,
   futureArtwork:all.filter(e=>e.artwork?.url).length,
   missingStyles:all.filter(e=>e.category==="Music"&&!e.musicStyles?.length).length,
   earliest:all.reduce((x,e)=>!x||e.startsAt<x?e.startsAt:x,null)?.slice(0,10)||null};
 });
 const indexed=new Set(rows.flatMap(v=>[v.name,...v.aliases].map(norm)));
 const notIndexed=[...new Set(events.filter(e=>e.startsAt?.slice(0,10)>=today&&!indexed.has(norm(e.venue))).map(e=>e.venue))].sort();
 return {date:today,totalEvents:events.length,listedVenues:rows.length,rows,notIndexed};
}
function report(a){
 const line=[
  "# Venue-first music coverage audit — "+a.date,"",
  "Source of truth: \`discovery/venues.json\` editorialPreferenceGroups. Preference and technical import readiness are independent. Counts are only **already-listed future SHOWS records**, not all dates on a venue calendar.",
  "A venue can have dozens of shows while SHOWS contains zero. Never substitute event totals for source completeness.","",
  "## Preferred venues (editorial choices, regardless of importer status)","",
  "| Venue | Events listed | Music | Original images | Import source status | Official calendar |",
  "| --- | ---: | ---: | ---: | --- | --- |"
 ];
 for(const v of a.rows.filter(x=>x.editorialPreference==="preferred"))line.push("| "+v.name+" | "+v.futureCount+" | "+v.futureMusic+" | "+v.futureArtwork+" | "+v.ingestionStatus+" | "+(v.calendarUrl?"[Source]("+v.calendarUrl+")":"Needs verification")+" |");
 line.push("","## Other scene venues and secondary coverage","","| Venue | Events listed | Music | Import status |","| --- | ---: | ---: | --- |");
 for(const v of a.rows.filter(x=>x.editorialPreference!=="preferred"))line.push("| "+v.name+" | "+v.futureCount+" | "+v.futureMusic+" | "+v.ingestionStatus+" |");
 line.push("","## Events at unindexed venues","","These are not necessarily music-specific venues; review whether they belong in the permanent venue inventory.","",...a.notIndexed.map(x=>"- "+x));
 line.push("","## Collection order","","1. Research user-preferred venues first, even when their source is blocked or no adapter exists. Record those gaps; a venue without an importer is NOT a lower priority.",
 "2. Discover every publicly announced future event at a supported venue; keep unknown genre and unverified times explicit.",
 "3. Extract source-provided event image + origin on the same pass; distinguish a generic logo from an event-specific flyer.",
 "4. Review source conflicts, duplicates, age/time/venue and image usage before merging; the portfolio sync remains a separate review.",
 "5. Record last successful source fetch, last reviewed date, new events, holds and missing art for each adapter.",
 "","## Supplementary sources","",...registry.supplementaryDiscovery.map(x=>"- "+x.name+": "+x.url+" — "+x.purpose),"");
 return line.join("\n")+"\n";
}
if(require.main===module){
 const a=audit(process.argv[2]||undefined);
 const output=report(a);
 if(process.argv.includes("--write"))fs.writeFileSync(path.join(root,"discovery/venue-coverage-latest.md"),output);
 else process.stdout.write(output);
}
module.exports={audit,report};
