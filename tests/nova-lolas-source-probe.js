"use strict";
const assert=require("node:assert/strict");
const {PAGES,MAX_BYTES,normalizedUrl,summarizeHtml,retrieve}=require("../scripts/probe-nova-lolas");
assert.equal(PAGES.length,3);
assert.equal(normalizedUrl("https://www.tixr.com/events/great-night?token=private",PAGES[0].url),
 "https://www.tixr.com/events/great-night");
assert.equal(normalizedUrl("http://unsafe.test/path",PAGES[0].url),null);
assert.equal(normalizedUrl("https://name:password@unsafe.test/",PAGES[0].url),null);
const html=`<!doctype html><html><head><script type="application/ld+json">
{"@graph":[{"@type":"MusicEvent","name":"Fictional fixture","startDate":"2026-11-21T21:00:00-08:00"}]}
</script></head><body><h2>Fictional fixture</h2>
<time datetime="2026-11-21T21:00:00-08:00">November 21, 2026</time>
<a href="https://www.tixr.com/groups/novapdx/events/fictional?token=secret">Tickets</a>
<p>Lola's Room has a July 7 listing with NO YEAR</p></body></html>`;
const s=summarizeHtml(html,PAGES[0]);
assert.equal(s.eventSchemaCount,1);
assert(s.fullDateSamples.includes("November 21, 2026"));
assert(s.isoDateSamples.includes("2026-11-21T21:00:00-08:00"));
assert.equal(s.ticketDomains[0],"www.tixr.com");
assert(!JSON.stringify(s).includes("token=secret"));
assert(!s.fullDateSamples.some(x=>x.includes("July 7")),"No guessed year on yearless listing");
assert.throws(()=>summarizeHtml("X".repeat(MAX_BYTES+1),PAGES[0]),/Unbounded/);
(async()=>{
 const request=async()=>({ok:true,headers:{get:()=> "text/html;charset=utf-8"},
  body:new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(html));controller.close();}})});
 const result=await retrieve(PAGES[0],request);
 assert.equal(result.eventSchemaCount,1);
 await assert.rejects(retrieve(PAGES[1],async()=>({ok:false,status:403})),/source unavailable, not zero shows/);
 console.log("PASS — Nova/Lola first-party limited source inspection, JSON-LD and no-year guardrails, ticket URL redaction");
})().catch(e=>{console.error(e);process.exitCode=1});
