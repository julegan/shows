# Outlook-to-SHOWS coverage review — October 29, 2026

Input: Julie's [shared scheduled outlook](https://chatgpt.com/share/6ae3cdd8-8950-83e8-8895-60df32db512f). The shared conversation includes October 29 weekend picks, October 26 lookahead, and older September reports. Treat generated recommendations as leads; recheck primary evidence before publication. Earlier dates are not future opportunities.

## First proposed additions

Three distinct live music bills, zero DJ nights, zero recurring market dates:

| Date (Pacific) | Bill | Venue | Evidence checked October 29 |
| --- | --- | --- | --- |
| October 29, 8 PM; doors 7 PM | Protomartyr / Accessory | Aladdin Theater | [Official calendar](https://www.aladdin-theater.com/) and its [original ticket link](https://www.etix.com/ticket/p/32935754/protomartyr-portland-aladdin-theater) |
| November 2, 8 PM; doors 7 PM | King Buffalo / L.A. Witch | Aladdin Theater | Official calendar and its [original ticket link](https://www.etix.com/ticket/p/84319558/king-buffalo-portland-aladdin-theater); [artist style evidence](https://kingbuffalo.com/band) |
| November 6, 8 PM; doors 7 PM | Gully Boys / Pollyanna / Nonbinary Girlfriend | Mission Theater | [Official dated event page](https://www.mcmenamins.com/events/277583-gully-boys) establishes lineup, show/doors, all ages and Pollyanna's punk/rock background |

Etix detail pages present a verification wall in this environment. Event timing and billing come from the readable official venue calendar; prices, ticket availability and Aladdin ages remain unknown. No artwork rights were established in this pass. No inferred end times. November events use the post-DST Pacific offset (-08:00).

Register Aladdin and Mission as expansion venues, and The Off Beat as a core DIY music venue. All three explicitly need adapters; registration and manual events do not establish recurring ingestion. [Friends of Noise](https://friendsofnoise.org/the-off-beat/) identifies The Off Beat and links its [official calendar](https://friendsofnoise.org/event-calendar/). Preserve the existing ranked core twelve and their outstanding blockers.

## Already captured — preserve IDs and avoid duplicates

Checked against canonical events.js October 29:

- Soft Vein / Modele / Chalice Sect, November 7, Coffin Club.
- Beta Voids / Byproxy / DJ Ben with Total Punk Souvenir Shop, November 20, Turn! Turn! Turn!.
- Masonique / RLLBLL / Creature Guts, November 6, Turn! Turn! Turn!.
- Dead Animal Assembly Plant / At the Heart of the World, December 5, Dante's.
- Downstem album release, November 19, Twilight.
- Shoot the Moon Fest, November 12–15, Twilight; preserve distinct daily bills.
- Worst Party Ever / Equipment, November 3, Polaris Hall. Additional support billing in the outlook needs fresh primary confirmation.
- Beelzebub's Bazaar, November 1, Kenton Club.
- Is This Really Halloween?, October 31, Turn! Turn! Turn!.

Mississippi Studios and Polaris already have active shared-calendar adapters with separate room identities. Turn! Turn! Turn! and Kenton also have active adapters. An outlook mention does not mean a missing connector.

## Next source work, in order

1. **The Off Beat / Friends of Noise**: validate the officially embedded calendar/provider, dated room identity, actual lineup, show/doors and original posters. All-ages DIY coverage directly serves the core mission. Do not import old September benefit shows as future dates.
2. **Aladdin / True West**: collect all dated Aladdin room cards, then classify. Its calendar also lists Crystal Ballroom and other offsite shows: strict room matching and moved/rescheduled holds are essential. Retain source Etix IDs for deduplication.
3. **Mission Theater**: verify dated detail pages. Separate music, talks, films and promotional headings; West End Entertainment District is a promotion, not a band. Intake/classify before deciding display, with review PRs.
4. **High Water Mark**: resolve the existing blocked first-party feed through verified promoter or authorized ticket evidence. Early Moods on December 20 is an outlook lead, not yet reverified in this batch. Do not mark this as published or connected.
5. **Spectrum Art Market / Grave Raiment Studio / Sinister Coffee and Creamery**: verify the organizer's October 31 Halloween Market Crawl announcement. Preserve one event with two stops, not duplicate market counts. Access and mask statements require organizer attribution. [Studio's public announcement lead](https://www.patreon.com/graveraimentstudio/posts/grave-raiment-171145378). No event proposed until primary details are checked.
6. **Selective independent maker sources**: My People's Market / Low End Warehouse (December 5–6); Oregon Arts & Agriculture at ADX (December 2); Wicked Craft / Rae Loft; Bitchcraft; SymbiOp's Radical Harvest; Seagrape. Verify organizers and upcoming dates independently. Buildings and changing event hosts are not interchangeable with recurring organizers. Older outlook occurrences are historical leads only.

Frybread Fest is an editorial decision pending review of the actual artist/maker program; its presence in a personal digest is not automatic default-feed approval. Routine farmers markets, generic food/date recommendations and drag brunches remain outside default discovery.

## When to consider retiring the scheduled reports

Keep the outlook and weekend digests active for now. Proposed acceptance criteria for Julie to assess:

- Over four consecutive weekly comparisons, SHOWS contains at least 95% of verified, in-scope outlook recommendations before the report arrives. Report the denominator and each miss; evaluate music and independent art/market events separately.
- Each missing event has a recorded source gap, owner action or editorial exclusion. No duplicates from artists, venues and promoters describing the same bill.
- Active sources refresh successfully within 48 hours or show an explicit failure; cancellation/move/status evidence is reviewed, not silently discarded.
- Review PRs and portfolio deployment reliably deliver the approved events; a successful fetch or registry entry alone is not coverage.
- Julie explicitly approves canceling each named scheduled task after those checks. No automations are changed by this PR.

This is a first coverage batch and a reconciled source queue, not completion of the full outlook migration or implementation of the three new adapters.
