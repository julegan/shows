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
test("Free jazz quartet live music", "Music",["Jazz"]);
test("Blues live music", "Music",["Blues"]);
test("Portland independent hip-hop concert", "Music",["Hip-hop & rap"]);

const thesisUrl="https://www.albertastreetpub.com/music/2026/11/5/the-thesis-starring-4our-rachel-wong";
const thesisItem={title:"The Thesis - Starring 4our & Rachel Wong",
 venue:"Alberta Street Pub",sourceId:"alberta-street-pub",url:thesisUrl};
const thesis=classifyEvent(thesisItem);
assert.equal(thesis.category,"Music","Original promoter-specific series can be confirmed without venue-wide inference");
assert.deepEqual(thesis.musicStyles,["Hip-hop & rap"],"Only organizer-evidenced hip-hop, not an assumption that every lineup is R&B");
assert.equal(thesis.evidenceUrl,"https://thethesispdx.com/about/");
assert.deepEqual(classifyEvent({...thesisItem,title:"The Thesis - R&B and soul showcase"}).musicStyles,
 ["Hip-hop & rap","R&B & soul"],"Event-specific style wording can add supported styles to organizer verified program");
for(const variant of [
 {...thesisItem,sourceId:"unknown-venue"},
 {...thesisItem,venue:"Other Venue"},
 {...thesisItem,url:"https://other.example.org/music/2026/11/5/the-thesis-starring"},
 {...thesisItem,url:"https://www.albertastreetpub.com/music?format=json"},
 {...thesisItem,url:thesisUrl+"?utm_source=test"},
 {...thesisItem,title:"The Thesis of Everything"},
 {...thesisItem,title:"Unrelated local music showcase"}
]){
 const got=classifyEvent(variant);
 assert(!got.musicStyles.includes("Hip-hop & rap"),"Untrusted program identity must not inherit Thesis genre");
}
assert.equal(classifyEvent({...thesisItem,title:"The Thesis - Karaoke"}).category,"Karaoke",
 "Nonmusic event-specific format overrides verified program identity");

test("Rapping and freestyle rap showcase", "Music",["Hip-hop & rap"]);
test("Boom-bap producer showcase", "Music",["Hip-hop & rap"]);
test("RNB and neo-soul concert", "Music",["R&B & soul"]);
test("Late Lyrics Hip-hop & R&B Open Mic", "Music",["Hip-hop & rap","R&B & soul"]);
test("Soul open mic showcase", "Music",["R&B & soul"]);
test("Open mic poetry", "Unclassified");
test("Open mic comedy with a hip-hop DJ", "Performance");
test("Karaoke and rap open mic", "Karaoke");
test("Neo soul live music show", "Music",["R&B & soul"]);
test("Funk and disco DJ set", "Music",["Funk & disco"]);
test("Bluegrass live music show", "Music",["Folk & bluegrass"]);
test("Country music concert", "Music",["Country"]);
test("Honky-tonk country band", "Music",["Country"]);
test("Americana concert", "Music",["Americana"]);
test("Alt-country and Americana concert", "Music",["Country","Americana"]);
test("Country & Americana show", "Music",["Country","Americana"]);
test("Country trivia night", "Other");
test("A country of origin documentary", "Unclassified");
test("American art opening", "Arts & DIY");
test("Techno live music", "Music",["Electronic & dance"]);
test("Reggae and ska concert", "Music",["Reggae & ska"]);
test("Afrobeat live band", "Music",["Global & traditional"]);
test("String quartet concert", "Music",["Classical & chamber"]);
test("Shoegaze live show", "Music",["Indie & alternative"]);
test("Hyperpop live concert", "Music",["Pop"]);
test("Jazz trivia", "Other");
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
const {STYLE_LABELS}=require("../scripts/event-classification");
const nonPunkStyles=["Hip-hop & rap","R&B & soul","Funk & disco","Jazz","Blues","Electronic & dance","Reggae & ska","Global & traditional"];
assert(nonPunkStyles.every(x=>STYLE_LABELS.includes(x)),"Diverse SHOWS music styles are part of the canonical taxonomy");
const sampleReviewed={category:"Music",musicStyles:["Hip-hop & rap","R&B & soul"],evidenceUrl:"https://artist.example.org/original-press-kit"};
const validated=reviewed.validateReviewedClassification(sampleReviewed);
assert.deepEqual(validated.musicStyles,["Hip-hop & rap","R&B & soul"],"Owner-reviewed hip-hop and R&B labels are not artificially prohibited");
assert.notEqual(validated.musicStyles,sampleReviewed.musicStyles,"Reviewed styles are returned as a safe copy");
for(const styles of [["Unknown marketing label"],["Hip-hop & rap","Hip-hop & rap"]])
 assert.throws(()=>reviewed.validateReviewedClassification({...sampleReviewed,musicStyles:styles}),/Nonstandard or duplicate/);
assert.throws(()=>reviewed.validateReviewedClassification({...sampleReviewed,category:"Markets"}),/invalid/);
assert.throws(()=>reviewed.validateReviewedClassification({...sampleReviewed,evidenceUrl:"http://no-original.example.org"}),/invalid/);

const {backfill}=require("../scripts/backfill-event-classifications");
const fs=require("node:fs");
const path=require("node:path");
const registry=require("../discovery/reviewed-classifications.json");
const text=fs.readFileSync(path.resolve(__dirname,"../events.js"),"utf8");
const current=backfill(text);
const objects=JSON.parse(text.match(/window\.SHOWS_EVENTS\s*=\s*(\[[\s\S]*?\]);\s*$/)[1]);
// Extending the taxonomy legitimately proposes new source-worded labels for
// already published shows. The dry run must not alter approved events, and
// applying the proposal once must be idempotent.
assert.equal(backfill(current.output).changed.length,0,"Backfill is idempotent after a proposed classification update");
assert(current.changed.every(x=>x.after==="Music"&&["Music","Unclassified"].includes(x.before)),
 "New taxonomy may only propose source-backed music styles or upgrade unclassified source listings");
const approvedMusic=objects.filter(e=>e.category==="Music").length;
const newlyRecognized=current.changed.filter(e=>e.before==="Unclassified"&&e.after==="Music").length;
assert.equal(current.meta.musicOccurrences,approvedMusic+newlyRecognized,
 "Dry-run proposed Music count equals approved Music plus only newly source-recognized listings; never silently publish");
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
