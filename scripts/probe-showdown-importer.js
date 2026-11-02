#!/usr/bin/env node
"use strict";
const a=require("./showdown-importer");
async function main(){
 const rows=await a.fetchEvents({id:"showdown",url:a.HOME,baseUrl:a.ROOT},{maxDetails:a.MAX_DETAILS});
 const accepted=rows.filter(x=>x.startDate);
 const held=rows.filter(x=>x.hold);
 console.log(JSON.stringify({source:"showdown",mode:"bounded first-party original preview",verified:accepted.length,held:held.length,
  previews:accepted.slice(0,25).map(x=>({title:x.title,startDate:x.startDate,event:x.fullUrl})),
  holdReasons:held.slice(0,10).map(x=>({title:x.title,reason:x.hold})),
  note:"Full current original page index and all bounded event details were checked; individual date/title discrepancies are held."},null,2));
 if(accepted.length<25)throw Error("Showdown proof insufficient: fewer than twenty-five verified full-year dated event details");
 console.log("PASS — Showdown first-party pagination and original event calendar date corroboration");
}
if(require.main===module)main().catch(e=>{console.error(String(e));process.exitCode=1});
