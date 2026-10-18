# SHOWS — calendar-first prototype

A small, browser-based working calendar for Portland, Oregon. **SHOWS is a provisional working name, not an adopted brand.**

This is a manually maintained interaction prototype, not a live event aggregation service. The calendar contains 182 dated occurrences for October–December 2026 across 24 places, including 128 music dates. Event additions are reviewed through pull requests before publication. Event times and availability can change; the organizer remains the source of truth.

## Try it locally

Download/clone this branch and open `index.html` in a modern browser. No dependencies, package manager, build, account or backend needed.

## Included

- Responsive month-grid, agenda/list and venue/place views, including a useful compact mobile calendar
- Previous/next month navigation, today's date, and drilldown on any calendar day
- Search across title, location, organizer context, description and tags
- Interest, music-style, neighborhood, free, today, weekend, next-seven-days and saved filters
- Event detail dialog, original organizer link and maps/directions when an address is verified
- Add individual events to Google Calendar using its native event template
- Download an individual event or a multi-event series as an RFC 5545-compatible `.ics` file for Apple Calendar, Outlook or Google Calendar import
- Export events in the current filtered view to `.ics`
- Save events in this browser using localStorage; share stable event URLs with hash deep links
- Consistent visual event thumbnails in list cards and details; source-verified artist/venue flyer art can be added after permission and attribution review
- No ads, analytics, profiles, account creation or behavioral tracking

**Doors-only times:** When only doors are published, the UI labels the time as Doors. Calendar export titles say `(doors)` and their descriptions disclose that the performance start is unconfirmed.

**Unknown end times:** A one-hour editable placeholder is required by the calendar export interfaces and is clearly disclosed. It does not represent a verified end time.

**Series:** Series exports currently produce one `VEVENT` per date; this is correct for nonuniform multi-day events. True recurrence rules (`RRULE`) are a later enhancement once a recurring source data model exists.

## Accessibility and browser behavior

Semantic headings and controls, explicit labels, keyboard-operated dialog, focus-visible styling, screen-reader status, a skip link and reduced-motion preference are included. Formal WCAG 2.2 AA auditing and real device testing remain to be done.

The event sample is separate in `events.js`; UI and calendar-export logic live in `app.js`. Dates are stored with explicit Pacific offsets so UTC calendar exports retain the right absolute time across daylight saving changes.

Apple Calendar: tap/download the `.ics` file and open/import it into your preferred calendar. Behavior differs by device and browser. Google Calendar single-event links open the Google Calendar event editor. For series/multiple events, import the downloaded `.ics` file through Google Calendar settings or another calendar application.

## Editorial/source model

This pilot is **not** a scraper or a recommendation algorithm. The original 11-event sample was checked against publicly available organizer and community calendar pages on October 17, 2026. The earlier 69-occurrence expansion and this 39-date music expansion preserve their source checks; the pull request is the human editorial approval step. The music pass adds 37 live bills and two goth DJ nights from primary venue, promoter, ticket, or artist listings, with explicit source-availability notes. Source URLs are preserved on each event. We start with activities taking place in Portland city limits; any street address that cannot be verified is visibly labeled as unknown and directions are not offered.

[EDITORIAL.md](EDITORIAL.md) preserves the original underground music priority. [MUSIC-SOURCES.md](MUSIC-SOURCES.md) records the new music bills, style evidence, and source gaps; [EVENT-SOURCES.md](EVENT-SOURCES.md) preserves the earlier expansion, recurrence boundaries, and review notes. Each record preserves source references, check date, verification method, and source categories separately from SHOWS classifications. Unknown admission uses `free: null`, so it is excluded from the confirmed-free filter.

The latest independent-venue research is in [INDEPENDENT-VENUES.md](INDEPENDENT-VENUES.md): 27 new dated music bills at No Fun, Twilight and Kenton Club, plus verification gaps that should be checked before declaring the calendar complete. [ARTWORK.md](ARTWORK.md) explains thumbnails and licensing. The prior major-venue expansion is documented in [VENUE-COVERAGE.md](VENUE-COVERAGE.md), including major-venue additions and outstanding verification gaps. Core sources in the earlier music pass included Twilight, High Water Mark, No Fun, Star Theater, Coffin Club, Turn! Turn! Turn!, High Limit Room, Kenton Club, and Hierophant / SOS x 777 Booking. Black Water and other incomplete sources remain in the review log for follow-up.

Source sites include:
- https://www.danteslive.com/
- https://hawthornetheatre.com/events/
- https://www.portlandfarmersmarket.org/
- https://www.portlandsaturdaymarket.com/
- https://craftywonderland.com/
- https://www.portlandzinesymposium.org/
- https://www.outletpdx.com/events
- https://artdesignxchange.com/events
- https://pc-pdx.com/show-guide/?date=10%2F17%2F2026

## Not built yet

Live source ingestion, editorial review queue, approved publication workflow, recurring calendar subscriptions, event change/cancellation monitoring, advanced accessibility metadata, transit routing, cross-location mapping, venue pages, actual event series recurrence rules, or a production CMS.

**Do not enable GitHub Pages as a public launch without a deliberate publication decision and fresh source validation.** This prototype is a static UI with sample 2026 data and will age.

## Release / testing

Run `node --check app.js`, `node --check events.js`, and `node tests/validate.js` (Node 20+). The included GitHub Actions workflow runs these on pull requests.

Design premise: the calendar is the product. Let people easily see what's happening, decide whether to go, and bring what interests them into their own calendars.


## Data update workflow

This static snapshot does not currently scrape, sync, or refresh shows on its own. The canonical `events.js` must be updated and validated, reviewed through a SHOWS PR, then explicitly synced to the portfolio snapshot through a second PR. A later importer should collect venue and promoter source links into an editorial queue, normalize the timestamps, detect duplicates and changed events, and require review before publication. The presence of a source link is not proof of cancellation monitoring.
