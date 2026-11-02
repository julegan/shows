# Wyrd Hut and Republic Cafe / Ming Lounge — original-source discovery review

**November 1, 2026.** Both venues remain **full editorial priority**. They do not yet offer a verified complete, authorized, machine-readable public event calendar. Their lack of importers must not be mistaken for a lack of shows.

## November 1 follow-up — working secondary lead monitoring

[Public NearHear Wyrd venue listings](https://nearhear.app/venues/4583) expose read-only `MusicEvent` JSON-LD, validated in a live GitHub Actions runner on **November 1, 2026**: **five future music leads**, all with UTC times and an address that matches **4704 SE 65th Ave, Portland**. The new `scripts/wyrd-secondary-leads.js` converts them to Pacific local day/time and writes `discovery/wyrd-secondary-leads-review.md` to the existing daily Actions review artifact. **This does not enable a Wyrd importer, send any requests to ticket sites, or alter approved event records.**

Observed sample bills include House of Warmth / sertraline. / Speckle, Flying Whammy / Tensas & The Mourners / Kids on Fire / Sorry Holly, Fundamental, The Mistons / Trans Panic, and Throw / Billy Batts & the Made Men / NOR/ME. All are **secondary candidate leads**. Their listing clock could be show, doors or another event time, not verified by an original organizer page. Some NearHear JSON-LD `offers.url` links point only to [Sad Times Productions' general show archive](https://www.sadtimesproductions.com/shows), which currently displays 2026 historical events rather than the exact winter 2026–27 bills. **That archive does not corroborate an upcoming show.**

The [original Wyrd Hut website](https://wyrdhut.com/) is a **Launching Soon** placeholder and does not provide a dated schedule. Automated requests to the original Bandcamp artist page yielded a restricted/challenge response and BandSlate returned HTTP 429. Neither was bypassed. Research and manual source checks can continue, but the daily collector only reads the openly served NearHear venue page with a bounded GET. If the source stops working, the report explicitly records the hold; it does not say the venue has zero shows or remove any existing event.

The daily workflow now retains this review alongside the existing Doomtown and source/artwork reviews. **The lead-only report does not by itself create a new PR**; it remains accessible in that day's action artifact and summary. If approved canonical events change, the corresponding review PR can include the report.

## Wyrd Hut

- Original venue social account: [@wyrdhut](https://www.instagram.com/wyrdhut/). **No authorized chronological importer** confirmed. Do not bypass authentication or use unrelated 'Wyrd Leatherworks & Meadery' (a different business).
- **Original artist-confirmed music lead:** [Shadowhouse's own Bandcamp show calendar](https://shadowhouse.bandcamp.com/) lists **Jan 9 — Wyrd Hut — Portland, OR**. Independent [BandSlate](https://www.bandslate.com/venue/wyrd-hut-portland) identifies **January 9, 2027** and classifies Shadowhouse as goth; the band's [own recorded releases](https://shadowhouse.bandcamp.com/album/forsaken-forgotten) use goth/darkwave/post-punk tags. **Do not invent the doors/show clock, supporting bands, ticket price, or a flyer.** Original artist feed does not itself print a year; confirm the 2027 date and ticket details on an original show-specific bill before calendar publication.
- **Organizer evidence for venue and address:** [furniture.factorypdx's original Eventbrite show](https://www.eventbrite.com/e/sw0rdswall0wer-helen-joy-way-of-flowers-at-wyrd-hut-tickets-2001707994496) specifies **4704 SE 65th Avenue, Portland OR 97206** for an October 31, 2026 all-ages show. [Travel Portland's organizer-submitted Nov. 5–22 theater listing](https://www.travelportland.com/event/6ae188412fa45389653f7f4e/) also gives **4704 SE 65th Avenue**. An older [Portland Show-Guide venue directory](https://mobile.pc-pdx.com/venues/wyrd-hut) says **4704 SE 64th Avenue**, so the original ticket or venue's directions should be checked per event. Do not replace the venue's actual address with a guess.
- **Additional dated but unconfirmed lineup leads:** [NearHear](https://nearhear.app/venues/4583) reports winter/spring events for House of Warmth/sertraline./Speckle, Flying Whammy/Kids on Fire, Fundamental, Trans Panic, and others, but its dates may be displayed in UTC and its listings are not original organizer source proof. Research individual original event flyers, artist/venue accounts or ticket pages rather than importing an aggregator wholesale.
- The venue also hosts performance/theater; since SHOWS is **music-first**, avoid padding the feed with weeks of unrelated theatrical performances merely because they happen at a preferred room.

## Republic Cafe / Ming Lounge

- [Official restaurant site](https://republiccafeor.com/) confirms **222 NW 4th Avenue, Portland OR 97209** and operating venue identity, **not** a dated music-calendar source.
- [Willamette Week, July 22, 2026](https://www.wweek.com/culture/2026/07/22/portlands-best-rave-in-a-chinese-restaurant/) reports that organizer [Headspace Circus](https://www.instagram.com/headspace.circus/) held underground hardcore-electronic rave and art nights in a back room behind the restaurant's Ming Lounge. That is a **historical recurring pattern, not proof** that every Tuesday in November or December has a show.
- **Potential dated show lead:** [Songkick's listing](https://www.songkick.com/concerts/43474084-bigbabygucci-at-ming-lounge-and-republic-cafe) advertises a **December 19, 2026** BigBabyGucci/Lil Candypaint show at Republic Cafe/Ming Lounge, presented by Better Temperatures. This is a **secondary listing**, pending an original promoter, artist, or ticket confirmation. Genre and editorial fit must be reviewed separately.
- Prioritize original dated Headspace Circus announcements and other organizer-supplied flyers/ticket pages. Do not scrape private accounts, reproduce artwork without permission, or confuse a club party with a concert.

## Improvements implemented here

The already-running [Doomtown PDX review-only lead collector](../scripts/doomtown-leads.js) now scans its own original posted text for **Wyrd Hut, Republic Cafe and Ming Lounge**, alongside existing venues. This is **not** a new importer; any matched original Doomtown post only creates a human-readable source-review lead, and its publication date is never treated as an event date.

Both canonical entries in [venues.json](venues.json) and [sources.json](sources.json) remain **preferred / editorial-active** and **adapter-needed**. We record original social/artist/organizer evidence, with no fake importer readiness or automatic event additions.

## Concrete next work

1. Ask/verify whether Wyrd Hut provides a publicly accessible show list, original booking calendar, RSS/ICS or promoter feed. A verified artist or organizer dated listing can be proposed individually through the normal SHOWS editorial PR.
2. Look for original Headspace Circus and Better Temperatures event postings; only schedule a specific night after verifying date/year, room, start/doors, and organizer.
3. When a first-party feed exists, build an isolated **review-only** connector with original venue identity, no guessed timestamps, and explicit source failure reporting. Keep review and Portfolio sync separate.
