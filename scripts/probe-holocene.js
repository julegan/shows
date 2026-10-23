#!/usr/bin/env node
"use strict";
const {fetchItems}=require("./discover-events");
const src=require("../discovery/sources.json").sources.find(x=>x.id==="holocene");
(async()=>{
 const rows=await fetchItems(src),valid=rows.filter(x=>x.startDate),held=rows.filter(x=>x.hold);
 console.log(JSON.stringify({source:"holocene",reviewOnly:true,examined:rows.length,valid:valid.length,held:held.length,
  examples:valid.slice(0,6).map(x=>({title:x.title,venue:x.venue,startDate:x.startDate,url:x.fullUrl})),
  holds:held.slice(0,8).map(x=>({reason:x.hold,url:x.url}))}));
 if(valid.length<8)throw Error("Insufficient source-published Holocene venue/time evidence; do not activate");
 console.log("PASS — Original Holocene venue event schema verifies full local dates and timezone");
})().catch(e=>{console.error("HOLOCENE SOURCE FAILED "+e.message);process.exitCode=1});
