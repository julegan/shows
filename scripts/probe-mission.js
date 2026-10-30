"use strict";
const adapter=require('./mission-importer'),{extract,reconcile,parseFile}=require('./discover-events');
async function main(){const src=require('../discovery/sources.json').sources.find(x=>x.id==='mission-theater'),raw=await adapter.fetchEvents(src),now=new Date();const result=reconcile(parseFile(require('fs').readFileSync(require('path').join(__dirname,'../events.js'),'utf8')).events,raw.map(x=>x.hold||x.skip?x:extract(x,src,now)));console.log('MISSION RESULT '+JSON.stringify({examined:raw.length,verified:raw.filter(x=>x.startDate).length,held:result.held,skipped:result.skipped,accepted:result.accepted.map(e=>({title:e.title,date:e.startsAt,category:e.category,url:e.url,art:!!e.artwork}))}));}
main().catch(e=>{console.error(e.message);process.exitCode=1});
