# Nova PDX and Lola's Room — first-party source readiness

Checked on November 1, 2026 using [GitHub Actions run 41366325952](https://github.com/julegan/shows/actions/runs/41366325952). All probes used bounded GET requests to original public venue pages; **no** private API, ticket-provider scraping, authenticated data, image download, or changes to approved events.

## Nova PDX — live tested and proposed for daily review intake

- [Official dated calendar](https://www.novapdxevents.com/event-calendar) contains **12 valid event JSON-LD objects**, including year-bearing dates, event status, the 722 E Burnside Portland venue, and original `tixr.com/e/<event-id>` ticket links.
- [Official homepage](https://www.novapdxevents.com/) independently includes the **same 12 bills and exact-day printed clock times**. The generated candidate preserves this as a venue-published **event listing** time; it is not silently labeled as performance start versus doors.
- [Read-only live importer probe](https://github.com/julegan/shows/actions/runs/41366325952) showed **12 candidates, 12 corroborated clock times, 0 date-only fallbacks and 0 holds**. Validation tests also verify invalid dates, cancellations, wrong venue, outside venue, ticket host restrictions and `usageApproved:null` on flyer candidates.
- Adapter `nova-official-schema` is approved for *candidate collection* through the existing canonical daily discovery workflow. It creates or updates only **human-reviewable PRs**, never commits straight to approved calendar data or the public portfolio.
- Original event-specific artwork URLs retain creator/source attribution and `usageApproved:null`; no download or reproduction rights are inferred. Missing event times or homepage access result in **date-only** candidates, not fabricated clocks.
- A zero/invalid structured event list raises a **source failure**, not a claim the venue has no events. Other venue listings remain unchanged.

## Lola's Room — accessible, dedicated first-party pages, importer still disabled

- Original venue-specific [McMenamins Lola's Room events](https://www.mcmenamins.com/crystal-ballroom/lolas-room/music-events/) expose around a dozen original McMenamins event permalinks, but the overview HTML frequently prints **weekday/month/day without a year**.
- Original [November 14, 2026 event](https://www.mcmenamins.com/events/278429-2000s-dance-flashback) and [November 21, 2026 event](https://www.mcmenamins.com/events/278428-2010s-dance-flashback) detail pages both returned **full dates, 9 PM doors and 9 PM show**, with Lola-specific listing identity.
- Important edge case: shared Crystal Ballroom events (e.g. tickets granting access to both Lola's and the main ballroom) must not result in event clones or incorrect room-specific venue identities. Some site-wide events span multiple floors; hold their location for editorial review instead of assigning only Lola's.
- Next adapter should read the original venue list, validate each `https://www.mcmenamins.com/events/<id>-<slug>` page, independently confirm year, time wording, venue identity/address and cancellations, then dedupe across Crystal main stage and Lola's Room.
- Keep `lolas-room` as `adapter-needed` until its own live read-only importer probe verifies date/room coverage. Do not infer that the source is empty from yearless overview cards.

## Policy

Both are fully preferred venues regardless of technical source state. All 38 active venues remain equal editorial priorities; other unconnected venues are still research work, not secondary. Official venue clocks, doors/show distinctions and event age/format must remain accurate and source-linked.
