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
test("Metal Trivia + Karaoke","Other");
test("DJ Karaoke and Bingo","Other");
test("Post-punk comedy night","Performance");
test("SOLD OUT: Wednesday Night Special: Kyle Kinane (Early)","Unclassified");
test("Mdou Moctar (Solo)","Unclassified");
test("SOLD OUT: Lime Garden","Unclassified");
test("Gilla Band and PISS","Unclassified"); // Artist-name familiarity alone is not enough evidence.
test("Bass band at Halloween","Music");
test("Record release at Black Water","Music");
test("This is a game night","Other");
assert.equal(classifyEvent({title:"Original show",sourceEventType:"MusicEvent"}).category,"Music");
assert.equal(classifyEvent({title:"Original show",sourceEventType:"ComedyEvent"}).category,"Performance");
assert.equal(classifyEvent({title:"Original show",sourceVerifiedMusic:true}).category,"Music");
assert.equal(classifyEvent({title:"Original show",categories:["Music"]}).category,"Music");
assert.equal(classifyEvent({title:"Original show",categories:["Goth & darkwave"]}).musicStyles[0],"Goth & darkwave");
assert.equal(classifyEvent({title:"Open mic comedy",sourceVerifiedMusic:true}).category,"Performance");
assert.deepEqual(musicStylesFromSource({title:"New event at The Coffin Club",description:"Goth venue with industrial bands"}),[],
 "Venue description never becomes an event-specific music style");
console.log("PASS — event-specific format and style evidence with negative comedy, games, brand-name, venue and artist-only cases");
