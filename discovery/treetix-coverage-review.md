# TreeTix provider-wide source reconciliation — 2026-11-09

**Evidence:** one observed public TreeTix feed response at https://api.treetix.com/events.json (not a guarantee of provider or venue completeness).
**Scope:** publicly listed events with source dates from 2026-11-09 through 2027-12-14 and provider-labeled Portland, OR locations; unverified/new producer venues require investigation before publication.
**Safety:** this report does not import new producers, approve events, infer genres, or delete missing/rescheduled listings. Every source format is considered; unknown type is not an exclusion.

## Snapshot dispositions

- Raw provider records: **100**; records not excluded for time/geography: **73**.
- Disposition is source-specific; a possible duplicate is **not** proof of an approved matching event.

| Disposition | Records |
| --- | ---: |
| approved | 69 |
| outside-geography | 27 |
| possible-cross-source-match | 2 |
| unconnected-producer | 2 |

## Original producer calendars

| Producer calendar | Source records in reporting scope | Approved by ID | Proposed by ID | Needs review |
| --- | ---: | ---: | ---: | ---: |
| burlynomicon | 1 | 0 | 0 | 1 |
| glittertrashcan | 1 | 0 | 0 | 1 |
| highwatermark | 68 | 68 | 0 | 0 |
| soundcontrol | 3 | 1 | 0 | 2 |

## Event-by-event exceptions

Every observed source row not confidently matched by original provider identity is shown below. Out-of-Portland and historical/distant events appear only in disposition totals. This is a **review queue**, not a list of confirmed missing shows.

- 2026-11-15 — [2026 Hump and Grind Workshop: Masc Movement and Choreography with Throb Zombie](https://www.treetix.com/event/203743/burlynomicon) · Portland Dance Studio · producer burlynomicon · **unconnected-producer**: Portland-labeled original event from a provider calendar not connected to SHOWS; check actual venue and source scope
- 2026-12-04 — [LEWDicrous: Choose Your Own Adventure](https://www.treetix.com/event/204917/glittertrashcan) · Hoku Events on Madison · producer glittertrashcan · **unconnected-producer**: Portland-labeled original event from a provider calendar not connected to SHOWS; check actual venue and source scope
- 2027-01-15 — [Mustard Plug, The Planet Smashers, The Venomous Pinks](https://www.treetix.com/event/204952/soundcontrol) · Dante's · producer soundcontrol · **possible-cross-source-match**: Likely same bill at the same venue/date based on distinctive title words, but no shared original provider ID; verify before asserting coverage
- 2027-02-09 — [Wolves in the Throne Room, Stygian Bough, Spirit Possession](https://www.treetix.com/event/204942/soundcontrol) · Wonder Ballroom · producer soundcontrol · **possible-cross-source-match**: Likely same bill at the same venue/date based on distinctive title words, but no shared original provider ID; verify before asserting coverage

## Next actions

1. Resolve connected-source unaccounted records and original-ID/date conflicts first, prioritizing near-term events.
2. Investigate additional Portland producer calendars and venues; source inclusion is an editorial/source decision, **not** a per-event genre filter.
3. Treat malformed IDs/dates, unverified venues, and possible duplicates as explicit holds; never assume a blank or inaccessible feed means zero shows.
4. Recheck cancellations and reschedules against original ticket pages. TreeTix does not provide a cancellation roster; disappearance alone never cancels an event.
5. Keep additions, source configuration, and any venue-map expansion under the normal owner-reviewed SHOWS PR and separate Portfolio sync.

