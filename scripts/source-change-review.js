"use strict";
// Advisory only: compare already-approved events with uniquely matching, observed source records.
// Absence from a calendar feed does not prove cancellation or rescheduling.
const normalizeUrl=(value)=>{
 try{
  const u=new URL(value);
  if(u.protocol!=="https:"||u.username||u.password||u.hash)return null;
  // A venue homepage or undated calendar is never a stable individual event identity.
  if(["/","/events","/events/","/shows","/shows/","/calendar","/calendar/"].includes(u.pathname))return null;
  if(u.pathname==="/calendar/event"&&!u.searchParams.get("eid"))return null;
  return u.href;
 }catch(_){return null;}
};
const field=record=>record?.event||record;
const idOf=record=>field(record)?.discovery?.sourceId||record?.sourceId||null;
const nowDate=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
function uniqueMatches(items,get){
 const counts=new Map();
 for(const x of items){
  const k=get(x);
  if(k)counts.set(k,(counts.get(k)||[]).concat([x]));
 }
 return counts;
}
function detectPublishedChanges(approved,observations,{today=nowDate()}={}){
 const old=uniqueMatches(approved.filter(e=>e.startsAt?.slice(0,10)>=today),e=>normalizeUrl(e.url));
 const live=uniqueMatches(observations,x=>normalizeUrl(field(x)?.url));
 const changes=[],ambiguous=[];
 for(const [url,matched] of old){
  if(!live.has(url))continue; // Missing from a feed is NOT an event cancellation.
  const incoming=live.get(url);
  if(matched.length!==1||incoming.length!==1){
   ambiguous.push({url,reason:"Same source URL represents multiple approved or observed events"});
   continue;
  }
  const previous=matched[0],found=incoming[0],entry=field(found),sourceId=idOf(found);
  const oldVenue=String(previous.venue||"").trim().toLowerCase();
  const newVenue=String(entry.venue||"").trim().toLowerCase();
  const oldDate=previous.startsAt?.slice(0,10);
  const newDate=entry.startsAt?.slice(0,10);
  const hold=String(found.hold||"");
  let change=null;
  // A specific official cancellation/postponement hold is review evidence,
  // not authorization to remove or change a published event.
  if(/cancel(?:led|ed|ation)?|postponed|rescheduled/i.test(hold)){
   change={kind:"Official status requires review",detail:hold};
  }else if(found.event&&newVenue&&oldVenue&&newVenue!==oldVenue){
   change={kind:"Venue changed",detail:previous.venue+" → "+entry.venue};
  }else if(found.event&&oldDate&&newDate&&oldDate!==newDate){
   change={kind:"Date changed",detail:oldDate+" → "+newDate};
  }else if(found.event&&oldDate===newDate&&previous.startTimeKind==="listed"&&entry.startTimeKind==="listed"&&previous.startsAt!==entry.startsAt){
   change={kind:"Listed time changed",detail:previous.startsAt.slice(11,16)+" → "+entry.startsAt.slice(11,16)};
  }
  if(change)changes.push({sourceId,venue:previous.venue,title:previous.title,url,kind:change.kind,detail:change.detail,approvedStartsAt:previous.startsAt,observedStartsAt:entry.startsAt||null});
 }
 return {changes,ambiguous};
}
function renderChangeReview(review){
 const items=review?.changes||[],ambiguous=review?.ambiguous||[];
 const lines=["## Changes to previously published events (review only)","",
  "Compared only **uniquely matched event-specific primary URLs** found again in this run. An event absent from a source feed is not proof of cancellation. Different labels for doors and showtime are not treated as changes. **Nothing is edited or deleted automatically.**","",
  "**Potential changes: "+items.length+"** · Ambiguous matching source URLs: "+ambiguous.length+".",""];
 if(items.length){
  lines.push("| Change | Venue and event | Approved → observed | Official event evidence |","| --- | --- | --- | --- |");
  for(const x of items)lines.push("| "+x.kind+" | "+String(x.venue+" — "+x.title).replace(/\|/g,"/")+" | "+String(x.detail).replace(/\|/g,"/")+" | "+x.url+" |");
 }else lines.push("No changed published events were confirmed by uniquely matching source records in this run.");
 if(ambiguous.length)lines.push("","The "+ambiguous.length+" ambiguous URLs were not classified as changes. Investigate duplicated or reused event links before updating any approved listing.");
 return lines.join("\n")+"\n";
}
module.exports={normalizeUrl,detectPublishedChanges,renderChangeReview};
