#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const {analyze,shape,detail,ENDPOINT}=require("../scripts/probe-treetix-api");
assert.equal(ENDPOINT,"https://www.treetix.com/api/events.json");
assert.equal(shape([]),"array(0)");
assert.equal(shape(null),"null");
assert.deepEqual(detail({id:42,title:"A Show",other:{private:"do not publish"}}).relevantValues,{id:42,title:"A Show"});
const fixture={events:[
  {id:1,cal:"highwatermark",title:"Punk Show",start:"2026-11-15T20:00:00-08:00",image:"https://www.treetix.com/poster.jpg"},
  {id:2,cal:"soundcontrol",title:"Darkwave Show",date:"2026-11-20",venue:"High Water Mark"},
  {id:3,cal:"other",title:"Somewhere else"}
]};
const a=analyze(fixture);
assert.equal(a.directEntries,3);
assert.equal(a.targetMatches,2);
assert.equal(a.eventsContainer,"array(3)");
assert.equal(a.targetSamples[0].relevantValues.cal,"highwatermark");
assert.equal(a.targetSamples[1].relevantValues.venue,"High Water Mark");
assert.equal(analyze({events:{a:{id:1},b:{id:2}}}).directEntries,2);
assert.throws(()=>analyze({notEvents:[]}),/no events/);
assert.throws(()=>analyze({events:null}),/not an array or object/);
assert.equal(analyze({events:[]}).directEntries,0);
console.log("PASS — TreeTix read-only schema probe, object/array support, bounded public field samples");
