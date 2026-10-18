# Independent venue connections — October 18, 2026

These are researched sources and review-only proposals, not proof of complete venue calendars.

## Black Water: working official venue calendar

- Official venue page: https://bar.blackwaterpdx.com/
- Public Google iCalendar: https://calendar.google.com/calendar/ical/blackwater.venue.calendar%40gmail.com/public/basic.ics
- The source has 11 future dated entries as of October 18, including Iron Lung, Habak, multiple DJ/cover listings and other venue activity.
- All 11 entries are all-day entries without verified performance times. SHOWS displays **Time TBA** and exports all-day placeholders without claiming an actual midnight performance.
- Event-specific flyers aren't published in the iCalendar data; the 11 records intentionally have no artwork links.
- **Conflict:** Iron Lung / Solitary Ruin / Defiant Body is on the venue calendar October 22; Doomtown describes 'Thursday Oct 26', an inconsistent weekday/date. Confirm with organizer before depending on the date.

## High Water Mark: primary promoter fallback, incomplete calendar

- Venue homepage returned HTTP 403 to our public GitHub Actions runner; no bypass.
- Soundcontrol PDX provides officially promoted cross-venue tickets and links to TreeTix pages. This connector is already enabled but doesn't guarantee full venue inventory.
- Artwork review backfill is now whitelisted for known primary High Water Mark TreeTix ticket URLs.

## High Limit Room: embedded Afton Tickets

- Official https://highlimitroompdx.com/shows/ contains a public Afton Tickets embedded widget, but the server-side HTML does not list dated show entries.
- Existing confirmed ticket pages hosted on https://aftontickets.com/ may now supply original event artwork through review-only backfill.
- **Full calendar event feed still needs an authorized/public collection endpoint**. Do not copy merchant configuration keys into the repo or probe private commerce APIs.

## The Coffin Club: VenuePilot

- https://thecoffinclubpdx.com/ embeds a VenuePilot calendar widget but currently reports no published events.
- Original event ticket pages at https://tickets.venuepilot.com/e/ clearly show Coffin Club events, including existing SHOWS records for Antioch Arrow, Zanias, Ritual Howls, Soft Vein and Mobiius.
- Review-only artwork backfill now visits original source ticket pages for existing Coffin Club events.
- A stable public or venue-authorized VenuePilot event index is **not yet connected**. Do not infer the venue has no future events merely because its visible widget is empty.

## Next connector priorities

1. Confirm the Iron Lung date conflict; verify Black Water showtimes and original flyer rights via venue/promoter sources.
2. Establish a supported public read-only Afton event feed for High Limit Room.
3. Establish a supported public VenuePilot event list for The Coffin Club, or agree on alternate primary public sources.
4. Improve High Water Mark completeness through public Soundcontrol/TreeTix ticket feeds.
5. Keep venue-based completeness and image coverage separate from aggregate record totals.
