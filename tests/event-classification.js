"use strict";
const assert=require("node:assert/strict");
const {classifyEvent,musicStylesFromSource}=require("../scripts/event-classification");
const test=(title,category,styles=[])=>{
 const result=classifyEvent({title});
 assert.equal(result.category,category,title);
 assert.deepEqual(result.musicStyles,styles,title);
};
test("Underground metal punk and hardcore show", "Music",["Hardcore","Metal","Punk"]);
test("CRIMEWAVE: A GOTH, POST-PUNK, & DARKWAVE PARTY – 21+", "Music",["Post-punk","Goth & darkwave"]);
test("Industrial EBM DJ set", "Music",["Industrial & EBM"]);
test("Experimental noise music with bands", "Music",["Noise & experimental"]);
test("Live Rock Show", "Music",["Rock"]);
test("Punk rock record fair","Markets");
test("Punk zine making workshop","Workshops");
test("School of Rock Halloween Fright Fest","Unclassified");
test("Metal Trivia + Karaoke","Karaoke");
test("Karaoke Night - Free!","Karaoke");
test("KARAOKE FROM HELL","Karaoke");
test("Square Dancing / KARAOKE @ 9:30","Karaoke");
test("DJ Karaoke and Bingo","Karaoke");
test("Post-punk comedy night","Performance");
test("SOLD OUT: Wednesday Night Special: Kyle Kinane (Early)","Unclassified");
test("Mdou Moctar (Solo)","Unclassified");
test("SOLD OUT: Lime Garden","Unclassified");
test("Gilla Band and PISS","Unclassified"); // Artist-name familiarity alone is not enough evidence.
test("Live band at Halloween","Music");
test("Record release at Black Water","Music");
test("This is a game night","Other");
test("Karaoke at punk and metal bar","Karaoke");
test("Tuesday Trivia","Other");
assert.equal(classifyEvent({title:"Original show",sourceEventType:"MusicEvent"}).category,"Music");
assert.equal(classifyEvent({title:"Original show",sourceEventType:"ComedyEvent"}).category,"Performance");
assert.equal(classifyEvent({title:"Original show",sourceVerifiedMusic:true}).category,"Music");
assert.equal(classifyEvent({title:"Original show",categories:["Music"]}).category,"Music");
assert.equal(classifyEvent({title:"Original show",categories:["Goth & darkwave"]}).musicStyles[0],"Goth & darkwave");
assert.equal(classifyEvent({title:"Open mic comedy",sourceVerifiedMusic:true}).category,"Performance");
assert.deepEqual(musicStylesFromSource({title:"New event at The Coffin Club",description:"Goth venue with industrial bands"}),[],
 "Venue description never becomes an event-specific music style");

const reviewed=require("../scripts/reviewed-classifications");
const {backfill}=require("../scripts/backfill-event-classifications");
const fs=require("node:fs");
const path=require("node:path");
const registry=require("../discovery/reviewed-classifications.json");
const text=fs.readFileSync(path.resolve(__dirname,"../events.js"),"utf8");
const current=backfill(text);
const objects=JSON.parse(text.match(/window\.SHOWS_EVENTS\s*=\s*(\[[\s\S]*?\]);\s*$/)[1]);
assert.equal(current.changed.length,0,"Classification backfill must be idempotent after reviewed events are updated");
assert.equal(current.meta.musicOccurrences,objects.filter(e=>e.category==="Music").length,
 "Conservative source-reviewed Music count must match actual, growing dataset");
assert.equal(current.meta.totalOccurrences,objects.length,
 "Classification never adds or removes calendar events");
assert.equal(registry.entries.length,13,"Reviewed-event registry tracks only individually evidenced bills, without broad artist auto-tagging");
// Keep the unrelated activities in the original High Water Mark calendar out of music.
for(const title of ["Karaoke Night - Free!","Shady Pines Open Mic!","Kink Nite! Market and party!"]){
 const classified=classifyEvent({title});
 assert.notEqual(classified.category,"Music",title+" must not inherit a musical format from venue reputation");
}
assert(registry.entries.some(x=>x.url==="https://www.treetix.com/event/204920/highwatermark"&&x.evidenceUrl.includes("reddit.com/r/portlandmusic/")),
  "Firsthand Nov 7 band-led evidence is pinned to exact provider event");
for(const item of registry.entries){
 const got=reviewed.forEvent(item);
 assert(got&&got.category==="Music",item.title+" exact original evidence");
 assert.equal(got.evidenceUrl,item.evidenceUrl);
 assert.equal(reviewed.forEvent({...item,url:"https://example.com/unverified"}),null,"Different original event URL cannot inherit classification");
 assert.equal(reviewed.forEvent({...item,venue:"Other Stage"}),null,"Wrong venue cannot inherit classification");
 assert.equal(reviewed.forEvent({...item,date:"2027-12-31"}),null,"Wrong date cannot inherit classification");
}

for(const item of registry.entries){
 const e=objects.find(x=>x.url===item.url&&x.title===item.title&&x.venue===item.venue&&x.startsAt.startsWith(item.date));
 assert(e,"Original identified event remains in snapshot");
 assert.equal(e.category,"Music","Original event format classification is applied");
 assert.equal(e.classificationSourceUrl,item.evidenceUrl,"Evidence URL retained in approved event data");
 for(const style of item.musicStyles)assert(e.musicStyles.includes(style),"Source-verified style retained: "+style);
}
for(const x of ["SOLD OUT: Wednesday Night Special: Kyle Kinane (Early)","SOLD OUT: Wednesday Night Special: Kyle Kinane (Late)"]){
 const e=objects.find(v=>v.title===x);
 assert(e&&e.category!=="Music","Comedy venue bill not reclassified just for appearing on music-venue calendar");
}

console.log("PASS — event-specific format and style evidence with negative comedy, games, brand-name, venue and artist-only cases");
