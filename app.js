(() => {
  "use strict";
  const events = Object.freeze((window.SHOWS_EVENTS || []).slice().sort((a,b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)));
  const zone = "America/Los_Angeles";
  const today = localYmd(new Date());
  const state = {month:today.slice(0,7),view:"month",search:"",category:"all",musicStyle:"all",neighborhood:"all",quick:"all",selectedDay:null};
  const $ = (id) => document.getElementById(id);
  const categories = [...new Set(events.map(e=>e.category))].sort();
  const musicStyles = [...new Set(events.flatMap(e=>e.musicStyles||[]))].sort();
  const neighborhoods = [...new Set(events.map(e=>e.neighborhood))].sort();
  const dateParts = new Intl.DateTimeFormat("en-US",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"});
  const dateLong = new Intl.DateTimeFormat("en-US",{timeZone:zone,weekday:"long",month:"long",day:"numeric"});
  const weekdayLong = new Intl.DateTimeFormat("en-US",{timeZone:zone,weekday:"long"});
  const timeFmt = new Intl.DateTimeFormat("en-US",{timeZone:zone,hour:"numeric",minute:"2-digit"});
  const dayFmt = new Intl.DateTimeFormat("en-US",{timeZone:zone,month:"short",day:"numeric"});
  const monthFmt = new Intl.DateTimeFormat("en-US",{timeZone:"UTC",month:"long",year:"numeric"});
  const savedKey = "shows-saved-v1";
  let saved = new Set();
  try { saved = new Set(JSON.parse(localStorage.getItem(savedKey) || "[]")); } catch (_) {}
  function localYmd(date) {
    const parts = new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
    const field = type => parts.find(p=>p.type===type).value;
    return field("year")+"-"+field("month")+"-"+field("day");
  }
  function ymd(e){return localYmd(new Date(e.startsAt));}
  function esc(v){return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function dateLabel(e){return dateLong.format(new Date(e.startsAt));}
  function clock(e){return e.startTimeKind==="date-only"?"Time TBA":(e.startTimeKind==="doors"?"Doors ":e.startTimeKind==="listed"?"Listed time ":"")+timeFmt.format(new Date(e.startsAt));}
  function timeRange(e){return e.startTimeKind==="date-only"?"Time TBA · date confirmed, start time not published":clock(e)+(e.endsAt?" – "+timeFmt.format(new Date(e.endsAt)):" · end time not confirmed");}
  function readableDay(day){return dateLong.format(new Date(day+"T12:00:00Z"));}
  function monthDate(y,m,d){return new Date(Date.UTC(y,m-1,d));}
  function addDays(day,n){const d = new Date(day+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
  function shiftMonth(month,step){const [y,m]=month.split("-").map(Number);const d=monthDate(y,m+step,1);return d.toISOString().slice(0,7);}
  function inWindow(e){
    const d = ymd(e);
    if(state.quick==="today")return d===today;
    if(state.quick==="seven")return d>=today && d<=addDays(today,6);
    if(state.quick==="weekend"){const day=new Date(today+"T12:00:00Z").getUTCDay();const saturday=addDays(today,day===0?-1:(6-day+7)%7);return d>=saturday && d<=addDays(saturday,1);}
    return d.slice(0,7)===state.month;
  }
  function filtered(){
    return events.filter(e => {
      if (!inWindow(e))return false;
      if(state.category!=="all" && e.category!==state.category)return false;
      if(state.musicStyle!=="all" && !(e.musicStyles||[]).includes(state.musicStyle))return false;
      if(state.neighborhood!=="all" && e.neighborhood!==state.neighborhood)return false;
      if(state.quick==="free" && !e.free)return false;
      if(state.quick==="saved" && !saved.has(e.id))return false;
      if(state.search){
        const all=[e.title,e.subtitle,e.category,e.venue,e.neighborhood,e.description,...e.tags,...(e.musicStyles||[])].join(" ").toLowerCase();
        if(!all.includes(state.search))return false;
      }
      return true;
    });
  }
  function restoreFilters(){
    state.quick="all";state.search="";state.category="all";state.musicStyle="all";state.neighborhood="all";state.selectedDay=null;
    $("search").value="";$("category").value="all";$("musicStyle").value="all";$("neighborhood").value="all";
    document.querySelectorAll("[data-quick]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.quick==="all")));
  }
  function render(){
    const items=filtered();
    const date=new Date(state.month+"-01T12:00:00Z");
    $("period").textContent=monthFmt.format(date);
    $("resultCount").textContent=items.length+" event"+(items.length===1?"":"s")+" in view"+(state.selectedDay?" · "+readableDay(state.selectedDay):"");
    $("exportVisible").disabled=!items.length;
    document.querySelectorAll("[data-view]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.view===state.view)));
    document.querySelectorAll("[data-quick]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.quick===state.quick)));
    $("calendar").innerHTML=state.view==="month"?renderMonth(items):state.view==="agenda"?renderAgenda(items):renderPlaces(items);
  }
  function renderMonth(items){
    const [year,month]=state.month.split("-").map(Number);
    const start=new Date(Date.UTC(year,month-1,1));
    const offset=start.getUTCDay();
    const monthStart=new Date(Date.UTC(year,month-1,1-offset));
    const count=Math.ceil((offset+new Date(Date.UTC(year,month,0)).getUTCDate())/7)*7;
    let html='<p class="mobile-calendar-hint">Select a date to explore its events.</p><div class="month-grid">';
    for(const label of ["SUN","MON","TUE","WED","THU","FRI","SAT"])html+='<div class="weekday">'+label+'</div>';
    for(let i=0;i<count;i++){
      const d=new Date(monthStart);d.setUTCDate(d.getUTCDate()+i);
      const day=d.toISOString().slice(0,10);
      const inMonth=day.slice(0,7)===state.month;
      const dayItems=items.filter(e=>ymd(e)===day);
      const cl=["day",!inMonth?"outside":"",day===today?"today":"",day===state.selectedDay?"selected":""].filter(Boolean).join(" ");
      const dateName=esc(readableDay(day));
      const eventCount=dayItems.length;
      const eventCountLabel=eventCount+' event'+(eventCount===1?'':'s');
      html+='<div class="'+cl+'"><button class="mobile-day" type="button" data-day="'+day+'" aria-label="Explore '+dateName+', '+eventCountLabel+'"><span class="mobile-day-number">'+d.getUTCDate()+'</span>'+(eventCount?'<span class="mobile-day-count" aria-hidden="true">'+eventCount+'</span>':'')+'</button><div class="day-top"><button class="day-number" type="button" data-day="'+day+'" aria-label="Explore '+dateName+'">'+d.getUTCDate()+'</button></div>';
      for(const e of dayItems.slice(0,3))html+='<button type="button" class="event-chip" data-category="'+esc(e.category)+'" data-event="'+esc(e.id)+'"><span class="chip-time">'+esc(clock(e))+'</span><span class="chip-title">'+esc(e.title)+'</span></button>';
      if(dayItems.length>3)html+='<button class="overflow" data-day="'+day+'" type="button">+'+(dayItems.length-3)+' more</button>';
      html+='</div>';
    }
    html+='</div>';
    if(state.selectedDay){
      const chosen=events.filter(e=>ymd(e)===state.selectedDay && matchesOtherFilters(e));
      html+='<div class="selected-day-header"><h3>'+esc(readableDay(state.selectedDay))+'</h3><button data-clear-day type="button">Show full month</button></div><div class="selected-day-list">';
      html+=chosen.length?'<div class="agenda-items">'+chosen.map(eventCard).join("")+'</div>':'<div class="empty"><h3>Nothing listed yet.</h3><p>Try another date. This is a limited pilot dataset.</p></div>';
      html+='</div>';
    }
    return html;
  }
  function matchesOtherFilters(e){
    const found=state.selectedDay;state.selectedDay=null;
    const match=filtered().some(v=>v.id===e.id);
    state.selectedDay=found;return match;
  }
  // Use original venue/promoter-supplied event artwork; no synthesized band posters.
  // Source metadata is validated during discovery. Broken external images fail to a neutral card.
  function artMarkup(e,large=false){
    const arts=e.artwork;
    const valid=arts && typeof arts.url==="string" &&
      /^https:\/\/[^<>"'\s]+$/i.test(arts.url) &&
      typeof arts.sourceUrl==="string" && /^https:\/\//i.test(arts.sourceUrl) &&
      (arts.origin==="official-event-page" || arts.usageApproved===true) && arts.usageApproved!==false;
    const image=valid?'<img class="show-art-image" src="'+esc(arts.url)+'" alt="" loading="lazy" decoding="async" referrerpolicy="strict-origin-when-cross-origin">':"";
    const label='<span class="show-art-placeholder">No flyer available</span>';
    const credit=valid&&large?'<p class="art-credit">Event artwork from <a target="_blank" rel="noopener noreferrer" href="'+esc(arts.sourceUrl)+'">'+esc(arts.credit||"the official event listing")+'</a>. Artwork and details belong to their respective creators.</p>':"";
    return '<span class="show-art'+(large?' show-art--large':'')+(valid?' show-art--poster':'')+'" aria-hidden="true">'+label+image+'</span>'+credit;
  }
  function eventCard(e){
    return '<button type="button" data-event="'+esc(e.id)+'" class="event-card" data-category="'+esc(e.category)+'">'+artMarkup(e)+'<span class="tag">'+esc(e.category)+'</span><h3>'+esc(e.title)+'</h3><span class="card-desc">'+esc(e.subtitle)+'</span><span class="card-meta">'+esc(clock(e))+' · '+esc(e.venue)+'<br>'+esc(e.price)+'</span><span class="card-cta">Explore event ↗</span></button>';
  }
  function renderAgenda(items){
    if(!items.length)return empty();
    const groups=new Map();
    for(const e of items){const d=ymd(e);if(!groups.has(d))groups.set(d,[]);groups.get(d).push(e);}
    return '<div class="agenda">'+[...groups].map(([day,list])=>'<div class="agenda-day"><div class="agenda-date">'+esc(dayFmt.format(new Date(list[0].startsAt)))+'<small>'+esc(weekdayLong.format(new Date(list[0].startsAt)))+'</small></div><div class="agenda-items">'+list.map(eventCard).join("")+'</div></div>').join("")+'</div>';
  }
  function renderPlaces(items){
    if(!items.length)return empty();
    const groups=new Map();
    for(const e of items){const key=e.venue;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);}
    return '<div class="places-list">'+[...groups].map(([venue,list])=>{
      const sample=list[0],address=sample.address;
      return '<article class="place-card"><span class="detail-tag">'+esc(sample.neighborhood)+'</span><h3>'+esc(venue)+'</h3><p>'+esc(address||"Address not confirmed")+'</p><div class="place-actions">'+(address?'<a target="_blank" rel="noopener noreferrer" href="'+mapLink(address)+'">Directions ↗</a>':'')+'</div>'+list.map(e=>'<div class="place-event"><small>'+esc(dayFmt.format(new Date(e.startsAt)))+' · '+esc(clock(e))+'</small><button type="button" data-event="'+esc(e.id)+'">'+esc(e.title)+' ↗</button></div>').join("")+'</article>';
    }).join("")+'</div>';
  }
  function empty(){return '<div class="empty"><h3>No events in this view.</h3><p>Try changing the date or filters. Coverage is limited to the dates and sources in this snapshot.</p><button type="button" class="small-button" data-reset>Clear filters</button></div>';}
  function mapLink(address){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address);}
  function googleLink(e){
    const start=new Date(e.startsAt),end=e.endsAt?new Date(e.endsAt):new Date(start.getTime()+60*60000);
    const fmt=d=>d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
    const u=new URL("https://calendar.google.com/calendar/render");u.searchParams.set("action","TEMPLATE");u.searchParams.set("text",e.title+(e.startTimeKind==="doors"?" (doors)":e.startTimeKind==="listed"?" (time unverified)":""));u.searchParams.set("dates",e.startTimeKind==="date-only"?ymd(e).replace(/-/g,"")+"/"+addDays(ymd(e),1).replace(/-/g,""):fmt(start)+"/"+fmt(end));
    u.searchParams.set("details",e.description+"\nSource: "+e.url+(e.startTimeKind==="date-only"?"\nDate is confirmed but no start time is published. This is an all-day calendar placeholder; update when the organizer announces a time.":e.endsAt?"":"\nThe original listing did not confirm an end time. Adjust the one-hour placeholder."));
    if(e.address)u.searchParams.set("location",e.venue+", "+e.address);
    return u.toString();
  }
  function icsEscape(s){return String(s||"").replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");}
  function icsDate(date){return date.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");}
  function fold(line){
    const pieces=[];let rest=line;
    while(rest.length>72){pieces.push(rest.slice(0,72));rest=" "+rest.slice(72);}
    pieces.push(rest);return pieces.join("\r\n");
  }
  function makeIcs(items){
    const stamp=icsDate(new Date());
    const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//SHOWS//Portland Calendar Pilot//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:SHOWS saved events"];
    for(const e of items){
      const end=e.endsAt?new Date(e.endsAt):new Date(Date.parse(e.startsAt)+3600000);
      const allDay=e.startTimeKind==="date-only";
      const startDay=ymd(e).replace(/-/g,""),endDay=addDays(ymd(e),1).replace(/-/g,"");
      lines.push("BEGIN:VEVENT","UID:"+e.id+"@shows-portland","DTSTAMP:"+stamp,
        allDay?"DTSTART;VALUE=DATE:"+startDay:"DTSTART:"+icsDate(new Date(e.startsAt)),
        allDay?"DTEND;VALUE=DATE:"+endDay:"DTEND:"+icsDate(end),
        "SUMMARY:"+icsEscape(e.title+(e.startTimeKind==="doors"?" (doors)":"")),
        "LOCATION:"+icsEscape([e.venue,e.address].filter(Boolean).join(", ")),
        "DESCRIPTION:"+icsEscape(e.description+"\nSource: "+e.url+(allDay?"\nDate confirmed; start time not published. This is an all-day calendar placeholder; update when time is known.":e.endsAt?"":"\nNote: End time was not published. The calendar includes a one-hour placeholder; edit it as needed.")),
        "URL:"+e.url,"END:VEVENT");
    }
    lines.push("END:VCALENDAR");return lines.map(fold).join("\r\n")+"\r\n";
  }
  function downloadIcs(items,name){
    if(!items.length)return;
    const blob=new Blob([makeIcs(items)],{type:"text/calendar;charset=utf-8"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=name+".ics";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  function saveEvent(id){
    if(saved.has(id))saved.delete(id);else saved.add(id);
    try{localStorage.setItem(savedKey,JSON.stringify([...saved]));}catch(_){}
    if(state.quick==="saved")render();
  }
  function sourceInfo(e){
    const refs=e.sources?.length?e.sources:[{name:e.source,url:e.url}];
    const links=refs.map(s=>'<a target="_blank" rel="noopener noreferrer" href="'+esc(s.url)+'">'+esc(s.name)+' ↗</a>').join(' · ');
    const checked=e.sourceCheckedAt?new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(e.sourceCheckedAt+'T12:00:00Z')):null;
    return '<p class="detail-note"><strong>Source'+(refs.length>1?'s':'')+':</strong> '+links+'</p>'+(checked?'<p class="detail-note">Source checked '+esc(checked)+'. Confirm current details with the organizer.</p>':'')+(e.sourceNote?'<p class="detail-note">'+esc(e.sourceNote)+'</p>':'');
  }
  function detail(e){
    const series=e.seriesId?events.filter(item=>item.seriesId===e.seriesId):[];
    const map=e.address?'<a target="_blank" rel="noopener noreferrer" href="'+mapLink(e.address)+'">Directions ↗</a>':"Address not verified";
    const dialog=$("eventDialog");
    $("dialogContent").innerHTML='<div class="detail-wrap"><div class="dialog-top"><span class="detail-tag">'+esc(e.category)+' · '+esc(e.neighborhood)+'</span><button type="button" class="dialog-close" data-close aria-label="Close event details">×</button></div>'+artMarkup(e,true)+'<h2 id="dialogTitle">'+esc(e.title)+'</h2><p class="detail-sub">'+esc(e.subtitle)+'</p><div class="detail-info"><div><strong>When</strong><span>'+esc(dateLabel(e))+'<br>'+esc(timeRange(e))+'</span></div><div><strong>Where</strong><span>'+esc(e.venue)+'<br>'+esc(e.address||"Address not confirmed")+(e.address?' · '+map:"")+'</span></div><div><strong>Cost</strong><span>'+esc(e.price)+'</span></div><div><strong>Ages</strong><span>'+esc(e.age)+'</span></div></div><p class="detail-description">'+esc(e.description)+'</p>'+(e.accessibility?'<p class="detail-note"><strong>Access:</strong> '+esc(e.accessibility)+'</p>':"")+sourceInfo(e)+'<div class="detail-actions"><a class="primary" target="_blank" rel="noopener noreferrer" href="'+esc(e.url)+'">Event / registration ↗</a><button class="accent" type="button" data-save="'+esc(e.id)+'">'+(saved.has(e.id)?"★ Saved — remove":"☆ Save for later")+'</button><a href="'+esc(googleLink(e))+'" target="_blank" rel="noopener noreferrer">+ Google Calendar ↗</a><button type="button" data-download="'+esc(e.id)+'">↓ Apple / Outlook (.ics)</button>'+(series.length>1?'<button type="button" data-series="'+esc(e.seriesId)+'">↓ Add all '+series.length+' series dates (.ics)</button>':"")+'<button type="button" data-share="'+esc(e.id)+'">↗ Share event</button></div>'+(!e.endsAt?'<p class="detail-footnote">The end time is unconfirmed. Calendar exports use an editable one-hour placeholder.</p>':"")+'</div>';
    if(!dialog.open)dialog.showModal();
    const hash="#event="+encodeURIComponent(e.id);if(location.hash!==hash)history.replaceState(null,"",hash);
    dialog.querySelector("[data-close]").focus();
  }
  function closeDialog(){
    const dialog=$("eventDialog");if(dialog.open)dialog.close();
    if(location.hash.startsWith("#event="))history.replaceState(null,"",location.pathname+location.search);
  }
  document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{state.view=b.dataset.view;state.selectedDay=null;render();}));
  document.querySelectorAll("[data-quick]").forEach(b=>b.addEventListener("click",()=>{state.quick=b.dataset.quick;state.selectedDay=null;if(["today","seven","weekend"].includes(state.quick))state.month=today.slice(0,7);render();}));
  $("previous").addEventListener("click",()=>{state.month=shiftMonth(state.month,-1);state.quick="all";state.selectedDay=null;render();});
  $("next").addEventListener("click",()=>{state.month=shiftMonth(state.month,1);state.quick="all";state.selectedDay=null;render();});
  $("today").addEventListener("click",()=>{state.month=today.slice(0,7);state.quick="today";state.selectedDay=null;render();});
  $("search").addEventListener("input",e=>{state.search=e.target.value.trim().toLowerCase();state.selectedDay=null;render();});
  $("category").addEventListener("change",e=>{state.category=e.target.value;if(state.category!=="Music"){state.musicStyle="all";$("musicStyle").value="all";}state.selectedDay=null;render();});
  $("musicStyle").addEventListener("change",e=>{state.musicStyle=e.target.value;if(state.musicStyle!=="all"){state.category="Music";$("category").value="Music";}state.selectedDay=null;render();});
  $("neighborhood").addEventListener("change",e=>{state.neighborhood=e.target.value;state.selectedDay=null;render();});
  $("reset").addEventListener("click",()=>{restoreFilters();render();});
  $("exportVisible").addEventListener("click",()=>downloadIcs(filtered(),"shows-"+state.month+"-events"));
  $("calendar").addEventListener("click",e=>{
    const eventButton=e.target.closest("[data-event]");
    if(eventButton){const match=events.find(x=>x.id===eventButton.dataset.event);if(match)detail(match);return;}
    const day=e.target.closest("[data-day]");
    if(day){state.selectedDay=day.dataset.day;render();document.querySelector(".selected-day-header")?.scrollIntoView({block:"nearest",behavior:"smooth"});return;}
    if(e.target.closest("[data-clear-day]")){state.selectedDay=null;render();return;}
    if(e.target.closest("[data-reset]")){restoreFilters();render();}
  });
  // A blocked or missing hotlinked flyer must not leave a broken image in the interface.
  if(typeof document.addEventListener==="function")document.addEventListener("error",e=>{
    const image=e.target;
    if(!(image instanceof HTMLImageElement)||!image.classList.contains("show-art-image"))return;
    image.remove();
    image.closest(".show-art")?.classList.remove("show-art--poster");
  },true);
  $("eventDialog").addEventListener("click",async e=>{
    if(e.target===$("eventDialog")||e.target.closest("[data-close]")){closeDialog();return;}
    const b=e.target.closest("button");if(!b)return;
    if(b.dataset.save){const id=b.dataset.save;saveEvent(id);b.textContent=saved.has(id)?"★ Saved — remove":"☆ Save for later";}
    if(b.dataset.download){const x=events.find(v=>v.id===b.dataset.download);if(x)downloadIcs([x],"shows-"+x.id);}
    if(b.dataset.series){downloadIcs(events.filter(v=>v.seriesId===b.dataset.series),"shows-"+b.dataset.series);}
    if(b.dataset.share){const x=events.find(v=>v.id===b.dataset.share);if(!x)return;const url=location.href.split("#")[0]+"#event="+encodeURIComponent(x.id);try{if(navigator.share)await navigator.share({title:x.title,url});else{await navigator.clipboard.writeText(url);b.textContent="✓ Link copied";}}catch(_){b.textContent="Copy this URL: "+url;}}
  });
  $("eventDialog").addEventListener("close",()=>{if(location.hash.startsWith("#event="))history.replaceState(null,"",location.pathname+location.search);});
  for(const c of categories){const o=document.createElement("option");o.value=c;o.textContent=c;$("category").appendChild(o);}
  for(const style of musicStyles){const o=document.createElement("option");o.value=style;o.textContent=style;$("musicStyle").appendChild(o);}
  for(const n of neighborhoods){const o=document.createElement("option");o.value=n;o.textContent=n;$("neighborhood").appendChild(o);}
  render();
  if(location.hash.startsWith("#event=")){const match=events.find(e=>e.id===decodeURIComponent(location.hash.slice(7)));if(match)detail(match);}
})();
