"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class Element {
  constructor(dataset={}) {this.dataset=dataset;this.listeners={};this.children=[];this.value="";this.innerHTML="";this.textContent="";this.hidden=false;this.attrs={};}
  addEventListener(type,fn){this.listeners[type]=fn;}
  setAttribute(k,v){this.attrs[k]=v;}
  appendChild(child){this.children.push(child);}
  append(child){this.children.push(child);}
  click(){this.listeners.click?.({target:this});}
  change(value){this.value=value;this.listeners.change?.({target:this});}
  input(value){this.value=value;this.listeners.input?.({target:this});}
  remove(){}
}
const nodes=new Map();
const el=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
const views=["dates","places","month"].map(view=>new Element({view}));
const downloads=[];
const document={
  getElementById:el,
  querySelectorAll:selector=>selector==="[data-view]"?views:[],
  createElement:()=>new Element(),
  addEventListener(){},
  body:{appendChild(){}}
};
const NativeDate=Date;
class FixedDate extends NativeDate {constructor(...args){super(...(args.length?args:["2026-10-18T12:00:00-07:00"]));}}
class TestURL extends URL {static createObjectURL(blob){downloads.push(blob);return "blob:calendar";}static revokeObjectURL(){}}
const context={window:{},document,Date:FixedDate,Intl,URL:TestURL,Blob:class{constructor(parts){this.text=parts.join("");}},
 localStorage:{getItem:()=>null,setItem(){}},
 location:{hash:"",pathname:"/",search:""},history:{replaceState(){}},
 setTimeout(){},HTMLImageElement:class{}
};
vm.createContext(context);
for(const file of ["events.js","app.js"])vm.runInContext(fs.readFileSync(path.join(__dirname,"..",file),"utf8"),context);
const events=context.window.SHOWS_EVENTS;
const eById=new Map(events.map(e=>[e.id,e]));
const styles=[...new Set(events.flatMap(e=>e.musicStyles||[]))].sort();
assert(styles.includes("Punk")&&styles.includes("Metal")&&styles.includes("Hardcore"),"Core underground styles retained");
assert.deepEqual(el("style").children.map(e=>e.value),styles,"Style options reflect dataset");
assert.equal(el("fromDate").value,"2026-10-18","Starts today in Portland");
assert.equal(views.find(v=>v.dataset.view==="dates").attrs["aria-pressed"],"true","Chronological view is default");
assert.equal(el("monthControls").hidden,true,"Month is secondary");
function renderedIds(){return [...el("results").innerHTML.matchAll(/data-event="([^"]+)"/g)].map(m=>m[1]).sort();}
const past=new Set(events.filter(e=>e.startsAt.slice(0,10)<"2026-10-18").map(e=>e.id));
assert(!renderedIds().some(id=>past.has(id)),"Past events excluded from default feed");
assert(!renderedIds().some(id=>/farmers? market/i.test(eById.get(id)?.title||"")),"Routine farmers market listings excluded");
el("fromDate").change("2026-11-01");
for(const style of ["Metal","Punk","Hardcore"]){
  el("style").change(style);
  const expected=Array.from(events.filter(e=>e.startsAt.slice(0,10)>="2026-11-01"&&(e.musicStyles||[]).includes(style)),e=>e.id).sort();
  assert.deepEqual(renderedIds(),expected,"Chronological feed respects "+style+" filter");
  views.find(v=>v.dataset.view==="places").click();
  assert.deepEqual(renderedIds(),expected,"Places respects "+style+" filter");
  views.find(v=>v.dataset.view==="dates").click();
  el("exportVisible").click();
  if(expected.length){
    const output=downloads.at(-1).text;
    assert.equal((output.match(/BEGIN:VEVENT/g)||[]).length,expected.length,"ICS export respects "+style+" filter");
  }
}
el("clearFilters").click();
assert.equal(el("style").value,"","Clear restores genre");
el("freeOnly").click();
assert.equal(el("freeOnly").attrs["aria-pressed"],"true");
assert(renderedIds().every(id=>eById.get(id).free===true),"Free filter excludes priced events");
el("clearFilters").click();
el("savedOnly").click();
assert.equal(renderedIds().length,0,"Saved filter is empty before any saved events");
el("clearFilters").click();
views.find(v=>v.dataset.view==="month").click();
assert.equal(el("monthControls").hidden,false,"Month controls appear only on request");
assert(el("results").innerHTML.includes('class="shows-month-grid"'),"Optional month grid is rendered");
el("nextMonth").click();
assert(el("monthPeriod").textContent.includes("November 2026"),"Month navigation works");
el("jumpToday").click();
assert.equal(el("fromDate").value,"2026-10-18","Today button restores initial date");
assert.equal(views.find(v=>v.dataset.view==="dates").attrs["aria-pressed"],"true");
console.log("PASS — music filters, date-first default, month, Places, free/saved, exclusions, and ICS exports.");
