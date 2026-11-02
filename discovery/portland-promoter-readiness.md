# 777 Booking and Third Eye Booking — source readiness

Reviewed November 2, 2026. Both were specifically requested for SHOWS coverage and are independent **promoters**, not venues. No source in this file is approved for blind event ingestion. See `discovery/promoter-backlog.json` and [tracking issue #95](https://github.com/julegan/shows/issues/95).

## 777 Booking — independently identified; one original co-promotion verified

- [Willamette Week, July 22, 2025](https://www.wweek.com/culture/2025/07/22/high-limit-room-is-portlands-newest-home-for-all-ages-hardcore/) identifies 777 Booking as a Portland-based hardcore promotion agency closely linked to opening the all-ages High Limit Room, **720 SE Hawthorne Blvd**. This does not mean every High Limit event is 777-promoted.
- [SOS Booking & Production's original event-specific page](https://www.sosbookingandproduction.com/booking/2026/10/28/spy-february) explicitly states **"PRESENTED BY SOS X 777 BOOKING"** for **SPY / FEBRUARY**, **October 28, 2026**, at **High Limit Room**, and includes the original [Afton event ticket link](https://aftontickets.com/spy). It says **5 PM DOORS**; do not report this as verified music start. This event is **past** and is **never** a new candidate for the November 2 discovery window.
- [High Limit Room's official venue information](https://highlimitroompdx.com/info/) says Afton is its ticket supplier and explicitly warns that announced shows may not yet have a complete ticket link. The public venue `/shows/` page has no verified accessible machine-readable dated feed. The venue is an independent operator, not an authorized 777 RSS/JSON source.
- The existing `@777booking` community-associated Instagram source remains **unconfirmed as an accessible, permissioned dated feed**; no social-site scraping, copied flyers, private endpoint calls, or inferred recurrence.

**Next integration step:** Get original published future-event URLs from 777 itself and/or ask High Limit Room/Afton for a supported read-only feed as [issue #75](https://github.com/julegan/shows/issues/75). Cross-check venue, full date, local time kind, cancellation and original ticket URL against existing SHOWS entries. Keep original 777 and venue records distinct while deduplicating shared bills.

## Third Eye Booking — Portland organizer corroborated; official feed still unverified

- [Northwest Hardcore interview with Dry Socket](https://www.northwesthardcore.net/dani-dry-socket) independently mentions Third Eye Booking approaching the band about a Portland benefit-show performance.
- [No Echo's Sacrament band interview](https://www.noecho.net/band-spotlights/sacrament-metalcore-band-interview) thanks Third Eye Booking in the context of Portland's DIY scene.
- [PDX After Dark's Sherane performance history](https://www.pdxafterdark.com/bands/sherane) lists a **past** Mission Theater bill named **"Pleasure Tapes and Third Eye Booking Present Sherane"**. It does **not** establish an official Third Eye original publishing domain or current events.
- Search results for **Third Eye Shut Booking** in Los Angeles or **Third Eye Booking Company** in Mississippi are **unrelated** to the named Portland promoter. Do not attach their data.

**Next integration step:** Verify the organizer's own event-posting channel, then locate a future original dated ticket or venue event page and corroborate the lineup/year, promoter and venue. No active importer or invented official URL is warranted.

## Review acceptance for both

1. Confirm an organizer-controlled public source or explicitly permissioned read-only API/ICS/RSS; respect access restrictions.
2. Confirm event-specific primary ticket/venue links and published **future** dates in Portland (or approved metro scope), and identify whether times are **doors**, **show** or unknown.
3. Hold postponed, canceled, ambiguous, out-of-region and duplicate listings; do not infer a cancelation from feed omission.
4. Preserve original art attribution and review usage rights separately.
5. Add bounded fixtures, live GitHub Actions validation, source-health reporting and a **review-only** candidate PR. A separate approved Portfolio sync is still required.

**Status:** Both promoters remain `research-backlog`. This evidence update does **not** add events to the deployed calendar.
