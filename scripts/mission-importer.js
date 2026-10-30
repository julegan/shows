"use strict";
const {wallToPacific,time24,artworkCandidate}=require('./priority-importers');
const {plain}=require('./aladdin-importer');
const ROOT='https://www.mcmenamins.com',CALENDAR_URL=ROOT+'/mission-theater',VENUE='Mission Theater';
const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
function eventUrl(raw){try{const u=new URL(raw,ROOT);return u.origin===ROOT&&!u.username&&!u.password&&!u.search&&!u.hash&&/^\/events\/\d{4,8}-[a-z0-9-]+$/.test(u.pathname)?u.href:null;}catch{return null;}}
function times(raw){
 const text=plain(raw),rx=/(\d{1,2}(?::\d\d)?\s*[ap]m)\s*(doors|show|presentation|dance|event|film)?/gi;
 const matches=[...text.matchAll(rx)],starting=matches.filter(m=>m[2]?.toLowerCase()!=='doors');
 if(starting.length!==1)return null;
 return {clock:time24(starting[0][1]),kind:starting[0][2]?.toLowerCase()||'listed',doors:matches.find(m=>m[2]?.toLowerCase()==='doors')?.[1]};
}
const norm=s=>plain(s).toLowerCase().replace(/[^a-z0-9]/g,'');
function sourceIndex(html){
 const tags=[...String(html).matchAll(/<div id="(?:mobileEventAutoComplete|eventAutoComplete)"[^>]*data-uk-autocomplete="([^"]+)"/g)];
 if(!tags.length)throw Error('Mission official year-bearing search data missing');
 const byUrl=new Map();byUrl.invalidRecords=[];
 for(const m of tags){
 const decoded=m[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&#39;/g,"'");
 if(!decoded.startsWith('{source:')||!decoded.endsWith('}'))throw Error('Mission search data format changed');
 let rows;try{rows=JSON.parse(decoded.slice(8,-1));}catch{throw Error('Mission year-bearing search data is not valid JSON');}
 if(!Array.isArray(rows)||!rows.length||rows.length>120)throw Error('Mission event search data empty or oversized');
 for(const row of rows){
 const url=eventUrl(row.url);if(!url||typeof row.title!=='string'||!/^\d{1,2}\/\d{1,2}\/20\d{2}$/.test(row.date||'')){byUrl.invalidRecords.push({hold:'Source search record lacks usable full-year date or event identity: '+String(row.date||'unknown').slice(0,80),title:String(row.title||'Unknown source title').slice(0,250),url:url||undefined});continue;}
 const old=byUrl.get(url);if(old&&(old.date!==row.date||norm(old.title)!==norm(row.title)))throw Error('Contradictory Mission search records');byUrl.set(url,row);
 }
 }
 return byUrl;
}
function parseRoster(html){
 const raw=String(html),starts=[...raw.matchAll(/<div class="[^"]*\bevent detailed(?: movie)?"[^>]*>/g)];
 if(!starts.length||starts.length>180)throw Error('Mission detailed roster missing or exceeds bounded source count');
 const index=sourceIndex(raw),rows=[...index.invalidRecords],seen=new Map();
 for(let i=0;i<starts.length;i++){
 const c=raw.slice(starts[i].index,starts[i+1]?.index||raw.length).slice(0,24000);
 const title=plain(c.match(/<h3 class="uk-panel-title">([\s\S]*?)<\/h3>/)?.[1]);
 const url=eventUrl(c.match(/<a\b[^>]*href="([^"]+)"/)?.[1]||'');
 const venue=plain(c.match(/at\s*<span>([^<]+)<\/span>/)?.[1]);
 if(venue!==VENUE){rows.push({skip:'Non-Mission venue or all-location promotion',title,venue});continue;}
 const heads=[...c.matchAll(/<h3 class="uk-panel-title">([\s\S]*?)<\/h3>/g)].map(m=>plain(m[1]));
 const date=heads.find(x=>/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),/.test(x));
 const time=plain(c.match(/<p class="uk-panel-time[^\"]*">([\s\S]*?)<\/p>/)?.[1]);
 const image=c.match(/background-image:url\('([^']+)'\)/)?.[1];
 if(!url||!title||!date||!times(time)){rows.push({hold:'Mission card lacks event identity, date or unambiguous published start',title,url});continue;}
 const record=index.get(url),start=times(time),fail=hold=>rows.push({hold,title,url});
 if(!record||norm(record.title)!==norm(title)){fail('Original Mission search billing and card disagree');continue;}
 const [month,day,year]=record.date.split('/').map(Number),dt=new Date(Date.UTC(year,month-1,day));
 const expected=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dt.getUTCDay()]+', '+months[month-1]?.replace(/^./,c=>c.toUpperCase())+' '+day;
 if(dt.getUTCFullYear()!==year||dt.getUTCMonth()!==month-1||dt.getUTCDate()!==day||date!==expected){fail('Source year/date and printed weekday disagree');continue;}
 if(/\b(?:cancelled|canceled|postponed|rescheduled|moved to)\b/i.test(title)){fail('Official changed status requires review');continue;}
 const startDate=wallToPacific(year,month,day,start.clock);
 if(!startDate){fail('Invalid Pacific start');continue;}
 if(start.doors){const door=wallToPacific(year,month,day,time24(start.doors));if(!door||Date.parse(door)>Date.parse(startDate)){fail('Doors/show order conflicts');continue;}}
 let artwork=null;try{const u=new URL(image);if(u.hostname==='cdn.mcmenamins.com'&&u.protocol==='https:'&&u.pathname.startsWith('/system/uploads/MadborgAssets/')){const art=artworkCandidate(u.href,url);if(art)artwork={url:art,sourceUrl:url,origin:'official-venue-calendar',credit:'McMenamins Mission Theater event-card image',usageApproved:null};}}catch{}
 const item={title,fullUrl:url,rosterDate:date,rosterTime:time,venue:VENUE,startDate,sourceVerifiedMusic:false,
 categories:start.kind==='presentation'?['Presentation']:start.kind==='film'?['Film screening']:[],
 timeEvidence:'Official venue card and year-bearing event search data agree on event identity, title and weekday/date. Published starting-time label: '+start.kind+'.',
 description:'Original Mission Theater event card; review format and genres. Doors remain distinct; a show label alone does not establish a concert.',...(artwork?{artwork}:{})};
 if(seen.has(url)){const old=seen.get(url);if(!old.hold&&(old.title!==title||old.rosterDate!==date||old.rosterTime!==time)){const held={hold:'Conflicting duplicate Mission cards',title,url};rows[rows.indexOf(old)]=held;seen.set(url,held);}continue;}
 seen.set(url,item);rows.push(item);
 }
 if(!seen.size)throw Error('No dated Mission-owned cards');
 for(const [url,row] of index)if(!seen.has(url)&&!rows.some(x=>x.url===url))rows.push({hold:'Year-bearing source event has no matching dated venue card',title:row.title,url});
 const heldUrls=new Set(rows.filter(x=>x.hold&&x.url).map(x=>x.url));return rows.filter(x=>!x.fullUrl||!heldUrls.has(x.fullUrl));
}
async function request(url){const u=new URL(url);if(u.origin!==ROOT||u.username||u.password||u.search||u.hash||(u.href!==CALENDAR_URL&&!eventUrl(u.href)))throw Error('Unapproved Mission URL');const r=await fetch(u,{redirect:'error',signal:AbortSignal.timeout(18000),headers:{Accept:'text/html','User-Agent':'SHOWS-event-review/0.1'}});if(!r.ok||!r.headers.get('content-type')?.includes('text/html'))throw Error('Mission source HTTP '+r.status);const t=await r.text();if(t.length>2400000)throw Error('Mission source too large');return t;}
async function fetchEvents(source){
 if(source.id!=='mission-theater'||source.url!==CALENDAR_URL||source.baseUrl!==ROOT)throw Error('Unapproved Mission source configuration');
 return parseRoster(await request(CALENDAR_URL));
}
module.exports={ROOT,CALENDAR_URL,VENUE,eventUrl,times,sourceIndex,parseRoster,fetchEvents};
