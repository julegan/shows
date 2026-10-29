# The Off Beat — ongoing source connection, October 29, 2026

Friends of Noise's [official event calendar](https://friendsofnoise.org/event-calendar/) embeds `https://calendar.friendsofnoise.org/embed.js`. The [venue-owned calendar](https://calendar.friendsofnoise.org/) publishes readable dated event cards and individual `/shows/` detail pages. OpenDate supplies its original ticket links and source images. No private API, application credential, login or access-control bypass is used.

[Live read-only probe 40973251804](https://github.com/julegan/shows/actions/runs/40973251804) inspected ten roster entries and verified nine detailed event records with original images. One conflicting or missing performance clock is held. Tests separately cover wrong room/address, inconsistent schema time and title, cancellation/postponement, incorrect DST, original-image event identity, duplicate URLs, and redirects outside the same first-party event path.

## Proposed music candidates

| Date | Listing | Pacific performance time |
| --- | --- | --- |
| October 29 | OsoSuckaK, TzoTopStar, Lul Dada, BagBoyMoe, AZ Gutter | 7:30 PM |
| October 30 | Kill Michael, Beautiful Freaks, Starly Kind, Hound | 7 PM |
| October 31 | Masquerade of Madness — cover show | 7 PM |
| November 5 | Phalseprofit, Refugio, Zephyr, Zae Shiki | 7 PM |
| November 6 | Doombia album release | 7:30 PM |
| November 13 | High Glow, Die Right, Midnight Morning, Sertraline | 7 PM |
| November 20 | Heaven Skate, Rheumatoid Trapezoid, Steevee Von Schneedle, Dopamean | 7 PM |
| December 3 | Mel Bryant & the Mercy Makers, Everybody's Worried About Owen, Trans Panic | 7:30 PM |
| December 21 | Rotting Carcass, Miss March, Crazy Ben | 7 PM |

Nine MusicEvent candidates; no inferred genre labels and no recurring-market dates. Every event retains the exact first-party detail URL and review status. These are comprehensive source intake candidates from the new core venue; not every bill has been established as underground punk, metal or goth. The Masquerade description explicitly identifies tribute/cover performances; do not present it as appearances by the original artists.

## Held

**March 26, 2027 — Larry and His Flask / 1876:** calendar card and detail performance clock could not be reconciled under the strict parser. Preserve the hold and inspect the organizer's detail page before relaxing any validation; no candidate is published for this bill.

## Ongoing behavior

- Add `the-off-beat` to the existing daily review-only source loop; preserve the owner's core twelve priority order and No Fun's paused status.
- Validate every card and original detail, matching title, Pacific timestamp, The Off Beat location/address, scheduled status, and organizer-linked ticket identity. Safe same-path trailing-slash redirects only.
- Collect all dated venue events, then classify using source-specific evidence. A MusicEvent assertion establishes music; it does not establish a style.
- Retain source-provided event image URLs and credit. `usageApproved` remains unknown; no artwork ownership/replication permission is asserted. Admission, age and end-time fields remain unknown in structured intake rather than being inferred from general venue policy.
- Feed failures and contradictory details are visible in existing source-health and held-record reports. Never infer cancellation from a missing card.
- New discoveries propose review PRs; Julie approves before main and portfolio publication. This connection does not cancel either scheduled outlook or weekend digest.

The portfolio release adds these same nine candidates to its existing snapshot and updates the events.js content hash in index.html so browsers fetch the new data. No UI layout changes.
