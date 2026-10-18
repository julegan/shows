const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','events.js'),'utf8'),context);
const events=context.window.SHOWS_EVENTS;
const metadata=context.window.SHOWS_DATASET;
const added=events.filter(e=>e.addedIn===metadata.batchId);
assert(added.length>=25,'Core music expansion contains substantial distinct bills');
assert.equal(metadata.addedOccurrences,added.length);
assert(added.every(e=>e.category==='Music'),'This batch prioritizes the original music scope');
const styles=new Set(added.flatMap(e=>e.musicStyles));
for(const style of ['Metal','Punk','Hardcore','Goth & darkwave','Rock'])assert(styles.has(style),'Core style covered: '+style);
const venues=new Set(added.map(e=>e.venue));
for(const venue of ['Twilight Cafe and Bar','High Water Mark Lounge','No Fun','Star Theater','The Coffin Club','Turn! Turn! Turn!','High Limit Room'])assert(venues.has(venue),'Priority source represented: '+venue);
for(const e of added){
  assert(e.musicStyles.length>0);
  assert(e.musicStyleEvidence?.basis&&e.musicStyleEvidence.urls.length,'Every curated music style has evidence');
  assert(['live','dj'].includes(e.eventFormat),'DJ nights are distinct from live bills');
  assert(e.sourceCheckedAt==='2026-10-17');
  assert(e.sources.some(s=>['organizer','promoter','artist','official-ticketing'].includes(s.kind)),'Primary event evidence');
  assert(e.startsAt.slice(0,10)>='2026-10-18'&&e.startsAt.slice(0,10)<='2026-12-13');
  if(e.startTimeKind==='doors'){
    assert.equal(e.startsAt,e.doorsAt);
    assert(/performance start|show start/i.test(e.description),'Doors-only time is explained in exports');
  }
}
const festival=added.filter(e=>e.seriesId==='shoot-the-moon-2026');
assert.deepEqual(Array.from(festival,e=>e.startsAt.slice(0,10)),['2026-11-12','2026-11-13','2026-11-14','2026-11-15']);
const spy=added.find(e=>e.title.startsWith('SPY / FEBRUARY'));
assert.equal(spy.startsAt,'2026-10-28T17:00:00-07:00','Promoter doors time, not an aggregator showtime');
assert.equal(spy.startTimeKind,'doors');
const sutekh=added.find(e=>e.title.startsWith('Sutekh Hexen'));
assert.equal(sutekh.address,null,'No invented private venue address');
assert.equal(sutekh.startsAt,'2026-11-14T20:00:00-08:00');
assert(!added.some(e=>e.title.includes('Atomic Rule')||e.title.startsWith('Ayria')),'Unresolved timing/status conflicts stay held back');
console.log('PASS — original music priorities, primary evidence, live/DJ distinction, doors-only times, bounded festival series and source holds.');
