# Mission Theater ongoing discovery — October 29, 2026

The [official Mission Theater calendar](https://www.mcmenamins.com/mission-theater) publishes event cards and a year-bearing search index on the same page. The connector cross-checks those two published representations using **one public request** per discovery run. No private API, authentication or ticket checkout is used.

This is a source connection, not a bulk event release. Daily discovery proposes candidates for Julie's review. events.js and the deployed portfolio snapshot are unchanged by this PR, so no portfolio release PR is required.

## Live result

[Read-only live probe 40977016290](https://github.com/julegan/shows/actions/runs/40977016290) validated **45 dated Mission records** using the single-request approach. Reconciliation found **44 new review candidates and one already-present Gully Boys listing**. These are venue records, not 45 verified concerts. Non-Mission Halloween Specials promotions are excluded, and malformed promotion search entries remain disclosed holds. No events are published in this PR.

## Evidence and scope

- Each venue card supplies an original McMenamins event permalink, billing, weekday/month/day, starting-time wording, venue identity and source image. The search index supplies the same event permalink and billing with a complete month/day/year.
- Require matching event URL, normalized title and date/weekday. Preserve unknown music styles and event format; a `show` label alone does not establish a concert. Use Portland's actual daylight/standard offset.
- Preserve show, presentation, dance, film and unlabeled starting-time labels in the evidence. Doors-only, multiple starts, conflicting dates and invalid doors/show order are held. Unknown admission, age and end times stay unknown.
- Deduplicate mobile/desktop copies. Contradictory copies and contradictory search records cannot silently become accepted listings. Search records missing a matching card are disclosed as holds.
- Skip non-Mission and All Locations promotions. Do not use the site's `movie` CSS class as film evidence: it also appears on History & Art Tour cards.
- Use actual card billing, excluding sitewide promotional headings. **West End Entertainment District is not an artist.** Preserve the manual Gully Boys title and ID when source URL, Mission venue and starting instant match exactly.
- Capture only the original McMenamins CDN image attached to the event card, preserving event permalink, credit and unknown rights status. No downloaded mirror or invented artwork.
- Source errors, including HTTP 429, fail visibly without automatic retries or access-control bypass. The single bounded request replaces the initial detail-page fanout.

## Why this source design

The initial read-only probe fetched original detail pages to establish the site's structure. Its 45-page follow-up encountered timeouts and HTTP 429 after a few pages, and some detail bill headings included additional marketing text. That approach is not enabled. The final connector reads the venue's own year-bearing search data and visible cards together, avoiding the load and title ambiguity of fetching every detail page. This is a change in evidence source, not a relaxation to guessed years or times.

## Operations

Mission remains an expansion venue. The ranked core twelve and No Fun's paused status stay intact. No approved events are deleted or relabeled. The outlook and weekend digests remain active. New venue records still require editorial review; this connection does not claim all venue programming belongs in the underground music feed.

## Validation

Tests cover full-year/card-title/date agreement, weekdays, Pacific standard/daylight conversion, doors/show ordering, unknown or ambiguous starts, source URLs, conflicting duplicate cards/index entries, explicit presentation/film labels, unknown genres, image attribution and preservation of existing curated IDs. A mocked fetch test verifies exactly one request for the complete source. The read-only live probe reconciles against the canonical event snapshot without writing changes.
