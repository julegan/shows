# Independent underground venue source readiness — October 22, 2026

## Starday Tavern — enabled, review-only

First-party calendar: https://stardaytavern.com/#calendar

The public venue site embeds an Elementor calendar containing original Google Calendar event objects. Each valid candidate must have an exact, source-provided year/date/local time and `America/Los_Angeles` offset plus a matching Google event ID and public permalink. Duplicate occurrences use independent Google calendar links; distinct timed same-date events can coexist. The public source calendar **may use doors, not showtime**, so editorial review must verify that distinction and event status. No flyer image is invented if the embedded source supplies none.

A [read-only GitHub runner verification](https://github.com/julegan/shows/actions/runs/39895941675) checked **1,587** archived/public objects: **1,544** had verified time-bearing original links, **82** dated occurrences lay in the checked future window, and **43** records were held for missing or inconsistent timed starts. This is **not** 1,544 upcoming events. Only dates within the discovery review window are eligible for candidate PRs. Source artwork is never fetched without actual event artwork links.

The original calendar's event IDs and permalink validation are tested in `tests/starday-importer.js`. Source health can be rechecked with **Actions → Probe official Starday Tavern source health (review-only)**; regular CI uses fixtures rather than live site requests. The ordinary daily workflow proposes new candidates in PRs; publication to Portfolio is a separate approval step.

## Kenton Club — year/time evidence missing

The [official venue website](https://www.kentonclub.com/) has compelling punk and rock lineups (including October and November bills), but most entries are hand-entered **weekday/month/day without a calendar year or show start time**. Venue covers often default to $10, but that is not showtime evidence. Do not guess year from the current month, publication date, weekdays, or a prior year's site archive. Seek first-party promoter/ticket pages, a venue ICS export, or event-specific date/time confirmation before activating a calendar importer.

## Doomtown PDX — valuable promoter and flyer leads, not dates to publish blindly

The independent [Doomtown PDX](https://doomtownpdx.com/) WordPress site publishes underground punk/hardcore bills, flyers and venue references (Black Water, High Limit Room, Shanghai Tunnel, Alleyway, High Water Mark). The public WordPress posts feed is readable at `https://doomtownpdx.com/wp-json/wp/v2/posts`. But **post dates can be scheduled on the event day rather than reflect when a listing was written**, post canonical slugs can differ from the post title, and handwritten event weekdays occasionally conflict with the post's 2026 calendar date. Some flyers include multiple nights at different times.

Recommended next stage: a **leads-only** source importer using original WordPress post IDs/permalinks, artwork provenance, venue and advertised lineup, plus explicit weekday/year/time conflict reporting. Corroborate questionable bills with original venue/organizer records before they become actual SHOWS event candidates. Do not assign invented local clock times or reuse the post publication time as a performance start.

**October 29 implementation:** The combined SHOWS refresh now checks public Doomtown WordPress posts, saving `discovery/doomtown-leads-review.md` with original URLs, printed date snippets, venue references and first-party artwork leads. It remains lead-only (no event ingestion, no verified date claim or artwork rights); errors are visible in the report instead of silently presenting zero shows. Confirm public API access on a GitHub runner after merge, then corroborate any candidate with the original venue or ticket issuer before an event importer can be activated.

## Existing dependencies

- **The Coffin Club:** VenuePilot authorized app ID still required for enabled automated data access.
- **High Limit Room:** Afton Tickets integration or original dated public feed still required.
- **High Water Mark:** Official venue site blocked automated source checks; Soundcontrol remains a partial authorized promoter source.
- **No Fun:** Remains intentionally paused from automatic daily intake.

All newly imported events and imagery continue to require owner review before publication. No social accounts or event-attendance registration are created.
