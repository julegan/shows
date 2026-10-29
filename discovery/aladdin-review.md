# Aladdin ongoing discovery — October 29, 2026

Source: [Aladdin Theater's official calendar](https://www.aladdin-theater.com/), with original Etix ticket links and event images. Aladdin is an expansion venue; the owner's ranked twelve core sources retain priority and No Fun remains paused.

## Verified source behavior

[Read-only runner probe 40974636056](https://github.com/julegan/shows/actions/runs/40974636056) examined all **97** cards advertised by the main `feed-primary` calendar. It found **85** date/time-valid Aladdin room records, **nine** offsite listings, and **three** source holds. Those are venue records, not 85 verified music bills. The calendar includes films, comedy, storytelling and other formats; event type and genre must be reviewed rather than inferred from performer familiarity.

Two records match previously approved original ticket URLs: Protomartyr / Accessory and King Buffalo / L.A. Witch. The importer recognizes those existing IDs even though the manual titles include supporting artists. Exact ticket URL, venue and start instant must all match; schedule differences remain held.

This PR **connects source intake only**. It does not bulk-publish the 83 remaining candidate records or change events.js. After merging, the existing daily discovery workflow will collect Aladdin candidates and propose them through editorial review. No portfolio release is needed for this infrastructure-only change.

## Critical validation

- Require the exact printed Aladdin Theater room plus an original `www.etix.com/ticket/p/` URL ending in `-portland-aladdin-theater`. The ticket ID must agree with the card's event ID; conflicting links are held.
- Skip Crystal Ballroom, Keller Auditorium and Arlene Schnitzer cards from this calendar. Keep the original room identity; don't duplicate other venue pipelines.
- The source's `startDate` metadata attaches `+00:00` to a **local show clock**. Treating it as an actual UTC instant shifts the event by seven/eight hours. Instead use the independent UTC doors timestamp, verify its printed Pacific doors clock, validate the full date and weekday, and convert the separate printed show clock with Portland DST. Check the metadata only as a local date/clock corroboration.
- Relative Tonight/Today/Tomorrow labels require an independent source UTC doors date. Never infer the date from the runner's clock.
- Hold inconsistent dates, weekday, clocks, ticket identity or status. Retain sold-out listings; exclude rescheduled/canceled and ticket-addon cards for review.
- Require the actual main-feed card count to equal its advertised count. Fail visibly if pagination or layout changes instead of claiming complete coverage from a partial page.
- Preserve separate early/late performances using independent ticket URLs and showtimes. Unknown price, age and end times remain unknown. Original images retain source attribution and unknown permission status.

## Current source holds

1. The Aces — November 4 card says rescheduled to May 23, 2027. Hold the old date.
2. Ladysmith Black Mambazo — changed-status card says rescheduled to February 19, 2027. Hold the old date.
3. Aterciopelados — Aladdin room label lacks an accepted matching original Aladdin ticket identity. Investigate instead of widening the ticket rule.

Previously approved events remain intact. The source health report distinguishes offsite skips, already-present records, new candidates and source holds. The scheduled outlook and weekend digests remain active.

## Validation

Tests cover the metadata timezone trap, Pacific standard/daylight time, relative source dates, full weekdays, incorrect ticket IDs/rooms/hosts, missing showtimes, show-before-doors, status changes, incomplete pagination, duplicates, independently timed performances, and offsite skip reporting. The source itself is fetched read-only; no Etix checkout request, authentication, private API or automated publication occurs.
