"use strict";
/* Public first-party endpoint readiness probe. No proxy, evasion, session,
 * authentication, retries, unapproved redirects or data ingestion.
 * Reports only connection metadata; a 403 means manual source resolution.
 */
const targets=[
 "https://thegoodfoot.com/music/",
 "https://thegoodfoot.com/wp-json/tribe/events/v1/events?per_page=5",
 "https://thegoodfoot.com/wp-json/wp/v2/",
 "https://thegoodfoot.com/events/?ical=1"
];
(async()=>{
 for(const url of targets){
  try{
   const r=await fetch(url,{redirect:"error",headers:{Accept:"text/html, application/json, text/calendar","User-Agent":"SHOWS-original-source-readiness/0.1"},signal:AbortSignal.timeout(10000)});
   console.log(JSON.stringify({url,status:r.status,contentType:r.headers.get("content-type"),redirected:r.redirected}));
  }catch(e){console.log(JSON.stringify({url,error:String(e.message||e).slice(0,140)}));}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
