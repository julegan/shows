#!/usr/bin/env node
"use strict";
/* SECONDARY ONLY. 19hz says its listings are automatically generated and
 * NOT reviewed. Source discovery is not calendar publication. No fetching
 * outbound ticket links, copying flyers, or inferred doors/show clocks.
 */
const fs=require("node:fs");
const path=require("node:path");
const {URL: NodeURL}=require("node:url");
const SOURCE="https://19hz.info/eventlisting_ORE.php";
const REPORT=path.join(__dirname,"../discovery/oregon-electronic-leads-review.md");
const VENUES=require("../discovery/venues.json");
const LIMIT=600000,MAX_ROWS=350;
const ACTIVE=VENUES.venues.filter(v=>VENUES.editorialActiveVenueIds.includes(v.id));
const TOKENS=/\b(?:goth|darkwave|industrial|ebm|post.punk|coldwave|noise|experimental|jungle|drum\s*(?:and|&|n)\s*bass|hard\s*techno|synthpop|electroclash|breaks?|techno|ambient|hardcore|queer)\b/i;
function plain(s){return String(s||"").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<[^>]*>/g," ").replace(/&(?:amp|#38);/gi,"&").replace(/&(?:quot|#34);/gi,'"').replace(/&#(?:39|x27);|&apos;/gi,"'").replace(/&nbsp;/gi," ").replace(/\s+/g," ").trim();}
function clean(s){return plain(s).replace(/[\r\n|]/g," ").slice(0,170);}
const norm=s=>plain(s).toLowerCase().replace(/[^a-z0-9]/g,"");
function urlOf(text){
 try{
  const u=new NodeURL(String(text||"").replace(/&amp;/gi,"&"));
  if(!["https:","http:"].includes(u.protocol)||u.username||u.password||u.port||u.href.length>1400||
    /^(?:localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0)/.test(u.hostname))return null;
  // Never make a request to this link. Keep first-party ticket/artist source
  // ONLY as a research lead and strip identifying/ad parameters.
  if(u.protocol!=="https:")return null;
  return u.origin+u.pathname;
 }catch{return null;}
}
function venueMatch(name){
 const n=norm(name);
 return ACTIVE.find(v=>[v.name,...(v.aliases||[])].some(a=>norm(a)===n))||null;
}
function dateOf(value,dayLabel){
 const d=/^(20\d{2})\/(\d{2})\/(\d{2})$/.exec(plain(value));
 if(!d)return null;
 const yr=+d[1],mo=+d[2],day=+d[3],dt=new Date(Date.UTC(yr,mo-1,day));
 if(dt.getUTCFullYear()!==yr||dt.getUTCMonth()!==mo-1||dt.getUTCDate()!==day)return null;
 const m=/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun):/i.exec(plain(dayLabel));
 if(!m||["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dt.getUTCDay()].toLowerCase()!==m[1].toLowerCase())return null;
 return [yr,String(mo).padStart(2,"0"),String(day).padStart(2,"0")].join("-");
}
function parse(html,now=new Date()){
 const body=String(html||"");
 if(body.length<2000||body.length>LIMIT)throw Error("19hz source unavailable or unexpectedly large");
 if(!/automatically generated and not reviewed for accuracy/i.test(plain(body)))throw Error("19hz unreviewed-source notice missing; inspect changed format");
 const rows=[...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi)].map(m=>m[1]);
 if(rows.length<3||rows.length>MAX_ROWS)throw Error("19hz table row count changed");
 const results=[],held=[],seen=new Set();
 for(const raw of rows){
  const cells=[...raw.matchAll(/<td(?:\s[^>]*)?>/gi)];
  if(cells.length!==7)continue; // header and other tables
  const c=cells.map((m,i)=>raw.slice(m.index+m[0].length,cells[i+1]?.index||raw.length).replace(/<\/td\s*>/gi," "));
  const dayLabel=plain(c[0]),date=dateOf(c[6],dayLabel);
  if(!date){held.push({reason:"Missing or conflicting full date/weekday",dateText:clean(dayLabel)});continue;}
  const afterMidnight=new Date(date+"T00:00:00-08:00");
  // Compare calendar days in Pacific, not user workstation timezone;
  // allow yesterday as grace for overnight listings without inferring time.
  const days=(afterMidnight.getTime()-now.getTime())/86400000;
  if(days< -2||days>182)continue;
  const titleHtml=c[1],anchor=titleHtml.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
  const title=clean(anchor?.[2]),lead=urlOf(anchor?.[1]);
  const venueText=plain(titleHtml.slice(anchor?.index!==undefined?anchor.index+anchor[0].length:0));
  const vm=/@\s*(.+?)\s*\(Portland,\s*OR\)\s*$/i.exec(venueText),venue=vm?.[1]?.trim()||"";
  // Restrict to Portland city listings; do not imply a 25 mile geofence from
  // secondary venue text (no coordinates). Original link is required.
  if(!venue||/[()]/.test(venue)||/^(?:TBA|unknown|undisclosed|secret)(?:\b|\s)/i.test(venue)||!title||!lead)continue;
  const tags=clean(c[2]),promoter=clean(c[4]),preferred=venueMatch(venue);
  const matchGenre=TOKENS.test(tags+" "+title+" "+promoter);
  if(!preferred&&!matchGenre)continue;
  const dedupKey=date+"|"+norm(venue)+"|"+norm(title.replace(/\s+(?:at|@)\s+.+$/i,""));
  if(seen.has(dedupKey))continue;
  seen.add(dedupKey);
  results.push({date,title,venue,priorityVenue:preferred?.id||null,genre:tags||"Not categorized",
    organizer:promoter||"Not listed",originalLeadUrl:lead,secondaryUrl:SOURCE,
    why:preferred?"Preferred SHOWS venue"+(matchGenre?" + relevant music tag":""):"Relevant electronic / dark music tag",
    caveat:"Unverified secondary listing; original ticket/venue/artist must confirm year, venue, bill, show vs doors clock and art permission"});
 }
 if(!results.length)throw Error("No relevant source rows validated, not proof of zero underground shows");
 return {sourceRows:rows.length,leads:results.sort((a,b)=>a.date.localeCompare(b.date)),holds:held};
}
function report(out,error){
 const lines=["# Portland electronic scene leads — 19hz (review-only)","",
 "**19hz explicitly says its calendar is automatically generated and not reviewed for accuracy.** These rows are discovery leads only, **not verified SHOWS events**, not an endorsement of every music genre or booking, and not an event importer. Follow the original ticket, artist or venue link and check the actual bill, local year/date and time type before proposing anything.",""];
 if(error){lines.push("**Source unavailable/changed:** "+clean(error)+". No event changes or deletions were made.","");return lines.join("\n")+"\n";}
 const matches=out.leads.filter(x=>x.priorityVenue),genres=out.leads.filter(x=>!x.priorityVenue);
 lines.push("**"+out.sourceRows+" public table rows checked; "+out.leads.length+" distinct relevant research leads ("+matches.length+" preferred-venue, "+genres.length+" other genre-relevant), "+out.holds.length+" date/weekday holds; 0 automatically approved.**",
 "",
 "| Date (unverified) | Event / original link | Venue | 19hz category / promoter | Research relevance |",
 "| --- | --- | --- | --- | --- |");
 for(const x of out.leads.slice(0,90))lines.push("| "+x.date+" | ["+clean(x.title)+"]("+x.originalLeadUrl+") | "+clean(x.venue)+" | "+clean(x.genre)+" / "+clean(x.organizer)+" | "+clean(x.why)+" |");
 if(out.leads.length>90)lines.push("","**"+(out.leads.length-90)+" additional relevant entries omitted from this bounded report.**");
 lines.push("",
 "No outbound tickets were requested and no 19hz images were copied. Source may have duplicate or stale listings; event deduplication against approved SHOWS entries happens during a separate editorial review. A 'TBA' venue may appear in other listings and is excluded here without a confirmed location. Discovery filters prioritize active SHOWS venues and dark/experimental/underground electronic tags rather than generic mainstream EDM.","");
 return lines.join("\n")+"\n";
}
async function fetchLeads({request=fetch,now=new Date()}={}){
 const r=await request(SOURCE,{redirect:"error",headers:{Accept:"text/html","User-Agent":"SHOWS-research-only/0.1"},signal:AbortSignal.timeout(15000)});
 if(!r.ok||!String(r.headers.get("content-type")||"").toLowerCase().includes("text/html"))throw Error("19hz original listing HTTP "+r.status);
 const reader=r.body?.getReader();if(!reader)throw Error("19hz source unreadable");
 const bufs=[];let n=0;
 for(;;){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;
  if(n>LIMIT){await reader.cancel();throw Error("19hz original listing exceeds byte limit");}bufs.push(Buffer.from(value));}
 return parse(Buffer.concat(bufs).toString("utf8"),now);
}
async function main(){
 let out=null,error=null;
 try{out=await fetchLeads();}catch(e){error=e.message||String(e);}
 fs.writeFileSync(REPORT,report(out,error));
 console.log("19hz secondary scene review: "+(out?.leads.length||0)+" relevant leads, "+(out?.holds.length||0)+" source holds, 0 approved"+(error?" error: "+error:""));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={SOURCE,MAX_ROWS,venueMatch,dateOf,parse,report,fetchLeads,urlOf};
