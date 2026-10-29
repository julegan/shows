"use strict";
// End-to-end, read-only source probe. Never writes/publishes event records.
const adapter=require('./offbeat-importer');
const {extract,reconcile,parseFile}=require('./discover-events');
const fs=require('node:fs');
async function main(){
 const src=require('../discovery/sources.json').sources.find(s=>s.id==='the-off-beat');
 const raw=await adapter.fetchEvents(src);
 const result=reconcile(parseFile(fs.readFileSync(require('node:path').join(__dirname,'../events.js'),'utf8')).events,raw.map(x=>x.hold?x:extract(x,src,new Date())));
 console.log('OFFBEAT RESULT '+JSON.stringify({verified:raw.filter(x=>!x.hold).length,held:result.held,skipped:result.skipped,accepted:result.accepted}));
 if(raw.some(x=>x.hold))console.log('OFFBEAT DETAIL HOLDS '+JSON.stringify(raw.filter(x=>x.hold)));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
