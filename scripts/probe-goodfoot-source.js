#!/usr/bin/env node
"use strict";
(async()=>{
  const url="https://the1905.turntabletickets.com/";
  const r=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},redirect:"error",signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error("The 1905 public page status "+r.status);
  const html=await r.text(),m=html.match(/window\.__pinia\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  console.log("1905 SSR",JSON.stringify({length:html.length,matched:!!m,scriptPosition:html.indexOf("window.__pinia"),numShows:(html.match(/\/shows\/\d+\/20\d\d-\d\d-\d\d/g)||[]).length}));
  if(!m)return;
  const state=JSON.parse(m[1]);
  const pp=state.performancePaginate||{},ps=pp.performances||[];
  console.log("1905 STATE",JSON.stringify({stateKeys:Object.keys(state),pagination:Object.keys(pp),hasMore:pp.hasMore,records:ps.length,firstItems:ps.slice(0,3).map(e=>({keys:Object.keys(e),id:e.id,performance_id:e.performance_id,show_id:e.show_id,date:e.date,time:e.time,show:e.show?{keys:Object.keys(e.show),id:e.show.id,name:e.show.name,title:e.show.title,description:e.show.description?.slice(0,240),image:e.show.image,show_url:e.show.url}:null}))}).slice(0,12000));
  console.log("1905 COMPLETE FIRST",JSON.stringify(ps[0]).slice(0,6200));
})();
