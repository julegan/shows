#!/usr/bin/env node
"use strict";
const {URL}=require("node:url");
const INDEX="https://www.mcmenamins.com/crystal-ballroom/lolas-room/music-events/";
const DETAILS=["https://www.mcmenamins.com/events/278429-2000s-dance-flashback","https://www.mcmenamins.com/events/278428-2010s-dance-flashback","https://www.mcmenamins.com/events/278696-inaugural-holiday-bazaar-brewfest"];
const tidy=s=>String(s||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," ").replace(/&(?:nbsp|amp|quot|#39);/g," ").replace(/\s+/g," ").trim();
async function read(u){
 const url=new URL(u);if(url.origin!=="https://www.mcmenamins.com"||url.search||url.hash)throw Error("Not approved");
 const r=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(17000),headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"}});
 if(!r.ok||!r.headers.get("content-type")?.includes("text/html"))throw Error("Official HTML HTTP "+r.status);
 const t=await r.text();if(t.length>500000)throw Error("Unexpected page size");return t;
}
async function main(){
 const index=await read(INDEX);
 const cards=[...index.matchAll(/<div\b[^>]*class="[^"]*\bevent detailed\b[^"]*"[^>]*>/gi)];
 const searches=[...index.matchAll(/<div\b[^>]*id="(?:mobileEventAutoComplete|eventAutoComplete)"[^>]*>/gi)];
 const links=[...new Set([...index.matchAll(/<a\b[^>]*href=["'](https?:\/\/www\.mcmenamins\.com\/events\/\d+[a-z0-9-]*)["']/gi)].map(m=>m[1]))];
 const {sourceIndex}=require("./mission-importer");
 let indexed;
 try{const m=sourceIndex(index); indexed={count:m.size,invalid:m.invalidRecords?.length,first:[...m.entries()].slice(0,5).map(([url,row])=>({url,title:row.title,date:row.date,keys:Object.keys(row)}))};}
 catch(e){indexed={error:String(e.message||e)}}
 console.log("SOURCE_INDEX "+JSON.stringify(indexed));
 console.log(JSON.stringify({kind:"index",bytes:index.length,cardCount:cards.length,searchCount:searches.length,
   searchSample:searches.slice(0,1).map(m=>m[0].slice(0,240)),eventLinks:links.slice(0,20),
   cardSample:cards.slice(0,2).map((m,i)=>({html:index.slice(m.index,m.index+700).slice(0,700),visible:tidy(index.slice(m.index,m.index+2200)).slice(0,400)}))},null,2));
 for(const url of DETAILS){
  const html=await read(url);
  const stripped=tidy(html);
  const dt=stripped.match(/\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}\b/);
  console.log(JSON.stringify({kind:"detail",url,bytes:html.length,
    date:dt?.[0],dateContext:dt?stripped.slice(dt.index,dt.index+310):null,
    headings:[...html.matchAll(/<h[123]\b[^>]*>([\s\S]*?)<\/h[123]>/gi)].slice(0,7).map(m=>tidy(m[1])),
    og:[...html.matchAll(/<meta\b[^>]*\b(?:property|name)=["'](?:og:title|og:description|og:url)["'][^>]*>/gi)].slice(0,8).map(m=>m[0].slice(0,350)),
    sourceRoomMarkers: [...new Set((stripped.slice(0,1900).match(/Lola(?:'|’)?s Room|Crystal Ballroom|Crystal Blocks|West End Entertainment District/gi)||[]))]},null,2));
 }
}
main().catch(e=>{console.error(String(e));process.exitCode=1});
