"use strict";
/* VenuePilot public, read-only, app-scoped events API.
 * This is NOT the website widget API. A 64-hex application id must be issued
 * independently by VenuePilot and supplied as a GitHub Actions secret.
 * Do not fetch events without permission; no fallback to private endpoints.
 */
const ACCOUNT_ID=3434; // Published in The Coffin's own public widget.
const ENDPOINT="https://public.api.venuepilot.com/graphql";
const QUERY=`query SHOWSCoffinEvents($filter: EventSearchArguments!, $after: String) {
 events(filter: $filter, first: 60, after: $after) {
  nodes { id slug name description startTime doorTime canceled ticketsUrl
   images { name highlighted variants { variant src } }
   venue { name street1 city state timezone }
  }
  pageInfo { hasNextPage endCursor }
 }
}`;
const localDay=()=>{
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).map(x=>[x.type,x.value]));
 return [parts.year,parts.month,parts.day].join("-");
};
function primaryTicketUrl(input){
 try{
  const u=new URL(input);
  if(u.protocol!=="https:"||u.hostname!=="tickets.venuepilot.com"||u.username||u.password||u.port||!/^\/e\/[a-z0-9][a-z0-9-]*$/i.test(u.pathname))return null;
  u.search="";u.hash="";return u.href;
 }catch(_){return null}
}
function getArtwork(images,pageUrl){
 if(!Array.isArray(images))return null;
 const pictures=[...images].sort((a,b)=>Number(!!b?.highlighted)-Number(!!a?.highlighted));
 for(const i of pictures){
  for(const v of Array.isArray(i?.variants)?i.variants:[]){
   try{
    const u=new URL(v?.src);
    if(u.protocol!=="https:"||u.username||u.password||u.href.length>1100||/\.svg$|\.gif$/i.test(u.pathname))continue;
    if(/logo|default|placeholder|tracking/i.test(u.pathname))continue;
    return {url:u.href,sourceUrl:pageUrl,origin:"official-event-page",credit:i.name||"Official ticketing event artwork",usageApproved:null};
   }catch(_){}
  }
 }
 return null;
}
function toEvent(item){
 if(!item||typeof item!=="object")return {hold:"Unusable event record"};
 const title=String(item.name||"").replace(/\s+/g," ").trim().slice(0,280);
 const venue=item.venue||{},url=primaryTicketUrl(item.ticketsUrl);
 if(item.canceled)return {hold:"Official ticketing record is canceled",title,url};
 if(!title||!url)return {hold:"No title or allowlisted original VenuePilot event ticket URL",title};
 if(!/^(?:the )?coffin(?: club)?$/i.test(String(venue.name||"").trim())||
    !/portland/i.test(String(venue.city||""))||
    !/^(?:or|oregon)$/i.test(String(venue.state||"").trim())||
    !/^421\s+(?:s(?:e|outheast)\s+)?grand\b/i.test(String(venue.street1||"").trim()))
   return {hold:"Ticketing venue identity/address not verified as The Coffin Portland",title,url};
 if(venue.timezone&&venue.timezone!=="America/Los_Angeles")return {hold:"Ticketing venue timezone conflicts with Portland",title,url};
 if(!item.startTime||!Number.isFinite(Date.parse(item.startTime)))return {hold:"Event has no valid official start time",title,url};
 if(item.doorTime&&Number.isFinite(Date.parse(item.doorTime))&&Date.parse(item.startTime)<Date.parse(item.doorTime))
  return {hold:"Event begins before its published door time",title,url};
 const artwork=getArtwork(item.images,url);
 return {title,fullUrl:url,venue:"The Coffin Club",startDate:item.startTime,
  timeEvidence:"VenuePilot official announced-event API startTime; editorial show/doors confirmation required",
  sourceVerifiedMusic:false,description:"VenuePilot account-approved official The Coffin ticket listing. "+String(item.description||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,450),
  ...(artwork?{artwork}:{})};
}
function parsePage(body){
 if(!body||typeof body!=="object"||!body.data?.events||Array.isArray(body.errors)&&body.errors.length)throw Error("Official VenuePilot API did not return a valid events connection");
 const e=body.data.events,p=e.pageInfo;
 if(!Array.isArray(e.nodes)||!p||typeof p.hasNextPage!=="boolean")throw Error("VenuePilot event schema changed; stop collection");
 return {events:e.nodes.map(toEvent),next:p.hasNextPage?p.endCursor:null,hasNext:p.hasNextPage};
}
async function fetchCoffinEvents({appId=process.env.COFFIN_VENUEPILOT_APP_ID,request=fetch,startDate=localDay()}={}){
 if(typeof appId!=="string"||!/^[0-9a-f]{64}$/.test(appId))throw Error("VenuePilot app ID missing or invalid. Provision integration and store COFFIN_VENUEPILOT_APP_ID in GitHub Actions secrets.");
 if(!/^\d{4}-\d\d-\d\d$/.test(startDate))throw Error("Invalid startDate");
 const all=[],seen=new Set();
 let after=null;
 for(let page=0;page<4;page++){
  const response=await request(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json","x-vp-app-id":appId,"User-Agent":"SHOWS-event-review/0.1"},
    body:JSON.stringify({operationName:"SHOWSCoffinEvents",query:QUERY,variables:{filter:{accountIds:[ACCOUNT_ID],startDate},after}}),
    signal:AbortSignal.timeout(16000),redirect:"error"});
  if(!response.ok)throw Error("VenuePilot public API HTTP "+response.status+"; verify integration access (credentials never logged)");
  const data=await response.json(),batch=parsePage(data);
  for(const e of batch.events){const key=e.fullUrl||e.title+"|"+e.hold;if(!seen.has(key)){seen.add(key);all.push(e)}}
  if(!batch.hasNext)return all;
  if(typeof batch.next!=="string"||!batch.next)throw Error("VenuePilot pagination cursor missing");
  after=batch.next;
 }
 throw Error("VenuePilot event pagination exceeds bounded 240-event window; adapter needs review");
}
module.exports={ACCOUNT_ID,ENDPOINT,QUERY,primaryTicketUrl,toEvent,parsePage,fetchCoffinEvents};
