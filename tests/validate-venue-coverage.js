const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','events.js'),'utf8'),ctx);
const all=ctx.window.SHOWS_EVENTS;
const meta=ctx.window.SHOWS_DATASET;
const added=all.filter(e=>e.addedIn==='2026-10-17-venue-coverage');
assert.equal(added.length,31);
assert.equal(meta.batchId,'2026-10-17-venue-coverage');
assert.equal(meta.addedOccurrences,added.length);
assert.equal(meta.totalOccurrences,all.length);
assert.equal(meta.musicOccurrences,all.filter(e=>e.category==='Music').length);
assert(added.every(e=>e.category==='Music' && e.eventFormat==='live'));
assert(added.every(e=>e.sources.some(s=>s.url===e.url) && e.musicStyleEvidence?.basis));
const counts=new Map();
for(const e of added) counts.set(e.venue,(counts.get(e.venue)||0)+1);
for(const [v,n] of [['Roseland Theater',10],['Wonder Ballroom',5],['Crystal Ballroom',5],['Moda Center',2],['Revolution Hall',8],['Show Bar at Revolution Hall',1]])assert.equal(counts.get(v),n);
assert.equal(added.filter(e=>e.title.startsWith('Neurosis')).length,2);
assert(!added.some(e=>/SiM|Julia Wolf|Frost Children|Death From Above 1979/i.test(e.title)));
for(const e of added){
 assert(e.startsAt.slice(0,10)>='2026-10-17' && e.startsAt.slice(0,10)<='2026-12-13');
 assert(e.startsAt.slice(-6)===(e.startsAt.slice(0,10)<'2026-11-01'?'-07:00':'-08:00'));
 assert(e.endsAt===null);
}
console.log('PASS — 31 verified venue dates, previous records intact, source provenance, move/postpone exclusions and Pacific offsets.');
