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
// A venue's primary listing is not invisible just because its genre/format is unknown.
vm.runInContext(fs.readFileSync(path.join(__dirname,"..","events.js"),"utf8"),context);
const fixtureBase=context.window.SHOWS_EVENTS.find(e=>e.category==="Music");
assert(fixtureBase,"Need a known music fixture to model a source-listed venue record");
context.window.SHOWS_EVENTS.push(
  {...fixtureBase,id:"fixture-unclassified-venue",title:"Unverified local bill",category:"Unclassified",
    musicStyles:[],startsAt:"2026-10-18T13:00:00-07:00"},
  {...fixtureBase,id:"fixture-other-night",title:"Venue dance night",category:"Other",
    musicStyles:[],startsAt:"2026-10-18T13:05:00-07:00"},
  {...fixtureBase,id:"fixture-performance",title:"Cabaret show",category:"Performance",
    musicStyles:[],startsAt:"2026-10-18T13:10:00-07:00"},
  {...fixtureBase,id:"fixture-workshop",title:"Risograph workshop",category:"Workshops",
    musicStyles:[],startsAt:"2026-10-18T13:15:00-07:00"},
  {...fixtureBase,id:"fixture-scene-market",title:"Independent record market",category:"Markets",
    musicStyles:[],startsAt:"2026-10-18T13:20:00-07:00"},
  {...fixtureBase,id:"fixture-farmers-market",title:"PSU Farmers Market",category:"Markets",
    musicStyles:[],startsAt:"2026-10-18T13:25:00-07:00"},
  {...fixtureBase,id:"fixture-venue-closed",title:"CLOSED",category:"Unclassified",
    musicStyles:[],startsAt:"2026-10-18T13:30:00-07:00"},
  {...fixtureBase,id:"fixture-closed-mistagged",title:"Closed Merry Christmas",category:"Music",
    musicStyles:[],startsAt:"2026-10-18T13:35:00-07:00"}
);
// Ensure the Places preview cap is exercised even when the live venue roster changes.
for (let n=0;n<9;n++) {
  context.window.SHOWS_EVENTS.push({...fixtureBase,
    id:"fixture-nine-punk-shows-"+n,title:"Venue test punk bill "+n,
    venue:"Fixture Venue",category:"Music",musicStyles:["Punk"],
    startsAt:"2026-11-02T14:"+String(n).padStart(2,"0")+":00-08:00"
  });
}
vm.runInContext(fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8"),context);
const events=context.window.SHOWS_EVENTS;
const eById=new Map(events.map(e=>[e.id,e]));
const styles=[...new Set([...["Jazz","Blues","Hip-hop & rap","R&B & soul","Funk & disco","Folk & bluegrass","Country & Americana","Electronic & dance","Reggae & ska","Global & traditional","Classical & chamber","Indie & alternative","Pop"],...events.flatMap(e=>e.musicStyles||[])])].sort();
assert(styles.includes("Punk")&&styles.includes("Metal")&&styles.includes("Hardcore"),"Core underground styles retained");
assert(styles.includes("Jazz")&&styles.includes("Hip-hop & rap")&&styles.includes("R&B & soul"),"Broad music styles available in filter even before imports");
assert.deepEqual(el("style").children.map(e=>e.value),styles,"Style options reflect dataset");
assert.equal(el("fromDate").value,"2026-10-18","Starts today in Portland");
assert(!fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8").includes("fromDateDisplay"),"The real date input must not be obscured by a fake display");
assert.equal(views.find(v=>v.dataset.view==="dates").attrs["aria-pressed"],"true","Chronological view is default");
assert.equal(el("monthControls").hidden,true,"Month is secondary");
function renderedIds(){return [...el("results").innerHTML.matchAll(/data-event="([^"]+)"/g)].map(m=>m[1]).sort();}
const past=new Set(events.filter(e=>e.startsAt.slice(0,10)<"2026-10-18").map(e=>e.id));
assert(!renderedIds().some(id=>past.has(id)),"Past events excluded from default feed");
assert(renderedIds().includes("fixture-unclassified-venue"),"Unclassified primary venue listing remains visible in the default mixed feed");
for(const id of ["fixture-other-night","fixture-performance","fixture-workshop","fixture-scene-market"])
  assert(renderedIds().includes(id),id+" is visible without genre or category approval");
assert(!renderedIds().includes("fixture-farmers-market"),"Routine farmers markets remain an explicit editorial exclusion");
assert(!renderedIds().includes("fixture-venue-closed"),"Operational closure notice is not shown as a show");
assert(!renderedIds().includes("fixture-closed-mistagged"),"Closure notice stays hidden even when incorrectly tagged Music");
assert(el("results").innerHTML.includes("Type unconfirmed"),"Venue listing is not misrepresented as verified music");
assert(!renderedIds().some(id=>/farmers? market/i.test(eById.get(id)?.title||"")),"Routine farmers market listings excluded");
el("fromDate").change("2026-11-01");
for(const style of ["Metal","Punk","Hardcore"]){
  el("style").change(style);
  const expected=Array.from(events.filter(e=>e.startsAt.slice(0,10)>="2026-11-01"&&(e.musicStyles||[]).includes(style)),e=>e.id).sort();
  assert.deepEqual(renderedIds(),expected,"Chronological feed respects "+style+" filter");
  views.find(v=>v.dataset.view==="places").click();
  // Places intentionally previews only the first 8 chronological shows per venue.
  // More source discoveries must not break validation simply because a venue
  // crosses that display limit. Still check both venue caps and style correctness.
  const perVenue = new Map();
  const expectedPlaceIds = Array.from(events
    .filter(e=>e.startsAt.slice(0,10)>="2026-11-01"&&(e.musicStyles||[]).includes(style))
    .sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))
    .filter(e=>{
      const count=perVenue.get(e.venue)||0;
      perVenue.set(e.venue,count+1);
      return count<8;
    }), e=>e.id).sort();
  assert.deepEqual(renderedIds(),expectedPlaceIds,"Places previews up to eight correctly filtered "+style+" shows per venue");
  assert.equal(parseInt(el("summary").textContent,10),expected.length,
    "Places summary counts all matching "+style+" shows, including overflow");
  if (style==="Punk") assert.equal(perVenue.get("Fixture Venue"),9,
    "Deterministic fixture verifies a venue with more than eight matching shows");
  for (const [venue,count] of perVenue) {
    if (count>8) assert(el("results").innerHTML.includes("And "+(count-8)+" more dates."),
      "Places reports overflow instead of hiding venue counts for "+venue);
  }
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
assert(el("results").innerHTML.includes('class="shows-month-event"'),"Month view previews actual event listings, not only day counts");
assert(el("results").innerHTML.includes('class="shows-month-day"'),"Full-day navigation remains available");
assert(el("results").innerHTML.includes('class="shows-month-event-title"'),"Month preview exposes meaningful event names");
assert(!el("results").innerHTML.includes('<button type="button" class="shows-month-date'),"Day and event controls are not nested buttons");
el("nextMonth").click();
assert(el("monthPeriod").textContent.includes("November 2026"),"Month navigation works");
el("jumpToday").click();
assert.equal(el("fromDate").value,"2026-10-18","Today button restores initial date");
assert.equal(views.find(v=>v.dataset.view==="dates").attrs["aria-pressed"],"true");
console.log("PASS — music filters, date-first default, month, Places, free/saved, exclusions, and ICS exports.");
