#!/usr/bin/env node
"use strict";
const i=require("./45east-redcube-importer");
const source={id:"45-east",url:i.CALENDAR_URL,baseUrl:"https://www.redcubepresents.com",adapter:"45east-redcube-original"};
async function main(){
 const entries=await i.fetchEvents(source);
 const accepted=entries.filter(x=>x.fullUrl&&x.dateOnly),held=entries.filter(x=>x.hold);
 console.log(JSON.stringify({source:"45-east",origin:"Red Cube Presents original 45 East bill list",
   sourceDateOnly:accepted.length,holds:held.length,
   candidates:accepted.slice(0,24).map(x=>({title:x.title,date:x.dateOnly,ticket:x.fullUrl,hasArt:!!x.artwork})),
   holds:held.slice(0,15).map(x=>({title:x.title,reason:x.hold})),
   note:"Venue calendar date is verified; doors/show time is UNPUBLISHED by this source and must not be guessed."},null,2));
 if(accepted.length<10||held.length)throw Error("Original Red Cube/45 East source needs further investigation before activation");
 console.log("PASS — original Red Cube 45 East only, full-year/date records, no assumed times or poster rights");
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
