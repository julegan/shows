#!/usr/bin/env node
"use strict";
const checks=[
 {id:"revived-subvert",url:"https://subvert.blackwaterpdx.com/"},
 {id:"label-announcement",url:"https://blackwaterpdx.com/store/"},
 {id:"alternative-punk-guide",url:"https://pc-pdx.com/show-guide/"}
];
const tokens=["November","Nov ","2026","2027","show","gig","event","rss","feed","calendar","wp-json","submit","<article","<time"];
async function check(x){
 const out={id:x.id,url:x.url,attemptedAtUtc:new Date().toISOString(),status:null,finalUrl:null,bytes:null,contentType:null,title:null,items:[],links:[],error:null};
 try{
  const response=await fetch(x.url,{method:"GET",redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-source-review/0.1"},signal:AbortSignal.timeout(13000)});
  out.status=response.status;out.finalUrl=response.url;out.contentType=response.headers.get("content-type");
  if(!response.ok||!out.contentType?.includes("text/html"))return out;
  const raw=await response.text();out.bytes=raw.length;
  if(raw.length>850000)throw Error("Page larger than bounded probe");
  out.title=raw.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1]||null;
  if(x.id==="revived-subvert"){
    const nextPushes=[...raw.matchAll(/self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)/g)];
    out.nextFlightPushes=nextPushes.length;
    let blocks=[];
    for(const m of nextPushes){
      try{
        const parsed=JSON.parse(m[1]);
        if(parsed.includes('"show":{'))blocks.push(parsed);
      }catch(e){out.nextParseError=String(e.message)}
    }
    out.showBlocks=blocks.length;
    out.showRecordTokens=blocks.reduce((n,s)=>n+(s.match(/"show":\{/g)||[]).length,0);
    out.showFirstDecoded=blocks[0]?blocks[0].slice(Math.max(0,blocks[0].indexOf('"show":{')-100),blocks[0].indexOf('"show":{')+1850):null;
    out.allPageScriptCount=(raw.match(/<script\b/gi)||[]).length;
    out.nextRawSnippet=raw.slice(Math.max(0,raw.indexOf('__next_f.push')-40),raw.indexOf('__next_f.push')+550);
  }
  out.items=tokens.map(t=>({token:t,count:raw.toLowerCase().split(t.toLowerCase()).length-1})).filter(x=>x.count);
  out.links=[...new Set([...raw.matchAll(/<a\b[^>]*href=["']([^"']{1,250})["']/gi)].map(m=>m[1]))]
    .filter(url=>/show|gig|event|calendar|archive|rss|feed|subvert|contact|wordpress/i.test(url)).slice(0,32);
  const idx=raw.search(/(?:October|November|December)\s+\d{1,2}|2026[-/](?:11|12)[-/]\d\d/i);
  out.markupSample=idx>=0?raw.slice(Math.max(0,idx-250),idx+1000).replace(/\s+/g," ").slice(0,1200):null;
 }catch(e){out.error=String(e?.message||e).slice(0,160)}
 return out;
}
async function main(){for(const c of checks)console.log("SCENE_SOURCE_PROBE "+JSON.stringify(await check(c)));}
if(require.main===module)main();
