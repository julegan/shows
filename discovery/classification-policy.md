# Evidence-backed SHOWS event classification

Reviewed October 22, 2026. SHOWS prioritizes accurate music discovery, not maximizing guessed genres.

## Rules

- **Music format** is a fact separate from **music style**. A show can be recognized as `Music` while leaving `musicStyles: []`.
- **Verified format evidence:** original event-specific organizer or venue category (`Music`), schema.org `MusicEvent`, explicit genre / DJ / live performance wording on the actual event title, or exact independently verified artist/ticketing evidence with the *original event URL, title, venue and date* pinned in `reviewed-classifications.json`.
- **Style labels** use the shared complete site vocabulary from `scripts/event-classification.js`: punk, hardcore, metal, rock, goth, experimental, **hip-hop & rap, R&B & soul, funk & disco, jazz, blues**, electronic/dance, folk, global and other supported groups. Style terms must appear **in the original event-specific title or source-authored categories**, or be documented by exact-event independently reviewed evidence. An artist's name or a venue's usual programming alone is not proof of a style.
- **Non-music overrides:** Comedy, workshops, markets, trivia, karaoke, cinema, and other specifically labelled non-music events cannot become music just because their title includes punk or a venue presents mostly concerts.
- The classifier never infers a date, time, headliner, price, image license or show type from venue reputation.
- **Original dataset is source of truth.** Events already reviewed and edited manually must retain their existing categories and styles; the backfill only upgrades under-classified importer records with specific evidence.
- All classification changes require an approved GitHub PR and a separate, owner-reviewed portfolio data sync before publishing.

## What changed in this review

Of **470 original event records**, **nine** had source-supported format or style corrections. Music increased **197 → 204** and Unclassified decreased **188 → 181**. Two existing Music listings gained source-title genres; five specific concert formats were cross-checked against official artist or original event-ticket sources, with provenance pinned to source URLs. The other two were promoted based on unambiguous original event wording such as `Album Release` or `Rave`.

No event records were added/removed. IDs, original source/ticket URLs, dates and times, venue assignments, and photo rights remained untouched.

## Future workflow

- `scripts/event-classification.js` applies cautious source-specific rules during daily discovery; unrelated venue headers and generic site keywords are ignored.
- `scripts/reviewed-classifications.js` applies exact event-source evidence where editorially recorded.
- `scripts/backfill-event-classifications.js` performs a dry run by default and is idempotent after applied. `--write` only for explicit PR-based review.
- Test failures should be repaired rather than removing negative guardrails (Kyle Kinane comedy at Mississippi Studios, School of Rock brand names, markets and workshops with punk in the title).
- Remaining **181 Unclassified** events and untagged music events need targeted event-specific evidence. Do not fill them with guesses for a cosmetic improvement to totals.

Source-reviewed examples: [Lime Garden official shows](https://limegarden.bandcamp.com/), [Mdou Moctar tour](https://www.mdoumoctar.com/tour), [Slow Pulp tour](https://www.slowpulp.com/), [Demon Hunter official band biography](https://www.demonhunter.net/), and [HAVOK original TicketWeb bill](https://www.ticketweb.com/event/havok-with-slackjaw-xoth-dantes-tickets/15036603?pl=dante).

## November 8, 2026 — support evidence-backed classifications across all music scenes

The earlier `reviewed-classifications.js` allowlist inadvertently permitted only the initial punk/metal/goth genres even after SHOWS expanded the public music taxonomy. This prevented exact-event reviewed entries for independent hip-hop, rap, R&B, soul, funk, jazz and other covered styles. The reviewed workflow now uses the same canonical style labels as the discovery classifier, with explicit HTTPS evidence and duplicate/unknown genre rejection.

Follow-up editorial passes should prioritize **already listed but unclassified** future music events and missing music styles within priority venue sources. For example, Mississippi Studios has a source-confirmed November 10 Armand Hammer bill, and the artist's [official label biography](https://fatpossum.com/collections/armand-hammer) identifies the duo as hip-hop. These two sources are useful to verify a specific event and music style; an entry must match the **exact published SHOWS ticket URL, title, venue, and date** before proposing a reviewed classification. Source evidence is not permission to guess every other artist's genre, change old events silently, or reclassify a whole venue.

Counts of unknown formats/styles are a diagnostic, **not** a genre quota or incentive to add speculative tags. Prioritize review of events coming up soon because those records are more useful when accurate before the show date. This policy change alone **does not alter any published event records**; it makes future reviewed classifications from all genres permissible.

## November 8, 2026 — original organizer verifies a precisely scoped series

**The Thesis** is described by its first-party organizer as a Portland independent hip-hop showcase and is hosted at Alberta Street Pub: https://thethesispdx.com/about/ . The existing Alberta Street Pub importer already verifies each actual dated occurrence from its own first-party venue feed.

The source-aware classifier may now label an individual **The Thesis** occurrence `Hip-hop & rap` only if the listing has an original Alberta Street Pub event permalink, the matching venue identity, the enabled Alberta source identifier, and an unambiguous Thesis program title. It retains the organizer's evidence URL in `classificationSourceUrl`. This is not a monthly recurrence generator, an artist-name rule, or permission to label unrelated Alberta concerts hip-hop.

The Thesis also promotes R&B/soul artists, but **do not label every single Thesis bill R&B/soul** without event-specific information. If the actual source event uses those descriptors, a second style may be included. Nonmusic events retain their nonmusic classification.

Source-specific verified-series rules are intentionally narrow. Do not build an ever-growing opaque list of guessed artist or genre mappings. Expand to another program only with the original promoter's clear identity, a source-backed stable event permalink and regression tests against false positives. This change does **not** edit existing SHOWS event snapshots; separately reviewed publication is still required for existing listings.
