"use strict";
const registry=require("../discovery/reviewed-classifications.json");
const {STYLE_LABELS}=require("./event-classification");
const ALLOWED_STYLES=new Set(STYLE_LABELS);
function forEvent({url,title,venue,date}){
 if(!url||!title||!venue||!date)return null;
 const match=registry.entries.find(e=>e.url===url&&e.title===title&&e.venue===venue&&e.date===date);
 if(!match)return null;
 return validateReviewedClassification(match);
}
function validateReviewedClassification(match){
 if(!match||match.category!=="Music"||!Array.isArray(match.musicStyles)||!/^https:\/\//.test(match.evidenceUrl||""))
  throw Error("Reviewed classification registry is invalid");
 if(!match.musicStyles.every(x=>ALLOWED_STYLES.has(x))||new Set(match.musicStyles).size!==match.musicStyles.length)
  throw Error("Nonstandard or duplicate reviewed music genre");
 return {category:match.category,musicStyles:[...match.musicStyles],evidence:"Manually reviewed event-specific performance evidence",evidenceUrl:match.evidenceUrl};
}
module.exports={forEvent,validateReviewedClassification};
