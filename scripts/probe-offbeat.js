"use strict";
// Read-only inspection of the calendar linked by the venue itself.
async function request(url){
 const u=new URL(url);
 if(u.protocol!=="https:"||!["friendsofnoise.org","calendar.friendsofnoise.org","app.opendate.io"].includes(u.hostname)||u.username||u.password)throw Error("Unexpected source host");
 const r=await fetch(url,{signal:AbortSignal.timeout(18000),redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"}});
 if(!r.ok)throw Error("HTTP "+r.status);const t=await r.text();if(t.length>1800000)throw Error("Document too large");return t;
}
async function main(){
 const original=await request("https://friendsofnoise.org/event-calendar/");
 const embeds=[...original.matchAll(/https:\/\/app\.opendate\.io\/v\/[^\s"'<>]+/g)].map(m=>m[0].replace(/&amp;/g,"&"));
 console.log("OFFBEAT EMBEDS "+JSON.stringify([...new Set(embeds)]));
 if(!embeds.length){for(const u of ["https://calendar.friendsofnoise.org/embed.js","https://calendar.friendsofnoise.org/"])console.log("OFFICIAL CALENDAR "+u+" "+await request(u));return;}
 const roster=await request(embeds[0]);console.log("ROSTER SAMPLE "+roster.slice(-28000));
 const urls=[...new Set([...roster.matchAll(/https:\/\/app\.opendate\.io\/e\/[a-z0-9-]+/gi)].map(m=>m[0]))];
 console.log("EVENT URLS "+JSON.stringify(urls));
 for(const url of urls.slice(0,3)){
 const detail=await request(url);
 console.log("DETAIL "+JSON.stringify({url,schemas:[...detail.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]),text:detail.replace(/<[^>]*>/g," ").replace(/\s+/g," ").slice(-14000)}));
 }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
