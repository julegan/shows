"use strict";
/* Safely update already-approved source-discovered karaoke listings through the
 * existing review-PR pipeline. Never rewrite curated events, dates or URLs.
 */
const {classifyEvent}=require("./event-classification");
function reclassifyKaraoke(events){
 const changed=[];
 const updated=events.map(e=>{
  if(e.category!=="Other"||!e.discovery?.sourceId||!/\bkaraoke\b/i.test(String(e.title||"")))return e;
  const kind=classifyEvent({title:e.title,categories:e.sourceCategories||[]});
  if(kind.category!=="Karaoke")return e;
  changed.push({id:e.id,title:e.title,sourceId:e.discovery.sourceId});
  return {...e,category:"Karaoke",
    tags:(e.tags||[]).map(t=>t==="Source-listed Other"?"Source-listed Karaoke":t),
    classificationEvidence:kind.evidence};
 });
 return {events:updated,changed};
}
module.exports={reclassifyKaraoke};
