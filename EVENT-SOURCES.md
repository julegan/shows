# Earlier expansion — event source review, October 17, 2026

**Review method: Julie approves additions through the pull request before publication. The associated PR records the current review state.**

The earlier merged expansion added 69 dated occurrences to the 11-event prototype, for 80 total. New dates run October 18–December 13, 2026. All additions use venue or organizer pages. The original records and stable IDs are retained.

Latest music-priority additions and source gaps are documented in [MUSIC-SOURCES.md](MUSIC-SOURCES.md). This file preserves the earlier batch; its source-access gaps are historical, not a statement that Star or Coffin remain uncovered.

## Batch composition

| SHOWS category | Added occurrences |
| --- | ---: |
| Arts & DIY | 2 |
| Community | 1 |
| Markets | 36 |
| Music | 23 |
| Workshops | 7 |

## What was checked

- Title, published date, show time versus doors, venue, and stated age/cost information were read from the linked pages. New descriptions are brief paraphrases.
- `sources` preserves multiple references and original source categories separately from the SHOWS `category` and `tags`. An empty original-category list means the source did not supply a category; it is not an invented classification.
- Prices and accessibility claims are not inferred. `free: null` means admission was not confirmed; it does not assert that an event charges admission. These records do not enter the confirmed-free filter.
- Concert end times remain null. Calendar exports retain the existing clearly disclosed, editable one-hour placeholder.
- Addresses are venue or organizer locations in Portland. Area labels such as Hawthorne and Waterfront are browsing districts, not formal neighborhood-boundary determinations.
- Source checking is not a safety endorsement or a substitute for human editorial approval. This remains a manually maintained snapshot, with no cancellation-monitoring service.

## Recurring dates and exceptions

