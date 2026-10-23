"use strict";
/* Classification from event-specific ORIGINAL source evidence.
 * The venue's reputation, poster artwork, and artist familiarity alone
 * are never enough to claim a genre or a concert format.
 */
const STYLES=[
 {label:"Post-punk", rx:/\bpost[\s-]?punk\b/i},
 {label:"Hardcore", rx:/\bhardcore(?:\s+punk)?\b/i},
 {label:"Goth & darkwave", rx:/\b(?:goth(?:ic)?|darkwave|coldwave)\b/i},
 {label:"Industrial & EBM",rx:/\b(?:industrial(?:\s+music)?|EBM|electronic body music)\b/i},
 {label:"Metal",rx:/\b(?:metal|metalcore|deathcore|doom metal|black metal|thrash metal)\b/i},
 {label:"Punk",rx:/\bpunk\b/i},
 {label:"Noise & experimental",rx:/\b(?:noise(?:\s+(?:rock|music))?|experimental(?:\s+music)?)\b/i},
 {label:"Rock",rx:/\brock(?:\s+(?:music|show|concert|band))?\b/i}
];
const NON_MUSIC=/\b(?:trivia|karaoke|open[\s-]?mic|comedy|stand[\s-]?up|bingo|quiz|brunch|screening|movie|film|happy hour|tournament|board games?|game night)\b/i;
const EVENT_TYPES={
 Workshops:/\b(?:workshop|class|lesson|seminar|skillshare)\b/i,
 "Arts & DIY":/\b(?:craft night|mask making|zine making|gallery|exhibition|art opening|craft fair)\b/i,
 Markets:/\b(?:market|bazaar|swap meet|record fair|vintage fair|pop[\s-]?up shop)\b/i,
 Performance:/\b(?:comedy|burlesque|drag show|film screening|movie night|theater performance|improv night|stand[\s-]?up)\b/i,
 Other:/\b(?:trivia|karaoke|bingo|quiz|happy hour|tournament|game night|board game)\b/i
};
const MUSIC_CLAIM=/\b(?:live music|live bands?|music show|concert|band(?:s)?(?:\s+performing)?|rock show|gig|record release|album release|DJ(?:\s+set)?|rave)\b/i;
function clean(v){return String(v??"").replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();}
function eventWords(item){
 // Title and source-specific tags/categories ONLY. Do not mine general venue descriptions.
 return [item.title,...(Array.isArray(item.categories)?item.categories:[]),...(Array.isArray(item.tags)?item.tags:[])]
 .filter(x=>typeof x==="string").map(clean).join(" ").slice(0,1250);
}
function musicStylesFromSource(item){
 const words=eventWords(item);
 const forbidden=Object.values(EVENT_TYPES).some(rx=>rx.test(words))||NON_MUSIC.test(words);
 if(forbidden)return [];
 const explicit=[];
 for(const style of STYLES){
  if(!style.rx.test(words))continue;
  // Avoid using a venue/brand name such as "School of Rock" as a style claim.
  if(style.label==="Rock"&&/\bschool of rock\b/i.test(words))continue;
  if(style.label==="Industrial & EBM"&&/\bindustrial(?: design| district| warehouse)\b/i.test(words))continue;
  if(style.label==="Noise & experimental"&&/\bnoise (?:complaint|ordinance)\b/i.test(words))continue;
  explicit.push(style.label);
 }
 return explicit.filter(v=>v!=="Punk"||!explicit.includes("Post-punk"));
}
function classifyEvent(item){
 const words=eventWords(item),title=clean(item.title);
 const fromSource=musicStylesFromSource(item);
 // Event-specific first-party schema.org type is a direct format assertion.
 const type=item.sourceEventType;
 if(type==="ComedyEvent")return {category:"Performance",musicStyles:[],evidence:"Source event type: ComedyEvent"};
 for(const [category,regex] of Object.entries(EVENT_TYPES)){
  if(regex.test(words))return {category,musicStyles:[],evidence:"Event-specific source wording"};
 }
 if(fromSource.length)return {category:"Music",musicStyles:fromSource,evidence:"Event-specific source genre wording"};
 if(type==="MusicEvent")return {category:"Music",musicStyles:[],evidence:"Source event type: MusicEvent"};
 if(item.sourceVerifiedMusic===true||MUSIC_CLAIM.test(words)||[...(Array.isArray(item.categories)?item.categories:[]),...(Array.isArray(item.tags)?item.tags:[])].some(x=>/^(?:Music|Concert|Live Music)$/i.test(String(x).trim()))){
  return {category:"Music",musicStyles:[],evidence:item.sourceVerifiedMusic===true?"Original source explicitly verifies music":"Event-specific source wording"};
 }
 return {category:"Unclassified",musicStyles:[],evidence:"No verified event type or genre"};
}
module.exports={classifyEvent,musicStylesFromSource,eventWords};
