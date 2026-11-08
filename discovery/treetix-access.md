# TreeTix access for High Water Mark and Soundcontrol

Tracks [SHOWS #56](https://github.com/julegan/shows/issues/56) and [SHOWS #158](https://github.com/julegan/shows/issues/158). Current status: TreeTix's provider-supplied non-proxied API was live-validated November 2, 2026; **High Water Mark and Soundcontrol ingestion is enabled**, while coverage of other Portland producer calendars requires research. Historical notes below preserve previous blocked states.

## Source-wide reconciliation — November 8, 2026

The daily refresh now runs `scripts/treetix-coverage.js` separately from the restricted importer. It inspects **every observed provider record** from the public TreeTix JSON response, reconciles strong original event IDs/permalinks against approved SHOWS data and proposed records, and writes `discovery/treetix-coverage-review.md`.

Events from previously unconnected producers, unverified Portland venues, unknown clocks, possible cross-source duplicates, and date conflicts remain visible as per-event exceptions. Genre or format is never used to skip these source records. The original supported importer remains scoped to High Water Mark and Soundcontrol until other producers/locations are independently verified; the audit does not directly import or publish their events.

Provider city/state labels are preliminary evidence, not a guarantee that each venue is inside city limits. A failed feed is reported as **unknown**, not empty, and feed absence never proves cancellation. The reconciler is a provider snapshot, not a claim that TreeTix itself lists every booking. Review the report's per-event exceptions and expand validated source scope through subsequent PRs.

## Successful live provider feed / adapter proposal — November 2, 2026

Three GitHub Actions read-only probes against the **new** `https://api.treetix.com/events.json` host returned valid JSON, including [successful initial probe #41532069711](https://github.com/julegan/shows/actions/runs/41532069711). The [third detailed verification #41532520170](https://github.com/julegan/shows/actions/runs/41532520170) established the actual canonical permalink shape `https://www.treetix.com/event/{event_id}/{calendar}`, date `YYYY-MM-DD`, 12-hour local `start_time`, `tz: US/Pacific`, event `talent` and/or `event_title`, and individual venue names.

**102 total provider records** are **not** 102 SHOWS events. They consist of **69 highwatermark calendar entries**, **3 soundcontrol entries**, 15 WhatsSoFunnyNetwork, 13 Peacock and two other producers. The venue view includes **70 High Water Mark Lounge records**, accounting for one Soundcontrol-produced bill, and one Soundcontrol show each at Dante's and Wonder Ballroom. Other producers and locations remain excluded from the proposed adapter.

The independent adapter in this review PR scopes strictly to those two source calendars; validates original event ID and event permalink, exact venue, Portland/OR, local full-year date/clock/time zone and DST conversion; and **holds** malformed/ambiguous records for manual review. TreeTix's listed clock is **not verified as show vs doors**. A single bounded read can be shared between both source adapters per run. Original poster URLs are retained as research evidence only, **not displayed or hotlinked**, until reuse rights and permitted local caching are confirmed. Feed failures and omitted entries **never** imply cancellations or deletions.

The existing daily refresh can propose source events in an ordinary editorial PR after this implementation is merged; SHOWS's approval and separate Portfolio publication steps remain mandatory. Compare original promoter and official venue duplicates before approval. Keep issue #56 open through successful end-to-end review and publication confirmation.

## Provider-approved alternate host — November 2, 2026

TreeTix support (Lionel) confirmed that the previous host was blocked by **Cloudflare Bot Fight Mode** and supplied a **new, non-proxied public listing URL** for SHOWS: [https://api.treetix.com/events.json](https://api.treetix.com/events.json).

The read-only schema probe (`scripts/probe-treetix-api.js`) now uses that exact provider-supplied URL. The existing manual-only GitHub Actions workflow (`Inspect TreeTix public events API (review only)`) should be run once from `main` after this PR is merged to verify GitHub-runner access, actual JSON shape and presence of original High Water Mark / Soundcontrol events. **Provider confirmation of the routing change is not yet a successful GitHub runner test**; do not treat a blocked, invalid or empty response as proof that either venue has no upcoming shows.

**Next:** Inspect real source keys, timestamp/venue semantics, original event IDs/permalinks and artwork fields; then implement a separate tested review-only importer. Preserve explicit editorial approval, source attribution, no silent cancellation/deletion, and no hotlinked artwork. The prior `www.treetix.com/api/events.json` URL below is historical diagnostic evidence only.

## Follow-up — November 2, 2026: TreeTix Cloudflare challenge confirmed

TreeTix support responded that **Cloudflare is the likely blocker** and requested the latest **UTC timestamp, GitHub runner source IP and HTTP client/User-Agent** so they can find the request in their logs. We made **one new unauthenticated public GET** with the *same exact* explicit User-Agent and `Accept: application/json` header as the November 1 API attempt.

[Diagnostic GitHub Actions run 41514481916](https://github.com/julegan/shows/actions/runs/41514481916), one on-demand request, no retries or bypass:

| Log correlation field | Observed value |
| --- | --- |
| Endpoint | `https://www.treetix.com/api/events.json` |
| Request start UTC | **2026-11-02T19:56:03.670Z** |
| Request completed UTC | **2026-11-02T19:56:03.792Z** |
| GitHub runner egress IP as seen by **both** api.ipify.org and AWS checkip | **52.234.44.120** |
| HTTP client | **Node.js v22.23.4 built-in `fetch` (Undici 6.29.1)** |
| Exact `User-Agent` | **`SHOWS-public-event-feed-probe/1.0`** |
| `Accept` | `application/json` |
| HTTP response | **403 Forbidden** |
| `Server` | **`cloudflare`** |
| `cf-mitigated` | **`challenge`** |
| `cf-ray` | **`a545b34b8a39cf1b-SJC`** |
| Response content type | `text/html; charset=UTF-8` |

The **`cf-mitigated: challenge`** and `cf-ray` headers provide a specific Cloudflare log correlation. These response headers are evidence that Cloudflare issued a challenge, **not proof of which rule fired or that the TreeTix application refused the request**; only TreeTix can identify the exact rule/action from its Cloudflare logs.

The IP above is a *single ephemeral GitHub-hosted runner's observed outbound address*, not a guaranteed stable address for future workflows. **Do not request a permanent allowlist for one ephemeral runner IP** as a durable solution. Ask TreeTix for a supported, narrowly scoped server-to-server access mechanism, a Cloudflare API/bot-management exception restricted to the public listing endpoint and documented client requirements, or an authorized cached/exported feed. Never attempt to bypass challenge or use credentials without their instruction.

The diagnostic code is `scripts/diagnose-treetix-cloudflare.js` and the dedicated workflow `.github/workflows/diagnose-treetix-cloudflare.yml` is **manual-only** after the single live run. It logs timing, observed source IP and Cloudflare response metadata **without logging data or sending events to SHOWS**. The original API importer remains **disabled** until an authorized, successfully validated feed is established.

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
