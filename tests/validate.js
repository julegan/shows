const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '..', 'events.js'), 'utf8');
const context = {window:{}};
vm.runInNewContext(code, context);
const events = context.window.SHOWS_EVENTS;
assert(Array.isArray(events) && events.length >= 8, 'Event sample exists');
const ids = new Set(), series = new Map();
for (const e of events) {
  assert(e.id && !ids.has(e.id), 'Every event has a unique id: ' + e.id);
  ids.add(e.id);
  assert(e.title && e.venue && e.category && e.neighborhood && e.source, 'Required fields: ' + e.id);
  assert(Array.isArray(e.tags), 'Tags must be array: ' + e.id);
  assert(/^2026-\d\d-\d\dT\d\d:\d\d:\d\d-0[78]:00$/.test(e.startsAt), 'Explicit Pacific offset: ' + e.id);
  assert(Number.isFinite(Date.parse(e.startsAt)), 'Valid timestamp: ' + e.id);
  if(e.endsAt) assert(Date.parse(e.endsAt)>Date.parse(e.startsAt), 'End after start: ' + e.id);
  assert(/^https:\/\//.test(e.url), 'Source HTTPS: ' + e.id);
  if(e.seriesId)series.set(e.seriesId,(series.get(e.seriesId)||0)+1);
}
assert((series.get('pzs-weekend')||0)>=2, 'Series supports multiple VEVENTs');
console.log('PASS — ' + events.length + ' source-linked events, unique IDs, explicit timezones, chronological times, series.');
require('./validate-expansion.js');
