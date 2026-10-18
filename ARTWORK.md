# SHOWS original event artwork

SHOWS uses **event-specific images from original organizer and venue listings** when available, without synthesizing flyers or cropping their original proportions.

- Importers read Event JSON-LD `image` and event-page `og:image` or `twitter:image` from supported official sources. Squarespace image fields can also provide event imagery.
- The event data retains `artwork.url`, `artwork.sourceUrl`, `artwork.origin`, and attribution. Source-specific images can be absent. They must not be fabricated.
- Generic venue logos, favicon files, and obvious placeholders are excluded. The browser falls back to the neutral “No flyer available” tile when a source URL is missing or broken.
- HTML image insertion is decorative because the event title is present in the card text. Detail views provide source attribution.
- Embedded external artwork may be governed by venue/artist usage terms; confirm permission and a stable source before redistributing, mirroring, or caching imagery locally. Do not strip credit, watermark, or artist branding.
- Newly discovered candidate records gain images during importer runs. Existing records without artwork do **not** magically acquire images: they need a deliberate backfill/reimport or source-linked update before a poster appears.
- Keep an opt-out mechanism for source owners or event organizers, and never treat an image URL as evidence of permission to mirror it.
- Maintain WCAG 2.1 AA testing for contrast, keyboard support, and readable event information independent of imagery.
