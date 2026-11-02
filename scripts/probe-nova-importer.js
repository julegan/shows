#!/usr/bin/env node
"use strict";
const {fetchNovaEvents}=require("./nova-importer");
async function main(){
 const rows=await fetchNovaEvents();
 const proposed=rows.filter(x=>x.fullUrl&&(x.startDate||x.dateOnly));
 const held=rows.filter(x=>x.hold);
 const withClock=proposed.filter(x=>x.startDate);
 const dateOnly=proposed.filter(x=>x.sourceDateOnly);
 console.log(JSON.stringify({source:"nova-pdx",mode:"original-venue-review-only",officialCandidates:proposed.length,
  exactTimeCorroborated:withClock.length,dateOnly:dateOnly.length,sourceHolds:held.length,
  samples:proposed.slice(0,12).map(x=>({title:x.title,day:x.startDate||x.dateOnly,ticket:x.fullUrl})),
  holdReasons:held.slice(0,6).map(x=>x.hold)},null,2));
 if(proposed.length<5||held.length)throw Error("Nova venue evidence incomplete; do not enable automated importer");
 console.log("PASS — Nova first-party schema supplied five or more confirmed dates; importer remains inactive until reviewed");
}
if(require.main===module)main().catch(e=>{console.error("NOVA SOURCE PROBE: "+String(e.message||e));process.exitCode=1});
module.exports={main};
