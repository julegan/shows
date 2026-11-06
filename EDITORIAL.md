# SHOWS editorial priorities

SHOWS is a provisional name for a curated Portland **music-first** calendar. The default discovery feed combines underground music with a selective layer of related independent art and culture. It is deliberately not a general Portland city/community calendar.

## First priority: independent music across genres

Research original Portland-area live music calendars across genres. Underground metal, punk, goth, rock, hardcore and DIY bills remain essential strengths, not limits on which music is welcome. Jazz, blues, hip-hop, soul, R&B, funk, electronic, folk, Americana, reggae, global, contemporary classical and experimental scenes deserve active coverage. Adjacent interests include black metal, crust, deathrock, darkwave, industrial, post-punk, noise, and experimental music. Favor independent venues, local and touring original music bills, emerging artists, independent promoters and scene organizers, regardless of genre. Include larger venues when the actual bill fits; do not describe every rock concert as underground.

**Venue relevance and preference take precedence over importer convenience.** The canonical owner-directed **unordered editorial groups** live in `discovery/venues.json` under `editorialPreferenceGroups`. Both personally preferred venues and other fully relevant scene venues have **equal active research and coverage priority** even when an API, event feed or calendar scraper is difficult or unavailable. Only explicitly secondary venues have lower priority. Keep calendar integration status in `discovery/sources.json` independently; neither easy import nor an old `editorialRank` constitutes personal priority. The previous 12-venue adapter baseline remains for operational compatibility and is **not** the complete editorial coverage list. Explicit additions include Mississippi Studios, Holocene, Doug Fir Lounge (reopening watch), Nova PDX, Star Bar, Lola's Room, The Showdown, 45 East, Republic Cafe/Ming Lounge, B-Side Tavern, Wyrd Hut and Moda Center. Continue prioritizing Black Water, High Water Mark, Twilight, Coffin Club and other underground scene venues. **The Fixin' To is secondary after converting its music room to an arcade; No Fun also remains secondary, with its daily intake paused.** Promoters such as Doomtown and Soundcontrol provide leads rather than replacing venue identities. A preferred venue is not a claim it is currently open, has every booking relevant to SHOWS, or has an active importer.

Queer-friendly and inclusive spaces matter. Queer identity is not a substitute for a fitting music or cultural program. Generic drag brunches and broad nightlife listings do not become priorities simply because they are queer events.

## Additional interests

Independent art, zines, DIY, maker fairs, vintage/record/tattoo/occult pop-ups, and unusual markets **fit the mixed feed** when genuinely relevant to the underground creative community. Routine farmers markets, generic neighborhood/community activities, recurring general-interest listings, and unrelated animal-welfare or workshop entries are **not default-feed content**. Previously approved historical records remain intact; this is a discovery and source-priority change, not a data deletion or a decision to make a comprehensive city calendar. Stop expanding routine farmers markets simply to grow event totals.

## Find new scene sources, not only events from familiar venues

Keep a modest read-only **source-scouting network** alongside the existing venue and promoter importers. Original vendor appearance lists, small organizer pages, independent zine/book-fair publisher directories and selective local roundups may reveal otherwise unknown shows, maker collectives and unusual seasonal/holiday markets. New organizer URLs should enter `discovery/scene-scout-leads.json` through a **separate research PR**, never be treated as approved event data or automatically enabled as importers. Prioritize independent underground and weird culture over generic holiday/bazaar volume; check actual Portland location, event-specific original date/year and time, venue/organizer identity and canceled status before event proposals. Social-only accounts remain an authorization/access research gap; no scraping around access restrictions. New sources strengthen a source registry after review, not a fabricated recurrence in SHOWS.

## Default experience and coverage priorities

The homepage opens to a chronological list beginning on the current date in Portland. **By date** is the initial view on mobile and desktop; **Places** and **Month** remain available. Month should never be required to reach today's event listings. Promote source-provided flyers with attribution where allowed, and do not fabricate artwork.

**The default feed is an inclusive inventory of approved, source-listed events—not a genre-qualification shortlist.** Display future events from connected venue, booking and scene sources even when they have no confirmed music style, or are classified as Other, Performance, Workshops or Markets. Keep genuine unknowns labeled **Type unconfirmed**; genre/style filters only narrow results when the visitor explicitly chooses them. Do not hide valid events simply because source metadata is sparse. The owner's explicit exception is routine farmers markets, which are intentionally outside SHOWS, along with operational venue-closure notices. These exclusions are editorial decisions, not evidence that other non-music events lack value.

### Karaoke as a distinct format

A source-listed karaoke event has the separate **Karaoke** category rather than being silently grouped into Other or presented as a verified live-music concert, even when its title mentions metal, punk, or DJ programming. Preserve its original title, host venue, date, event-specific link and any combined activity (e.g. square dancing followed by karaoke). This format classification doesn't by itself elevate unrelated routine nightlife above the primary underground show discovery priorities or exclude already-approved entries from the mixed feed.

