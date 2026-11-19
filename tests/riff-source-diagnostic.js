"use strict";
const assert=require("node:assert/strict");
const riff=require("../scripts/riff-source-diagnostic");
const bills=riff.BILLS.map(b=>"<section><h3>"+b.date+"</h3><h4>"+b.name+"</h4><p>"+b.time+"</p></section>").join("");
const html="<html><h1>Events at The Riff</h1><p>B-Side Records & Vintage</p>"+bills+"<p>"+("Live Music & Community ".repeat(25))+"</p></html>";
const result=riff.inspect(html);
assert.equal(result.checks.length,3);
assert(result.checks.every(x=>x.status==="first-party-calendar-text-observed"));
assert.deepEqual(result.proposedEvents,[]);
assert.deepEqual(result.artwork,[]);
assert.equal(riff.inspect(html.replace("INTERCHANGE","Cancelled")).checks[2].status,"hold-source-changed-or-missing");
assert.throws(()=>riff.inspect(html.replace("B-Side Records & Vintage","Unrelated venue")),/identity/);
assert.throws(()=>riff.inspect("x".repeat(1000001)),/oversized/);
(async()=>{
 const x=await riff.run({write:false,request:async url=>{
  assert.equal(url,riff.SOURCE);
  return {ok:true,headers:{get:()=> "text/html; charset=utf-8"},text:async()=>html};
 }});
 assert.equal(x.checks.filter(c=>c.status==="first-party-calendar-text-observed").length,3);
 await assert.rejects(riff.run({write:false,request:async()=>({ok:false,status:403})}),/HTTP 403/);
 await assert.rejects(riff.run({write:false,request:async()=>({ok:true,headers:{get:()=> "application/json"}})}),/not HTML/);
 console.log("PASS — original Riff calendar diagnostic holds uncertain records and never proposes events or artwork");
})().catch(e=>{console.error(e);process.exitCode=1;});
