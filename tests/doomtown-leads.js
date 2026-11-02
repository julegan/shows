'use strict';
const assert=require('node:assert/strict');
const s=require('../scripts/doomtown-leads.js');
const link='https://doomtownpdx.com/benefit-show-at-high-water-mark/';
const posts=[{id:12,link,title:{rendered:'Benefit Show at High Water Mark'},date:'2026-10-17T12:30:00',content:{rendered:'<p>Sat. Oct 17th Nyx Division Railing High Water Mark</p><img src="https://doomtownpdx.com/wp-content/uploads/2026/10/benefit.jpg">'}},{id:13,link:'https://doomtownpdx.com/iron-lung-at-black-water/',title:{rendered:'Iron Lung'},date:'2026-10-26T12:00:00',content:{rendered:'Thursday Oct. 26th Black Water'}},{id:14,link:'https://evil.example/post',title:{rendered:'Outside'},content:{rendered:'Bad'}},{id:12,link,title:{rendered:'Duplicate'},content:{rendered:'Bad'}}];
const found=s.parsePosts(posts);
assert.equal(found.length,2);
assert.equal(found[0].postedOn,'2026-10-17');
assert.equal(found[0].dateText,'Sat. Oct 17th');
assert(found[0].image.includes('benefit.jpg'));
assert.deepEqual(found[0].venues,['High Water Mark']);
assert.equal(found[1].dateText,'Thursday Oct. 26th');
assert.match(s.report(found,null),/publication dates are \*\*not\*\* event dates/);
assert.match(s.report([], 'HTTP 403'),/Source unavailable/);
assert.throws(()=>s.parsePosts(null),/WordPress JSON/);
const mock=async()=>({ok:true,status:200,headers:{get:()=> 'application/json; charset=utf-8'},text:async()=>JSON.stringify(posts)});
s.fetchLeads(mock).then(rows=>{assert.equal(rows.length,2);console.log('PASS — original Doomtown posts, image/venue provenance, no date inference, unavailability report');}).catch(e=>{console.error(e);process.exitCode=1;});

const newlyPrioritized=s.parsePosts([
 {id:97,link:'https://doomtownpdx.com/wyrd-hut-jan/',title:{rendered:'Shadowhouse at Wyrd Hut'},date:'2026-11-01T10:00:00',content:{rendered:'Jan 9 Wyrd Hut, Portland. See original artist and venue sources.'}},
 {id:98,link:'https://doomtownpdx.com/republic-cafe-diy-night/',title:{rendered:'Republic Cafe and Ming Lounge show leads'},date:'2026-11-01T11:00:00',content:{rendered:'Nov 7 Headspace Circus at Republic Cafe and Ming Lounge; check dated promoter post.'}}
]);
assert.deepEqual(newlyPrioritized[0].venues,['Wyrd Hut'],"Wyrd Hut must be included in ongoing scene discovery leads");
assert.deepEqual(newlyPrioritized[1].venues,['Republic Cafe','Ming Lounge'],"Republic and Ming aliases must not be lost");
assert.equal(newlyPrioritized[0].dateText,'Jan 9',"A yearless post date must remain an unverified lead, not an inferred calendar date");
