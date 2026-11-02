# 45 East — original Red Cube Presents source validation

Reviewed 2026-11-01 for the canonical user-preferred 45 East venue, 315 SE 3rd Avenue, Portland OR.

## First-party evidence

- Promoter [Red Cube Presents events](https://www.redcubepresents.com/events/) publishes mixed-venue event cards, including 45 East and Q Nightclub (Seattle).
- GitHub [live read-only venue source probe](https://github.com/julegan/shows/actions/runs/41372757913) confirmed 19 explicit `45 EAST - PORTLAND` cards with full year-bearing weekday/date and original Tixr ticket links.
- **17 valid original dated 45 East candidates** and **2 held** for missing/nonmatching original Tixr group-specific links: **ANAMĒ** and **CASPA + THE WIDDLER**. These are not automatically published. The count is a subset of Red Cube promoted events, not an assertion of all 45 East bookings.
- The promoter cards publish a full date but do **not** verify doors/show clock. The importer uses a date-only sorting anchor; UI must clearly present **time not published** rather than midnight. No default club-opening time is invented.
- Tixr source links are constrained to `tixr.com/groups/45east/` and organizer art to original `redcubepresents.com/wp-content/uploads` URLs. Artwork permissions are unknown (`usageApproved:null`), no photos are downloaded or mirrored. Other promoters at 45 East require separate, verified feeds.

## Safeguards

- Source ID `45-east` uses adapter `45east-redcube-original` in the existing canonical **review-only** discovery flow, with 45 East's own venue identity and address, not generic `promoter` dispatch.
- Read only a bounded official Red Cube HTML page; never fetch TicketWeb/Tixr checkout data or circumvent platform access controls.
- Filtering explicitly requires the *literal venue string* `45 EAST - PORTLAND`; no Seattle Q Nightclub or other Red Cube bookings are imported as 45 East.
- Unrecognized or conflicting card fields are review holds or source errors; source failures do not imply zero upcoming shows.

## Future promoter leads

- [777 Booking](promoter-backlog.json) and **Third Eye Booking** are a separate, owner-requested **future research backlog**. Both are relevant to Portland's punk/hardcore scene, especially where direct venue calendars are difficult to access.
- They are **promoters, not venues**. Their source accounts and dated original listings are not yet validated or activated. Verify actual host venue, source, age/access labels, year and showtime per bill; never assume all High Limit shows are produced by 777.
- Keep Third Eye Booking (Portland) distinct from unrelated Third Eye Shut Booking in Los Angeles, Mississippi's 3rd Eye Booking Company and other similarly named services.

## Workflow

An editor still reviews every SHOWS event proposal and merges it before any Portfolio sync PR. This source-connection PR does not publish events by itself.
