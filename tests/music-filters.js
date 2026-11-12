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
 location:new URL("https://example.test/"),history:{replaceState(){}},
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
    musicStyles:[],startsAt:"2026-10-18T13:35:00-07:00"},
  {...fixtureBase,id:"fixture-country-concert",title:"Country concert",category:"Music",
    musicStyles:["Country"],startsAt:"2026-11-04T19:00:00-08:00"},
  {...fixtureBase,id:"fixture-americana-concert",title:"Americana concert",category:"Music",
    musicStyles:["Americana"],startsAt:"2026-11-04T20:00:00-08:00"},
  {...fixtureBase,id:"fixture-legacy-country-americana",title:"Older combined genre",category:"Music",
    musicStyles:["Country & Americana"],startsAt:"2026-11-05T20:00:00-08:00"}
);
// Repeated dates may be condensed in Places but remain complete in By date.
for (let n=0;n<4;n++){
  const day=String(4+7*n).padStart(2,"0");
  context.window.SHOWS_EVENTS.push({...fixtureBase,id:"fixture-weekly-karaoke-"+n,
    title:"Karaoke from Hell",category:"Karaoke",venue:"Fixture Karaoke",musicStyles:[],
    startsAt:"2026-11-"+day+"T20:00:00-08:00"});
}
context.window.SHOWS_EVENTS.push({...fixtureBase,id:"fixture-special-karaoke",
  title:"Karaoke from Hell — Special Guest Night",category:"Karaoke",venue:"Fixture Karaoke",
  musicStyles:[],startsAt:"2026-11-07T20:00:00-08:00"});
// Canonical venue aliases resolve to one identity instead of fragmenting cards.
context.window.SHOWS_EVENTS.push({...fixtureBase,id:"fixture-alias",title:"Alternate name bill",
  venue:"Fixture Hall",musicStyles:["Punk"],startsAt:"2026-11-02T17:00:00-08:00"});
