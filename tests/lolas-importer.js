"use strict";
const assert=require("node:assert/strict");
const lola=require("../scripts/lolas-importer");
const {extract}=require("../scripts/discover-events");
const venue=require("../discovery/sources.json").sources.find(x=>x.id==="lolas-room");
const url="https://www.mcmenamins.com/events/278429-2000s-dance-flashback";
const title="2000's Dance Flashback";
function index(rows=[{title,url,date:"11/14/2026"}]){
 const data=("{source:"+JSON.stringify(rows)+"}").replace(/&/g,"&amp;").replace(/"/g,"&quot;");
 return '<div id="eventAutoComplete" data-uk-autocomplete="'+data+'"></div>';
}
function card({venue="Lola's Room",date="Saturday, November 14",time="9pm doors, 9pm show",titleName=title}={}){
 return '<div class="uk-panel uk-panel-box tm-panel-card event detailed">'+
 '<div style="background-image:url(\'https://cdn.mcmenamins.com/system/uploads/MadborgAssets/danceflashback.jpg\');">'+
 '<a href="/events/278429-2000s-dance-flashback"><h3 class="uk-panel-title">'+titleName+'</h3></a></div>'+
 '<h3 class="uk-panel-title">'+date+'</h3><p class="uk-panel-time uk-text-truncate">'+time+'</p>'+
 '<h4>at <span>'+venue+'</span></h4></div>';
}
function page(rows, cards=[card(),card()]){return index(rows)+cards.join("");}
function detail({date="Saturday, November 14, 2026",heading=title,description="An original Lola's Room music and dance night."}={}){
 return '<html><body><nav>Lola\'s Room Music & Events</nav><section>'+date+
 '<h2>'+heading+'</h2>9pm doors, 9pm show 21 and over<p>'+description+'</p>'+
 '</section><h2>Upcoming Events at Lola\'s Room</h2></body></html>';
}
const rows=[{title,url,date:"11/14/2026"}];
const found=lola.roster(page(rows));
assert.equal(found.length,1,"Duplicate desktop/mobile cards collapse to one");
assert.equal(found[0].venue,"Lola's Room");
assert.equal(found[0].startDate,"2026-11-15T05:00:00.000Z");
assert.equal(found[0].artwork.usageApproved,null);
assert(!found[0].sourceVerifiedMusic);
assert.equal(lola.detail(detail(),found[0]).fullUrl,url);
assert.match(lola.detail(detail({date:"Sunday, November 15, 2026"}),found[0]).hold,/disagrees/);
assert.match(lola.detail(detail({heading:"Different show"}),found[0]).hold,/differs/);
assert.match(lola.detail(detail({description:"Ticket allows access to the Crystal Ballroom AND the Lola's Room party."}),found[0]).hold,/multiple/);
assert.match(lola.detail(detail({description:"Four floors of the Crystal complex host this event."}),found[0]).hold,/multiple/);
assert(lola.roster(page(rows,[card(),card({venue:"Crystal Ballroom"})])).some(x=>x.skip));
assert(lola.roster(page(rows,[card({time:"1-7pm"})])).some(x=>x.hold));
assert(lola.roster(page(rows,[card({date:"Friday, November 14"})])).some(x=>x.hold));
assert(lola.roster(page(rows,[card(),card({time:"8pm show"})])).some(x=>x.hold));
assert.throws(()=>lola.roster("no source"),/roster/);
assert.equal(lola.dateFromRecord(rows[0],"Saturday, November 14").fullDate,"2026-11-14");
assert.equal(lola.dateFromRecord({...rows[0],date:"11/31/2026"},"Tuesday, November 31"),null);
assert.equal(lola.dateFromRecord({...rows[0],date:"11/14"},"Saturday, November 14"),null);
assert.equal(lola.dateFromRecord(rows[0],"Friday, November 14"),null);
assert.equal(lola.detail(detail(),found[0]).timeEvidence.includes("full date"),true);
(async()=>{
 const request=async u=>{
  assert(u===lola.CALENDAR_URL||u===url,"Only first-party allowlisted Lola pages");
  const html=u===lola.CALENDAR_URL?page(rows):detail();
  return {ok:true,status:200,headers:{get:()=> "text/html; charset=utf-8"},
   body:new ReadableStream({start(ctrl){ctrl.enqueue(new TextEncoder().encode(html));ctrl.close();}})};
 };
 const data=await lola.fetchEvents({...venue,baseUrl:lola.ROOT},{request});
 assert.equal(data.length,1);
 assert.equal(data[0].fullUrl,url);
 const src={...venue,status:"pilot-enabled",adapter:"lolas-mcmenamins-html",baseUrl:lola.ROOT,address:"1332 W Burnside St, Portland, OR 97209",neighborhood:"West End"};
 // Extract can link through only original McMenamins event pages.
 const existingSrc=require("../discovery/sources.json").sources.find(s=>s.id==="mission-theater");
 const extracted=extract(data[0],{...existingSrc,...src},new Date("2026-11-02T12:00:00-08:00"));
 assert(extracted.event,JSON.stringify(extracted));
 assert.equal(extracted.event.venue,"Lola's Room");
 assert.equal(extracted.event.startTimeKind,"listed");
 assert.equal(extracted.event.endsAt,null);
 await assert.rejects(lola.fetchEvents({...venue,baseUrl:lola.ROOT},{request:async()=>({ok:false,status:403,headers:{get:()=>"text/html"}})}),/never equate/);
 console.log("PASS — Lola room-specific full-year/date reconciliation, original detail checks, multiroom holds, source URL safety, Pacific DST and no automatic publication");
})().catch(e=>{console.error(e);process.exitCode=1});
