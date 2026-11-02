# The Showdown — official source readiness and activation

**Reviewed November 1, 2026.** The Showdown is among the owner's fully relevant active SHOWS venues. Preference does not depend on importer availability.

## Original first-party source

- [Venue homepage and dated show calendar](https://www.showdownpdx.com/) at **1195 SE Powell Blvd, Portland, OR 97202**. WordPress TicketWeb-powered calendar has separate listing cards for show/doors, original on-site `/tm-event/<slug>/` permalinks, source-provided images, and at least **six discoverable pages** of upcoming events.
- Calendar cards have weekday, abbreviated month/day and times **but no year**. This is a material ambiguity over New Year. The independent first-party **event details** have an original Google Calendar action with `dates=YYYYMMDDTHHMMSS/YYYYMMDDTHHMMSS`, original billing, and venue address; we read its link only, never request Google Calendar, TicketWeb or third-party widgets.
- [Live GitHub Actions source validation #41371602744](https://github.com/julegan/shows/actions/runs/41371602744) checked all six bounded original calendar pages and found **40 verified event-detail candidates**, **11 review holds** across 51 original listings; no provider API calls and no automatic publishing.
- Holds include original detail records with no unique year-bearing calendar action and differing original ticket/event billing. These are *not* silently assigned to a different date, excluded as non-events, or published. One ordinary HTML apostrophe discrepancy was fixed and regression-tested.

## Mapping and safety

- Adapter `showdown-original-html` validates exact original event URL, original listing weekday, month/day, show/doors clocks against the *same-event* Google Calendar action year/date/local time, show billing, and `1195 SE Powell Blvd, Portland, OR` location. Converts the verified venue-local show clock to correct `America/Los_Angeles` offset, including daylight-saving transitions.
- The actor lists both punk/indie-leaning shows and country/line-dance programming. It is **venue-relevant**, not proof that every bill is punk/metal. Candidate music style, category, event format and suitability require existing editorial classification and human-reviewed pull requests. Do not mark country lessons as punk or concerts merely because of the room.
- Source images belong to their original event cards; `usageApproved:null` explicitly means no assumed rights. No hotlink/download/mirroring without review.
- Pagination and body sizes are bounded (maximum eight pages, ninety detail pages per read); event-detail requests are limited to two at a time, without retrying or bypassing HTTP 429. Missing or changed source layouts produce errors/holds, **not** a claim of zero upcoming events.
- The importer is enabled only for the existing SHOWS **review-only** daily refresh. Approved `events.js` remains untouched by this activation PR; Portfolio sync is a subsequent separate reviewed step.

## Research gaps

- Investigate held original events with a clear provider-supported full-year feed or individual manual checks. Do not presume a year or re-enable ambiguous listings simply to raise the count.
- Monitor whether the full 51-event detail process remains within the refresh job budget and whether subsequent runs return rate limits. If rate limited, pause/reduce this importer rather than evading controls.
- Pursue other active-priority venues (including 45 East, Wyrd Hut, Republic Cafe) with the same source-verification standard, independent of importer ease.