// Ensure the Places preview cap is exercised even when the live venue roster changes.
for (let n=0;n<9;n++) {
  context.window.SHOWS_EVENTS.push({...fixtureBase,
    id:"fixture-nine-punk-shows-"+n,title:"Venue test punk bill "+n,
    venue:"Fixture Venue",category:"Music",musicStyles:["Punk"],
    startsAt:"2026-11-02T14:"+String(n).padStart(2,"0")+":00-08:00"
  });
}
vm.runInContext(fs.readFileSync(path.join(__dirname,"..","places.js"),"utf8"),context);
context.window.SHOWS_PLACES.push({id:"fixture-venue",name:"Fixture Venue",aliases:["Fixture Hall"],calendarUrl:null});
vm.runInContext(fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8"),context);
const events=context.window.SHOWS_EVENTS;
const eById=new Map(events.map(e=>[e.id,e]));
const styles=[...new Set([...["Jazz","Blues","Hip-hop & rap","R&B & soul","Funk & disco","Folk & bluegrass","Country","Americana","Electronic & dance","Reggae & ska","Global & traditional","Classical & chamber","Indie & alternative","Pop"],...events.flatMap(e=>e.musicStyles||[])])].sort();
assert(styles.includes("Punk")&&styles.includes("Metal")&&styles.includes("Hardcore"),"Core underground styles retained");
assert(styles.includes("Jazz")&&styles.includes("Hip-hop & rap")&&styles.includes("R&B & soul"),"Broad music genres available in filter even before imports");
assert(styles.includes("Country")&&styles.includes("Americana"),"Country and Americana are independently selectable genres");
assert(styles.includes("Country & Americana"),"Previously approved combined taxonomy remains visible while present in the dataset");
const markup=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
assert.match(markup,/<label id="styleLabel" for="style">Genre\s*<select id="style"><option value="">All genres<\/option>/,
 "Accessible genre filter label and option are user-facing and linked to the same control");
assert.match(markup,/placeholder="Band, venue, genre, artist…"/,"Search hint uses genre terminology");
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
for(const style of ["Metal","Punk","Hardcore","Country","Americana","Country & Americana"]){
  el("style").change(style);
  const expected=Array.from(events.filter(e=>e.startsAt.slice(0,10)>="2026-11-01"&&(e.musicStyles||[]).includes(style)),e=>e.id).sort();
  assert.deepEqual(renderedIds(),expected,"Chronological feed respects "+style+" filter");
  views.find(v=>v.dataset.view==="places").click();
  // Highlight/compact previews show at most six one-off events per place;
  // recurring series surface a representative occurrence, never phantom dates.
  const visiblePlaceIds=renderedIds();
  const matchAll=events.filter(e=>e.startsAt.slice(0,10)>="2026-11-01"&&(e.musicStyles||[]).includes(style));
  const allMatchingIds=new Set(matchAll.map(e=>e.id));
  assert(visiblePlaceIds.every(id=>allMatchingIds.has(id)),
    "Places may not leak events outside the selected genre "+style);
  assert.equal(new Set(visiblePlaceIds).size,visiblePlaceIds.length,"A Place preview must not repeat events");
  assert.equal(parseInt(el("summary").textContent.match(/· (\d+) matching listings/)?.[1],10),expected.length,
    "Places summary accounts for all matching "+style+" events, not just visible previews");
  if(style==="Punk"){
    const markup=el("results").innerHTML;
    assert(markup.includes('id="place-heading-venue-fixture-venue"'),
      "Canonical alias resolves into Fixture Venue");
    assert(!markup.includes('id="place-heading-unlisted-fixturehall"'),
      "An alternate name must not become a second venue");
    for(let n=0;n<6;n++)
      assert(visiblePlaceIds.includes("fixture-nine-punk-shows-"+n),
        "First six distinct shows remain in the collapsed lineup");
    assert(!visiblePlaceIds.includes("fixture-nine-punk-shows-8"),
      "Collapsed Places does not dump an unbounded roster");
    assert(markup.includes('data-place-toggle="venue-fixture-venue"'),
      "An inline all-dates action is present");
    const target={closest(selector){return selector==="[data-place-toggle]"?
      {dataset:{placeToggle:"venue-fixture-venue"}}:null;}};
    el("results").listeners.click({target});
    for(let n=0;n<9;n++)assert(renderedIds().includes("fixture-nine-punk-shows-"+n),
      "Expanded venue exposes all nine original dates");
    assert(el("results").innerHTML.includes("Back to highlights"));
    el("results").listeners.click({target});
  }
  views.find(v=>v.dataset.view==="dates").click();
  el("exportVisible").click();
  if(expected.length){
    const output=downloads.at(-1).text;
    assert.equal((output.match(/BEGIN:VEVENT/g)||[]).length,expected.length,"ICS export respects "+style+" filter");
  }
}
el("clearFilters").click();
views.find(v=>v.dataset.view==="places").click();
assert(el("results").innerHTML.includes("Regular programming"),
  "Recurrence summary appears within Places");
assert(el("results").innerHTML.includes("Weekly in listed dates · 4 upcoming"),
  "Only four verified future dates are presented, not an infinite schedule");
assert(renderedIds().includes("fixture-weekly-karaoke-0"),
  "The recurring program opens its next verified occurrence");
assert(!renderedIds().includes("fixture-weekly-karaoke-3"),
  "Later weekly occurrences are collapsed from Places, not deleted");
assert(renderedIds().includes("fixture-special-karaoke"),
  "Special edition remains a distinct prominent event");
const target={closest(selector){return selector==="[data-place-toggle]"?
  {dataset:{placeToggle:"unlisted-fixturekaraoke"}}:null;}};
el("results").listeners.click({target});
for(let n=0;n<4;n++)assert(renderedIds().includes("fixture-weekly-karaoke-"+n),
  "All recurring instances become available when expanded");
views.find(v=>v.dataset.view==="dates").click();
for(let n=0;n<4;n++)assert(renderedIds().includes("fixture-weekly-karaoke-"+n),
  "By date never hides instances of recurring shows");
el("clearFilters").click();
assert.equal(el("style").value,"","Clear restores genre");
el("style").change("Country");
assert(renderedIds().includes("fixture-country-concert"),"Country finds country listings");
assert(!renderedIds().includes("fixture-americana-concert"),"Country filter does not imply Americana");
assert(!renderedIds().includes("fixture-legacy-country-americana"),
 "Do not silently assume the legacy combined label definitively means Country");
el("style").change("Americana");
assert(renderedIds().includes("fixture-americana-concert"),"Americana finds its own listings");
assert(!renderedIds().includes("fixture-country-concert"),"Americana filter does not imply Country");
el("clearFilters").click();
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
