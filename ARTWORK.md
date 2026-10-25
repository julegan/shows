# SHOWS original event artwork

SHOWS uses **event-specific flyers and artist photographs from original organizer and venue event pages** when available, without synthesizing images, mirroring files, or cropping the original proportions. Music bills take priority over recurring nonmusic entries.

- Importers read Event JSON-LD `image` and event-page `og:image` or `twitter:image` from supported official sources. Squarespace image fields can also provide event imagery.
- The event data retains `artwork.url`, `artwork.sourceUrl`, `artwork.origin`, and attribution. Source-specific images can be absent. They must not be fabricated.
- Generic venue logos, favicon files, and obvious placeholders are excluded. The browser falls back to the neutral “No flyer available” tile when a source URL is missing or broken.
- HTML image insertion is decorative because the event title is present in the card text. Detail views provide source attribution.
- Embedded external artwork may be governed by venue/artist usage terms; confirm permission and a stable source before redistributing, mirroring, or caching imagery locally. Do not strip credit, watermark, or artist branding.
- Newly discovered candidate records gain images during importer runs. Existing records without artwork do **not** magically acquire images: they need a deliberate backfill/reimport or source-linked update before a poster appears.
- Keep an opt-out mechanism for source owners or event organizers, and never treat an image URL as evidence of permission to mirror it.
- Maintain WCAG 2.1 AA testing for contrast, keyboard support, and readable event information independent of imagery.

## Backfilling existing shows

The review-only GitHub Action **Propose existing event flyers** checks 35 eligible public, event-specific URLs per batch. Batch numbers are **zero-based**, and scheduled runs rotate. It prioritizes live music and the key underground venues rather than total event volume. Supported detail-page sources include Twilight, Star Theater, Dante's, Hawthorne Theatre/Lounge, Wonder Ballroom, Crystal Ballroom, Coffin Club, and selected other official providers. A venue homepage alone is deliberately not enough to select a poster.

The action tries event JSON-LD/social images, plus images whose alt text matches the event title and the official Dante's TicketWeb event photo. It preserves provenance and requires pull-request approval. The workflow's **Summary** shows attempted pages, proposals, and unresolved gaps. A downloadable **artwork-review** artifact contains the full source report even when the run finds zero images; zero proposals means no PR, not a broken run. Use a different `batch` input to review other eligible pages. If a review PR is already open, the action intentionally skips until it is resolved.

Some music listings currently link only to a venue-wide calendar (not an event page), or to hosts that reject automated access. No automated image can safely be attached from those generic links. Prioritize adding verified, event-specific source pages and media before attempting repeated backfills; do not guess or bypass blocked hosts. After merging artwork in the canonical SHOWS repository, merge the corresponding portfolio review/sync PR before expecting images to appear at the public URL.
