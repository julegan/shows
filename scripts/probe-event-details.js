'use strict';
(async()=>{
 const urls=[
 'https://www.twilightcafeandbar.com/event/466625/Lioneer-w-Gavin-Prophet-Drifter-Nervous-State',
 'https://www.twilightcafeandbar.com/event/467469/Ignite-w-Year-of-the-Cobra-Guest',
 'https://www.startheaterportland.com/tm-event/psycroptic-with-inferi-cognitive-summoning-the-lich/',
 'https://www.startheaterportland.com/tm-event/hell-with-death-parade-hope-failure-gethen-and-dj-dirty-wizard/'
 ];
 for(const url of urls){
 try {
 const response=await fetch(url,{signal:AbortSignal.timeout(12000)});
 const page=await response.text();
 const needles=['application/ld+json','<title','SHOW:','Doors:','Time:','2026','eventDate','event-datetime','event-name','startDate','eventStartDate','tw-name','tw-date'];
 const samples=[];
 for(const n of needles){const i=page.toLowerCase().indexOf(n.toLowerCase());if(i>=0)samples.push({needle:n,html:page.slice(Math.max(0,i-200),i+450).replace(/\s+/g,' ').slice(0,620)});}
 const meta=[...page.matchAll(/<meta[^>]+(?:property|name)="(?:og:title|event:start_time|article:published_time|description)"[^>]*>/gi)].slice(0,4).map(x=>x[0]);
 console.log(JSON.stringify({url,status:response.status,size:page.length,samples,meta}));
 }catch(e){console.log(JSON.stringify({url,error:String(e)}))}
 }
})().catch(e=>{console.error(e);process.exitCode=1});