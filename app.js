(() => {
  "use strict";
  const zone = "America/Los_Angeles";
  const events = (window.SHOWS_EVENTS || []).slice().sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const $ = (id) => document.getElementById(id);
  const dateLong = new Intl.DateTimeFormat("en-US", {timeZone: zone, weekday: "long", month: "long", day: "numeric"});
  const dateShort = new Intl.DateTimeFormat("en-US", {timeZone: zone, month: "short", day: "numeric"});
  const dateDisplayFormat = new Intl.DateTimeFormat("en-US", {timeZone: "UTC", month: "short", day: "numeric", year: "numeric"});
  const timeFormat = new Intl.DateTimeFormat("en-US", {timeZone: zone, hour: "numeric", minute: "2-digit"});
  const state = {view: "dates", start: ymdDate(new Date()), month: ymdDate(new Date()).slice(0,7), search: "", neighborhood: "", style: "", onlyFree: false, onlySaved: false, limit: 60};
  const today = state.start;
  const savedKey = "shows-saved-v1";
  let saved = new Set();
  try { saved = new Set(JSON.parse(localStorage.getItem(savedKey) || "[]")); } catch (_) {}
  const eligible = events.filter(e => e.category === "Music" || isCulture(e));
  const neighborhoods = [...new Set(eligible.map(e => e.neighborhood).filter(Boolean))].sort();
  const styles = [...new Set(events.filter(e => e.category === "Music").flatMap(e => e.musicStyles || []))].sort();
  function ymdDate(date) {
    const parts = new Intl.DateTimeFormat("en-US", {timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit"}).formatToParts(date);
    const part = t => parts.find(p => p.type === t).value;
    return part("year") + "-" + part("month") + "-" + part("day");
  }
  function ymd(e) { return ymdDate(new Date(e.startsAt)); }
  function esc(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function isCulture(e) {
    if (e.category === "Arts & DIY") return true;
    if (e.category !== "Markets") return false;
    const sample = [e.title, e.subtitle, ...(e.tags || [])].join(" ").toLowerCase();
    if (/farmers? markets?|produce market|farm stand/.test(sample)) return false;
    return /zine|art|craft|maker|diy|odd|occult|witch|goth|punk|record|vinyl|vintage|tattoo|print|queer|independent|handmade|alternative/.test(sample);
  }
  function inSearch(e) {
    if (!state.search) return true;
    return [e.title, e.subtitle, e.category, e.venue, e.neighborhood, e.description, ...(e.tags || []), ...(e.musicStyles || [])].join(" ").toLowerCase().includes(state.search);
  }
  function filtered() {
    return eligible.filter(e =>
      (state.view === "month" ? ymd(e).slice(0,7) === state.month : ymd(e) >= state.start) &&
      inSearch(e) &&
      (!state.neighborhood || state.neighborhood === e.neighborhood) &&
      (!state.style || (e.musicStyles || []).includes(state.style)) &&
      (!state.onlyFree || e.free === true) &&
      (!state.onlySaved || saved.has(e.id)));
  }
  function changeMonth(delta) {
    const [year,month] = state.month.split("-").map(Number);
    state.month = new Date(Date.UTC(year,month-1+delta,1)).toISOString().slice(0,7);
    render();
  }
  function renderMonth(items) {
    const [year,month] = state.month.split("-").map(Number);
    const first = new Date(Date.UTC(year,month-1,1));
    const offset = first.getUTCDay();
    const days = new Date(Date.UTC(year,month,0)).getUTCDate();
    const counts = new Map();
    items.forEach(e => counts.set(ymd(e), (counts.get(ymd(e)) || 0) + 1));
    let html = '<p class="shows-month-help">Select a date to open its events in the list.</p><div class="shows-month-grid">';
    for (const name of ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]) html += '<span class="shows-weekday">'+name+'</span>';
    for (let i=0; i<offset; i++) html += '<span class="shows-month-blank" aria-hidden="true"></span>';
    for (let n=1; n<=days; n++) {
      const day = state.month+'-'+String(n).padStart(2,"0");
      const count = counts.get(day) || 0;
      const label = dateLong.format(new Date(day+'T12:00:00Z'));
      html += '<button type="button" class="shows-month-date'+(day===today?' shows-month-today':'')+'" data-day="'+day+
        '"><span class="shows-date-number">'+n+
        '</span>'+(count?'<span class="shows-date-count">'+count+' <span class="sr-only">events</span></span>':'')+
        '<span class="sr-only"> '+esc(label)+': open day in list.</span></button>';
    }
    return html+'</div>';
  }
  function clock(e) {
    if (e.startTimeKind === "date-only") return "Time TBA";
    const prefix = e.startTimeKind === "doors" ? "Doors " : e.startTimeKind === "listed" ? "Listed time " : "";
    return prefix + timeFormat.format(new Date(e.startsAt));
  }
  function art(e, detail) {
    const a = e.artwork;
    const ok = a && /^https:\/\/[^<>"'\s]+$/i.test(a.url || "") && /^https:\/\//i.test(a.sourceUrl || "") &&
      (a.origin === "official-event-page" || a.origin === "official-venue-calendar" || a.usageApproved === true) && a.usageApproved !== false;
    const content = ok ? '<img alt="" loading="lazy" decoding="async" referrerpolicy="strict-origin-when-cross-origin" src="' + esc(a.url) + '">' : '<span>No flyer available</span>';
    return '<span aria-hidden="true" class="' + (detail ? "preview-detail-art" : "preview-art") + '">' + content + '</span>';
  }
  function card(e) {
    return '<button type="button" class="preview-event" data-event="' + esc(e.id) + '">' + art(e, false) +
      '<span class="preview-event-text"><span class="preview-eyebrow">' + esc(e.category) +
      (e.musicStyles && e.musicStyles.length ? ' · ' + esc(e.musicStyles.slice(0, 2).join(" / ")) : "") +
      '</span><span class="preview-event-title">' + esc(e.title) + '</span><span class="preview-meta">' +
      esc(clock(e)) + ' · <span class="preview-venue">' + esc(e.venue) + '</span></span>' +
      '<span class="preview-meta">' + esc(e.price || "Price not confirmed") + '</span></span></button>';
  }
  function renderDates(items) {
    const visible = items.slice(0, state.limit);
    const groups = new Map();
    for (const e of visible) {
      const day = ymd(e);
      if (!groups.has(day)) groups.set(day, []);
      groups.get(day).push(e);
    }
    let html = "";
    if (state.start === today && !groups.has(today) && groups.size > 0) {
      html += '<div class="preview-empty"><h3>Nothing listed today yet.</h3><p>Keep scrolling for upcoming events. Coverage is still growing at several venues.</p></div>';
    }
    for (const [day, list] of groups) {
      html += '<section class="preview-day"><div class="preview-day-heading"><h3>' + esc(dateLong.format(new Date(list[0].startsAt))) +
        '</h3><span>' + (day === today ? "TODAY · " : "") + list.length + ' listed' + (list.length === 1 ? "" : " events") +
        '</span></div><div class="preview-cards">' + list.map(card).join("") + '</div></section>';
    }
    return html || '<div class="preview-empty"><h3>No listings found.</h3><p>Try a different start date or clear search and filters. Music coverage is still growing.</p></div>';
  }
  function mapLink(address) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address); }
  function renderPlaces(items) {
    if (!items.length) return '<div class="preview-empty"><h3>No places found.</h3><p>Try another start date or clear filters.</p></div>';
    const places = new Map();
    for (const e of items) {
      if (!places.has(e.venue)) places.set(e.venue, []);
      places.get(e.venue).push(e);
    }
    return '<div class="preview-place-list">' + [...places].sort((a,b) => a[0].localeCompare(b[0])).map(([name, list]) =>
      '<article class="preview-place"><h3>' + esc(name) + '</h3><p>' + esc(list[0].neighborhood || "Portland") +
      ' · ' + list.length + ' listing' + (list.length === 1 ? "" : "s") +
      '</p>' + (list[0].address ? '<p>'+esc(list[0].address)+'</p><p><a href="'+esc(mapLink(list[0].address))+'" target="_blank" rel="noopener noreferrer">Directions ↗</a></p>' : '') +
      list.slice(0, 8).map(e =>
        '<button type="button" data-event="' + esc(e.id) + '"><span>' + esc(dateShort.format(new Date(e.startsAt))) +
        ' · ' + esc(clock(e)) + '</span>' + esc(e.title) + ' ↗</button>').join("") +
      (list.length > 8 ? '<p>And ' + (list.length - 8) + ' more dates. Refine filters or use By date for the full list.</p>' : "") +
      '</article>').join("") + '</div>';
  }
  function render() {
    // Synchronize the visible date with the native picker every time the view changes.
    $("fromDate").value = state.start;
    $("fromDateDisplay").textContent = dateDisplayFormat.format(new Date(state.start + "T12:00:00Z"));
    const items = filtered();
    const monthLabel = new Intl.DateTimeFormat("en-US",{timeZone:"UTC",month:"long",year:"numeric"}).format(new Date(state.month+"-01T12:00:00Z"));
    $("summary").textContent = items.length + " matching event listing" + (items.length === 1 ? "" : "s") +
      (state.view === "month" ? " in "+monthLabel :
       " from "+state.start+" onward · "+(state.view === "dates" ? "ordered by date" : "grouped by venue"));
    $("results").innerHTML = state.view === "dates" ? renderDates(items) :
      state.view === "places" ? renderPlaces(items) : renderMonth(items);
    $("showMore").hidden = state.view !== "dates" || items.length <= state.limit;
    $("showMore").textContent = "Show more events (" + Math.min(60, items.length - state.limit) + " next) ↓";
    $("exportVisible").disabled = !items.length;
    $("monthControls").hidden = state.view !== "month";
    $("fromDateLabel").hidden = state.view === "month";
    $("monthPeriod").textContent = monthLabel;
    $("freeOnly").setAttribute("aria-pressed", String(state.onlyFree));
    $("savedOnly").setAttribute("aria-pressed", String(state.onlySaved));
    document.querySelectorAll("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === state.view)));
    $("previewTitle").textContent = state.view === "month" ? monthLabel + " in Portland" :
      state.start === today ? "Upcoming in Portland" : "From " + state.start;
  }
  function icsEscape(s) { return String(s || "").replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;"); }
  function icsDate(date) { return date.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,""); }
  function makeIcs(items) {
    const out = ["BEGIN:VCALENDAR","VERSION:2.0","CALSCALE:GREGORIAN","PRODID:-//SHOWS//Portland Music and Art//EN"];
    const dayAfter = day => {const d = new Date(day+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10).replace(/-/g,"");};
    for (const e of items) {
      const allDay = e.startTimeKind === "date-only";
      const start = ymd(e).replace(/-/g,"");
      const end = e.endsAt ? new Date(e.endsAt) : new Date(Date.parse(e.startsAt) + 3600000);
      out.push("BEGIN:VEVENT","UID:"+icsEscape(e.id)+"@shows-portland","DTSTAMP:"+icsDate(new Date()),
        allDay ? "DTSTART;VALUE=DATE:"+start : "DTSTART:"+icsDate(new Date(e.startsAt)),
        allDay ? "DTEND;VALUE=DATE:"+dayAfter(ymd(e)) : "DTEND:"+icsDate(end),
        "SUMMARY:"+icsEscape(e.title + (e.startTimeKind === "doors" ? " (doors)" : "")),
        "LOCATION:"+icsEscape([e.venue,e.address].filter(Boolean).join(", ")),
        "DESCRIPTION:"+icsEscape((e.description || "") + "\nSource: " + e.url +
          (allDay ? "\nTime unconfirmed; this is an editable all-day placeholder." : !e.endsAt ? "\nEnd time unconfirmed; edit the one-hour placeholder." : "")),
        "URL:"+e.url,"END:VEVENT");
    }
    out.push("END:VCALENDAR");
    return out.join("\r\n")+"\r\n";
  }
  function download(items, filename) {
    if (!items.length) return;
    const blob = new Blob([makeIcs(items)], {type:"text/calendar;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename + ".ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  function googleLink(e) {
    const u = new URL("https://calendar.google.com/calendar/render");
    const allDay = e.startTimeKind === "date-only";
    const after = new Date(ymd(e)+"T12:00:00Z");
    after.setUTCDate(after.getUTCDate()+1);
    const day = d => ymdDate(d).replace(/-/g, "");
    u.searchParams.set("action","TEMPLATE");
    u.searchParams.set("text",e.title+(e.startTimeKind==="doors"?" (doors)":""));
    u.searchParams.set("dates", allDay ? day(new Date(e.startsAt))+"/"+day(after) :
      icsDate(new Date(e.startsAt))+"/"+icsDate(e.endsAt?new Date(e.endsAt):new Date(Date.parse(e.startsAt)+3600000)));
    u.searchParams.set("details",(e.description||"")+"\nSource: "+e.url+
      (allDay?"\nStart time not published; editable all-day placeholder.":!e.endsAt?"\nEnd time unconfirmed; adjust the one-hour placeholder.":""));
    if (e.address) u.searchParams.set("location",e.venue+", "+e.address);
    return u.toString();
  }
  function detail(e) {
    const dlg = $("eventDialog");
    const sources = e.sources && e.sources.length ? e.sources : [{name:e.source||"Event source",url:e.url}];
    const links = sources.filter(s => /^https:\/\//.test(s.url || "")).map(s =>
      '<a target="_blank" rel="noopener noreferrer" href="'+esc(s.url)+'">'+esc(s.name || "Source")+' ↗</a>').join(" · ");
    const artwork = e.artwork && e.artwork.sourceUrl && /^https:\/\//.test(e.artwork.sourceUrl) ?
      '<p class="preview-info">Artwork attribution: <a target="_blank" rel="noopener noreferrer" href="'+esc(e.artwork.sourceUrl)+'">'+
      esc(e.artwork.credit||"original event source")+'</a></p>' : "";
    $("dialogContent").innerHTML =
      '<div class="detail-wrap"><div class="dialog-top"><span class="detail-tag">'+esc(e.category)+' · '+esc(e.neighborhood||"Portland")+
      '</span><button type="button" class="dialog-close" data-close aria-label="Close event">×</button></div>'+
      art(e,true)+'<h2 id="dialogTitle">'+esc(e.title)+'</h2><p class="detail-sub">'+esc(e.subtitle || "")+
      '</p><div class="detail-info"><div><strong>When</strong><span>'+esc(dateLong.format(new Date(e.startsAt)))+'<br>'+esc(clock(e))+
      (e.endsAt?' – '+esc(timeFormat.format(new Date(e.endsAt))):' · end time unconfirmed')+
      '</span></div><div><strong>Where</strong><span>'+esc(e.venue)+'<br>'+esc(e.address||"Address not confirmed")+
      (e.address ? ' · <a href="'+esc(mapLink(e.address))+'" target="_blank" rel="noopener noreferrer">Directions ↗</a>' : '')+
      '</span></div><div><strong>Cost</strong><span>'+esc(e.price||"Unconfirmed")+
      '</span></div><div><strong>Ages</strong><span>'+esc(e.age||"Unconfirmed")+
      '</span></div></div><p class="detail-description">'+esc(e.description||"")+'</p>'+
      (e.accessibility?'<p class="preview-info"><strong>Access:</strong> '+esc(e.accessibility)+'</p>':"")+
      '<p class="preview-info"><strong>Sources:</strong> '+links+'</p>'+
      (e.sourceCheckedAt?'<p class="preview-info">Source checked '+esc(e.sourceCheckedAt)+'. Verify details before attending.</p>':"")+
      artwork+'<div class="detail-actions"><a class="primary" target="_blank" rel="noopener noreferrer" href="'+esc(e.url)+'">Official listing ↗</a>'+
      '<a target="_blank" rel="noopener noreferrer" href="'+esc(googleLink(e))+'">+ Google Calendar ↗</a>'+
      '<button type="button" data-ics="'+esc(e.id)+'">↓ Apple / Outlook (.ics)</button>'+
      '<button type="button" data-save="'+esc(e.id)+'">'+(saved.has(e.id)?"★ Saved — remove":"☆ Save for later")+'</button>'+
      (e.seriesId?'<button type="button" data-series="'+esc(e.seriesId)+'">↓ Add series dates (.ics)</button>':"")+
      '<button type="button" data-share="'+esc(e.id)+'">↗ Share event</button></div>'+
      (e.startTimeKind==="date-only" ? '<p class="detail-footnote">Date confirmed; start time not published. Calendar exports use a clearly labeled all-day placeholder.</p>' : !e.endsAt ? '<p class="detail-footnote">End time unconfirmed; exports use an editable one-hour placeholder.</p>' : "")+'</div>';
    if (!dlg.open) dlg.showModal();
    history.replaceState(null,"","#event="+encodeURIComponent(e.id));
    dlg.querySelector("[data-close]").focus();
  }
  function closeDialog() {
    if ($("eventDialog").open) $("eventDialog").close();
    if (location.hash.startsWith("#event=")) history.replaceState(null,"",location.pathname+location.search);
  }
  for (const name of neighborhoods) {
    const o = document.createElement("option");o.value=name;o.textContent=name;$("neighborhood").appendChild(o);
  }
  for (const name of styles) {
    const o = document.createElement("option");o.value=name;o.textContent=name;$("style").appendChild(o);
  }
  $("fromDate").value = state.start;
  for (const el of document.querySelectorAll("[data-view]")) el.addEventListener("click", () => {
    state.view=el.dataset.view;state.limit=60;render();
  });
  $("search").addEventListener("input",e => {state.search=e.target.value.trim().toLowerCase();state.limit=60;render();});
  $("fromDate").addEventListener("change",e => {if(/^\d{4}-\d\d-\d\d$/.test(e.target.value)){state.start=e.target.value;state.limit=60;render();}});
  $("neighborhood").addEventListener("change",e => {state.neighborhood=e.target.value;state.limit=60;render();});
  $("style").addEventListener("change",e => {state.style=e.target.value;state.limit=60;render();});
  $("jumpToday").addEventListener("click",() => {
    state.start=today;state.month=today.slice(0,7);state.view="dates";$("fromDate").value=today;state.limit=60;render();
  });
  $("previousMonth").addEventListener("click",() => changeMonth(-1));
  $("nextMonth").addEventListener("click",() => changeMonth(1));
  $("freeOnly").addEventListener("click",() => {state.onlyFree=!state.onlyFree;state.limit=60;render();});
  $("savedOnly").addEventListener("click",() => {state.onlySaved=!state.onlySaved;state.limit=60;render();});
  $("clearFilters").addEventListener("click",() => {
    state.search="";state.neighborhood="";state.style="";state.onlyFree=false;state.onlySaved=false;state.limit=60;
    $("search").value="";$("neighborhood").value="";$("style").value="";render();
  });
  $("showMore").addEventListener("click",() => {state.limit+=60;render();});
  $("exportVisible").addEventListener("click",() => download(filtered(),"shows-"+(state.view==="month"?state.month:state.start)+"-events"));
  $("results").addEventListener("click",event => {
    const hit=event.target.closest("[data-event]");
    if(hit){const e=events.find(item=>item.id===hit.dataset.event);if(e)detail(e);return;}
    const day=event.target.closest("[data-day]");
    if(day){state.start=day.dataset.day;state.view="dates";state.limit=60;$("fromDate").value=state.start;render();}
  });
  $("eventDialog").addEventListener("click",async event => {
    if(event.target===$("eventDialog")||event.target.closest("[data-close]")){closeDialog();return;}
    const hit=event.target.closest("button");if(!hit)return;
    if(hit.dataset.ics){const e=events.find(x=>x.id===hit.dataset.ics);if(e)download([e],"shows-"+e.id);}
    if(hit.dataset.series){const list=events.filter(x=>x.seriesId===hit.dataset.series);download(list,"shows-series-"+hit.dataset.series);}
    if(hit.dataset.save){const id=hit.dataset.save;if(saved.has(id))saved.delete(id);else saved.add(id);try{localStorage.setItem(savedKey,JSON.stringify([...saved]));}catch(_){}hit.textContent=saved.has(id)?"★ Saved — remove":"☆ Save for later";if(state.onlySaved)render();}
    if(hit.dataset.share){const e=events.find(x=>x.id===hit.dataset.share);if(!e)return;
      const url=location.href.split("#")[0]+"#event="+encodeURIComponent(e.id);
      try{if(navigator.share)await navigator.share({title:e.title,url});else {await navigator.clipboard.writeText(url);hit.textContent="✓ Link copied";}}
      catch(_){hit.textContent="Copy this URL: "+url;}
    }
  });
  $("eventDialog").addEventListener("close",() => {
    if(location.hash.startsWith("#event="))history.replaceState(null,"",location.pathname+location.search);
  });
  document.addEventListener("error",event => {
    const img=event.target;
    if(!(img instanceof HTMLImageElement) || !img.closest(".preview-art,.preview-detail-art"))return;
    const wrap=img.parentElement;
    img.remove();
    wrap.textContent="No flyer available";
  },true);
  render();
  if(location.hash.startsWith("#event=")) {
    const e=events.find(x=>x.id===decodeURIComponent(location.hash.slice(7)));
    if(e)detail(e);
  }
})();
