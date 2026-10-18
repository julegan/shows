"use strict";
const assert=require("node:assert/strict");
const registry=require("../discovery/sources.json");
const sources=registry.sources;
const order=["twilight","black-water","high-water","soundcontrol-pdx","star-theater"];
assert.deepEqual(sources.slice(0,5).map(s=>s.id),order,"User-preferred venues must lead source registry");
assert.deepEqual(registry.editorialPriority,[
  "Twilight Cafe and Bar","Black Water","High Water Mark Lounge","Soundcontrol PDX","Star Theater"
]);
assert.equal(new Set(sources.map(s=>s.id)).size,sources.length,"Source IDs unique");
const byId=Object.fromEntries(sources.map(s=>[s.id,s]));
for(const id of order){
  assert.equal(byId[id].priority,"highest",id+" has highest editorial priority");
  assert(byId[id].url?.startsWith("https://"),"Official source URL: "+id);
}
assert.equal(byId["soundcontrol-pdx"].type,"promoter");
assert.equal(byId["soundcontrol-pdx"].venue,null,"Multi-venue promoter never gets a fixed venue");
assert.equal(byId["black-water"].status,"source-blocked","Do not bypass official access restrictions");
assert.equal(byId["no-fun"].priority,"secondary");
assert.equal(byId["no-fun"].status,"pilot-enabled","Keep existing technical pilot working until new adapters pass tests");
const enabled=sources.filter(s=>s.status==="pilot-enabled");
assert.deepEqual(enabled.map(s=>s.id),["twilight","soundcontrol-pdx","star-theater","no-fun"]);
assert(enabled.every(s=>["twilight-html","promoter-list-html","star-theater-html","squarespace-json"].includes(s.adapter)),"No unsupported adapter may run");
console.log("PASS — five original priority sources first, promoter location unassigned, Black Water access respected and No Fun pilot intact.");
