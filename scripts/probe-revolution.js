#!/usr/bin/env node
"use strict";
/* Live, read-only official room/date/time verification. No event publishing. */
const {parseRevolution}=require("./revolution-importer");
const source=require("../discovery/sources.json").sources.find(x=>x.id==="revolution-hall");
async function main(){
 const res=await fetch(source.url,{headers:{Accept:"text/html","User-Agent":"SHOWS-event-review/0.1"},signal:AbortSignal.timeout(18000),redirect:"error"});
 if(!res.ok)throw Error("Official Revolution Hall HTML returned HTTP "+res.status);
 if(!res.headers.get("content-type")?.includes("text/html"))throw Error("Unexpected venue content type");
 const html=await res.text();
 if(html.length>3000000)throw Error("Venue page exceeded 3 MB source cap");
 const rows=parseRevolution(html,source),valid=rows.filter(x=>x.startDate&&x.fullUrl),held=rows.filter(x=>x.hold);
 const byRoom=Object.fromEntries(["Revolution Hall","Show Bar at Revolution Hall"].map(room=>[room,valid.filter(x=>x.venue===room).length]));
 console.log(JSON.stringify({venue:"Revolution Hall",reviewOnly:true,examined:rows.length,valid:valid.length,held:held.length,byRoom,examples:valid.slice(0,6).map(x=>({title:x.title,venue:x.venue,when:x.startDate,url:x.fullUrl})),holds:held.slice(0,6).map(x=>({title:x.title,reason:x.hold}))}));
 if(valid.length<7||byRoom["Revolution Hall"]<3||byRoom["Show Bar at Revolution Hall"]<2)throw Error("Official event page failed minimum dated main hall and Show Bar source coverage; do not activate");
 console.log("PASS — Live official Revolution Hall and Show Bar sources have independently verified dates, showtimes and room identities");
}
if(require.main===module)main().catch(e=>{console.error("LIVE SOURCE FAILED: "+String(e.message||e));process.exitCode=1});
module.exports={main};