Mammoth Northwest is an owner-requested **multi-venue original promoter** (see `discovery/scene-source-backlog.json`), never a physical venue. Its original regional roster is now **enabled only for verified Hawthorne Theatre Lounge and High Limit Room event pages**, after the GitHub runner independently confirmed 6/6 dated venue-specific records. All other promoter stops—including already-connected Roseland and Hawthorne main stages, Wonder and out-of-town rooms—are deliberately excluded to avoid duplicate/conflicting imports. This does not establish a complete calendar for either supported room; continue pursuing authorized venue feeds, and hold event/date/status discrepancies.

## Venue-first coverage before genre-based presentation

Maintain the canonical, machine-readable `discovery/venues.json` registry. **For a supported venue calendar, collect every published future event, not just those automatically recognized as underground music.** Primary genres, source categories, and user-selected interests are separate presentation/filter fields. Absence of a genre match must not silently drop a venue event.

Spend research and adapter effort on ALL active preferred and relevant venues, emphasizing independent and underground programming across both groups equally. A large arena and a small DIY club can both be preferred; once an actual event is approved from these connected sources, don't suppress it from the default feed merely because its classification isn't Music. Measure **actual dated venue coverage**, missing source connections and original flyer coverage separately from the overall event count. Treat a blocked or empty webpage as a source availability issue, not proof that the venue has no events. Keep artist/promoter/community guide announcements as supplemental leads when official venue pages are inaccessible.

Collect **event-specific images** directly from official venue/promoter event cards whenever available. Preserve the source page and link; do not claim rights to replicate, download, or mirror artwork without permission. Generic venue photos and sitewide default social images are not event flyers. When no suitable flyer is available, keep the neutral non-invented placeholder.

## Source discovery beyond venues

In addition to original venue calendars, evaluate **promoter, record label and community show-guide leads** in [the scene-source research backlog](discovery/scene-sources.md) and [machine-readable source list](discovery/scene-source-backlog.json). The owner explicitly requested **777 Booking** and **Third Eye Booking** as future promoter leads. Suggested record labels and scene guides are research candidates, **not new owner-approved venue preferences or connected importers**.

These sources may reveal record-release concerts, benefit bills, DIY house shows and tours, but are **discovery leads only** until the exact bill, original year/date, actual Portland-area venue and show/doors time can be verified. Never treat a release announcement, global tour page or an artist's label membership as itself a Portland event. Avoid conflating similarly named organizers (notably Portland's Third Eye Booking with the unrelated Third Eye Shut Booking), or Black Water Records the label with the existing venue source. Source availability is a separate technical status from editorial relevance.

## Evidence and review

- Begin with the core music sources. Discovery calendars can provide leads; use venue, promoter, artist, label, or official ticket pages to verify details wherever possible.
- Verify the year, local date, venue, and show time separately from doors. Do not generate repeated nights from a general weekly schedule without published dates.
- Preserve original source categories separately from curated music styles. Genre filters are broad browsing aids, supported by the artist, label, promoter, or venue; they are not definitive descriptions of every artist on a mixed bill.
- Do not assign genres from a band name, venue reputation, clothing, or an unsupported assumption. A fitting supporting artist may establish a mixed bill's style; record that basis.
- Keep unknown admission, ages, accessibility, and end times unknown. Conflicting sources stay in the review log until resolved.
- Retain useful earlier events and stable IDs. Deduplicate bills by venue, date, and lineup; do not create a second listing just to add genre metadata.
- Julie reviews additions through PRs before they are published. Source verification alone does not replace her editorial decision.

## Coverage reporting

Report newly added music bills, relevant styles, and covered core venues. Count recurring market dates separately. A large total is not evidence that the core scenes have been covered. Document unreadable sources and held-back listings so the next pass can address the gaps without repeating completed work.

The calendar is the product: people should be able to find something worth attending, understand what is known, and put the event or verified series in their personal calendar. Do not add social profiles or intentional personal-data collection as part of event discovery.

## Proactive genre and venue expansion (November 2026)

SHOWS is **music first, not genre-exclusive**. Do not require the owner to initiate each new coverage source. Every source audit should identify missing music styles, missing independent rooms and event-specific poster gaps, and prepare reviewable source/adapter improvements. The six original music sources in the registry (The 1905, Jack London Revue, The Goodfoot, Alberta Street Pub, Alberta Rose Theatre and Keys Lounge) are all full-priority research targets. The Thesis is a separate original hip-hop promoter, not a venue. Source-scouting uses original sites and produces a rolling research PR; collectors must not turn leads into events without verified original event identity, dates, venue, times and source rights. Existing underground venues retain full priority. Style classification relies on event-specific original claims and may remain unknown; never fabricate a genre from a venue stereotype. Any independent genre can be worthy of inclusion, regardless of popularity or aesthetic.
