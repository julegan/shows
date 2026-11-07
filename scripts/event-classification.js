"use strict";
/* Classification from event-specific ORIGINAL source evidence.
 * The venue's reputation, poster artwork, and artist familiarity alone
 * are never enough to claim a genre or a concert format.
 */
const STYLES=[
 {label:"Post-punk", rx:/\bpost[\s-]?punk\b/i},
 {label:"Hardcore", rx:/\bhardcore(?:\s+punk)?\b/i},
 {label:"Goth & darkwave", rx:/\b(?:goth(?:ic)?|darkwave|coldwave)\b/i},
 {label:"Industrial & EBM",rx:/\b(?:industrial\s+(?:music|DJ|night|dance|techno)|EBM|electronic body music)\b/i},
 {label:"Metal",rx:/\b(?:metal|metalcore|deathcore|doom metal|black metal|thrash metal)\b/i},
 {label:"Punk",rx:/\bpunk\b/i},
 {label:"Noise & experimental",rx:/\b(?:noise\s+(?:rock|music|show)|experimental\s+(?:music|sound|rock))\b/i},
 {label:"Rock",rx:/\b(?:rock\s+(?:music|show|concert|band|night)|rock[ -]?(?:n[ -]?)?roll)\b/i},
 {label:"Jazz",rx:/\b(?:jazz|bebop|hard bop|free jazz|jazz fusion|swing music)\b/i},
 {label:"Blues",rx:/\b(?:blues(?:\s+(?:music|band|show))?|delta blues)\b/i},
 {label:"Hip-hop & rap",rx:/\b(?:hip[\s-]?hop|rap(?:\s+(?:music|show|concert|artist|night))?|emcee)\b/i},
 {label:"R&B & soul",rx:/\b(?:r\s*&\s*b|rhythm\s+(?:and|&)\s+blues|neo[\s-]?soul|soul(?:\s+(?:music|night|band|show|revu[e]e))?)\b/i},
 {label:"Funk & disco",rx:/\b(?:funk|funky|disco|boogie)\b/i},
 {label:"Folk & bluegrass",rx:/\b(?:folk(?:\s+music)?|bluegrass|old[\s-]?time\s+music|acoustic\s+(?:music|show|duo))\b/i},
 {label:"Country",rx:/\b(?:country\s+(?:music|show|band|concert|artist|night|singer|songwriter)|country\s*(?:&|and)\s*americana|alt[\s-]?country|outlaw\s+country|honky[\s-]?tonk|country[\s-]?western)\b/i},
 {label:"Americana",rx:/\bamericana\b/i},
 {label:"Electronic & dance",rx:/\b(?:electronica|electronic\s+(?:music|show|set)|techno|trance|drum\s*(?:and|&)\s*bass|dnb|jungle\s+music|house\s+(?:music|DJ|night)|breakbeat|ambient\s+music)\b/i},
 {label:"Reggae & ska",rx:/\b(?:reggae|ska|dub\s+music|dancehall)\b/i},
 {label:"Global & traditional",rx:/\b(?:afrobeat|afro[\s-]?cuban|cumbia|salsa\s+(?:music|band)|balkan\s+music|traditional\s+(?:music|folk)|world\s+music)\b/i},
 {label:"Classical & chamber",rx:/\b(?:classical\s+music|chamber\s+music|string\s+quartet|symphony|symphonic)\b/i},
 {label:"Indie & alternative",rx:/\b(?:indie\s+(?:music|rock|pop|band)|alternative\s+(?:music|rock)|shoegaze|dream\s+pop|art\s+pop)\b/i},
 {label:"Pop",rx:/\b(?:pop\s+(?:music|show|concert)|synth[\s-]?pop|hyperpop|indie\s+pop|art\s+pop|dream\s+pop)\b/i}
];
const NON_MUSIC=/\b(?:trivia|karaoke|open[\s-]?mic|comedy|stand[\s-]?up|bingo|quiz|brunch|screening|movie|film|happy hour|tournament|board games?|game night)\b/i;
const EVENT_TYPES={
 Karaoke:/\bkaraoke\b/i,
 Workshops:/\b(?:workshop|class|lesson|seminar|skillshare)\b/i,
 "Arts & DIY":/\b(?:craft night|mask making|zine making|gallery|exhibition|art opening|craft fair)\b/i,
 Markets:/\b(?:market|bazaar|swap meet|record fair|vintage fair|pop[\s-]?up shop)\b/i,
 Performance:/\b(?:comedy|burlesque|drag show|film screening|movie night|theater performance|improv night|stand[\s-]?up)\b/i,
 Other:/\b(?:trivia|bingo|quiz|happy hour|tournament|game night|board game)\b/i
};
const MUSIC_CLAIM=/\b(?:live music|live bands?|music show|concert|live bands?|bands?\s+performing|rock show|gig|record release|album release|DJ(?:\s+set)?|rave)\b/i;
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
