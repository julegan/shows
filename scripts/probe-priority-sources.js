'use strict';
(async()=>{
 const sites=[
  ['twilight','https://www.twilightcafeandbar.com/calendar/'],
  ['star','https://www.startheaterportland.com/event/'],
  ['blackwater','https://bar.blackwaterpdx.com/']
 ];
 for(const [name,url] of sites){
  try{
   const res=await fetch(url,{signal:AbortSignal.timeout(17000),headers:{'User-Agent':'SHOWS-source-research/0.1','Accept':'text/html'}});
   const html=(await res.text()).slice(0,800000);
   const samples=[];
   const patterns=name==='twilight'?[ /.{0,180}MORE DETAILS.{0,180}/ig,/.{0,200}(?:<h3|<article|event\/[0-9]).{0,300}/ig ]:
   name==='star'? [/.{0,220}tm-event.{0,290}/ig,/.{0,150}(?:<article|event-card|event-title).{0,290}/ig]:
   [/.{0,100}(?:event|concert|instagram|facebook|show|music).{0,180}/ig];
   for(const pattern of patterns)for(const m of [...html.matchAll(pattern)].slice(0,5))samples.push(m[0].replace(/\s+/g,' ').slice(0,540));
   console.log(JSON.stringify({site:name,status:res.status,size:html.length,contentType:res.headers.get('content-type'),lead:html.slice(0,330).replace(/\s+/g,' '),samples}));
  }catch(e){console.log(JSON.stringify({site:name,error:String(e).slice(0,260)}))}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
