"use strict";
const assert=require("node:assert/strict");
const adapter=require("../scripts/turnturnturn-opendate");
const {extract,reconcile,urlOf}=require("../scripts/discover-events");
const src=require("../discovery/sources.json").sources.find(x=>x.id==="turn-turn-turn");
const now=new Date("2026-10-24T16:00:00-07:00");
const names=[
 ["CorMae + New Here + Combobox","october-28-2026-749681","October 28, 2026","7:30 PM","8:00 PM","https://s3.amazonaws.com/opendate-aws-assets/confirms/main_event_images/000/749/681/compressed/IMG_0135.jpg?1788520562"],
 ["Iroiro (Seattle) + Blesst Chest + Trigger Object + Grapefruit","november-07-2026-751112","November 07, 2026","7:30 PM","8:00 PM",null],
 ["She Ate: A Food Drive for Esther's Pantry","november-07-2026-790061","November 07, 2026","4:00 PM","4:30 PM",null]
];
const slug=(title)=>title.toLowerCase().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-");
const cards=names.map(([title,id,date,doors,show,image])=>
  "<div class='col-12 col-sm-6 col-md-4 col-xl-3' style='margin-bottom:58px'>"+
  "<div class='card confirm-card'><div class='card-body'><div><img src='"+(image||"https://s3.amazonaws.com/opendate-aws-assets/confirms/main_event_images/000/749/681/compressed/poster.jpg")+"'></div>"+
  "<p class='mb-0 public-listing-text'><a href='https://app.opendate.io/e/"+slug(title)+"-"+id+"'><strong>"+title.replace(/&/g,"&amp;")+"</strong></a></p>"+
  "<p class='mb-0 public-listing-date'>"+date+"</p>"+
  "<p class='mb-0 public-listing-date'>Doors: "+doors+" - Show: "+show+"</p>"+
  "<p class='public-listing-text' title='Turn! Turn! Turn! • Portland, OR'>Turn! Turn! Turn! • Portland, OR</p></div></div></div>").join("");
const items=adapter.parseRoster("<html><h1>Turn! Turn! Turn!</h1>"+cards+"</html>");
assert.equal(items.length,3,"All dated source card events included");
assert.equal(items[0].title,"CorMae + New Here + Combobox");
assert.equal(items[0].dateOnly,"2026-10-28");
assert.equal(items[0].startDate,"2026-10-29T03:00:00.000Z","Pacific time is converted to UTC before extraction");
assert.equal(items[1].startDate,"2026-11-08T04:00:00.000Z","PST shift across DST");
assert.equal(items[2].startDate,"2026-11-08T00:30:00.000Z");
assert.equal(items[0].artwork?.origin,"official-event-page");
assert.equal(items[0].artwork?.usageApproved,null);
assert.equal(adapter.officialArtwork("https://attacker.invalid/image.png",items[0].fullUrl),null);
assert.equal(adapter.officialEventUrl("https://app.opendate.io/e/shows"),null);
assert.equal(adapter.officialEventUrl("https://app.opendate.io/v/turn-turn-turn-3116?layout=iframe"),null);
assert.equal(adapter.officialEventUrl("http://app.opendate.io/e/test-october-28-2026-749681"),null);
assert.equal(urlOf(items[0],src),items[0].fullUrl);
assert.equal(urlOf({...items[0],fullUrl:"https://app.opendate.io/e/fake?token=other"},src),null);
const schema=(item,{status="https://schema.org/EventScheduled",venue="Turn! Turn! Turn!",date=item.dateOnly,description=""}={})=>JSON.stringify({
 "@context":"https://schema.org","@type":"Event","name":item.title,"startDate":date,"eventStatus":status,
 location:{name:venue,address:{streetAddress:"8 NE Killingsworth St",addressLocality:"Portland",addressRegion:"OR"}},
 offers:{url:item.fullUrl},description,image:item.artwork?.url
});
const detail=(item,change={})=>"<html><script type='application/ld+json'>"+schema(item,change)+"</script></html>";
const verified=[
 adapter.parseDetail(detail(items[0],{description:"Three live bands perform a concert."}),items[0]),
 adapter.parseDetail(detail(items[1],{description:"Local bands are playing music."}),items[1]),
 adapter.parseDetail(detail(items[2],{description:"A food drive fundraiser for Esther's Pantry."}),items[2])
];
assert.equal(verified[0].sourceVerifiedMusic,true);
assert.equal(verified[2].sourceVerifiedMusic,false,"Fundraiser does not become a concert from venue association");
assert.equal(adapter.parseDetail(detail(items[0],{venue:"Other Club"}),items[0]).hold?.startsWith("Original ticket event venue"),true);
assert.match(adapter.parseDetail(detail(items[0],{status:"https://schema.org/EventCancelled"}),items[0]).hold,/status requires/);
assert.match(adapter.parseDetail(detail(items[0],{date:"2026-10-29"}),items[0]).hold,/disagrees/);
assert.equal(adapter.parseDetail("<html>No schema</html>",items[0]).hold,"Original OpenDate detail lacks valid event schema");
const transformed=verified.map(x=>extract(x,src,now));
assert(transformed.every(x=>x.event));
assert.equal(transformed[0].event.category,"Music");
assert.equal(transformed[2].event.category,"Unclassified","Nonmusic fundraiser should not be guessed as music");
assert.equal(reconcile([],transformed).accepted.length,3,"Two different showtimes on same date do not conflict");
assert.equal(transformed[0].event.startsAt,"2026-10-28T20:00:00-07:00");
assert.equal(adapter.dateAndTime("Doors: 7:30 PM - Show: 8:00 PM").show,"20:00");
assert(!adapter.dateAndTime("Doors: TBD - Show: sometime"),"Unknown showtime is a hold");
assert.throws(()=>adapter.parseRoster("<html>Nothing</html>"),/Unexpected/);
console.log("PASS — first-party OpenDate roster dates, precise Portland time, original imagery, event-specific venue and cancellation checks.");
