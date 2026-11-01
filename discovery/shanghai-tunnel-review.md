# Shanghai Tunnel Bar — November 1, 2026 primary-source review

## Priority gap

Shanghai Tunnel is an underground-music priority venue, but the current approved dataset contains no events under the Shanghai Tunnel venue name. Its [official gatherings page](https://www.shanghaitunnelbarpdx.com/gatherings) says to follow Instagram for current shows; the page's claim of no upcoming events is **not reliable evidence of an empty show calendar**. Its address is 211 SW Ankeny St, Portland, OR 97204.

An Eventbrite [organizer page under the venue name](https://www.eventbrite.com/o/shanghai-tunnel-underground-bar-venue-112736462551) lists original shows and ticket pages. The original organizer-listed [Tamarack! + Pauses + Burner Phone + Skrdycat show](https://www.eventbrite.com/e/tamarack-alaska-pauses-burner-phone-skrdycat-at-shanghai-tunnel-bar-tickets-2003553411187) was indexed during this review with Saturday **November 14, 2026**, **8:30 PM start**, **8:00 PM doors**, **21+**, Shanghai Tunnel Bar & Venue at 211 SW Ankeny St, and an Anchorage post-hardcore performer (Tamarack!). This supports a narrowly attributed live-music candidate, not complete venue coverage.

**Review caveat:** attempts to reopen Eventbrite original event pages in the browsing environment returned HTTP **429 Too Many Requests**. No browser-evasion, private API calls or authenticated endpoints were used. Before merging the proposed event, verify the original ticket page is still current and the organizer/time/venue have not changed. The Eventbrite listing is primary organizer-authored source evidence from indexed results, **not a successful live-source probe**.

## Proposed event

- `shanghai-tunnel-tamarack-2026-11-14` — Tamarack! (Alaska), Pauses, Burner Phone, Skrdycat; show 8:30 PM Pacific (`-08:00` after DST), doors 8 PM; age 21+; price, end time and accessibility unknown. No flyer is copied or invented.
- The record retains original organizer/ticket URL, source attribution, and review method. A broad `Hardcore` filter is supported by the original *post-hardcore* description, without extrapolating to the supporting performers.
- Reconciliation: the base dataset contained no Shanghai Tunnel records, so this is not a same-venue/date duplicate in the reviewed snapshot. Preserve event ID when approved.

## Reusable coverage next step

1. Check whether the venue-authorized Eventbrite organizer roster supports **repeatable** read-only event retrieval without defeating rate limits or access controls; treat the existing 429 as an access limitation, not an empty feed.
2. If provider access is unsuitable, request a machine-readable venue/organizer calendar, public ICS/RSS/JSON, or official static event listing. Do not assume the organizer's Eventbrite account covers every venue event.
3. Only activate an adapter after validating original ID, date/year, venue address, `doors` vs event start, `America/Los_Angeles` offset, pagination/coverage and changes; hold cancellations and reschedules for review.
4. Preserve original flyer URL, credit, source and usage review; do not download or hotlink any artwork without appropriate permission.
5. Feed new dated candidate events into the existing canonical discovery PR → human review → separate portfolio sync, not directly into public pages.

## Scope

This is a **single-source event proposal and documented future source lead**, not a new automated importer. Shanghai Tunnel remains `adapter-needed`. No other source was enabled, and all other approved calendar entries are preserved.
