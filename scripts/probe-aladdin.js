"use strict";
async function main(){
 const url='https://www.aladdin-theater.com/';
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000),headers:{Accept:'text/html','User-Agent':'SHOWS-event-review/0.1'}});
 if(!r.ok)throw Error('Aladdin HTTP '+r.status);const text=await r.text();if(text.length>2200000)throw Error('Page too large');
 console.log('ALADDIN ROOMS '+JSON.stringify([...text.matchAll(/data-venue-id=["'](\d+)["']/g)].map(m=>m[1])));
 const cards=[...text.matchAll(/<div\s+class=["']event-wrapper\s+([a-z0-9-]+)["']\s*>/gi)];
 console.log('ALADDIN WRAPPERS '+JSON.stringify(cards.map(m=>m[1])));
 for(let i=0;i<Math.min(cards.length,2);i++)console.log('ALADDIN CARD '+JSON.stringify(text.slice(cards[i].index,cards[i+1]?.index||text.length).slice(0,18000)));
 if(!cards.length){for(let i=0;i<text.length;i+=40000)console.log('ALADDIN HTML '+JSON.stringify(text.slice(i,i+40000)));}
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
