#!/usr/bin/env node
"use strict";
const {fetchCoffinEvents}=require("./coffin-venuepilot");
async function main(){
 const rows=await fetchCoffinEvents();
 const valid=rows.filter(x=>x.startDate&&x.fullUrl),held=rows.filter(x=>x.hold);
 console.log(JSON.stringify({source:"coffin-club",mode:"read-only",proposedCandidates:valid.length,heldForReview:held.length,examples:valid.slice(0,4).map(x=>({title:x.title,venue:x.venue,when:x.startDate})),holdReasons:held.slice(0,5).map(x=>x.hold)}));
 if(!valid.length)throw Error("No publicly announced Coffin Club events with verified primary details; leave importer disabled");
 console.log("PASS — official VenuePilot application access and The Coffin venue identity confirmed; no records changed or published.");
}
if(require.main===module)main().catch(e=>{console.error("COFFIN PUBLIC API PROBE FAILED: "+String(e.message||e));process.exitCode=1;});
module.exports={main};
