#!/usr/bin/env node
"use strict";
const {wallToPacific}=require("./priority-importers");
(async()=>{
 const r=await fetch("https://the1905.turntabletickets.com/",{redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-source-health-debug/0.1"},signal:AbortSignal.timeout(17000)});
 if(!r.ok)throw Error("Original source HTTP "+r.status);
 const html=await r.text();
 if(html.length>1600000)throw Error("Source exceeds 1.6 MB");
 const pinia=html.match(/<script\b[^>]*>\s*window\.__pinia\s*=\s*(\{[\s\S]*?\});\s*<\/script>/i);
 if(!pinia)throw Error("Original SSR state absent");
 const state=JSON.parse(pinia[1]),pg=state.performancePaginate||{},perf=pg.performances||[];
 const links=[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(x=>x[1]).filter(x=>x.includes("/shows/"));
 console.log("1905-CHECK",JSON.stringify({status:r.status,bytes:html.length,ssrCount:perf.length,hasMore:pg.hasMore,links:links.slice(0,15)}));
 for(const p of perf.slice(0,12)){
  const ymd=p.date||"";
  const wall=ymd&&p.time?wallToPacific(...ymd.split("-").map(Number),p.time):null;
  const dateLink="/shows/"+p.show_id+"/"+p.date;
  const dt=p.datetime;
  const diff=Number.isFinite(Date.parse(dt))&&wall?Math.round((Date.parse(dt)-Date.parse(wall))/60000):null;
  console.log("1905-ROW",JSON.stringify({id:p.id,showId:p.show_id,title:p.show?.name?.slice(0,70),date:p.date,time:p.time,datetime:dt,
    wallPacific:wall,diffMinutes:diff,dateLink,linked:links.some(x=>x.startsWith(dateLink)),
    otherKeys:Object.keys(p).filter(x=>/date|time|zone|offset|start|end|show/i.test(x)).slice(0,25),
    showKeys:Object.keys(p.show||{}).filter(x=>/date|time|zone|offset|url|permalink|start|end/i.test(x)).slice(0,20)}));
 }
})().catch(e=>{console.error(e);process.exitCode=1});