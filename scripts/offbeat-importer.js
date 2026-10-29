"use strict";
// The calendar is linked by Friends of Noise's official event-calendar page.
const {wallToPacific}=require('./priority-importers');
const {eventSchema}=require('./turnturnturn-opendate');
function localTime(value){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',timeZoneName:'longOffset'}).formatToParts(new Date(value)).map(x=>[x.type,x.value]));
 return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${parts.timeZoneName.replace('GMT','')}`;
}

const CALENDAR_URL='https://calendar.friendsofnoise.org/';
const VENUE='The Off Beat';
function textOf(html){return String(html||'').replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&(?:amp|quot|apos|nbsp);/g,x=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&nbsp;':' '}[x])).replace(/&#(\d+);/g,(_,n)=>Number(n)<=0x10ffff?String.fromCodePoint(Number(n)):' ').replace(/\s+/g,' ').trim();}
function eventUrl(raw){try{const u=new URL(raw,CALENDAR_URL);return u.origin===CALENDAR_URL.slice(0,-1)&&!u.username&&!u.password&&!u.search&&!u.hash&&/^\/shows\/[a-z0-9-]+-20\d{2}-\d{5,12}$/.test(u.pathname.replace(/\/$/,''))?u.href.replace(/\/$/,''):null;}catch{return null;}}
function validStart(value){
 if(!/^20\d{2}-\d\d-\d\dT\d\d:\d\d:\d\d-0[78]:00$/.test(value||''))return false;
 try{const [y,m,d]=value.slice(0,10).split('-').map(Number);return localTime(wallToPacific(y,m,d,value.slice(11,16)))===value;}catch{return false;}
}
function parseRoster(html){
 if(!String(html).includes('Upcoming Events — Friends of Noise'))throw Error('Unexpected Friends of Noise calendar');
 const cards=[...String(html).matchAll(/<article\b[^>]*class="card"[^>]*>([\s\S]*?)<\/article>/g)];
 if(!cards.length||cards.length>110)throw Error('Missing or oversized Off Beat roster; review source template');
 const seen=new Set();return cards.map(m=>{
 const c=m[1],heading=c.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)?.[1]||'';
 const a=heading.match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
 const url=a&&eventUrl(a[1]),title=a&&textOf(a[2]),start=c.match(/<time\b[^>]*datetime="([^"]+)"/)?.[1];
 if(!url||!title||title.length>300||!validStart(start)||!/Venue:\s*The Off Beat\s*Organized By:/i.test(textOf(c)))return {hold:'Off Beat card venue, title, URL or Pacific time cannot be verified',title,url};
 if(seen.has(url))return {hold:'Duplicate Off Beat event permalink',title,url};seen.add(url);
 return {title,fullUrl:url,startDate:start,venue:VENUE,timeEvidence:'Venue-owned calendar publishes an explicit Pacific starting time; confirm show versus doors on the event detail.',description:'Venue-listed event; format and style require event-specific evidence.'};
 });
}
function parseDetail(html,card){
 const fail=hold=>({hold,title:card.title,url:card.fullUrl});
 const schema=eventSchema(html),text=textOf(html),heading=textOf(String(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
 if(!schema||!eventUrl(card.fullUrl))return fail('Missing original Off Beat event schema or URL');
 if(/cancel|postpon|resched|moved/i.test(String(schema.eventStatus)))return fail('Official status requires cancellation/reschedule review');
 if(schema.eventStatus!=='https://schema.org/EventScheduled')return fail('Missing explicit scheduled event status');
 if(textOf(schema.name)!==card.title||heading!==card.title||localTime(schema.startDate)!==card.startDate)return fail('Event title or start time disagrees with official roster');
 if(schema.location?.name!=='Friends of Noise / The Off Beat'||schema.location?.address!=='Portland, OR'||!/\b8440\s+N\s+Interstate\s+Ave\b/i.test(text))return fail('Official event venue/address does not match The Off Beat');
 const show=text.match(/(\d{1,2}(?::\d\d)?)\s+Show\b/i);
 // Source prose prints e.g. "6:30 Doors 7:00 Show"; the dated schema
 // independently establishes AM/PM. Require the printed clock to agree.
 if(!show||Number(show[1].split(':')[0])!==((Number(card.startDate.slice(11,13))+11)%12+1)||Number(show[1].split(':')[1]||0)!==Number(card.startDate.slice(14,16)))return fail('Missing or contradictory performance clock in official description');
 const slug=new URL(card.fullUrl).pathname.split('/').pop();
 const ticketLinks=[...String(html).matchAll(/href="(https:\/\/app\.opendate\.io\/e\/[^"<>]+)"/g)].map(m=>m[1]);
 if(!ticketLinks.some(raw=>{try{const u=new URL(raw.replace(/&amp;/g,'&'));return u.hostname==='app.opendate.io'&&u.pathname==='/e/'+slug&&!u.username&&!u.password;}catch{return false;}}))return fail('Missing matching organizer ticket permalink');
 let artwork=null;const raw=Array.isArray(schema.image)?schema.image[0]:schema.image;
 try{const u=new URL(raw),id=slug.match(/-(\d+)$/)[1].padStart(9,'0').match(/.{3}/g).join('/');
 if(u.protocol==='https:'&&u.hostname==='s3.amazonaws.com'&&!u.username&&!u.password&&!u.port&&u.pathname.startsWith('/opendate-aws-assets/confirms/website_event_images/'+id+'/compressed/')&&/\.(?:jpg|jpeg|png|webp)$/i.test(u.pathname))artwork={url:u.href,sourceUrl:card.fullUrl,origin:'official-event-page',credit:'Friends of Noise / The Off Beat — source-provided event image',usageApproved:null};
 }catch{}
 return {...card,sourceEventType:schema['@type'],sourceVerifiedMusic:schema['@type']==='MusicEvent',
 timeEvidence:'Official event schema and source description agree on the dated Pacific performance time; doors are separate.',
 description:text.slice(text.indexOf('When'),text.indexOf('Ticketing needs JavaScript')>0?text.indexOf('Ticketing needs JavaScript'):undefined).slice(0,1200),...(artwork?{artwork}:{})};
}
async function request(url,depth=0){
 const u=new URL(url);
 if(depth>2||u.origin!==CALENDAR_URL.slice(0,-1)||u.username||u.password||u.search||u.hash||(u.pathname!=='/'&&!eventUrl(url)))throw Error('Unapproved Off Beat calendar URL');
 const response=await fetch(u,{signal:AbortSignal.timeout(18000),redirect:'manual',headers:{Accept:'text/html','User-Agent':'SHOWS-event-review/0.1'}});
 if([301,302,307,308].includes(response.status)){
 const next=new URL(response.headers.get('location'),u);
 if(next.origin!==u.origin||next.pathname.replace(/\/$/,'')!==u.pathname.replace(/\/$/,''))throw Error('Off Beat redirect changed event identity');
 return request(next.href,depth+1);
 }
 if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw Error('Off Beat calendar HTTP '+response.status);
 const body=await response.text();if(body.length>1800000)throw Error('Off Beat calendar document too large');return body;
}
async function fetchEvents(source){
 if(source.url!==CALENDAR_URL||source.baseUrl!==CALENDAR_URL.slice(0,-1))throw Error('Unapproved Off Beat source configuration');
 const cards=parseRoster(await request(CALENDAR_URL)),out=[];
 for(let i=0;i<cards.length;i+=4)out.push(...await Promise.all(cards.slice(i,i+4).map(async card=>{
 if(card.hold)return card;
 try{return parseDetail(await request(card.fullUrl),card);}catch(e){return {hold:'Official Off Beat detail unavailable: '+e.message,title:card.title,url:card.fullUrl};}
 })));
 if(!out.some(x=>x.startDate))throw Error('No verified Off Beat detail records');return out;
}
module.exports={CALENDAR_URL,VENUE,textOf,eventUrl,validStart,parseRoster,parseDetail,fetchEvents};
