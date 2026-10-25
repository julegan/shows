"use strict";
// Read-only inspection of the Opendate calendar embedded by the venue.
// No event data changes; only approved public domains and bounded text output.
const MAIN="https://app.opendate.io/v/turn-turn-turn-3116?layout=iframe";
const VENUE="https://turnturnturnpdx.com/entertainment/";
async function get(url){
 const r=await fetch(url,{headers:{Accept:"text/html","User-Agent":"SHOWS-venue-review/0.1"},signal:AbortSignal.timeout(15000),redirect:"error"});
 const body=await r.text();
 if(!r.ok||!r.headers.get("content-type")?.includes("text/html")||body.length>1400000)throw Error("Unexpected response "+r.status+" ("+r.headers.get("content-type")+")");
 return body;
}
async function run(){
 const page=await get(MAIN),host=await get(VENUE);
 console.log("MAIN_BYTES",page.length,"VENUE_BYTES",host.length);
 console.log("OPENDATE_EMBED_PRESENT",/app\.opendate\.io\/v\/turn-turn-turn-3116/.test(host));
 console.log("NEXT_DATA",/__NEXT_DATA__/.test(page),"JSON_LD",/application\/ld\+json/.test(page));
 const raw=[...page.matchAll(/(?:href|data-href)=["']([^"']{1,300})["']/g)].map(x=>x[1]);
 const href=[...new Set(raw.filter(x=>/\/e\/|turn.turn.turn/i.test(x)))];
 console.log("EVENT_HREFS",JSON.stringify(href.slice(0,15)));
 const matches=[...page.matchAll(/(?:the-nummies|cormae|ghoulfriends|november 0[24]|749681)/gi)].slice(0,7);
 for(const m of matches)console.log("EVENT_CONTEXT",page.slice(Math.max(0,m.index-460),Math.min(page.length,m.index+720)).replace(/\s+/g," ").slice(0,1120));
 const schema=[...page.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].filter(m=>/json|event|__next|application\//i.test(m[0].slice(0,180))).slice(0,6);
 console.log("SCRIPT_TYPES",JSON.stringify(schema.map(x=>({open:x[0].slice(0,240),len:x[1].length,preview:x[1].slice(0,200)}))));
 const e=href.find(x=>/\/e\//.test(x));
 if(e){
  const u=new URL(e,MAIN);
  if(u.hostname==="app.opendate.io"&&u.pathname.startsWith("/e/")){
   const detail=await get(u.href);console.log("DETAIL_BYTES",detail.length);
   console.log("DETAIL_JSONLD",/application\/ld\+json/.test(detail));
   console.log("DETAIL_CONTEXT",detail.slice(Math.max(0,detail.indexOf("Doors")-250),Math.max(0,detail.indexOf("Doors")-250)+1200).replace(/\s+/g," ").slice(0,1200));
   console.log("DETAIL_IMAGES",JSON.stringify([...detail.matchAll(/<img\b[^>]{0,900}>/gi)].slice(0,6).map(m=>m[0].slice(0,550))));
  }
 }
}
run().catch(e=>{console.error("OpenDate probe failure: "+e.message);process.exitCode=1});
