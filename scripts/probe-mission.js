"use strict";
async function request(url){
 const u=new URL(url);if(u.origin!=='https://www.mcmenamins.com'||u.username||u.password||u.search||u.hash)throw Error('Unapproved source');
 const r=await fetch(u,{redirect:'error',signal:AbortSignal.timeout(20000),headers:{Accept:'text/html','User-Agent':'SHOWS-event-review/0.1'}});if(!r.ok)throw Error('HTTP '+r.status);const html=await r.text();if(html.length>2400000)throw Error('Source too large');return html;
}
async function main(){
 for(const url of ['https://www.mcmenamins.com/mission-theater','https://www.mcmenamins.com/events/277583-gully-boys']){
 const html=await request(url);console.log('MISSION PAGE '+url);for(let i=0;i<html.length;i+=35000)console.log('MISSION HTML '+JSON.stringify(html.slice(i,i+35000)));
 }
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
