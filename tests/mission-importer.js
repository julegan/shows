"use strict";
const assert=require('node:assert/strict'),a=require('../scripts/mission-importer'),{extract,reconcile}=require('../scripts/discover-events');
const src=require('../discovery/sources.json').sources.find(s=>s.id==='mission-theater');
const url='https://www.mcmenamins.com/events/277583-gully-boys';
function card({title='Gully Boys Pollyanna Nonbinary Girlfriend',venue='Mission Theater',date='Friday, November 6',time='7pm doors, 8pm show'}={}){return '<div class="uk-panel uk-panel-box tm-panel-card event detailed"><div style="background-image:url(\'https://cdn.mcmenamins.com/system/uploads/MadborgAssets/GullyBoys26.jpg\');"><a href="'+url+'"><h3 class="uk-panel-title">'+title+'</h3></a></div><h3 class="uk-panel-title">'+date+'</h3><p class="uk-panel-time uk-text-truncate">'+time+'</p><h4>at <span>'+venue+'</span></h4></div>';}
const record={title:'Gully Boys / Pollyanna / Nonbinary Girlfriend',url,date:'11/6/2026'};
function page(cards=[card()],rows=[record]){const data=('{source:'+JSON.stringify(rows)+'}').replace(/&/g,'&amp;').replace(/"/g,'&quot;');return '<div id="eventAutoComplete" data-uk-autocomplete="'+data+'"></div>'+cards.join('');}
const e=a.parseRoster(page())[0];assert.equal(e.startDate,'2026-11-07T04:00:00.000Z');assert(e.artwork);assert.equal(e.artwork.usageApproved,null);assert(!e.sourceVerifiedMusic);assert(!e.title.includes('West End'));
assert.equal(a.parseRoster(page([card(),card()])).length,1);
assert(a.parseRoster(page([card(),card({time:'9pm show'})])).every(x=>!x.startDate),'Conflicting cards cannot leave accepted copy');
assert(a.parseRoster(page([card(),card({venue:'All Locations'})])).some(x=>x.skip));
for(const changed of [{date:'Thursday, November 6'},{title:'Other Artist'},{time:'7pm doors'},{time:'TBA'},{time:'9pm doors, 8pm show'}])assert.throws(()=>a.parseRoster(page([card(changed)])),/No dated Mission-owned cards/);
assert.throws(()=>a.parseRoster(page([card()],[record,{...record,date:'11/7/2026'}])),/Contradictory/);
assert.throws(()=>a.parseRoster(card()),/search data missing/);
assert.equal(a.eventUrl(url+'?ref=x'),null);assert.equal(a.eventUrl(url.replace('www.mcmenamins.com','evil.invalid')),null);
const presentation=a.parseRoster(page([card({time:'6pm doors, 7pm presentation'})]))[0];assert.deepEqual(presentation.categories,['Presentation']);assert(!presentation.sourceVerifiedMusic);
const film=a.parseRoster(page([card({time:'6pm film'})]))[0];assert.deepEqual(film.categories,['Film screening']);
assert.equal(a.times('1pm').kind,'listed');assert.equal(a.times('8pm doors, 8pm dance').kind,'dance');assert.equal(a.times('6pm show, 8pm show'),null);
assert.equal(a.parseRoster(page([card({date:'Thursday, October 29'})],[{...record,date:'10/29/2026'}]))[0].startDate,'2026-11-?'.replace('2026-11-?','2026-10-30T03:00:00.000Z'));
const event=extract(e,src,new Date('2026-10-29T12:00:00-07:00')).event;assert(event);assert.equal(event.category,'Unclassified');assert.deepEqual(event.musicStyles,[]);assert.equal(event.endsAt,null);
assert.equal(reconcile([{...event,id:'manual-gully',title:'Gully Boys with Pollyanna and Nonbinary Girlfriend'}],[{event}]).skipped.length,1);
assert.equal(reconcile([{...event,id:'manual-gully',title:'Gully Boys with Pollyanna',startsAt:'2026-11-06T21:00:00-08:00'}],[{event}]).held.length,1);
(async()=>{const original=global.fetch;let calls=0;try{global.fetch=async()=>{calls++;return {ok:true,headers:{get:()=> 'text/html'},text:async()=>page()};};assert.equal((await a.fetchEvents(src)).length,1);assert.equal(calls,1,'Entire venue roster uses one public request');}finally{global.fetch=original;}console.log('PASS — Mission year-bearing source/card agreement, Pacific/DST, formats, conflicting copies, one-request intake and curated-ID preservation');})().catch(e=>{console.error(e);process.exitCode=1;});
