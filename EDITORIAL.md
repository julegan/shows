# SHOWS editorial priorities

SHOWS is a provisional name for a curated Portland **music-first** calendar. The default discovery feed combines underground music with a selective layer of related independent art and culture. It is deliberately not a general Portland city/community calendar.

## First priority: underground music

Research underground metal, punk, goth, rock, hardcore, and DIY bills first. Adjacent interests include black metal, crust, deathrock, darkwave, industrial, post-punk, noise, and experimental music. Favor small independent venues, local and touring underground bills, independent promoters, and scene organizers. Include larger venues when the actual bill fits; do not describe every rock concert as underground.

**Venue preference takes precedence over importer convenience.** The canonical owner-directed **unordered preference groups** live in `discovery/venues.json` under `editorialPreferenceGroups`. Research preferred venues before scene-relevant and secondary venues even when an API, event feed or calendar scraper is difficult or unavailable. Keep calendar integration status in `discovery/sources.json` independently; neither easy import nor an old `editorialRank` constitutes personal priority. The previous 12-venue adapter baseline remains for operational compatibility and is **not** the complete preferred-venue roster. Explicit additions include Mississippi Studios, Holocene, Doug Fir Lounge (reopening watch), Nova PDX, Star Bar, Lola's Room, The Showdown, 45 East, Republic Cafe/Ming Lounge, B-Side Tavern, Wyrd Hut and Moda Center. Continue prioritizing Black Water, High Water Mark, Twilight, Coffin Club and other underground scene venues. **The Fixin' To is secondary after converting its music room to an arcade; No Fun also remains secondary, with its daily intake paused.** Promoters such as Doomtown and Soundcontrol provide leads rather than replacing venue identities. A preferred venue is not a claim it is currently open, has every booking relevant to SHOWS, or has an active importer.

Queer-friendly and inclusive spaces matter. Queer identity is not a substitute for a fitting music or cultural program. Generic drag brunches and broad nightlife listings do not become priorities simply because they are queer events.

## Additional interests

Independent art, zines, DIY, maker fairs, vintage/record/tattoo/occult pop-ups, and unusual markets **fit the mixed feed** when genuinely relevant to the underground creative community. Routine farmers markets, generic neighborhood/community activities, recurring general-interest listings, and unrelated animal-welfare or workshop entries are **not default-feed content**. Previously approved historical records remain intact; this is a discovery and source-priority change, not a data deletion or a decision to make a comprehensive city calendar. Stop expanding routine farmers markets simply to grow event totals.

## Default experience and coverage priorities

The homepage opens to a chronological list beginning on the current date in Portland. **By date** is the initial view on mobile and desktop; **Places** and **Month** remain available. Month should never be required to reach today's event listings. Promote source-provided flyers with attribution where allowed, and do not fabricate artwork.

## Venue-first coverage before genre-based presentation

Maintain the canonical, machine-readable `discovery/venues.json` registry. **For a supported venue calendar, collect every published future event, not just those automatically recognized as underground music.** Primary genres, source categories, and user-selected interests are separate presentation/filter fields. Absence of a genre match must not silently drop a venue event.

Spend research and adapter effort first on venues in the user's preferred group, emphasizing independent and underground programming within that group. A large arena and a small DIY club can both be preferred, but collect only events appropriate to the music-first SHOWS mission. Measure **actual dated venue coverage**, missing source connections and original flyer coverage separately from the overall event count. Treat a blocked or empty webpage as a source availability issue, not proof that the venue has no events. Keep artist/promoter/community guide announcements as supplemental leads when official venue pages are inaccessible.

Collect **event-specific images** directly from official venue/promoter event cards whenever available. Preserve the source page and link; do not claim rights to replicate, download, or mirror artwork without permission. Generic venue photos and sitewide default social images are not event flyers. When no suitable flyer is available, keep the neutral non-invented placeholder.

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