| Series | Included dates / rule | Reference |
| --- | --- | --- |
| PSU Farmers Market | 10-24, 10-31, 11-07, 11-14, 11-21, 11-28, 12-05, 12-12; 8:30 AM in October, 9 AM from November 7 | [Organizer](https://www.portlandfarmersmarket.org/our-markets/psu/) |
| King Farmers Market | 10-18, 10-25, 11-01, 11-08, 11-15, 11-22; season ends November 22 | [Organizer](https://www.portlandfarmersmarket.org/our-markets/king/) |
| Lents International Farmers Market | 10-18, 10-25, 11-01, 11-08, 11-15, 11-22; season ends November 22 | [Organizer](https://www.portlandfarmersmarket.org/our-markets/lents-international/) |
| Shemanski Park Farmers Market | 10-21, 10-28, 11-25; October 28 season end, then only the November 25 harvest date | [Organizer](https://www.portlandfarmersmarket.org/our-markets/shemanski-park/) |
| Portland Saturday Market | 10-24, 10-31, 11-07, 11-14, 11-21, 11-28, 12-05, 12-12; Saturdays only; no Sunday dates inferred | [Organizer](https://www.portlandsaturdaymarket.com/hours-and-directions) |

The Riso Basics dates are grouped as one workshop series. Crafty Wonderland has separate Friday, Saturday, and Sunday occurrences with their actual hours and admission types. Series exports contain only these checked dates, not an indefinite recurrence rule.

## Conflicts resolved / listings held back

- Crafty Wonderland: the organizer lists a 5 PM weekend close; Outlet’s participating-vendor listing says 6 PM. The records use the organizer’s 5 PM close and expose the difference in event details.
- PSU October 31: the general page says summer hours end October 30, but its dated October 31 listing explicitly states 8:30 AM–2 PM. The dated occurrence governs; both references are retained.
- SICK fundraiser at Dante’s: the structured listing says 9 PM show / 8 PM doors, while prose says 8 PM. Held back pending clarification.
- ADX “Sign Painting Workshop” overlaps the detailed Casual Practice lettering workshop with different hours. Only the specifically described Casual Practice event is added.
- HERE for PDX has a date/time but insufficient descriptive detail in the reviewed page. Held back instead of guessing its purpose.
- Star Theater and High Water Mark pages could not be read successfully; the Coffin Club page did not expose usable event detail. No listings were invented for those gaps.
- No newly verified Portland adoption or animal-welfare event is included in this batch. Oregon Humane’s dated October fundraiser is in Salem and is outside the current geography.

## Added occurrences for editorial review

Times below are local to Portland; explicit UTC offsets in events.js change at the November 1 daylight-saving transition.

| Date | Time | Event | Place | Cost | Original source |
| --- | --- | --- | --- | --- | --- |
| 2026-10-18 | 10:00–14:00 | King Farmers Market | King Farmers Market | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/king/) |
| 2026-10-18 | 10:00–15:00 | Lents International Farmers Market | Lents International Farmers Market · The ZED | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/lents-international/) |
| 2026-10-18 | 14:00–15:00 | Unstuck Workshop with Denise Gour | ADX · Art Design Xchange | See organizer for current cost | [Listing](https://artdesignxchange.com/events/unstuck-workshop-with-denise-gour-l4k7z-mx5y5-f2lcz-shrhb) |
| 2026-10-18 | 18:30–22:30 | Puppetry in Process with Tim Giugni | ADX · Art Design Xchange | Free · something to share welcomed | [Listing](https://artdesignxchange.com/events/puppetry-in-process-with-tim-giugni-1) |
| 2026-10-21 | 10:00–14:00 | Shemanski Park Farmers Market | Shemanski Park Farmers Market | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/shemanski-park/) |
| 2026-10-21 | 19:00 (end unconfirmed) | Bear Ghost | Hawthorne Theatre | See organizer for current cost | [Listing](https://hawthornetheatre.com/event/bear-ghost-2/hawthorne-theatre/portland-oregon/) |
| 2026-10-23 | 19:00–21:00 | Woolly Sweaters | ADX · Art Design Xchange | Free · RSVP | [Listing](https://artdesignxchange.com/events/woolly-sweaters-show) |
| 2026-10-24 | 08:30–14:00 | PSU Farmers Market | PSU Farmers Market · South Park Blocks | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/psu/) |
| 2026-10-24 | 10:00–17:00 | Portland Saturday Market | Portland Saturday Market | Free admission · purchases extra | [Listing](https://www.portlandsaturdaymarket.com/hours-and-directions) |
| 2026-10-25 | 10:00–14:00 | King Farmers Market | King Farmers Market | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/king/) |
| 2026-10-25 | 10:00–15:00 | Lents International Farmers Market | Lents International Farmers Market · The ZED | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/lents-international/) |
| 2026-10-25 | 13:00–16:00 | Woodblock Printing with Gabrielle Wolfe | ADX · Art Design Xchange | See organizer for current cost | [Listing](https://artdesignxchange.com/events/gabrielle-wolfe-woodblock-printing-workshop) |
| 2026-10-25 | 18:00–21:00 | My Friend Blue Fundraiser | ADX · Art Design Xchange | See organizer for current cost | [Listing](https://artdesignxchange.com/events/adx-fest-my-friend-blue-fundraiser) |
| 2026-10-26 | 18:00–22:00 | Music Monday at ADX | ADX · Art Design Xchange | See organizer for current cost | [Listing](https://artdesignxchange.com/events/music-monday) |
| 2026-10-27 | 20:00 (end unconfirmed) | Blitzkid | Dante's | Listed $26.24 · confirm current total | [Listing](https://www.danteslive.com/tm-event/blitzkid-modern-hel-tour-2026-with-guests/) |
| 2026-10-27 | 20:00 (end unconfirmed) | smush | Hawthorne Lounge | See organizer for current cost | [Listing](https://hawthornetheatre.com/event/smush/hawthorne-lounge/portland-oregon/) |
| 2026-10-28 | 10:00–14:00 | Shemanski Park Farmers Market | Shemanski Park Farmers Market | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/shemanski-park/) |
| 2026-10-28 | 19:30 (end unconfirmed) | Ho99o9 & N8NOFACE | Hawthorne Theatre | See organizer for current cost | [Listing](https://hawthornetheatre.com/event/ho99o9-n8noface-sincerely___-the-void/hawthorne-theatre/portland-oregon/) |
| 2026-10-29 | 17:30–20:30 | Casual Practice: Intro to Casual Style Lettering | ADX · Art Design Xchange | $65 · supplies included | [Listing](https://artdesignxchange.com/events/casual-practice-intro-to-casual-style-lettering) |
| 2026-10-29 | 18:00–22:00 | Tunnel Vision: Battle of the Battle Jackets | ADX · Art Design Xchange | Free · RSVP | [Listing](https://artdesignxchange.com/events/tunnel-vision-battle-of-the-battle-jackets) |
| 2026-10-30 | 19:00 (end unconfirmed) | Pain of Truth | Hawthorne Theatre | See organizer for current cost | [Listing](https://hawthornetheatre.com/event/pain-of-truth/hawthorne-theatre/portland-oregon/) |
| 2026-10-31 | 08:30–14:00 | PSU Farmers Market | PSU Farmers Market · South Park Blocks | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/psu/) |
| 2026-10-31 | 10:00–17:00 | Portland Saturday Market | Portland Saturday Market | Free admission · purchases extra | [Listing](https://www.portlandsaturdaymarket.com/hours-and-directions) |
| 2026-11-01 | 10:00–14:00 | King Farmers Market | King Farmers Market | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/king/) |
| 2026-11-01 | 10:00–15:00 | Lents International Farmers Market | Lents International Farmers Market · The ZED | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/lents-international/) |
| 2026-11-04 | 13:00–16:00 | Risograph Basics | Outlet PDX | See organizer for current cost | [Listing](https://www.outletpdx.com/events/riso-basics-11-4-2026) |
| 2026-11-05 | 20:00 (end unconfirmed) | True Fear | Dante's | Listed $18.03 · confirm current total | [Listing](https://www.danteslive.com/tm-event/true-fear-with-resist-la-crucible-of-absolution-oddities/) |
| 2026-11-07 | 09:00–14:00 | PSU Farmers Market | PSU Farmers Market · South Park Blocks | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/psu/) |
| 2026-11-07 | 10:00–14:00 | CMYK Photo Process for RISO | Outlet PDX | See organizer for current cost | [Listing](https://www.outletpdx.com/events/cmyk-workshop-11-2026) |
| 2026-11-07 | 10:00–17:00 | Portland Saturday Market | Portland Saturday Market | Free admission · purchases extra | [Listing](https://www.portlandsaturdaymarket.com/hours-and-directions) |
| 2026-11-08 | 10:00–13:00 | Butch Bootcamp: Drywall Repair | ADX · Art Design Xchange | $15–$55 · choose-what-you-can-pay | [Listing](https://artdesignxchange.com/events/butch-bootcamp-drywall-repair) |
| 2026-11-08 | 10:00–14:00 | King Farmers Market | King Farmers Market | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/king/) |
| 2026-11-08 | 10:00–15:00 | Lents International Farmers Market | Lents International Farmers Market · The ZED | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/lents-international/) |
| 2026-11-10 | 20:00 (end unconfirmed) | Jon Spencer | Dante's | Listed $31.39 · confirm current total | [Listing](https://www.danteslive.com/tm-event/jon-spencer-with-guest/) |
| 2026-11-12 | 20:00 (end unconfirmed) | Deathtape | Dante's | Listed $22.12 · confirm current total | [Listing](https://www.danteslive.com/tm-event/deathtape-with-salt-guests/) |
| 2026-11-13 | 19:00 (end unconfirmed) | Static Dress | Hawthorne Theatre | See organizer for current cost | [Listing](https://hawthornetheatre.com/event/static-dress/hawthorne-theatre/portland-oregon/) |
| 2026-11-13 | 19:30 (end unconfirmed) | Metal Church / Armored Saint | Dante's | Listed $42.72 · confirm current total | [Listing](https://www.danteslive.com/tm-event/metal-church-armored-saint-with-livekill/) |
| 2026-11-14 | 09:00–14:00 | PSU Farmers Market | PSU Farmers Market · South Park Blocks | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/psu/) |
| 2026-11-14 | 10:00–13:00 | Risograph Basics | Outlet PDX | See organizer for current cost | [Listing](https://www.outletpdx.com/events/riso-basics-11-14-2026) |
| 2026-11-14 | 10:00–17:00 | Portland Saturday Market | Portland Saturday Market | Free admission · purchases extra | [Listing](https://www.portlandsaturdaymarket.com/hours-and-directions) |
| 2026-11-15 | 10:00–14:00 | King Farmers Market | King Farmers Market | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/king/) |
| 2026-11-15 | 10:00–15:00 | Lents International Farmers Market | Lents International Farmers Market · The ZED | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/lents-international/) |
| 2026-11-15 | 19:00 (end unconfirmed) | Kingdom of Giants | Hawthorne Theatre | See organizer for current cost | [Listing](https://hawthornetheatre.com/event/kingdom-of-giants/hawthorne-theatre/portland-oregon/) |
| 2026-11-17 | 20:00 (end unconfirmed) | Christian Death | Hawthorne Lounge | See organizer for current cost | [Listing](https://hawthornetheatre.com/event/christian-death/hawthorne-lounge/portland-oregon/) |
| 2026-11-18 | 19:00 (end unconfirmed) | Comeback Kid | Dante's | Listed $37.57 · confirm current total | [Listing](https://www.danteslive.com/tm-event/comeback-kid-with-the-warriors-dead-heat-barrio-slam/) |
| 2026-11-21 | 09:00–14:00 | PSU Farmers Market | PSU Farmers Market · South Park Blocks | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/psu/) |
| 2026-11-21 | 10:00–17:00 | Portland Saturday Market | Portland Saturday Market | Free admission · purchases extra | [Listing](https://www.portlandsaturdaymarket.com/hours-and-directions) |
| 2026-11-21 | 20:00 (end unconfirmed) | Fear Factory — Cybernetic Domination Tour | Hawthorne Theatre | See organizer for current cost | [Listing](https://hawthornetheatre.com/event/fear-factory-cybernetic-domination-tour-2026/hawthorne-theatre/portland-oregon/) |
| 2026-11-22 | 10:00–14:00 | King Farmers Market | King Farmers Market | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/king/) |
| 2026-11-22 | 10:00–15:00 | Lents International Farmers Market | Lents International Farmers Market · The ZED | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/lents-international/) |
| 2026-11-24 | 19:00 (end unconfirmed) | Distant | Dante's | Listed $27.27 · confirm current total | [Listing](https://www.danteslive.com/tm-event/distant-with-heavy-hitter-torn-open-katywentmissing/) |
| 2026-11-24 | 19:30 (end unconfirmed) | Boston Manor | Hawthorne Theatre | See organizer for current cost | [Listing](https://hawthornetheatre.com/event/boston-manor/hawthorne-theatre/portland-oregon/) |
| 2026-11-25 | 10:00–14:00 | Shemanski Park Farmers Market · Harvest Market | Shemanski Park Farmers Market | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/shemanski-park/) |
| 2026-11-27 | 19:00 (end unconfirmed) | Bodysnatcher — Hell Is Here, Hell Is Home | Hawthorne Theatre | See organizer for current cost | [Listing](https://hawthornetheatre.com/event/bodysnatcher-hell-is-here-hell-is-home-tour/hawthorne-theatre/portland-oregon/) |
| 2026-11-28 | 09:00–14:00 | PSU Farmers Market | PSU Farmers Market · South Park Blocks | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/psu/) |
| 2026-11-28 | 10:00–17:00 | Portland Saturday Market | Portland Saturday Market | Free admission · purchases extra | [Listing](https://www.portlandsaturdaymarket.com/hours-and-directions) |
| 2026-12-01 | 19:30 (end unconfirmed) | Amorphis & Insomnium | Hawthorne Theatre | See organizer for current cost | [Listing](https://hawthornetheatre.com/event/amorphis-insomnium/hawthorne-theatre/portland-oregon/) |
| 2026-12-03 | 16:00–19:00 | Oregon Arts & Agriculture Holiday Market | ADX · Art Design Xchange | See organizer for current cost | [Listing](https://artdesignxchange.com/events/oregon-arts-agriculture-holiday-market) |
| 2026-12-04 | 20:00 (end unconfirmed) | UNKLE | Hawthorne Theatre | See organizer for current cost | [Listing](https://hawthornetheatre.com/event/unkle/hawthorne-theatre/portland-oregon/) |
| 2026-12-05 | 09:00–14:00 | PSU Farmers Market | PSU Farmers Market · South Park Blocks | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/psu/) |
| 2026-12-05 | 10:00–17:00 | Portland Saturday Market | Portland Saturday Market | Free admission · purchases extra | [Listing](https://www.portlandsaturdaymarket.com/hours-and-directions) |
| 2026-12-08 | 20:00 (end unconfirmed) | Miss May I x Born of Osiris | Hawthorne Theatre | See organizer for current cost | [Listing](https://hawthornetheatre.com/event/miss-may-i-x-born-of-osiris/hawthorne-theatre/portland-oregon/) |
| 2026-12-09 | 19:00 (end unconfirmed) | Suicide Silence — Reminders of Hell | Hawthorne Theatre | See organizer for current cost | [Listing](https://hawthornetheatre.com/event/suicide-silence-reminders-of-hell-tour/hawthorne-theatre/portland-oregon/) |
| 2026-12-11 | 17:00–21:00 | Crafty Wonderland · First Pick Party | Oregon Convention Center · Hall D | $25 · confirm ticket details | [Listing](https://craftywonderland.com/pages/vendor-list) |
| 2026-12-12 | 09:00–14:00 | PSU Farmers Market | PSU Farmers Market · South Park Blocks | Admission cost not stated · purchases extra | [Listing](https://www.portlandfarmersmarket.org/our-markets/psu/) |
| 2026-12-12 | 10:00–17:00 | Portland Saturday Market | Portland Saturday Market | Free admission · purchases extra | [Listing](https://www.portlandsaturdaymarket.com/hours-and-directions) |
| 2026-12-12 | 10:00–17:00 | Crafty Wonderland Holiday Art + Craft Market | Oregon Convention Center · Hall D | $4 timed entry · confirm ticket details | [Listing](https://craftywonderland.com/pages/vendor-list) |
| 2026-12-12 | 12:00–20:00 | Kerns Holiday Market | Kerns Holiday Market · Outlet and neighboring businesses | See organizer for current cost | [Listing](https://www.outletpdx.com/events/kerns-market-2026) |
| 2026-12-13 | 10:00–17:00 | Crafty Wonderland Holiday Art + Craft Market | Oregon Convention Center · Hall D | $4 timed entry · confirm ticket details | [Listing](https://craftywonderland.com/pages/vendor-list) |
