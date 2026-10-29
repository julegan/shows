"use strict";
// Original Aladdin calendar, strict room/ticket agreement. Its startDate meta
// values use a misleading +00:00 for local show clocks: do not treat them as UTC.
const {wallToPacific,time24,artworkCandidate}=require('./priority-importers');
const CALENDAR_URL='https://www.aladdin-theater.com/';
const VENUE='Aladdin Theater';
const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
function plain(raw){return String(raw||'').replace(/<[^>]*>/g,' ').replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,h,d)=>{const n=parseInt(h||d,h?16:10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):' ';}).replace(/&(?:amp|quot|apos|nbsp|lt|gt);/gi,x=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&nbsp;':' ','&lt;':'<','&gt;':'>'}[x.toLowerCase()])).replace(/\s+/g,' ').trim();}
function ticketUrl(raw){try{const u=new URL(raw);return u.protocol==='https:'&&u.hostname==='www.etix.com'&&!u.port&&!u.username&&!u.password&&!u.search&&!u.hash&&/^\/ticket\/p\/\d{5,12}\/[a-z0-9-]+-portland-aladdin-theater$/.test(u.pathname)?u.href:null;}catch{return null;}}
function pacificParts(iso){return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso)).map(x=>[x.type,x.value]));}
function parseCard(block,source){
 const title=plain(block.match(/<h3\b[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/h3>/i)?.[1]);
 const venue=plain(block.match(/<div\b[^>]*class="event-venue"[^>]*>([\s\S]*?)<\/div>/i)?.[1]);
 const urls=[...block.matchAll(/<a\b[^>]*href="([^"]+)"/gi)].map(m=>m[1].replace(/&amp;/g,'&'));
 const url=urls.map(ticketUrl).find(Boolean);
 const fail=hold=>({hold,title,url,venue});
 if(venue!==VENUE)return {skip:'Offsite event on Aladdin calendar',title,venue};
 if(!title||title.length>280||!url)return fail('Missing Aladdin title or matching original ticket room');
 const id=block.match(/\bdata-event-id="(\d+)"/)?.[1];
 if(id!==new URL(url).pathname.split('/')[3]||urls.some(x=>x.startsWith('https://www.etix.com/ticket/p/')&&x!==url))return fail('Original event and ticket identities disagree');
 if(/\b(?:rescheduled|postponed|cancelled|canceled|moved to|vip upgrade|ticket not included)\b/i.test(title))return fail('Official changed-status or ticket-addon listing requires review');
 const label=plain(block.match(/<span\b[^>]*class="event-date--full"[^>]*>([\s\S]*?)<\/span>/)?.[1]);
 const tag=block.match(/<span\b[^>]*class="event-doors-showtime"[^>]*>([\s\S]*?)<\/span>/)?.[0]||'';
 const fields=plain(tag),show=fields.match(/\bShow:\s*(\d{1,2}(?::\d\d)?\s*[ap]m)\b/i),doors=fields.match(/\bDoors:\s*(\d{1,2}(?::\d\d)?\s*[ap]m)\b/i);
 const utc=tag.match(/\bdata-event-doors="([^"]+)"/)?.[1];
 if(!show||!doors||!/^20\d{2}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(utc||'')||!Number.isFinite(Date.parse(utc)))return fail('Missing independent UTC doors date and separate performance clock');
 const p=pacificParts(utc),date=p.year+'-'+p.month+'-'+p.day;
 if(p.hour+':'+p.minute!==time24(doors[1]))return fail('UTC doors timestamp conflicts with printed Pacific doors time');
 const dm=/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat),?\s+(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})$/i.exec(label);
 if(dm){
 const month=months.indexOf(dm[2].toLowerCase())+1,day=Number(dm[3]),year=Number(dm[4]),d=new Date(Date.UTC(year,month-1,day));
 if(d.getUTCFullYear()!==year||d.getUTCMonth()!==month-1||d.getUTCDate()!==day||['sun','mon','tue','wed','thu','fri','sat'][d.getUTCDay()]!==dm[1].toLowerCase()||year!==Number(p.year)||month!==Number(p.month)||day!==Number(p.day))return fail('Printed date/weekday and independent UTC date disagree');
 }else if(!/^(Tonight|Today|Tomorrow)$/i.test(label))return fail('Missing official full date or recognized relative label backed by UTC date');
 const startDate=wallToPacific(Number(p.year),Number(p.month),Number(p.day),time24(show[1]));
 if(!startDate||Date.parse(startDate)<Date.parse(utc))return fail('Invalid Pacific showtime or show before doors');
 const meta=block.match(/<meta\b[^>]*itemprop="startDate"[^>]*content="([^"]+)"/)?.[1];
 if(!meta||meta.slice(0,10)!==date||meta.slice(11,16)!==time24(show[1]))return fail('Source local-clock metadata disagrees with dated performance time');
 const supporting=plain(block.match(/<div\b[^>]*class="event-summary event-supporting"[^>]*>([\s\S]*?)<\/div>/)?.[1]);
 const image=block.match(/<img\b[^>]*src="([^"]+)"/)?.[1];
 const art=image&&artworkCandidate(image,url);
 return {title,fullUrl:url,venue:VENUE,startDate,address:source.address,neighborhood:source.neighborhood,
 sourceVerifiedMusic:false,timeEvidence:'Official Aladdin card independently matches its UTC doors date, printed Pacific doors/show clocks, full weekday/date (or source-backed relative label), and exact ticket event ID.',
 description:'Original Aladdin venue listing. Event type and genres require review.'+(supporting?' Supporting artists: '+supporting.slice(0,240):''),
 ...(art?{artwork:{url:art,sourceUrl:url,origin:'official-venue-calendar',credit:'Aladdin Theater event image via venue-linked Etix',usageApproved:null}}:{})};
}
function parseAladdin(html,source){
 if(source.id!=='aladdin-theater'||source.url!==CALENDAR_URL||source.baseUrl!==CALENDAR_URL.slice(0,-1))throw Error('Unexpected Aladdin source configuration');
 const raw=String(html),start=raw.indexOf('id="feed-primary"');if(start<0)throw Error('Original Aladdin full feed missing');
 const feed=raw.slice(start),matches=[...feed.matchAll(/<div class="event event--list-style[^\"]*"[^>]*>/g)];
 const advertised=Number(feed.match(/\bdata-events-count="(\d+)"/)?.[1]);
 if(!matches.length||matches.length>180||advertised!==matches.length)throw Error('Aladdin feed count changed or pagination incomplete; inspect source');
 const seen=new Set();return matches.map((m,i)=>parseCard(feed.slice(m.index,matches[i+1]?.index||feed.length).slice(0,18000),source)).filter(x=>{if(!x.fullUrl)return true;if(seen.has(x.fullUrl))return false;seen.add(x.fullUrl);return true;});
}
async function fetchEvents(source){
 if(source.url!==CALENDAR_URL||source.baseUrl!==CALENDAR_URL.slice(0,-1))throw Error('Unapproved Aladdin source');
 const r=await fetch(CALENDAR_URL,{redirect:'error',signal:AbortSignal.timeout(18000),headers:{Accept:'text/html','User-Agent':'SHOWS-event-review/0.1'}});
 if(!r.ok||!r.headers.get('content-type')?.includes('text/html'))throw Error('Aladdin source HTTP '+r.status);
 const body=await r.text();if(body.length>2200000)throw Error('Aladdin page too large');return parseAladdin(body,source);
}
module.exports={CALENDAR_URL,VENUE,plain,ticketUrl,parseCard,parseAladdin,fetchEvents};
