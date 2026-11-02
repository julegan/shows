#!/usr/bin/env node
"use strict";
/*
 * TreeTix support-only Cloudflare diagnostic. Exactly one public GET to the
 * vendor-provided events endpoint with the SAME headers as our failed probe.
 * Report outbound runner IP, exact time, status, and Cloudflare request ID.
 * No authentication, retries, challenge bypass, event imports or body logs.
 */
const fs=require("node:fs");
const ENDPOINT="https://www.treetix.com/api/events.json";
const UA="SHOWS-public-event-feed-probe/1.0"; // matches scripts/probe-treetix-api.js
const ACCEPT="application/json";
const MAX_MS=14000;

async function publicIp(url, type){
 try{
  const res=await fetch(url,{method:"GET",redirect:"error",headers:{Accept:type==="json"?"application/json":"text/plain"},
   signal:AbortSignal.timeout(7000)});
  if(!res.ok)return "unavailable (HTTP "+res.status+")";
  const body=(await res.text()).trim().slice(0,200);
  const ip=type==="json"?JSON.parse(body).ip:body;
  return /^(?:\d{1,3}\.){3}\d{1,3}$|^[0-9a-f:]{3,}$/i.test(ip)?ip:"unavailable (unexpected address)";
 }catch(e){return "unavailable ("+(e?.name||"network failure")+")";}
}
async function run(){
 const first=await publicIp("https://api.ipify.org?format=json","json");
 const second=await publicIp("https://checkip.amazonaws.com/","text");
 // The public address is what these public services observe from the runner.
 // If their results disagree, do not claim a single observed source IP.
 const observedIp=first===second?first:"DIFFERENT OR UNAVAILABLE — inspect the two observations";
 const start=new Date().toISOString(), t=Date.now();
 const out={
  endpoint:ENDPOINT,
  attemptedAtUtc:start,
  runnerPublicIpObserved:observedIp,
  observedByIpify:first,
  observedByAwsCheckip:second,
  httpClient:"Node.js "+process.version+" global fetch (Undici "+(process.versions.undici||"bundled")+")",
  userAgent:UA,
  requestMethod:"GET",requestAccept:ACCEPT,
  jobRunUrl:"https://github.com/"+process.env.GITHUB_REPOSITORY+"/actions/runs/"+process.env.GITHUB_RUN_ID,
  httpStatus:null,cfRay:null,cfMitigated:null,responseServer:null,responseContentType:null,
  completedAtUtc:null,elapsedMs:null,networkError:null,
  note:"One original unauthenticated public GET. HTTP 403 means source blocked, NOT zero events; no retries or bypass."
 };
 try{
  const res=await fetch(ENDPOINT,{method:"GET",redirect:"error",headers:{Accept:ACCEPT,"User-Agent":UA},
    signal:AbortSignal.timeout(MAX_MS)});
  out.httpStatus=res.status;out.cfRay=res.headers.get("cf-ray");
  out.cfMitigated=res.headers.get("cf-mitigated");
  out.responseServer=res.headers.get("server");
  out.responseContentType=res.headers.get("content-type");
  await res.body?.cancel();
 }catch(e){out.networkError=(e?.name||"Error")+": "+String(e?.message||"request failed").slice(0,170);}
 out.completedAtUtc=new Date().toISOString();out.elapsedMs=Date.now()-t;
 console.log("TREETIX_CLOUDFLARE_DIAGNOSTIC "+JSON.stringify(out));
 if(process.env.GITHUB_STEP_SUMMARY){
  const lines=["## TreeTix Cloudflare support diagnostic","",
   "No account/token, no retries, no bypass, no event publications.",
   "",
   "| Field | Value |","| --- | --- |",
   ...Object.entries(out).filter(([k])=>k!=="note").map(([k,v])=>"| "+k+" | "+String(v??"Not supplied").replaceAll("|","\\|")+" |"),
   "",
   "**Important:** egress IP is observed through public IP echo services and is not a provider-side access log. Ask TreeTix to search by timestamp, exact User-Agent and cf-ray where present.",
   ""
  ];
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join("\n"));
 }
}
if(require.main===module)run().catch(e=>{console.error("Diagnostic unavailable: "+e.message);process.exitCode=1});
module.exports={ENDPOINT,UA,run};
