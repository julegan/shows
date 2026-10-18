const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','events.js'),'utf8'),context);
const events=context.window.SHOWS_EVENTS;
const metadata=context.window.SHOWS_DATASET;
const added=events.filter(e=>e.addedIn==='2026-10-17-expansion');
assert(events.length>=80);
assert.equal(added.length,69);
assert.equal(metadata.totalOccurrences,events.length);
const keys=new Set();
const wallTime=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
function verifyPacific(value){
  const fields=Object.fromEntries(wallTime.formatToParts(new Date(value)).map(p=>[p.type,p.value]));
  const local=`${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}:${fields.second}`;
  assert.equal(local,value.slice(0,19),'Pacific wall time and UTC offset agree: '+value);
}
for(const e of events){
  const key=[e.title.toLowerCase(),e.venue.toLowerCase(),e.startsAt].join('|');
  assert(!keys.has(key),'No duplicate title/place/time: '+e.id);keys.add(key);
  verifyPacific(e.startsAt);if(e.endsAt)verifyPacific(e.endsAt);
  assert(e.free===true||e.free===false||e.free===null,'Admission can be known free, ticketed, or unknown');
  assert(e.sourceCheckedAt && e.verificationMethod);
  assert(Array.isArray(e.sourceCategories),'Original category field is separate');
  assert(e.sources.length>0);
  assert(e.sources.some(s=>s.url===e.url),'Primary reference retained');
  for(const source of e.sources){assert.equal(new URL(source.url).protocol,'https:');assert(source.checkedAt && source.kind && Array.isArray(source.originalCategories));}
}
for(const e of added){
  assert(e.startsAt.slice(0,10)>='2026-10-18'&&e.startsAt.slice(0,10)<='2026-12-13');
  assert(e.sources.some(s=>s.kind==='organizer'&&s.url===e.url),'Original organizer remains the primary event reference');
}
const members=id=>events.filter(e=>e.seriesId===id);
assert.equal(members('psu-farmers-2026').length,8);
assert.equal(members('king-farmers-2026').length,6);
assert.equal(members('lents-farmers-2026').length,6);
assert.equal(members('shemanski-farmers-2026').length,3);
assert.equal(members('saturday-market-2026').length,8);
assert.equal(members('crafty-wonderland-holiday-2026').length,3);
assert.equal(members('outlet-riso-basics-2026').length,4);
for(const e of members('psu-farmers-2026'))assert.equal(e.startsAt.slice(11,16),e.startsAt<'2026-11-01'?'08:30':'09:00');
for(const id of ['king-farmers-2026','lents-farmers-2026'])assert(members(id).every(e=>e.startsAt.slice(0,10)<='2026-11-22'));
assert.deepEqual(Array.from(members('shemanski-farmers-2026'),e=>e.startsAt.slice(0,10)),['2026-10-21','2026-10-28','2026-11-25']);
assert.equal(events.find(e=>e.id==='king-farmers-2026-10-25').startsAt.slice(-6),'-07:00');
assert.equal(events.find(e=>e.id==='king-farmers-2026-11-01').startsAt.slice(-6),'-08:00');
assert(!events.some(e=>e.id.includes('sick-fundraiser')),'Conflicting start times remain out of the calendar');
console.log('PASS — expansion provenance, duplicate checks, Pacific/DST offsets, recurrence bounds, winter hours, and unknown admission.');
