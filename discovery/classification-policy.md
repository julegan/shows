# Evidence-backed SHOWS event classification

Reviewed October 22, 2026. SHOWS prioritizes accurate music discovery, not maximizing guessed genres.

## Rules

- **Music format** is a fact separate from **music style**. A show can be recognized as `Music` while leaving `musicStyles: []`.
- **Verified format evidence:** original event-specific organizer or venue category (`Music`), schema.org `MusicEvent`, explicit genre / DJ / live performance wording on the actual event title, or exact independently verified artist/ticketing evidence with the *original event URL, title, venue and date* pinned in `reviewed-classifications.json`.
- **Style labels** use the site's existing vocabulary: Punk, Hardcore, Metal, Rock, Post-punk, Noise & experimental, Goth & darkwave, Industrial & EBM. Style terms must appear **in the original event-specific title or source-authored categories**, or be documented by the reviewed exact event evidence. A venue known for metal does not mean every act there is metal; an artist's name alone is not proof of any style.
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
