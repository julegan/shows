#!/usr/bin/env node
"use strict";
// Counts are listings actually in SHOWS, not evidence that all venue calendars are covered.
const fs=require("node:fs");
const path=require("node:path");
const {parseFile,discoveryEndDay}=require("./discover-events");
function pacificDay(now=new Date()){
 const p=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now).map(x=>[x.type,x.value]));
 return p.year+"-"+p.month+"-"+p.day;
}
function monthlyCoverage(events,today=pacificDay()){
 const end=discoveryEndDay(new Date(today+"T12:00:00Z"));
 const months=new Map();
 let [year,month]=today.slice(0,7).split("-").map(Number);
 const lastYear=Number(end.slice(0,4)),lastMonth=Number(end.slice(5,7));
 while(year<lastYear||(year===lastYear&&month<=lastMonth)){
  months.set(year+"-"+String(month).padStart(2,"0"),{total:0,music:0,artwork:0});
  month++;if(month>12){month=1;year++;}
 }
 for(const e of events){
  const day=e.startsAt?.slice(0,10);
  if(!day||day<today||day>end)continue;
  const row=months.get(day.slice(0,7));
  if(!row)continue;
  row.total++;
  if(e.category==="Music"){
   row.music++;
   if(e.artwork?.url)row.artwork++;
  }
 }
 return {today,end,months};
}
function report(r){
 const lines=["# SHOWS forward coverage — "+r.today,"",
  "Rolling discovery look-ahead ends **"+r.end+"**. Counts describe dated SHOWS event records, **not** complete venue schedules. Future events are added only after organizers publish verifiable details.","",
  "| Month | All upcoming listings | Music listings | Music with artwork |",
  "| --- | ---: | ---: | ---: |"];
 for(const [month,n] of r.months)lines.push("| "+month+" | "+n.total+" | "+n.music+" | "+n.artwork+" |");
 return lines.join("\n")+"\n";
}
if(require.main===module){
 const data=parseFile(fs.readFileSync(path.resolve(__dirname,"../events.js"),"utf8"));
 process.stdout.write(report(monthlyCoverage(data.events)));
}
module.exports={pacificDay,monthlyCoverage,report};
