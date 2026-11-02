#!/usr/bin/env node
"use strict";
const lola=require("./lolas-importer");
async function main(){
 const rows=await lola.fetchEvents({id:"lolas-room",url:lola.CALENDAR_URL,baseUrl:lola.ROOT});
 const accepted=rows.filter(x=>x.startDate&&x.fullUrl);
 const held=rows.filter(x=>x.hold);
 const skipped=rows.filter(x=>x.skip);
 console.log(JSON.stringify({venue:"Lola's Room",mode:"read-only source validation",total:rows.length,
  verified:accepted.length,holds:held.length,skipped:skipped.length,
  accepted:accepted.slice(0,15).map(x=>({title:x.title,date:x.rosterDate,time:x.rosterTime,url:x.fullUrl})),
  holdReasons:held.slice(0,25).map(x=>({title:x.title,reason:x.hold}))},null,2));
 if(accepted.length<5)throw Error("Fewer than five verified Lola records; keep importer disabled");
 if(accepted.some(x=>!x.rosterDate||!x.startDate||x.venue!=="Lola's Room"))throw Error("Incomplete Lola room validation");
 console.log("PASS — Original Lola's Room calendar detail records verified; still subject to human review.");
}
if(require.main===module)main().catch(e=>{console.error("LOLA VERIFY "+String(e.message||e));process.exitCode=1});
module.exports={main};
