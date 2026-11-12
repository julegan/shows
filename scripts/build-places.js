"use strict";
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const records=JSON.parse(fs.readFileSync(path.join(root,"discovery/venues.json"),"utf8")).venues
  .map(v=>({id:v.id,name:v.name,aliases:v.aliases||[],
    calendarUrl:v.calendarUrl && /^https:\/\//.test(v.calendarUrl) && !/\.json(?:$|[?#])/.test(v.calendarUrl)
      ? v.calendarUrl : null}));
const output="// Generated from discovery/venues.json by scripts/build-places.js; do not edit by hand.\n"+
  "window.SHOWS_PLACES = "+JSON.stringify(records,null,2)+";\n";
if(process.argv.includes("--check")){
  if(fs.readFileSync(path.join(root,"places.js"),"utf8")!==output){
    console.error("places.js is stale; run node scripts/build-places.js");process.exitCode=1;
  }else console.log("PASS — Places registry matches the canonical venue directory.");
}else{
  fs.writeFileSync(path.join(root,"places.js"),output);
  console.log("Updated places.js from canonical venue directory.");
}
