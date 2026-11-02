#!/usr/bin/env node
"use strict";
const a=require("./showdown-importer");
async function main(){
 const rows=await a.fetchEvents({id:"showdown",url:a.HOME,baseUrl:a.ROOT},{maxDetails:12});
 const accepted=rows.filter(x=>x.startDate);
 const held=rows.filter(x=>x.hold);
 console.log(JSON.stringify({source:"showdown",mode:"bounded first-party original preview",verified:accepted.length,held:held.length,
  previews:accepted.map(x=>({title:x.title,startDate:x.startDate,event:x.fullUrl})),
  holdReasons:held.slice(0,10).map(x=>({title:x.title,reason:x.hold})),
  note:"Limited to 12 details for source readiness, not a claim of whole-calendar coverage."},null,2));
 if(accepted.length<7)throw Error("Showdown proof insufficient: fewer than seven verified full-year dated event details");
 console.log("PASS — Showdown first-party pagination and original event calendar date corroboration");
}
if(require.main===module)main().catch(e=>{console.error(String(e));process.exitCode=1});
