# Independent Portland hip-hop, rap, R&B and soul coverage — November 8, 2026

## Purpose

Expand **actual local and independent music coverage** across rap, hip-hop, R&B, soul, beat production, cyphers, underground showcases, DJ sets, and relevant crossover bills. Existing underground punk, metal, goth and all-genre source priorities remain in force. These are **source and genre coverage gaps**, not a reason to invent classifications or target a fixed share of the calendar.

Source-first policy: the future dated events from a supported priority source should be present in SHOWS or accounted for with a concrete duplicate/conflict/unsupported-data reason, **regardless of genre**. Unknown genre is not a reason to discard an otherwise verified venue event.

## Evidence-based original sources to connect

| Source | Role and current evidence | Needed work |
| --- | --- | --- |
| [Mississippi Pizza & Atlantis Lounge](https://mississippipizza.com/events/) | **Highest implementation priority:** original venue calendar and individual details for local showcases. [Hungry Hungry Hip Hop](https://mississippipizza.com/event/hungry-hungry-hip-hop-10/) is individually advertised for **Sunday, November 22, 2026 at 8 pm** at Atlantis Lounge. This is **not** Mississippi Studios / Polaris Hall. | Build a new venue-first importer; verify event permalinks, Pacific date/time (doors versus show), room, title, source details, duplicates, and arbitrary music/other formats. Check this November 22 event against current SHOWS as the first spot-check. |
| [A Beat Happening](https://abeathappening.org/events) | Original DIY music producer/DJ showcase; its October 2026 event and past community collaborations document hip-hop, beatmakers, experimental and all-ages programming at L'Atelier Yaffe. | Connect dated original organizer pages or approved calendar feed; no future date inferred from monthly tradition. |
| [The Thesis](https://thethesispdx.com/) | Already present in the scout seeds. Longstanding first-Thursday independent hip-hop, R&B and soul showcase at Alberta Street Pub, whose venue importer is active. | Cross-check individual future Thesis nights against Alberta Street Pub imports; ensure standalone artist or organizer links do not create duplicates. |
| [Late Lyrics](https://www.latelyrics.com/) | Original Portland hip-hop/R&B open mic and performance ecosystem. Site says October 29 was the last 2026 event. | Scout for new 2027 dated announcements; no fictitious November/December events. A specifically identified rap/R&B performance open mic should retain Music classification. |
| [PDX Hip Hop Week](https://pdxhiphopweek.com/calendar) | Original annual organizer; current page reports no upcoming events. | Watch organizer-specific announcements; seasonal events are not general monthly recurrences. |
| [L'Atelier Yaffe](https://www.atelieryaffe.com/events) | Original venue documents A Beat Happening, RnB PDX Chapter and Sight & Sound collaborations, but its event page principally points to social channels instead of individual dated listings. | Follow the original collaborating organizers and establish authorized social/public date-bearing announcements; do not assume collaborations are upcoming events. |
| [The Goodfoot](https://thegoodfoot.com/music/) | Already registered for an importer but not connected. Original schedule includes R&B/hip-hop-influenced [greaterkind](https://thegoodfoot.com/music/) performances Nov 10 and 17 and Soul Stew DJ programming; not every event is hip-hop. | Implement its original calendar, preserve mixed genres and distinguish show start from doors. |

Additional research leads from [A Beat Happening's primary organizer network](https://abeathappening.org/events/2026/6/21/a-beat-happening-9-year-anniversary): Let Her Cook, Global Based, Hungry Hungry Hip Hop, DJ Klyph and Skratcher Portland. Those names are community discovery leads **only** until an original dated event URL and source owner have been validated.

## What's changed in this research PR

1. Register Mississippi Pizza / Atlantis Lounge as a fully active **editorial** scene venue while honestly retaining `adapter-needed` status. It is a separate venue from Mississippi Studios.
2. Add five first-party source scout seeds covering original local showcases and community organizers, keeping source research separate from publication.
3. Broaden scout recognition for standalone `rap`, `rapping`, `rnb`, and explicit hip-hop/R&B showcase/open-mic wording. A secondary discovery page is **never** a primary publication source.
4. Permit an event specifically described by its source as a hip-hop/rap/R&B/soul open mic to classify as Music. Generic open mics, comedy, karaoke, and other non-music programming do not receive invented music categories.
5. Add regression coverage for relevant discovery links and genre classification.

## Next implementation, in priority order

1. **Atlantis Lounge importer:** read original future dated event cards and detail pages, retain the source link and meaningful evidence; process every dated event, not just those already tagged hip-hop. Require dates, room, clock type, location, event identity, deduplication, update safety and classification tests.
2. **Close existing-source gaps:** check the Nov 22 Hungry Hungry Hip Hop bill and independent hip-hop/R&B shows against SHOWS, then compare The Thesis nights at Alberta Street Pub, relevant Off Beat bills and the Goodfoot calendar. Do not assert a show is missing without comparing its identity against approved records.
3. **Organizer-first pipeline:** connect A Beat Happening; track Late Lyrics and PDX Hip Hop Week for *newly dated* announcements; research social-first RnB PDX, Let Her Cook and underground smaller-room networks.
4. **Monitor meaningful coverage:** a rolling 30/60/90-day report should show future unique music bills by **source and verified music style**, source-withheld/conflicted records, records with unknown genre, and first-party sources not yet connected. Report actual source completeness and particular missing bills rather than treating a total event count or any genre quota as success.

All dates above derive from original source pages reviewed November 8, 2026. This PR does **not** activate an importer, directly add events, or authorize automatic publishing of new source records; event data and code changes still follow owner-reviewed PR policy.
