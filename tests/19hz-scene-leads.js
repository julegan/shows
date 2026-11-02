"use strict";
const assert=require("node:assert/strict");
const s=require("../scripts/19hz-scene-leads.js");
const now=new Date("2026-11-02T12:00:00-08:00");
function row({d="Tue: Nov 3",date="2026/11/03",title="No Exit",venue="The Coffin Club",tags="industrial, darkwave",url="https://tickets.example.com/nov3",promoter="Portland goth night"}={}){
 return "<tr><td>"+d+" <br />(9pm-1am)</td><td><a href='"+url+"'>"+title+"</a> @ "+venue+" (Portland, OR)"+ 
 "<td>"+tags+"</td><td>$15 | 21+</td><td>"+promoter+"</td><td></td><td><div class='shrink'>"+date+"</div></td></tr>";
}
function page(items){return "<html><body><p>NOTICE: This listing is automatically generated and not reviewed for accuracy</p><table><thead><tr><th>Date</th></tr></thead><tbody>"+
 items.join("")+"</tbody></table></body></html>"+(" filler".repeat(350));}
const good=[
 row(), // priority and genre
 row({title:"No Exit at The Coffin Club"}), // should dedupe by normalizer? title normalization only strips "at ...", so yes
 row({d:"Fri: Nov 6",date:"2026/11/06",title:"Wild Avant",venue:"Not a Preferred Place",tags:"experimental, noise",url:"https://dice.fm/event/nov6"}),
 row({d:"Sat: Nov 7",date:"2026/11/07",title:"Top 40 Night",venue:"Republic Cafe and Ming Lounge",tags:"party",url:"https://ticketweb.com/event/republic7"}),
 row({d:"Sat: Nov 7",date:"2026/11/07",title:"Big Room EDM",venue:"Elsewhere",tags:"dubstep",url:"https://eventbrite.com/e/elsewhere7",promoter:"Mainstream Party"}),
 row({d:"Sat: Nov 7",date:"2026/11/07",title:"Out of Area",venue:"The Coffin Club (Seattle, WA)",tags:"goth",url:"https://tickets.example.com/outside"}),
 row({d:"Fri: Nov 7",date:"2026/11/07",title:"Wrong weekday",tags:"industrial",url:"https://tickets.example.com/wrong"}),
 row({d:"Sat: Nov 7",date:"2026/11/07",title:"Wrong ticket",tags:"goth",url:"http://tickets.example.com/unsafe"}),
 row({d:"Tue: Nov 3",date:"2026/11/03",title:"Foreign city",venue:"White Owl (Eugene, OR)",tags:"experimental",url:"https://tickets.example.com/foreign"})
];
assert.equal(s.dateOf("2026/11/03","Tue: Nov 3"),"2026-11-03");
assert.equal(s.dateOf("2026/11/03","Wed: Nov 3"),null);
assert.equal(s.dateOf("2026/11/31","Mon: Nov 31"),null);
assert.equal(s.dateOf("2026/11/03","Nov 3"),null);
assert.equal(s.urlOf("https://ticketweb.com/event/1?utm_source=19hz"),"https://ticketweb.com/event/1");
assert.equal(s.urlOf("http://ticketweb.com/event/1"),null);
assert.equal(s.urlOf("javascript:alert(1)"),null);
assert.equal(s.urlOf("https://127.0.0.1/x"),null);
assert.equal(s.venueMatch("The Coffin Club").id,"coffin-club");
assert.equal(s.venueMatch("Ming Lounge").id,"republic-cafe");
assert.equal(s.venueMatch("Elsewhere"),null);
const got=s.parse(page(good),now);
assert.equal(got.leads.length,3,JSON.stringify(got.leads));
assert.equal(got.leads.filter(x=>x.priorityVenue).length,2);
assert.equal(got.leads.filter(x=>!x.priorityVenue).length,1);
assert(got.leads.every(x=>x.secondaryUrl===s.SOURCE));
assert(got.leads.every(x=>/Unverified secondary/.test(x.caveat)));
assert(got.holds.some(x=>/weekday/i.test(x.reason)));
const result=s.report(got,null);
assert.match(result,/automatically generated and not reviewed for accuracy/);
assert.match(result,/0 automatically approved/);
assert.match(result,/Portland goth night/);
assert.doesNotMatch(result,/Foreign city/);
assert.match(result,/Top 40 Night/,"Preferred venue may surface genre-unclassified leads for editorial review");
assert.match(s.report(null,"HTTP 429"),/unavailable\/changed/i);
assert.throws(()=>s.parse(page(good).replace(/automatically generated and not reviewed for accuracy/,"verified source"),now),/unreviewed-source notice missing/);
(async()=>{
 const request=async url=>{
  assert.equal(url,s.SOURCE);
  const html=page(good);
  return {ok:true,status:200,headers:{get:()=> "text/html"},
   body:new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(html));c.close()}})};
 };
 const records=await s.fetchLeads({request,now});
 assert.equal(records.leads.length,3);
 await assert.rejects(s.fetchLeads({request:async()=>({ok:false,status:429,headers:{get:()=>"text/html"}})}),/HTTP 429/);
 console.log("PASS — 19hz unreviewed-source discovery, strict Portland venue/genre filters, date/weekday validation, dedupe, 429 source hold and zero publication");
})().catch(e=>{console.error(e);process.exitCode=1});
