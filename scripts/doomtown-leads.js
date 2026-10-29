#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const API='https://doomtownpdx.com/wp-json/wp/v2/posts?per_page=40&_fields=id,date,link,title,content';
const venues=['High Water Mark','Black Water','High Limit Room','Shanghai Tunnel','Twilight','The Coffin Club','The Alleyway','Star Theater','Kenton Club'];
const plain=s=>String(s||'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const dateText=s=>s.match(/\b(?:Mon(?:day)?|Tues?(?:day)?|Wed(?:nesday)?|Thurs?(?:day)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)?\.?\s*(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+20\d{2})?/i)?.[0]?.trim()||null;
function parsePosts(posts){
 if(!Array.isArray(posts)||posts.length>100)throw Error('Unexpected or unbounded WordPress JSON');
 const result=[],seen=new Set();
 for(const p of posts){
  if(!Number.isSafeInteger(p?.id)||seen.has(p.id))continue;
  let u;try{u=new URL(p.link);}catch(_){continue;}
  if(u.protocol!=='https:'||!['doomtownpdx.com','www.doomtownpdx.com'].includes(u.hostname)||u.search||u.hash||u.username||u.password||u.port||u.pathname==='/')continue;
  const title=plain(p.title?.rendered).slice(0,170),content=String(p.content?.rendered||'');
  if(!title||content.length>300000)continue;
  seen.add(p.id);
  const body=plain(content).slice(0,1500),v=venues.filter(name=>body.toLowerCase().includes(name.toLowerCase())||title.toLowerCase().includes(name.toLowerCase()));
  const imageTag=content.match(/<img\b[^>]*\bsrc=['"]([^'"]+)['"]/i)?.[1];
  let image=null;
  if(imageTag){try{const x=new URL(imageTag,u.href);if(x.protocol==='https:'&&['doomtownpdx.com','www.doomtownpdx.com'].includes(x.hostname)&&x.pathname.startsWith('/wp-content/uploads/')&&!x.search&&!x.hash)image=x.href;}catch(_){}}
  result.push({id:p.id,title,url:u.href,postedOn:p.date?.slice(0,10)||null,dateText:dateText(body),venues:v,image});
 }
 return result;
}
function report(leads,error){
 const lines=['# Doomtown PDX original promoter leads (review-only)','',
  'WordPress post publication dates are **not** event dates. These leads require independent primary venue/organizer/ticket verification of date, year, venue, cancellation and show versus doors time. No records or image rights are automatically approved.',''];
 if(error)lines.push('**Source unavailable:** '+String(error).slice(0,250)+'. Existing calendar events remain untouched.');
 else{
  lines.push('**'+leads.length+' original post leads checked.**','','| Promoter post | Printed date | Venue mentions | Source art |','| --- | --- | --- | --- |');
  for(const x of leads){const clean=s=>String(s||'').replace(/[|\n\r]/g,' ').slice(0,180);
   lines.push('| ['+clean(x.title)+']('+x.url+') | '+clean(x.dateText||'Not verified')+' | '+clean(x.venues.join(', ')||'Unconfirmed')+' | '+(x.image?'Image found; rights unverified':'No first-party image detected')+' |');}
 }
 return lines.join('\n')+'\n';
}
async function fetchLeads(request=fetch){
 const r=await request(API,{headers:{Accept:'application/json','User-Agent':'SHOWS-review-only/0.1'},redirect:'error',signal:AbortSignal.timeout(16000)});
 if(!r.ok)throw Error('Public WordPress API HTTP '+r.status);
 if(!r.headers.get('content-type')?.includes('json'))throw Error('WordPress API response is not JSON');
 const text=await r.text();if(text.length>1500000)throw Error('WordPress response too large');
 return parsePosts(JSON.parse(text));
}
async function main(){
 let leads=[],error=null;try{leads=await fetchLeads();if(!leads.length)error='No validated original posts returned';}catch(e){error=e.message||String(e);}
 const file=path.join(__dirname,'../discovery/doomtown-leads-review.md');
 fs.writeFileSync(file,report(leads,error));
 console.log('Doomtown reviewed '+leads.length+' source posts'+(error?' — '+error:''));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={API,parsePosts,report,fetchLeads};
