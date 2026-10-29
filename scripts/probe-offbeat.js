"use strict";
// Read-only inspection of the calendar linked by the venue itself.
async function request(url,depth=0){
 if(depth>3)throw Error("Too many official redirects");
 const u=new URL(url);
 if(u.protocol!=="https:"||!["friendsofnoise.org","calendar.friendsofnoise.org","app.opendate.io"].includes(u.hostname)||u.username||u.password)throw Error("Unexpected source host");
 const r=await fetch(url,{signal:AbortSignal.timeout(18000),redirect:"manual",headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"}});
 if([301,302,303,307,308].includes(r.status)){const next=new URL(r.headers.get("location"),url).href;console.log("OFFICIAL REDIRECT "+url+" -> "+next);return request(next,depth+1);}
 if(!r.ok)throw Error("HTTP "+r.status);const t=await r.text();if(t.length>1800000)throw Error("Document too large");return t;
}
async function main(){
 const original=await request("https://friendsofnoise.org/event-calendar/");
 if(!original.includes('https://calendar.friendsofnoise.org/embed.js'))throw Error("Official embed link changed");
 const roster=await request("https://calendar.friendsofnoise.org/");
 const urls=[...new Set([...roster.matchAll(/https:\/\/calendar\.friendsofnoise\.org\/shows\/[a-z0-9-]+/gi)].map(m=>m[0]))];
 console.log("ROSTER URLS "+JSON.stringify(urls));
 for(const url of urls.slice(0,2))console.log("SHOW PAGE "+JSON.stringify({url,html:await request(url)}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
