#!/usr/bin/env node
"use strict";
/*
 * Read-only schema inspection for the event-listing endpoint supplied by TreeTix
 * to SHOWS. No credentials, event writes, artwork downloads, or publication.
 * Do not infer a cancellation when an event is absent from this snapshot.
 */
const ENDPOINT = "https://www.treetix.com/api/events.json";
const MAX_BYTES = 25 * 1024 * 1024;
const MATCH = /high\s*water\s*mark|highwatermark|sound\s*control|soundcontrol/i;
const RELEVANT = /^(?:id|event_?id|title|name|start|starts|end|date|time|calendar|cal|producer|organizer|venue|location|address|city|url|link|image|photo|poster|flyer|thumbnail|doors|show|timezone|tz)(?:_|$)/i;

function shape(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array(" + value.length + ")";
  return typeof value;
}
function preview(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value !== "string") return shape(value);
  return value.replace(/[\r\n\t]+/g, " ").slice(0, 140);
}
function detail(record) {
  if (!record || typeof record !== "object") return {shape:shape(record)};
  const fields = Object.entries(record);
  return {
    keys:fields.slice(0, 90).map(([k,v])=>({name:k,type:shape(v)})),
    relevantValues:Object.fromEntries(fields.filter(([k,v])=>RELEVANT.test(k) && (v === null || ["string","number","boolean"].includes(typeof v))).slice(0,24).map(([k,v])=>[k,preview(v)]))
  };
}
function analyze(payload) {
  if (!payload || typeof payload !== "object" || !("events" in payload)) throw Error("TreeTix JSON has no events member");
  const container=payload.events;
  if (!container || typeof container !== "object") throw Error("TreeTix events member is not an array or object");
  const records = Array.isArray(container) ? container : Object.values(container);
  const objects=records.filter(x=>x && typeof x==="object");
  const target=objects.filter(x=>MATCH.test(JSON.stringify(x)));
  return {
    checkedAt:new Date().toISOString(),
    endpoint:ENDPOINT,
    mode:"Read-only schema discovery; NOT an enabled importer or proof of complete coverage",
    topLevelKeys:Object.keys(payload).slice(0,35),
    eventsContainer:shape(container),
    directEntries:records.length,
    objectEntries:objects.length,
    firstEntry:records.length?detail(records[0]):null,
    targetMatches:target.length,
    targetSamples:target.slice(0,3).map(detail),
    caveats:[
      "TreeTix says its public listing omits cancellations and treats reschedules as new events.",
      "A missing feed record must not remove or cancel a previously approved SHOWS event.",
      "Source artwork should be downloaded for display, not hotlinked; review reuse rights before publication.",
      "Do not enable ingestion until real keys, venue identity, date/time semantics, and deduplication are verified."
    ]
  };
}
async function fetchSnapshot(fetcher=fetch) {
  const response=await fetcher(ENDPOINT,{
    method:"GET",redirect:"error",
    headers:{Accept:"application/json","User-Agent":"SHOWS-public-event-feed-probe/1.0"},
    signal:AbortSignal.timeout(25000)
  });
  if(!response.ok)throw Error("TreeTix feed HTTP " + response.status + "; source is unavailable, not empty");
  const reader=response.body?.getReader();
  if(!reader)throw Error("TreeTix response has no readable body");
  const pieces=[];let total=0;
  while(true) {
    const {done,value}=await reader.read();
    if(done)break;
    total+=value.byteLength;
    if(total>MAX_BYTES){await reader.cancel();throw Error("TreeTix response exceeds 25 MiB probe limit");}
    pieces.push(Buffer.from(value));
  }
  let parsed;
  try{parsed=JSON.parse(Buffer.concat(pieces).toString("utf8"));}
  catch(_){throw Error("TreeTix returned non-JSON content");}
  return analyze(parsed);
}
async function main(){
  try{
    const outcome=await fetchSnapshot();
    console.log(JSON.stringify(outcome,null,2));
    if(process.env.GITHUB_STEP_SUMMARY){
      const fs=require("node:fs");
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        "## TreeTix public API schema (read-only)\n\n" +
        "Events container: **"+outcome.eventsContainer+"**; direct entries: **"+outcome.directEntries+"**; High Water Mark/Soundcontrol string matches: **"+outcome.targetMatches+"**.\n\n" +
        "The job log contains bounded field names and sample metadata for adapter design. **No events were imported or published.**\n");
    }
  }catch(error){
    console.error("TreeTix API probe unavailable: "+String(error.message||error));
    process.exitCode=1;
  }
}
if(require.main===module)main();
module.exports={ENDPOINT,shape,preview,detail,analyze,fetchSnapshot};
