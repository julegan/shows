# SHOWS — calendar-first prototype

A small, browser-based working calendar for Portland, Oregon. **SHOWS is a provisional working name, not an adopted brand.**

This is a manually maintained interaction prototype, not a live event aggregation service. The calendar contains 80 dated occurrences for October–December 2026 across 16 places. Event additions are reviewed through pull requests before publication. Event times and availability can change; the organizer remains the source of truth.

## Try it locally

Download/clone this branch and open \`index.html\` in a modern browser. No dependencies, package manager, build, account or backend needed.

## Included

- Responsive month-grid, agenda/list and venue/place views, including a useful compact mobile calendar
- Previous/next month navigation, today's date, and drilldown on any calendar day
- Search across title, location, organizer context, description and tags
- Interest, neighborhood, free, today, weekend, next-seven-days and saved filters
- Event detail dialog, original organizer link and maps/directions when an address is verified
- Add individual events to Google Calendar using its native event template
- Download an individual event or a multi-event series as an RFC 5545-compatible \`.ics\` file for Apple Calendar, Outlook or Google Calendar import
- Export events in the current filtered view to \`.ics\`
- Save events in this browser using localStorage; share stable event URLs with hash deep links
- No ads, analytics, profiles, account creation or behavioral tracking

**Unknown end times:** A one-hour editable placeholder is required by the calendar export interfaces and is clearly disclosed. It does not represent a verified end time.

**Series:** Series exports currently produce one \`VEVENT\` per date; this is correct for nonuniform multi-day events. True recurrence rules (\`RRULE\`) are a later enhancement once a recurring source data model exists.

## Accessibility and browser behavior

Semantic headings and controls, explicit labels, keyboard-operated dialog, focus-visible styling, screen-reader status, a skip link and reduced-motion preference are included. Formal WCAG 2.2 AA auditing and real device testing remain to be done.

The event sample is separate in \`events.js\`; UI and calendar-export logic live in \`app.js\`. Dates are stored with explicit Pacific offsets so UTC calendar exports retain the right absolute time across daylight saving changes.

Apple Calendar: tap/download the \`.ics\` file and open/import it into your preferred calendar. Behavior differs by device and browser. Google Calendar single-event links open the Google Calendar event editor. For series/multiple events, import the downloaded \`.ics\` file through Google Calendar settings or another calendar application.

## Editorial/source model

This pilot is **not** a scraper or a recommendation algorithm. The original 11-event sample was checked against publicly available organizer and community calendar pages on October 17, 2026. The 69 additions use venue or organizer pages checked on that date; the pull request is the human editorial approval step. Source URLs are preserved on each event. We start with activities taking place in Portland city limits; any street address that cannot be verified is visibly labeled as unknown and directions are not offered.

[EVENT-SOURCES.md](EVENT-SOURCES.md) contains the proposed occurrences, recurrence boundaries, source conflicts, and review status. Each record preserves source references, check date, verification method, and source categories separately from SHOWS classifications. Unknown admission uses `free: null`, so it is excluded from the confirmed-free filter.

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

Run \`node --check app.js\`, \`node --check events.js\`, and \`node tests/validate.js\` (Node 20+). The included GitHub Actions workflow runs these on pull requests.

Design premise: the calendar is the product. Let people easily see what's happening, decide whether to go, and bring what interests them into their own calendars.
