# TreeTix access for High Water Mark and Soundcontrol

Tracks [SHOWS #56](https://github.com/julegan/shows/issues/56). Status: **TreeTix has supplied an unauthenticated public event-listing endpoint; live schema is still unverified, and the adapter is not yet implemented or enabled**.

## Provider response — November 1, 2026

TreeTix provided the event-listing endpoint: https://www.treetix.com/api/events.json. According to the provider, it returns an `events` object covering upcoming events for all current TreeTix producers (including High Water Mark and Soundcontrol), with no required account or authentication token **at present**.

Important limitations: cancellation notices are **not** included; rescheduled events are represented as new entries without a reschedule link. Missing events must never be automatically deleted or labeled canceled, and same-bill/new-date matches must be flagged for review. The provider asks consumers to **download original images instead of hotlinking** because hotlinking restrictions may be enforced later. Any local caching/public display must preserve image attribution and respect the repository's artwork rights-review policy.

**Live environment finding:** On November 1, 2026, GitHub Actions [run 41332079909](https://github.com/julegan/shows/actions/runs/41332079909) successfully ran the fixture tests but received **HTTP 403** from the provided API URL. No JSON schema or event coverage was confirmed. This is a source-access block, not an empty event list. The diagnostic workflow has been limited to manual dispatch to avoid ongoing failing notifications. Contact the provider to ask for a supported server-to-server delivery path or allowlist requirements; do not attempt to circumvent the denial.

At the time of this update, the data fields, event IDs, exact time representation, rate limits, venue strings, permission scope for archival artwork and refresh interval have **not** been validated. The read-only script `scripts/probe-treetix-api.js` reports bounded keys/field examples without writing any events or artwork. Its workflow is manual only; do not enable automatic ingestion until real records are confirmed.

## Historical verified source and blocker

On 2026-10-30 UTC, [TreeTix's official homepage](https://www.treetix.com/) returned HTTP 200 to a direct public request. Its Application Programming Interface section offers a REST API for event-listing services and names **support@treetix.com** as the access-request contact. This invitation does not supply API documentation or grant feed access.

The same local check returned HTTP 403 for both `https://www.highwatermarklounge.com/` and its public `/index.cfm` route, and for `https://www.soundcontrolpdx.com/`. These are access failures, not empty calendars. The existing Soundcontrol adapter remains supplementary; this work does not change source configuration or published events.

`scripts/probe-treetix-access.js` repeats a bounded, read-only check from GitHub Actions. It inspects five known public pages, including the original ticket permalink recorded in the issue. It makes no private API requests, follows no redirects, uses no credentials and performs no retries. Its successful exit means the diagnostic completed, not that a usable feed exists. The workflow is manual after this review branch; it adds no daily polling job.

## GitHub runner findings

The [live runner check](https://github.com/julegan/shows/actions/runs/40978656215) on 2026-10-30 UTC differs from the local network:

| Public page | Runner result | Interpretation |
| --- | --- | --- |
| TreeTix homepage | 403 | Access failure; the API invitation was verified locally |
| High Water Mark root | 403 | Access failure |
| High Water Mark `/index.cfm` | 200; 23 ticket-link references | Promising original venue roster, not yet an accepted dated-event feed |
| Soundcontrol homepage | 403 | Promoter coverage remains blocked |
| TreeTix High Water Mark event `204931` | 200 | Full date and venue confirmed, performance time ambiguous |

The reachable roster includes visible weekday/month/day labels, original ticket IDs, and year-bearing event-specific flyer filenames. The first two sampled cards contain dates matching those filenames. The sample detail page confirms V.I.S., Angurvadal, Iron Firmament and Viduus on Saturday, October 31, 2026 at High Water Mark Lounge (Portland), but prints **“Doors 8 Show 8:30” without AM/PM**. Do not turn that into an invented 8:30 p.m. timestamp. The 23 references are not 23 verified concerts: the roster also includes karaoke, drag, open mic and market listings, and completeness has not been established.

This creates a viable public-HTML investigation path alongside the API request. A future parser must cross-check all card dates/years/IDs, verify venue identity and source date on linked pages, retain unknown performance times for review, and inspect the public full-calendar link for completeness. Do not enable the source based on HTTP 200 or two sample cards alone. The API request is still useful for supported full inventory, clear timestamps and Soundcontrol's cross-venue coverage.

## Historical access request draft (superseded; do not send)

To: support@treetix.com  
Subject: Event-listing API access for SHOWS — High Water Mark and Soundcontrol

Hi TreeTix team,

I'm building SHOWS, a curated Portland music and independent arts calendar at https://julieowens.me/projects/shows/. I'd like to use your event-listing API to keep High Water Mark and Soundcontrol listings accurate and link people back to the original event and ticket pages.

Could you provide read-only access and documentation, and confirm whether it can cover the `highwatermark` and `soundcontrol` calendars? Please let me know if permission from either venue or promoter is also needed, and whether there are any fees.

It would help to understand:

- How to retrieve all upcoming events, including pagination, stable event IDs and original event links.
- How dates, time zones, doors versus show times, venues, cancellations and reschedules are represented.
- Authentication, request limits and the recommended refresh interval.
- Whether we may display source-provided event flyers by URL, with any required attribution or other usage conditions.

SHOWS uses editorial review before publishing additions. We don't need customer, order or checkout data.

Thanks,
Julie Owens

## Remaining integration milestones

1. Record the approved calendar scope, public documentation URL, required venue permissions, costs, rate limits and artwork terms. Do not put private correspondence or credentials into the public repository.
2. Store any credential only in a GitHub Actions repository secret; choose its name once the documented authentication scheme is known. Never include credentials in logs, issues, PRs or browser code.
3. Implement against the supplied documentation. Require stable original ID/URL, a full dated Portland listing, specific venue, verified Pacific offset and separate doors/performance times. Hold ambiguous or changed records; preserve unknown end times and genres.
4. Reconcile Soundcontrol's cross-venue bills with existing records before proposing additions. Preserve existing IDs and manually expanded lineups.
5. Add fixtures for pagination, invalid records, cancellations/reschedules, time-zone boundaries and duplicate bills, plus a credential-safe live probe. Enable only after authorized access and dated record identity pass.
6. Submit new source-confirmed events for editorial review, then prepare a separate portfolio release PR. Keep #56 open until its feed acceptance criteria are met.

Doomtown remains a review-only lead source while access is pending. The scheduled outlook and weekend digests remain active.
