#!/usr/bin/env node
"use strict";
/* Original Crystal Ballroom site-only, read-only source probe; no publishing. */
const {fetchItems}=require("./discover-events");
const source=require("../discovery/sources.json").sources.find(x=>x.id==="crystal-ballroom");
async function main(){
 if(!source||source.adapter!=="crystal-official-html")throw Error("Crystal source adapter not configured");
 const rows=await fetchItems(source);
 const valid=rows.filter(x=>x.startDate),held=rows.filter(x=>x.hold);
 const dates=valid.map(x=>x.startDate).sort();
 console.log(JSON.stringify({source:source.id,reviewOnly:true,examined:rows.length,valid:valid.length,held:held.length,earliest:dates[0],latest:dates.at(-1),samples:valid.slice(0,6).map(x=>({title:x.title,when:x.startDate,venue:x.venue,url:x.fullUrl})),holds:held.slice(0,6).map(x=>({url:x.url,reason:x.hold}))}));
 if(valid.length<8)throw Error("Fewer than eight valid original Crystal Ballroom event dates; do not activate");
 console.log("PASS — first-party Crystal Ballroom event pages contain independently dated venue-specific Pacific start times");
}
if(require.main===module)main().catch(e=>{console.error("CRYSTAL LIVE SOURCE FAILED: "+String(e.message||e));process.exitCode=1});
module.exports={main};
