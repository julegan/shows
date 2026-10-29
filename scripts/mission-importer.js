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
function parseRoster(html){
 const raw=String(html),starts=[...raw.matchAll(/<div class="[^"]*\bevent detailed(?: movie)?"[^>]*>/g)];
 if(!starts.length||starts.length>180)throw Error('Mission detailed roster missing or exceeds bounded source count');
 const rows=[],seen=new Map();
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
 const item={title,fullUrl:url,rosterDate:date,rosterTime:time,image};
 if(seen.has(url)){const old=seen.get(url);if(old.title!==title||old.rosterDate!==date||old.rosterTime!==time)rows.push({hold:'Conflicting duplicate Mission cards',title,url});continue;}
 seen.set(url,item);rows.push(item);
 }
 if(!seen.size)throw Error('No dated Mission-owned cards');return rows;
}
function parseDetail(html,card){
 const raw=String(html),fail=hold=>({hold,title:card.title,url:card.fullUrl});
 if(!eventUrl(card.fullUrl))return fail('Not an original McMenamins event URL');
 const venue=plain(raw.match(/<span id="locationSpecificPropertyName">([\s\S]*?)<\/span>/)?.[1]);
 if(venue!==VENUE||!/1624\s+N\.?W\.?\s+Glisan/i.test(plain(raw)))return fail('Event-specific venue/address does not match Mission Theater');
 const eventId=new URL(card.fullUrl).pathname.match(/\/events\/(\d+)-/)[1];
 if(!raw.includes('/getICSFile.aspx?id='+eventId+'"'))return fail('Official event calendar identity disagrees with permalink');
 const dates=[...new Set([...raw.matchAll(/<p class="event-date">([\s\S]*?)<\/p>/g)].map(m=>plain(m[1])))];
 if(dates.length!==1)return fail('Missing or conflicting full event dates');
 const dm=/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\w+) (\d{1,2}), (20\d{2})$/.exec(dates[0]);
 if(!dm)return fail('Missing explicit event year/date');
 const month=months.indexOf(dm[2].toLowerCase())+1,day=Number(dm[3]),year=Number(dm[4]),date=new Date(Date.UTC(year,month-1,day));
 if(!month||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day||['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][date.getUTCDay()]!==dm[1].toLowerCase()||dates[0].replace(/, 20\d{2}$/,'')!==card.rosterDate)return fail('Mission full date, weekday and roster disagree');
 const labels=[...new Set([...raw.matchAll(/<p id="MainContent_p_(?:mobile_)?times_info"[^>]*>([\s\S]*?)<\/p>/g)].map(m=>plain(m[1])))];
 if(labels.length!==1)return fail('Conflicting or missing original start labels');
 const start=times(labels[0]),roster=times(card.rosterTime);
 if(!start||!roster||start.clock!==roster.clock||start.kind!==roster.kind||time24(start.doors||'')!==time24(roster.doors||''))return fail('Roster and detail event time labels disagree');
 const heading=raw.match(/<div class="[^"]*event-panel-info-title[^\"]*">([\s\S]*?)<\/div>/)?.[1]||'';
 const bill=[...heading.matchAll(/<h[24][^>]*>([\s\S]*?)<\/h[24]>/g)].map(m=>plain(m[1])).filter(x=>x!=='West End Entertainment District');
 const norm=s=>plain(s).toLowerCase().replace(/[^a-z0-9]/g,'');
 if(!bill.length||norm(bill.join(' '))!==norm(card.title))return fail('Primary event billing differs from source card');
 if(/\b(?:cancelled|canceled|postponed|rescheduled|moved to)\b/i.test(bill.join(' ')+' '+labels[0]))return fail('Official changed status requires review');
 const startDate=wallToPacific(year,month,day,start.clock);
 if(!startDate)return fail('Invalid Portland performance time');
 if(start.doors){const doors=wallToPacific(year,month,day,time24(start.doors));if(!doors||Date.parse(startDate)<Date.parse(doors))return fail('Invalid doors/show ordering');}
 let artwork=null;try{const u=new URL(card.image);if(u.hostname==='cdn.mcmenamins.com'&&u.protocol==='https:'&&u.pathname.startsWith('/system/uploads/MadborgAssets/')&&raw.includes(card.image)){const image=artworkCandidate(u.href,card.fullUrl);if(image)artwork={url:image,sourceUrl:card.fullUrl,origin:'official-event-page',credit:'McMenamins Mission Theater source-provided event image',usageApproved:null};}}catch{}
 return {title:card.title,fullUrl:card.fullUrl,venue:VENUE,startDate,sourceVerifiedMusic:false,
 categories:start.kind==='presentation'?['Presentation']:start.kind==='film'?['Film screening']:[],
 timeEvidence:'Official Mission event detail publishes the full year/date and start label ('+start.kind+'), matching the venue roster. Doors remain separate.',
 description:'Original Mission Theater listing. Published starting-time label: '+start.kind+'. Review event format and genres; a show label alone does not establish a concert.',...(artwork?{artwork}:{})};
}
async function request(url){const u=new URL(url);if(u.origin!==ROOT||u.username||u.password||u.search||u.hash||(u.href!==CALENDAR_URL&&!eventUrl(u.href)))throw Error('Unapproved Mission URL');const r=await fetch(u,{redirect:'error',signal:AbortSignal.timeout(18000),headers:{Accept:'text/html','User-Agent':'SHOWS-event-review/0.1'}});if(!r.ok||!r.headers.get('content-type')?.includes('text/html'))throw Error('Mission source HTTP '+r.status);const t=await r.text();if(t.length>2400000)throw Error('Mission source too large');return t;}
async function fetchEvents(source){
 if(source.id!=='mission-theater'||source.url!==CALENDAR_URL||source.baseUrl!==ROOT)throw Error('Unapproved Mission source configuration');
 const cards=parseRoster(await request(CALENDAR_URL)),out=[];
 for(let i=0;i<cards.length;i+=4)out.push(...await Promise.all(cards.slice(i,i+4).map(async card=>{if(card.hold||card.skip)return card;try{return parseDetail(await request(card.fullUrl),card);}catch(e){return {hold:'Original Mission detail unavailable: '+e.message,title:card.title,url:card.fullUrl};}})));
 if(!out.some(x=>x.startDate))throw Error('No verified Mission records');return out;
}
module.exports={ROOT,CALENDAR_URL,VENUE,eventUrl,times,parseRoster,parseDetail,fetchEvents};
