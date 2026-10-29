"use strict";
const adapter=require('./aladdin-importer');
const {extract,reconcile,parseFile}=require('./discover-events');
async function main(){
 const src=require('../discovery/sources.json').sources.find(s=>s.id==='aladdin-theater');
 const raw=await adapter.fetchEvents(src),now=new Date();
 const result=reconcile(parseFile(require('fs').readFileSync(require('path').join(__dirname,'../events.js'),'utf8')).events,raw.map(x=>x.hold||x.skip?x:extract(x,src,now)));
 console.log('ALADDIN RESULT '+JSON.stringify({examined:raw.length,verified:raw.filter(x=>x.startDate).length,offsite:raw.filter(x=>x.skip).length,held:result.held,skipped:result.skipped,accepted:result.accepted.map(e=>({title:e.title,url:e.url,date:e.startsAt,category:e.category,art:!!e.artwork}))}));
 if(!raw.some(x=>x.startDate))throw Error('No valid Aladdin source records');
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
