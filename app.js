(() => {
  "use strict";
  const zone = "America/Los_Angeles";
  const events = (window.SHOWS_EVENTS || []).slice().sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const $ = (id) => document.getElementById(id);
  const dateLong = new Intl.DateTimeFormat("en-US", {timeZone: zone, weekday: "long", month: "long", day: "numeric"});
  const dateShort = new Intl.DateTimeFormat("en-US", {timeZone: zone, month: "short", day: "numeric"});
  const timeFormat = new Intl.DateTimeFormat("en-US", {timeZone: zone, hour: "numeric", minute: "2-digit"});
  const state = {view: "dates", start: ymdDate(new Date()), month: ymdDate(new Date()).slice(0,7), search: "", neighborhood: "", style: "", onlyFree: false, onlySaved: false, limit: 60};
  const today = state.start;
  const savedKey = "shows-saved-v1";
  let saved = new Set();
  try { saved = new Set(JSON.parse(localStorage.getItem(savedKey) || "[]")); } catch (_) {}
  // All source-listed events are discoverable regardless of category or genre.
  // Routine farmers markets are an explicit editorial exclusion, not a classification
  // uncertainty. Venue-closure notices are not events, even if mistagged as Music.
  const eligible = events.filter(e =>
    !/^(?:closed|closure|venue closed|no events?)\b/i.test(String(e.title || "").trim()) &&
    !isRoutineFarmersMarket(e));
  const neighborhoods = [...new Set(eligible.map(e => e.neighborhood).filter(Boolean))].sort();
  // Stable genre taxonomy: user-facing genre choices remain selectable before
  // a source has approved listings; unclassified events stay in the default feed.
  // Keep legacy mixed labels when approved events still use them, without
  // projecting Country onto Americana-only or vice versa.
  const supportedStyles = ["Jazz","Blues","Hip-hop & rap","R&B & soul","Funk & disco",
    "Folk & bluegrass","Country","Americana","Electronic & dance","Reggae & ska",
    "Global & traditional","Classical & chamber","Indie & alternative","Pop"];
  const styles = [...new Set([...supportedStyles,...events.filter(e => e.category === "Music").flatMap(e => e.musicStyles || [])])].sort();
  function ymdDate(date) {
    const parts = new Intl.DateTimeFormat("en-US", {timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit"}).formatToParts(date);
    const part = t => parts.find(p => p.type === t).value;
    return part("year") + "-" + part("month") + "-" + part("day");
  }
  function ymd(e) { return ymdDate(new Date(e.startsAt)); }
  function esc(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function displayCategory(e) { return e.category === "Unclassified" ? "Type unconfirmed" : e.category; }
  function isRoutineFarmersMarket(e) {
    if (e.category !== "Markets") return false;
    const sample = [e.title, e.subtitle, ...(e.tags || [])].join(" ").toLowerCase();
    return /farmers? markets?|produce market|farm stand/.test(sample);
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
    const grouped = new Map();
    for (const e of items) {
      const day = ymd(e);
      if (!grouped.has(day)) grouped.set(day, []);
      grouped.get(day).push(e);
    }
    // Calendar shows a few actual event names on roomy desktops; smaller
    // screens retain the existing compact dates/counts without horizontal scroll.
    // Each preview is a separate button (no nested interactive controls).
    let html = '<p class="shows-month-help">Select a date for its full list, or choose an event preview to see details.</p><div class="shows-month-grid">';
    for (const name of ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]) html += '<span class="shows-weekday">'+name+'</span>';
    for (let i=0;i<offset;i++) html += '<span class="shows-month-blank" aria-hidden="true"></span>';
    for (let n=1;n<=days;n++) {
      const day = state.month+'-'+String(n).padStart(2,"0");
      const list = grouped.get(day)||[];
      const label = dateLong.format(new Date(day+'T12:00:00Z'));
      const count = list.length;
      html += '<div class="shows-month-date'+(day===today?' shows-month-today':'')+'">'+
        '<button type="button" class="shows-month-day" data-day="'+day+'">'+
        '<span class="shows-date-number">'+n+'</span>'+
        (count?'<span class="shows-date-count">'+count+' <span class="sr-only">events</span></span>':'')+
        '<span class="sr-only"> · '+esc(label)+'. Open full day.</span></button>';
      if (count) {
        html += '<div class="shows-month-previews">';
        for (const e of list.slice(0,3)) {
          const time = e.startTimeKind==="date-only"?"Time TBA":
            (e.startTimeKind==="doors"?"Doors ":"")+timeFormat.format(new Date(e.startsAt));
          html += '<button type="button" class="shows-month-event" data-event="'+esc(e.id)+
            '">'+
            '<span class="shows-month-event-time">'+esc(time)+'</span>'+
            '<span class="shows-month-event-title">'+esc(e.title)+'</span>'+
            '<span class="shows-month-event-venue">'+esc(e.venue)+'</span>'+
            '<span class="sr-only">. Open event details.</span></button>';
        }
        html += '</div>';
        if(count>3) html += '<span class="shows-month-more">+'+(count-3)+' more · open day</span>';
      }
      html += '</div>';
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
      '<span class="preview-event-text"><span class="preview-eyebrow">' + esc(displayCategory(e)) +
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

// Places use the canonical venue identities from the public registry snapshot.
// Unknown event locations remain discoverable by their source-listed name.
  const placeDirectory = Array.isArray(window.SHOWS_PLACES) ? window.SHOWS_PLACES : [];
  function normalizePlace(value) {
    return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
  }
  const placeIndex = new Map();
  for (const venue of placeDirectory) {
    for (const name of [venue.name, ...(venue.aliases || [])]) {
      const key = normalizePlace(name);
      if (key && !placeIndex.has(key)) placeIndex.set(key,venue);
    }
  }
  const expandedPlaces = new Set();
  function placeInfo(venue) {
    const match = placeIndex.get(normalizePlace(venue));
    return {key: match ? "venue-"+match.id : "unlisted-"+normalizePlace(venue),
      name:match ? match.name : venue, calendarUrl:match?.calendarUrl || ""};
  }
  function placeGroups(items) {
    const groups = new Map();
    for (const event of items) {
      const info = placeInfo(event.venue);
      if (!groups.has(info.key)) groups.set(info.key,{...info,events:[]});
      groups.get(info.key).events.push(event);
    }
    return [...groups.values()].sort((a,b)=>a.name.localeCompare(b.name));
  }
  function recurringPrograms(items) {
    // Do not call a series weekly/monthly based on a title or a single listing.
    // Require at least three verified occurrences at a consistent cadence.
    const possible = new Map();
    for (const event of items) {
      const title = String(event.title || "").trim().toLowerCase().replace(/\s+/g," ");
      const key = title + "|" + event.category;
      if (!possible.has(key)) possible.set(key,[]);
      possible.get(key).push(event);
    }
    const programs = [], repeating = new Set();
    for (const list of possible.values()) {
      if (list.length < 3) continue;
      const gaps = list.slice(1).map((event,i)=>
        Math.round((Date.parse(event.startsAt)-Date.parse(list[i].startsAt))/86400000));
      const weekly = gaps.every(n=>n>=6&&n<=8);
      const monthly = gaps.every(n=>n>=27&&n<=35);
      if (!weekly && !monthly) continue;
      list.forEach(event=>repeating.add(event.id));
      programs.push({title:list[0].title,events:list,frequency:weekly?"Weekly":"Monthly"});
    }
    programs.sort((a,b)=>Date.parse(a.events[0].startsAt)-Date.parse(b.events[0].startsAt));
    return {programs,repeating};
  }
  function approvedPlaceArt(event) {
    const a = event.artwork;
    return !!(a && /^https:\/\/[^<>"'\s]+$/i.test(a.url || "") &&
      /^https:\/\//i.test(a.sourceUrl || "") &&
      (a.origin==="official-event-page" || a.origin==="official-venue-calendar" || a.usageApproved===true) &&
      a.usageApproved!==false);
  }
  function placeEvent(event, featured=false) {
    const date = dateShort.format(new Date(event.startsAt))+" · "+clock(event);
    if (!featured) return '<button class="place-compact" type="button" data-event="'+esc(event.id)+'">'+
      '<span class="place-compact-date">'+esc(date)+'</span>'+
      '<span class="place-compact-title">'+esc(event.title)+'</span></button>';
    return '<button class="place-feature" type="button" data-event="'+esc(event.id)+'">'+
      (approvedPlaceArt(event)?'<span class="place-feature-art">'+art(event,false)+'</span>':'')+
      '<span class="place-feature-body"><span class="place-feature-date">'+esc(date)+'</span>'+
      '<span class="place-feature-title">'+esc(event.title)+'</span>'+
      '<span class="place-feature-type">'+esc((event.musicStyles||[]).slice(0,2).join(" / ") || displayCategory(event))+
      '</span></span></button>';
  }
  function renderPlaces(items) {
    if (!items.length) return '<div class="preview-empty"><h3>No places found.</h3><p>Try another start date or clear filters.</p></div>';
    const places = placeGroups(items);
    return '<p class="places-intro">Browse venues through their upcoming programming. Regular series are condensed here; By date and calendar exports retain every listing. SHOWS is not a complete venue calendar.</p>'+
      '<div class="preview-place-list">'+places.map(place=>{
      const list = place.events, first = list[0];
      const address = list.find(event=>event.address)?.address;
      const {programs,repeating} = recurringPrograms(list);
      const specials = list.filter(event=>!repeating.has(event.id));
      const expanded = expandedPlaces.has(place.key) && (specials.length>6 || programs.length>0);
      const contentId="place-events-"+place.key;
      const meta = esc(first.neighborhood || "Portland")+' · '+list.length+
        ' listed event'+(list.length===1?"":"s");
      let contents = "";
      if (expanded) {
        contents = '<div class="place-full-list" id="'+esc(contentId)+'"><h4>All upcoming listings</h4>'+
          list.map(event=>placeEvent(event)).join("")+'</div>';
      } else {
        const highlights = specials.slice(0,2), more = specials.slice(2,6);
        contents = '<div id="'+esc(contentId)+'">'+
          (highlights.length?'<section class="place-highlights"><h4>Upcoming highlights</h4>'+
            highlights.map(event=>placeEvent(event,true)).join("")+'</section>':"")+
          (more.length?'<section class="place-additional"><h4>More coming up</h4>'+
            more.map(event=>placeEvent(event)).join("")+'</section>':"")+
          (programs.length?'<section class="place-regular"><h4>Regular programming</h4>'+
            programs.map(program=>'<button type="button" class="place-series" data-event="'+esc(program.events[0].id)+'">'+
              '<span class="place-series-title">'+esc(program.title)+'</span>'+
              '<span class="place-series-meta">'+esc(program.frequency)+' in listed dates · '+
              program.events.length+' upcoming · Next '+esc(dateShort.format(new Date(program.events[0].startsAt)))+
              '</span></button>').join("")+'</section>':"")+
          '</div>';
      }
      const hasMore = specials.length>6 || programs.length>0;
      return '<article class="preview-place" aria-labelledby="place-heading-'+esc(place.key)+'">'+
        '<header class="place-heading"><h3 id="place-heading-'+esc(place.key)+'">'+esc(place.name)+'</h3>'+
        '<p>'+meta+'</p>'+
        '<div class="place-links">'+
        (address?'<a target="_blank" rel="noopener noreferrer" href="'+esc(mapLink(address))+'">Directions</a>':"")+
        (place.calendarUrl?'<a target="_blank" rel="noopener noreferrer" href="'+esc(place.calendarUrl)+'">Venue calendar</a>':"")+
        '</div></header>'+contents+
        (hasMore?'<button type="button" class="place-toggle" data-place-toggle="'+esc(place.key)+
          '" aria-expanded="'+String(expanded)+'" aria-controls="'+esc(contentId)+'">'+
          (expanded?'Back to highlights':'Show all '+list.length+' listings')+'</button>':"")+
        '</article>';
      }).join("")+'</div>';
  }
  function render() {
    // Synchronize the visible date with the native picker every time the view changes.
    $("fromDate").value = state.start;
    const items = filtered();
    const monthLabel = new Intl.DateTimeFormat("en-US",{timeZone:"UTC",month:"long",year:"numeric"}).format(new Date(state.month+"-01T12:00:00Z"));
    $("summary").textContent = state.view === "places" ?
      placeGroups(items).length + " places · " + items.length + " matching listings from " + state.start + " onward" :
      items.length + " matching event listing" + (items.length === 1 ? "" : "s") +
      (state.view === "month" ? " in "+monthLabel : " from "+state.start+" onward · ordered by date");
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
  // Query URLs are visible to social preview bots; legacy #event URLs still open.
  function eventUrl(e) {
    const u = new URL(location.origin + location.pathname);
    u.searchParams.set("event", e.id);
    return u.toString();
  }
  function clearEventLocation() {
    const u = new URL(location.href);
    if (!u.searchParams.has("event") && !u.hash.startsWith("#event=")) return;
    u.searchParams.delete("event");
    if (u.hash.startsWith("#event=")) u.hash = "";
    history.replaceState(null, "", u.pathname + u.search + u.hash);
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
      '<div class="detail-wrap"><div class="dialog-top"><span class="detail-tag">'+esc(displayCategory(e))+' · '+esc(e.neighborhood||"Portland")+
      '</span><button type="button" class="dialog-close" data-close aria-label="Close event">×</button></div>'+
      '<h2 id="dialogTitle">'+esc(e.title)+'</h2><p class="detail-sub">'+esc(e.subtitle || "")+
      '</p><div class="detail-info"><div><strong>When</strong><span>'+esc(dateLong.format(new Date(e.startsAt)))+'<br>'+esc(clock(e))+
      (e.endsAt?' – '+esc(timeFormat.format(new Date(e.endsAt))):' · end time unconfirmed')+
      '</span></div><div><strong>Where</strong><span>'+esc(e.venue)+'<br>'+esc(e.address||"Address not confirmed")+
      (e.address ? ' · <a href="'+esc(mapLink(e.address))+'" target="_blank" rel="noopener noreferrer">Directions ↗</a>' : '')+
      '</span></div><div><strong>Cost</strong><span>'+esc(e.price||"Unconfirmed")+
      '</span></div><div><strong>Ages</strong><span>'+esc(e.age||"Unconfirmed")+
      '</span></div></div>'+
      (e.accessibility?'<p class="preview-info"><strong>Access:</strong> '+esc(e.accessibility)+'</p>':"")+
      '<div class="detail-actions"><a class="primary" target="_blank" rel="noopener noreferrer" href="'+esc(e.url)+'">Official listing ↗</a></div>'+
      art(e,true)+'<p class="detail-description">'+esc(e.description||"")+'</p>'+
      '<div class="detail-actions"><a target="_blank" rel="noopener noreferrer" href="'+esc(googleLink(e))+'">+ Google Calendar ↗</a>'+
      '<button type="button" data-ics="'+esc(e.id)+'">↓ Apple / Outlook (.ics)</button>'+
      '<button type="button" data-save="'+esc(e.id)+'">'+(saved.has(e.id)?"★ Saved — remove":"☆ Save for later")+'</button>'+
      (e.seriesId?'<button type="button" data-series="'+esc(e.seriesId)+'">↓ Add series dates (.ics)</button>':"")+
      '<button type="button" data-share="'+esc(e.id)+'">↗ Share event</button>'+
      (window.SHOWS_FEEDBACK_READY ? '<button type="button" data-report="'+esc(e.id)+'">Report listing issue</button>' : "")+'</div>'+
      (e.startTimeKind==="date-only" ? '<p class="detail-footnote">Date confirmed; start time not published. Calendar exports use a clearly labeled all-day placeholder.</p>' : !e.endsAt ? '<p class="detail-footnote">End time unconfirmed; exports use an editable one-hour placeholder.</p>' : "")+
      '<div class="detail-sources">'+(links?'<p class="preview-info"><strong>Sources:</strong> '+links+'</p>':"")+
      (e.sourceCheckedAt?'<p class="preview-info">Source checked '+esc(e.sourceCheckedAt)+'. Verify details before attending.</p>':"")+
      artwork+'</div></div>';
    if (!dlg.open) dlg.showModal();
    const eventLocation = new URL(location.href);
    eventLocation.searchParams.set("event", e.id);
    eventLocation.hash = "";
    history.replaceState(null, "", eventLocation.pathname + eventLocation.search);
    dlg.querySelector("[data-close]").focus();
  }
  function closeDialog() {
    if ($("eventDialog").open) $("eventDialog").close();
    clearEventLocation();
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
    const toggle=event.target.closest("[data-place-toggle]");
    if(toggle){const key=toggle.dataset.placeToggle;
      if(expandedPlaces.has(key))expandedPlaces.delete(key);else expandedPlaces.add(key);
      render();
      $("results").querySelector?.('[data-place-toggle="'+key+'"]')?.focus?.();
      return;
    }
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
    if(hit.dataset.report && window.SHOWS_OPEN_FEEDBACK){const e=events.find(x=>x.id===hit.dataset.report);if(!e)return;
      const link = eventUrl(e);
      closeDialog();window.SHOWS_OPEN_FEEDBACK({category:"correction",link});return;
    }
    if(hit.dataset.share){const e=events.find(x=>x.id===hit.dataset.share);if(!e)return;
      const url = eventUrl(e);
      const summary = [dateShort.format(new Date(e.startsAt)), clock(e), e.venue].filter(Boolean).join(" · ");
      try {
        if (navigator.share) await navigator.share({title: e.title, text: summary, url});
        else { await navigator.clipboard.writeText([e.title, summary, url].join("\n")); hit.textContent = "✓ Event details copied"; }
      } catch (error) {
        if (error && error.name === "AbortError") return;
        hit.textContent = "Copy this URL: " + url;
      }
    }
  });
  $("eventDialog").addEventListener("close",() => {
    clearEventLocation();
  });
  document.addEventListener("error",event => {
    const img=event.target;
    if(!(img instanceof HTMLImageElement) || !img.closest(".preview-art,.preview-detail-art"))return;
    const wrap=img.parentElement;
    img.remove();
    wrap.textContent="No flyer available";
  },true);
  render();
  // New share links use ?event=; keep existing bookmarked #event= links working.
  const queryEvent = new URL(location.href).searchParams.get("event");
  let hashEvent = null;
  if (location.hash.startsWith("#event=")) {
    try { hashEvent = decodeURIComponent(location.hash.slice(7)); } catch (_) {}
  }
  const sharedId = queryEvent || hashEvent;
  if (sharedId) {
    const e = events.find(x => x.id === sharedId);
    if (e) detail(e);
  }
})();
