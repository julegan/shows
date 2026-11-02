# SHOWS — Promoters, record labels and scene discovery sources

*Research backlog created November 1, 2026.*

The **38 active-priority venues remain unchanged**. This is a separate lead network for underground bills outside the places with working venue feeds. **Being on this list neither activates a collector nor approves events.** Editorial relevance is independent of importer ease. See [machine-readable source backlog](scene-source-backlog.json).

## Why follow labels?

A label's artist tours, record-release shows, compilations, benefit bills and collaborations can reveal shows earlier than venue calendars. Labels are **not venues**. SHOWS must identify the actual room, bill, date/year, doors/show, promoter/tickets, and source artwork rights for each specific event. A new release by itself is **not** an event.

## Owner-requested Portland show promoters

| Source | Relevance and evidence | Next action |
| --- | --- | --- |
| **777 Booking** | Portland DIY hardcore bookings; High Limit Room connection. [Evidence](https://www.wweek.com/culture/2025/07/22/high-limit-room-is-portlands-newest-home-for-all-ages-hardcore/) | Verify original @777booking public profile or organizer-supplied dated show list. Record original flyer/bill and venue, including High Limit Room and offsite DIY dates. |
| **Third Eye Booking** | Portland hardcore shows, benefits and DIY bills. [Evidence](https://www.northwesthardcore.net/dani-dry-socket) | Find and verify the promoter's OWN public show source/profile with original flyer/permalink. Do NOT mistake this Portland hardcore promoter for unrelated Third Eye Shut Booking (Los Angeles). |

| **[Sad Times Productions](https://www.sadtimesproductions.com/shows)** | First-party archive shows 2025–26 bookings at Wyrd Hut, Star Bar, High Water Mark, Twilight, Shanghai Tunnel and other suitable places. [Original archive](https://www.sadtimesproductions.com/shows) | Research future original promoter show notices and dated flyers; archived 2025–26 listings are *not* upcoming events. |

## Suggested record-label leads

| Source | Relevance and evidence | Next action |
| --- | --- | --- |
| **[Black Water Records](https://blackwaterpdx.com/store/)** | Local hardcore, punk, metal, post-punk and record-release shows. [Evidence](https://blackwaterpdx.com/store/) | Monitor date-bearing show or record-release notices and verify them with the event's official original venue/ticket page. Keep label distinct from Black Water Bar event source. |
| **[Wyrd War](https://wyrdwar.bandcamp.com/)** | Portland experimental metal, dungeon synth, dark art and sometimes live music/film events. [Evidence](https://hollywoodtheatre.org/series/wyrd-war-presents/) | Inspect actual Wyrd War Presents dates at the host venue; preserve mixed film/music format and original bill details. |
| **[Little Cloud Records](https://littlecloudrecords.com/pages/about)** | Portland shoegaze, dark psych, experimental indie and post-punk-adjacent acts. [Evidence](https://littlecloudrecords.com/pages/about) | Use artist-tour/release notices as leads. Confirm Portland Metro date at venue/artist/ticket source before candidate publication. |
| **[Jigsaw Records / My Vinyl Underground](https://jigsaw-records.com/)** | Portland indie/post-punk label and record store with explicitly advertised in-store shows. [Evidence](https://jigsaw-records.com/) | Find shop's actual dated in-store shows and confirm whether original flyers/links allow review-only discovery. |
| **[Beacon Sound](https://beaconsound.com/about)** | Portland experimental, adventurous, artist-centered music and intimate independent cultural programs. [Evidence](https://beaconsound.com/about) | Follow label and associated artist performances, not release-product entries. Validate original local event dates. |
| **[Projekt Records](https://www.projekt.com/store/about/)** | Portland darkwave, goth, ethereal, dark ambient and electronic music. [Evidence](https://www.projekt.com/store/about/) | Check local touring/label-show announcements; broad global catalog alone does not imply a Portland show. |
| **[Wergild](https://www.wergild.org/)** | Underground black metal with independently evidenced Portland show connections. [Evidence](https://www.wergild.org/) | Research original show notices associated with label acts, confirming first-party date, venue and artist bill. |
| **[Puddletown Records](https://puddletownrecords.com/)** | Portland experimental electronica, darkwave, metal and genre-bending music. [Evidence](https://puddletownrecords.com/) | Monitor label/artist release shows when dated, not album releases as SHOWS events. |

## Additional scene guides worth investigating

| Source | Relevance and evidence | Next action |
| --- | --- | --- |
| **[PDX//SUBVERT (revived)](https://subvert.blackwaterpdx.com/)** | Specialist Portland punk, hardcore and metal show guide announced revived October 2026. [Evidence](https://blackwaterpdx.com/store/) | Now reached and source-verified from GitHub Actions. Original public `scripts/pdx-subvert-leads.js` collects three dated source leads into daily review (1 ordinary, 2 held). Confirm all times on original flyer or venue; do not auto-publish. Older Blogspot archive is historical. |
| **[Doomtown PDX](https://doomtownpdx.com/)** | Original Portland underground punk and hardcore show calendar with flyers and venue details. [Evidence](https://doomtownpdx.com/) | Already covered by the existing `scripts/doomtown-leads.js` → `discovery/doomtown-leads-review.md` review-only lead workflow. Reuse that work; don't create another importer. Original event date/year and venue must still be verified. |

## Notable current opportunity

**Black Water Records announced in October 2026 that [PDX//SUBVERT](https://subvert.blackwaterpdx.com/) had been revived** after about a decade. The [label's own October 2026 update](https://blackwaterpdx.com/store/) is the primary evidence. The original subdomain is **accessible and live**, verified by [GitHub Actions #41520203569](https://github.com/julegan/shows/actions/runs/41520203569). It currently exposes three original show records with source dates, band lists, venue names and flyer references. A dedicated **research-only lead collector** now feeds the existing daily review artifacts—**it is still not an approved event importer**. The [old Blogspot archive](https://pdxsubvert.blogspot.com/) ends in the 2010s and must not be treated as live.

### PDX//SUBVERT live first-party feed findings (November 2, 2026)

The revived public site supplies structured `show` objects via the HTML's serialized Next.js Flight data: original 24-character IDs, bands, venue, date clock, age label, source flyer reference, and cancellation flag. This is a first-party *scene guide* operated by Black Water Records, but does **not** independently authorize every third-party venue's event time or an image-reuse license. The read-only original site [lists three future shows](https://subvert.blackwaterpdx.com/); [Actions #41520203569](https://github.com/julegan/shows/actions/runs/41520203569) validated all three via deterministic fixtures and a live bounded GET.

- **November 7, 2026:** Habak / Frenzy / Malakili / Verdant Force and Laughter at Black Water, displayed 8 PM — ordinary editorial lead, cross-check with Black Water's own concert roster to avoid duplicates.
- **November 14, 2026:** Huge Prick / Jab / Festering Estate / Zero Sanity at "Ask A Idiot", shown at **2 AM** — *hold* until promoter confirms the day, actual venue, intended show vs doors time and “assuming all ages” claim.
- **November 14, 2026:** Record Fair + DJ sets at Black Water, shown 7 PM — *hold* for SHOWS' music-first format review; it is not necessarily a concert.

**Source time caveat:** Next.js serializes `dateOfShow` using `$D...Z` and the rendered page uses the UTC clock components. This is not evidence that the site has correctly converted local Pacific timezone/UTC offsets. Do not publish event timestamps by applying a guessed conversion; verify the original event flyer/artist/venue. Missing or canceled events cannot be used to automatically remove existing SHOWS entries. No flyer is downloaded, copied or hotlinked, and `usageApproved` is never assumed. The reporter is a single bounded public GET that does not call unadvertised APIs or follow ticketing redirects.

The live source results are written to `discovery/pdx-subvert-leads-review.md` on the **same existing daily refresh**, shown in action summaries and saved as research artifacts. Research leads alone do not generate a new editorial PR; original confirmation is required for actual event additions.

**Doomtown is already integrated as a review-only lead source** via `scripts/doomtown-leads.js`; no additional discovery connector is needed. Its posts are corroborated with original organizer/venue sources before calendar inclusion.

## Distinctions that matter

- **Third Eye Booking (Portland hardcore)** is distinct from **Third Eye Shut Booking**, a similarly named unrelated Los Angeles booking operation. The former is documented by the Portland band Dry Socket in [Northwest Hardcore](https://www.northwesthardcore.net/dani-dry-socket). Do not attach the LA company's account or calendar. The exact authoritative Portland profile still requires verification.
- **777 Booking** is confirmed as a Portland hardcore promotion/booking operation with connections to High Limit Room by [Willamette Week](https://www.wweek.com/culture/2025/07/22/high-limit-room-is-portlands-newest-home-for-all-ages-hardcore/). Original organizer events and other hosted venue locations still require separate confirmation.
- **Black Water Records (label/shop)** and **Black Water Bar (venue)** overlap in community but should retain independent source identities and one canonical event per actual show.
- **Wyrd War** also curates films and art; distinguish an actual live show from a movie screening or album release without an event.
- **Record labels suggested here are not personally approved favorites.** They are research candidates; the user explicitly requested 777 Booking and Third Eye Booking for later.

## 19hz Oregon electronic-music listings — secondary review source (November 2, 2026)

The [19hz Portland/Oregon electronic listing](https://19hz.info/eventlisting_ORE.php) is an independent, publicly available aggregator for DJ nights, unusual club events and local electronic shows. **Its own page explicitly says the listings are automatically generated and not reviewed for accuracy.** It is useful for finding possible omissions in venue importers, **not a source to publish from directly**.

A single bounded original HTML read in [GitHub Actions 41485612644](https://github.com/julegan/shows/actions/runs/41485612644) validated **137 date-bearing table rows**, producing **56 distinct scene-relevant review leads**: 49 at active preferred SHOWS venues, seven additional genre-relevant Portland entries, and **one date/weekday hold**. Source types and genre labels may be inaccurate; links to RA or other ticket sites are recorded as *unopened leads*, not proof of original bill availability. No flyer or image is copied, and no event is inserted.

The [review-only 19hz parser](../scripts/19hz-scene-leads.js) retains the displayed full-year date and original external link after strict Portland location and date/weekday checks; it filters for preferred venues or dark/experimental/electronic genre tags, deduplicates obvious repeated venue/day/bill entries and excludes ambiguous TBA venues or wrong cities. It does not reinterpret a listed time as doors or show start. Daily output appears in `discovery/oregon-electronic-leads-review.md` as an Actions report/artifact, **never directly as canonical SHOWS events**. A lead-only day does not open an extra pull request.

No November 2026 **Headspace Circus, Republic Cafe or Ming Lounge** entries were seen on the live 19hz page during this first check; that absence is **not** evidence no such events exist. Keep the original Headspace Circus account and verified Republic/Ming original ticket watcher in the promoter research backlog, and require dated original announcement or original event-specific ticket evidence before publishing.

## Integration acceptance

1. Verify the operator's *original* public feed/site and any technical/rights restrictions; no provider-bypass or false source health claims.
2. Preserve event-specific original links and named actual venue and local time; an artist/label release page alone does not validate an event.
3. Deduplicate by original show identity, venue and bill; never create new copies for extra discovery leads.
4. Record source access limitations and reporter accuracy separately from editorial relevance.
5. Propose any actual source adapter and event additions through reviewable SHOWS PRs; Portfolio sync remains a separate reviewed step.
