"use strict";
const registry=require("../discovery/reviewed-classifications.json");
function forEvent({url,title,venue,date}){
 if(!url||!title||!venue||!date)return null;
 const match=registry.entries.find(e=>e.url===url&&e.title===title&&e.venue===venue&&e.date===date);
 if(!match)return null;
 if(match.category!=="Music"||!Array.isArray(match.musicStyles)||!/^https:\/\//.test(match.evidenceUrl))throw Error("Reviewed classification registry is invalid");
 const allowed=new Set(["Punk","Hardcore","Metal","Rock","Post-punk","Noise & experimental","Goth & darkwave","Industrial & EBM"]);
 if(!match.musicStyles.every(x=>allowed.has(x)))throw Error("Nonstandard reviewed genre");
 return {category:match.category,musicStyles:[...match.musicStyles],evidence:"Manually reviewed event-specific performance evidence",evidenceUrl:match.evidenceUrl};
}
module.exports={forEvent};
