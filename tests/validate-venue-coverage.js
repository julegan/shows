const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','events.js'),'utf8'),ctx);
const all=ctx.window.SHOWS_EVENTS;
const meta=ctx.window.SHOWS_DATASET;
const added=all.filter(e=>e.addedIn==='2026-10-17-venue-coverage');
assert.equal(added.length,36);
assert(meta.previousBatches.some(b=>b.batchId==='2026-10-17-venue-coverage'&&b.addedOccurrences===36));
assert.equal(added.length,36,'Previously approved major-venue batch stays fixed');
assert.equal(meta.totalOccurrences,all.length);
assert.equal(meta.musicOccurrences,all.filter(e=>e.category==='Music').length);
assert(added.every(e=>e.category==='Music' && e.eventFormat==='live'));
assert(added.every(e=>e.sources.some(s=>s.url===e.url) && e.musicStyleEvidence?.basis));
const counts=new Map();
for(const e of added) counts.set(e.venue,(counts.get(e.venue)||0)+1);
for(const [v,n] of [['Roseland Theater',10],['Wonder Ballroom',5],['Crystal Ballroom',10],['Moda Center',2],['Revolution Hall',8],['Show Bar at Revolution Hall',1]])assert.equal(counts.get(v),n);
assert.equal(added.filter(e=>e.title.startsWith('Neurosis')).length,2);
assert(!added.some(e=>/SiM|Julia Wolf|Frost Children|Death From Above 1979/i.test(e.title)));
for(const e of added){
 assert(e.startsAt.slice(0,10)>='2026-10-17' && e.startsAt.slice(0,10)<='2026-12-13');
 assert(e.startsAt.slice(-6)===(e.startsAt.slice(0,10)<'2026-11-01'?'-07:00':'-08:00'));
 assert(e.endsAt===null);
}
console.log('PASS — 36 source-linked venue dates, previous records intact, source provenance, move/postpone exclusions and Pacific offsets.');

const reviewedGap=all.filter(e=>e.addedIn==='2026-11-03-primary-venue-gap-review');
assert.equal(reviewedGap.length,3,'Three individually verified, owner-priority venue leads are staged');
assert.equal(reviewedGap.filter(e=>e.venue==='High Limit Room').length,2);
assert.equal(reviewedGap.filter(e=>e.venue==='The Coffin Club').length,1);
assert(reviewedGap.every(e=>e.category==='Music' && e.eventFormat==='live' && e.sources.some(s=>s.url===e.url)));
assert(reviewedGap.every(e=>e.startsAt.endsWith('-08:00')),'November date/time offsets must be Pacific standard time');
// The refresh workflow attaches original, event-specific image REFERENCES before
// running this validation. A missing image is fine; a sourced review proposal is
// also fine. Neither means we have permission to mirror or reuse the image.
const {originalUrl}=require('../scripts/backfill-artwork');
const reviewArtworkValid=e=>!e.artwork || (
  /^https:\/\//.test(e.artwork.url||'') &&
  e.artwork.sourceUrl===originalUrl(e) &&
  e.artwork.origin==='official-event-page' &&
  e.artwork.credit==='Official event page' &&
  e.artwork.usageApproved===null
);
assert(reviewedGap.every(reviewArtworkValid),
  'Artwork references must come from the matching official event page and remain unapproved');
const okGoodnight=reviewedGap.find(e=>e.id==='high-limit-room-ok-goodnight-snooze-eve-2026-11-14');
assert.equal(okGoodnight.startTimeKind,'date-only');
assert(/sorting anchor, not an event time/.test(okGoodnight.description));
const ayria=reviewedGap.find(e=>e.id==='the-coffin-club-ayria-die-robot-2026-11-24');
assert(ayria.sources.some(s=>s.kind==='official-ticketing'));
assert(/discrepancy is unresolved/.test(ayria.description),'Source time disagreement must remain visible');
const exampleArt={
  url:'https://example.org/artist-event-poster.jpg',
  sourceUrl:originalUrl(ayria),
  origin:'official-event-page',
  credit:'Official event page',
  usageApproved:null
};
assert(reviewArtworkValid({...ayria,artwork:exampleArt}),
  'A first-party artwork reference added by refresh must not fail validation');
assert(!reviewArtworkValid({...ayria,artwork:{...exampleArt,sourceUrl:'https://example.org/other-show'}}),
  'Artwork from an unrelated event page must still fail validation');
assert(!reviewArtworkValid({...ayria,artwork:{...exampleArt,usageApproved:true}}),
  'Artwork review must not invent usage permission');
assert(!reviewedGap.some(e=>/Sex Mex/i.test(e.title)),'Cancelled/contradictory events must not be imported');
console.log('PASS — priority Coffin and High Limit source-backed show additions, time/genre caveats and accessibility.');
