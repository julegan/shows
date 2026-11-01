# Coffin Club and High Limit Room — provider-source readiness

Reviewed October 21, 2026. These are **priority music venues**, not optional calendar fillers. Their official pages were inspected from a GitHub Actions runner. Neither has been enabled for automated discovery in this change.

## The Coffin Club — VenuePilot

- Official page: https://thecoffinclubpdx.com/
- Official website embeds the VenuePilot event widget for public account **3434**; its initial HTML is not a static dated event feed.
- Provider documents a **read-only GraphQL API** at https://public.api.venuepilot.com/graphql for publicly announced events. It requires a **provider-issued 64-character application ID**, sent in `x-vp-app-id`; the public website widget configuration is **not** an API credential.
- Vendor's official documentation: https://docs.venuepilot.com/public/reference and https://docs.venuepilot.com/public/types
- The integration in `scripts/coffin-venuepilot.js` supports pagination and maps only explicitly dated and allowed **The Coffin, 421 SE Grand Ave, Portland** listings into review candidates, while holding canceled or venue-mismatched records. Official image URLs retain source attribution and `usageApproved: null`.
- No extra artist, ticket or showtime details are inferred. No event is published automatically. No credential is written to source files or logs.

**Activation sequence, requiring explicit source permission:**

1. Request a VenuePilot **public API application ID**, scoped to The Coffin account 3434, with permission to use announced event metadata for a community calendar. Do not substitute the public widget's numeric account ID or any embedded site configuration as an application ID.
2. Store the separately issued ID as the SHOWS repository Actions secret `COFFIN_VENUEPILOT_APP_ID`. Never paste it into a PR, code file or discussion.
3. Manually run **Actions → Probe official Coffin Club event API (review-only)**. The check verifies access, venue identity, dates and page coverage but does not save or publish events.
4. After a successful real probe, open a PR to change `discovery/sources.json` entry `coffin-club` from `adapter-needed` to `pilot-enabled`; continue using normal editorial PR review and separate Portfolio sync. Do not activate before this live proof.

Until then, keep looking at original artist/promoter event pages and venue ticket links as supplemental leads, but do not infer missing showtimes from cards, search snippets or venue reputation.

## High Limit Room — Afton Tickets

- Official events: https://highlimitroompdx.com/shows/
- Venue's website publicly identifies **Afton** as its ticketing provider. The official shows page embeds Afton Tickets' checkout widget; public first-response HTML does not include a dated event list.
- No provider-documented, authorized read-only event listing API, ICS/RSS export, or stable venue-specific JSON source was verified. Its public widget configuration is not a general-purpose API credential.
- **Next step:** seek an authorized event-calendar feed or source-specific export from High Limit Room / Afton. Evaluate public original event pages and confirm date/year, showtime vs doors, venue address, changes and cancellation before any importer is enabled.
- Do not use resale site listings as a substitute for an official source and do not claim empty initial HTML means no shows.

## Guardrails

- Primary sources, source provenance, explicit Pacific date/offset and editorial review are required for each proposed event.
- Respect access controls and venue/vendor usage permissions. No credential guessing, private endpoint probing or bypassing authentication.
- Existing events remain untouched, and `No Fun` remains secondary and paused for daily intake.

## November 1, 2026 — provider source verification

### Coffin Club

VenuePilot's [official API reference](https://docs.venuepilot.com/public/reference) and [schema documentation](https://docs.venuepilot.com/public/types) still support the already-coded read-only GraphQL integration (announced events, IDs, UTC start and door times, canceled status, images and pagination). The public VenuePilot widget account identifier 3434 is not an API credential. VenuePilot instructs partners to request a separately provisioned app ID through the venue's account manager.

This branch wires the daily discovery workflow to the GitHub Actions secret `COFFIN_VENUEPILOT_APP_ID`. It does not create an app ID or activate the source. The `coffin-club` adapter remains `adapter-needed` until the credential has been authorized, stored as a secret, and confirmed by the [read-only Coffin probe](https://github.com/julegan/shows/actions/workflows/probe-coffin.yml). After that, inspect original events and duplicates before a separate activation PR.

### High Limit Room — official HTML findings

The [successful November 1 runner probe](https://github.com/julegan/shows/actions/runs/41347897664) fetched only the official `https://highlimitroompdx.com/shows/` page and reported **zero** static iframe references, original ticket links, JSON-LD Event blocks or dated time markers. The source HTML mentions **Afton**, and it loads two unrelated GoDaddy scripts. The page's initial HTML does not provide a reliable confirmed dated-event feed; this does **not** mean the venue has no upcoming shows. The probe did not access any Afton widget or private checkout API.

High Limit Room's [official general contact](https://highlimitroompdx.com/contact/) is **highlimitroompdx@gmail.com**. Ask for a permissioned read-only machine-readable calendar (JSON, RSS or iCalendar) or published provider integration, event-specific links, time zone and doors/show distinctions, and image reproduction terms. Keep the source `adapter-needed` until a real dated feed is validated. Do not manufacture event counts or event starts from marketing text.

### Review-only safeguards

Neither source was activated; no approved events, images or portfolio snapshot changed. The High Limit HTML diagnostic is manual-only after this check, with fixtures in regular CI. Source unavailability must never imply cancellation or zero upcoming events.
