# TreeTix access for High Water Mark and Soundcontrol

Tracks [SHOWS #56](https://github.com/julegan/shows/issues/56). Status: **access request prepared, not sent; API access not granted; adapter not implemented**.

## Verified source and current blocker

On 2026-10-30 UTC, [TreeTix's official homepage](https://www.treetix.com/) returned HTTP 200 to a direct public request. Its Application Programming Interface section offers a REST API for event-listing services and names **support@treetix.com** as the access-request contact. This invitation does not supply API documentation or grant feed access.

The same local check returned HTTP 403 for both `https://www.highwatermarklounge.com/` and its public `/index.cfm` route, and for `https://www.soundcontrolpdx.com/`. These are access failures, not empty calendars. The existing Soundcontrol adapter remains supplementary; this work does not change source configuration or published events.

`scripts/probe-treetix-access.js` repeats a bounded, read-only check from GitHub Actions. It inspects five known public pages, including the original ticket permalink recorded in the issue. It makes no private API requests, follows no redirects, uses no credentials and performs no retries. Its successful exit means the diagnostic completed, not that a usable feed exists. The workflow is manual after this review branch; it adds no daily polling job.

## Ready-to-send request

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

## After TreeTix responds

1. Record the approved calendar scope, public documentation URL, required venue permissions, costs, rate limits and artwork terms. Do not put private correspondence or credentials into the public repository.
2. Store any credential only in a GitHub Actions repository secret; choose its name once the documented authentication scheme is known. Never include credentials in logs, issues, PRs or browser code.
3. Implement against the supplied documentation. Require stable original ID/URL, a full dated Portland listing, specific venue, verified Pacific offset and separate doors/performance times. Hold ambiguous or changed records; preserve unknown end times and genres.
4. Reconcile Soundcontrol's cross-venue bills with existing records before proposing additions. Preserve existing IDs and manually expanded lineups.
5. Add fixtures for pagination, invalid records, cancellations/reschedules, time-zone boundaries and duplicate bills, plus a credential-safe live probe. Enable only after authorized access and dated record identity pass.
6. Submit new source-confirmed events for editorial review, then prepare a separate portfolio release PR. Keep #56 open until its feed acceptance criteria are met.

Doomtown remains a review-only lead source while access is pending. The scheduled outlook and weekend digests remain active.
