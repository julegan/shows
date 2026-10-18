const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the real app's controls and exports without a browser dependency.
class Element {
  constructor(dataset={}) { this.dataset=dataset; this.listeners={}; this.children=[]; this.value='all'; this.innerHTML=''; this.textContent=''; }
  addEventListener(type, fn) { this.listeners[type]=fn; }
  setAttribute() {}
  appendChild(child) { this.children.push(child); }
  click() { this.listeners.click?.({target:this}); }
  change(value) { this.value=value; this.listeners.change({target:this}); }
  remove() {}
  scrollIntoView() {}
}
const elements=new Map();
const el=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
const views=['month','agenda','places'].map(view=>new Element({view}));
const quick=['all','today','weekend','seven','free','saved'].map(value=>new Element({quick:value}));
const downloads=[];
const document={
  getElementById:el,
  querySelectorAll:selector=>selector==='[data-view]'?views:selector==='[data-quick]'?quick:[],
  querySelector:()=>new Element(),
  createElement:()=>new Element(),
  body:{append(){}},
};
const NativeDate=Date;
class TestDate extends NativeDate { constructor(...args){super(...(args.length?args:['2026-10-18T12:00:00-07:00']));} }
class TestURL extends URL { static createObjectURL(blob){downloads.push(blob);return 'blob:test';} static revokeObjectURL(){} }
const context={window:{},document,Date:TestDate,Intl,URL:TestURL,
  Blob:class {constructor(parts){this.text=parts.join('');}},
  localStorage:{getItem:()=>null,setItem(){}},
  location:{hash:'',pathname:'/',search:''},history:{replaceState(){}},setTimeout(){},
};
vm.createContext(context);
for(const file of ['events.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
const events=context.window.SHOWS_EVENTS;
const styles=Array.from(new Set(events.flatMap(e=>e.musicStyles||[]))).sort();
assert(styles.includes('Metal')&&styles.includes('Punk')&&styles.includes('Hardcore')&&styles.includes('Rock'));
assert(styles.some(s=>s.includes('Goth')),'Goth is a selectable music style');
assert.deepEqual(el('musicStyle').children.map(o=>o.value),styles,'Style menu is available without a text search');
el('next').click(); // November crosses the Pacific daylight-saving boundary.
views.find(b=>b.dataset.view==='agenda').click();
function renderedIds(){return [...el('calendar').innerHTML.matchAll(/data-event="([^"]+)"/g)].map(m=>m[1]).sort();}
function expected(style){return Array.from(events.filter(e=>e.startsAt.startsWith('2026-11')&&(e.musicStyles||[]).includes(style)),e=>e.id).sort();}
for(const style of styles){
  el('musicStyle').change(style);
  assert.equal(el('category').value,'Music');
  assert.deepEqual(renderedIds(),expected(style),'List respects '+style);
  views.find(b=>b.dataset.view==='month').click();
  assert(el('resultCount').textContent.startsWith(expected(style).length+' event'),'Month count respects '+style);
  views.find(b=>b.dataset.view==='agenda').click();
  views.find(b=>b.dataset.view==='places').click();
  assert.deepEqual(renderedIds(),expected(style),'Places respect '+style);
  views.find(b=>b.dataset.view==='agenda').click();
  el('exportVisible').click();
  if(expected(style).length){
    const ics=downloads.at(-1).text.replace(/\r\n[ \t]/g,'');
    assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length,expected(style).length,'Export includes only '+style);
    for(const e of events.filter(e=>expected(style).includes(e.id)))assert(ics.includes('UID:'+e.id+'@shows-portland'));
    if(style==='Metal'){
      assert(ics.includes('(doors)'),'Doors-only calendar entry keeps its time label');
      assert(ics.includes('performance start is unconfirmed'),'Doors-only export explains its time');
    }
  }
}
el('category').change('Markets');
assert.equal(el('musicStyle').value,'all','Changing to a nonmusic interest clears music style');
assert.deepEqual(renderedIds(),Array.from(events.filter(e=>e.startsAt.startsWith('2026-11')&&e.category==='Markets'),e=>e.id).sort());
el('musicStyle').change('Punk');
assert.equal(el('category').value,'Music','A style switches interest back to Music');
assert.deepEqual(renderedIds(),expected('Punk'));
el('reset').click();
assert.equal(el('musicStyle').value,'all');
assert.equal(el('category').value,'all');
assert.deepEqual(renderedIds(),Array.from(events.filter(e=>e.startsAt.startsWith('2026-11')),e=>e.id).sort(),'Clear restores the full month');
console.log('PASS — music styles filter list/place views and calendar exports; interest changes and clear recover all events.');
