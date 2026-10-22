#!/usr/bin/env node
"use strict";
/* Temporary diagnostic of the primary public official show-card markup. */
(async()=>{
 const response=await fetch("https://www.revolutionhall.com/",{headers:{Accept:"text/html","User-Agent":"SHOWS-public-venue-source-audit/0.1"},redirect:"error",signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error("Official calendar HTTP "+response.status);
 const html=await response.text();
 const etix=[...html.matchAll(/href=["'](https?:\/\/www\.etix\.com\/ticket\/p\/[^"']+)["']/gi)];
 const seen=new Set(),samples=[];
 for(const m of etix){
  const link=m[1].replace(/&amp;/g,"&");
  if(seen.has(link))continue;seen.add(link);
  samples.push({url:link,markup:html.slice(Math.max(0,m.index-1100),Math.min(html.length,m.index+800)).replace(/\s+/g," ").slice(0,1900)});
  if(samples.length===5)break;
 }
 console.log(JSON.stringify({bytes:html.length,links:etix.length,samples}));
})().catch(e=>{console.error("SOURCE PROBE FAILED "+e.message);process.exitCode=1});
