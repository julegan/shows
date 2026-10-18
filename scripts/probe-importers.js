"use strict";
(async()=>{
const sites=[
 ["twilight","https://www.twilightcafeandbar.com/calendar/"],
 ["star","https://www.startheaterportland.com/event/"],
 ["high-water","https://www.highwatermarklounge.com/"],
 ["soundcontrol","https://www.soundcontrolpdx.com/"]
];
for(const [id,url] of sites){
 try{
  const r=await fetch(url,{signal:AbortSignal.timeout(17000),headers:{"User-Agent":"SHOWS-source-review/0.1"}});
  const html=(await r.text()).slice(0,750000);
  const snippets=[];
  const patterns=[
   /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]{0,8000}?<\/script>/ig,
   /<[^>]*class=["'][^"']*(?:event|date|concert|show|month)[^"']*["'][^>]*>[\s\S]{0,300}/ig,
   /<a[^>]*href=["'][^"']*(?:\/event\/|tm-event|ticket|\/show\/|\/events\/)[^"']*["'][^>]*>[\s\S]{0,120}/ig,
   /<time[^>]*>[\s\S]{0,160}<\/time>/ig
  ];
  for(const p of patterns){let i=0;for(const m of html.matchAll(p)){if(i++>=5)break;snippets.push(m[0].replace(/\s+/g," ").slice(0,550))}}
  console.log("SITE "+JSON.stringify({id,status:r.status,final:r.url,size:html.length,title:html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],snippets}));
  for(const needle of id==="twilight"?["HIRS","Lioneer","event-item","event-container","calendar-event","event-date"]:id==="star"?["CHURCH OF HIVE","KIEFER","tw-event","tw-event-list","tw-cal","start-date"]:id==="high-water"?["The Well","Shows","Event","Calendar","October"]:["The Well","Shows","Events","October","High Water Mark"]){
   const i=html.toLowerCase().indexOf(needle.toLowerCase());
   if(i>=0)console.log("CONTEXT "+id+" "+needle+" "+html.slice(Math.max(0,i-350),i+780).replace(/\s+/g," ").slice(0,1130));
  }
 }catch(e){console.log("SOURCE_ERROR "+id+" "+String(e))}
}
})().catch(e=>{console.error(e);process.exitCode=1});
