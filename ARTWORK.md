# SHOWS event thumbnails: editorial and accessibility policy

The app shows **designed editorial thumbnails** in agenda/list event cards and individual event detail dialogs. They are abstract geometric visual signifiers, **not** photographs of performers and **not** simulated show posters. The month grid stays compact and usable on mobile.

## Official flyer support

Each event may eventually supply `artwork: { url: "https://…", credit: "Artist or venue name, source URL", usageApproved: true }`. The app displays this only when all three are present; absent fields always fall back to the designed thumbnail. The event detail shows the credit near the image. Card artwork is decorative, so its HTML image has an empty alt attribute; the full event title and venue remain readable independent of the image.

Do not auto-hotlink photographs or flyers just because they are publicly visible. For actual posters use an approved venue/promoter/artist flyer, confirm embedding or reproduction rights and a stable asset URL, retain provenance, avoid impermissible cropping, and add the appropriate attribution. Prefer storing appropriately licensed images as local optimized WebP/AVIF under a purpose-built directory rather than relying on ephemeral third-party URLs. Preserve artist branding faithfully and do not use an invented visual as if it were an official concert poster.

## Further accessibility/operational QA

- Test mobile and desktop agenda cards, modal image loading/fallback, screen-reader reading order, keyboard dialog operation, touch target sizing, 200% zoom, high contrast and reduced motion.
- Check credit visibility and image rights before reviewing any addition with `usageApproved:true`.
- Do not put full image thumbnails inside the month grid, where they would reduce calendar usability; consider optional poster tiles in the places view later.
- The currently reviewed events intentionally contain **no externally sourced poster images**.
