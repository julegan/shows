"use strict";
/* First-party organizer evidence for a precisely scoped existing show series.
 * This registry is NOT a recurrence generator or an artist-name genre guess.
 * Individual events still require a verified original venue occurrence.
 */
const THESIS_EVIDENCE="https://thethesispdx.com/about/";
function forEvent(item){
 if(!item||typeof item!=="object")return null;
 if(item.sourceId!=="alberta-street-pub"||item.venue!=="Alberta Street Pub")return null;
 // The Thesis organizer explicitly describes THIS showcase series as local
 // hip-hop. Its mixed lineup does not justify labeling every bill R&B/soul.
 const title=String(item.title||"").replace(/<[^>]*>/g," ").trim();
 if(!/^The Thesis(?:$|[\s]*[-–—:|]\s*|\s+Starring\b|\s+with\b)/i.test(title))return null;
 try{
  const u=new URL(item.fullUrl||item.url||"");
  if(u.protocol!=="https:"||u.hostname!=="www.albertastreetpub.com"||
     u.username||u.password||u.port||u.search||u.hash||
     !/^\/music\/20\d\d\/(?:[1-9]|1[0-2])\/(?:[1-9]|[12]\d|3[01])\/[a-z0-9][a-z0-9-]{1,220}\/?$/i.test(u.pathname))
   return null;
  return {category:"Music",musicStyles:["Hip-hop & rap"],
   evidence:"Original series organizer verifies hip-hop showcase identity at this venue",
   evidenceUrl:THESIS_EVIDENCE};
 }catch(_){return null;}
}
module.exports={THESIS_EVIDENCE,forEvent};
