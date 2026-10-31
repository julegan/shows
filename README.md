# SHOWS — Portland music and independent culture

**Canonical source repository** for [SHOWS on julieowens.me](https://julieowens.me/projects/shows/). SHOWS is a working, static, music-first calendar with automated discovery and **human-reviewed publication**, not a live, unmoderated event feed. Its name and design can evolve.

The default experience is a chronological list starting on the current Portland date. Browse **By date**, **Places**, or **Month**; search events and venues; filter by neighborhood, music style, free admission or saved events; and open the original organizer listing. Individual and visible events can be added/exported to Google Calendar, Apple Calendar and other calendar applications. Saved events stay in the visitor's browser; there are no user accounts.

The editorial focus is Portland-area punk, metal, hardcore, goth, darkwave and adjacent independent music, with a selective layer of art, DIY, zines and unusual markets. Generic city listings and routine farmers markets are not the priority. A source-listed event is not an endorsement; organizers' dates, times, access policies and prices can change.

## Where things live

- **This repository (`julegan/shows`)** is the canonical source for app code, approved event data, venue adapters, editorial rules and source research.
- **[`julegan/portfolio`](https://github.com/julegan/portfolio)** deploys a reviewed copy at `dist/projects/shows/`, served at [julieowens.me/projects/shows](https://julieowens.me/projects/shows/). Do not create an independent SHOWS public deployment without a decision to do so.
- `app.js`, `index.html`, `styles.css`, `preview.css`, and `theme.css` make up the current browser experience. **`preview.css` is still production CSS**, despite its historical filename; do not delete it as an old preview artifact.
- `events.js` is the approved static event dataset. Do not assume a fixed count or an October–December-only horizon.
- `discovery/venues.json`, `discovery/sources.json`, and `scripts/` describe and implement original source connections and importers.
- `EDITORIAL.md`, `ARTWORK.md`, `discovery/README.md`, and the other source/review documents provide editorial standards, source evidence, holds and historical investigation records.

## How updates reach the site

1. The [daily discovery workflow](.github/workflows/discover.yml) checks supported venue, artist and promoter sources, collects source-specific artwork where possible, and records validation, source health and review outcomes.
2. When accepted source changes exist, the workflow proposes a **SHOWS pull request**. Nothing is published automatically. Julie reviews and merges approved additions on `main`.
3. The [portfolio's reviewed sync workflow](https://github.com/julegan/portfolio/blob/main/.github/workflows/sync-shows.yml) detects the approved dataset and proposes a **separate portfolio PR**. The portfolio changes only after that PR is reviewed and merged.
4. Application code and CSS changes require coordinated review in both repositories; the automated sync does not transfer UI changes.

Source access can fail, and not every venue is covered. A missing listing is not proof of cancellation or that no event exists. Hold uncertain dates, conflicting details, ambiguous genres, inaccessible sources and unverified end times for review instead of inventing data. See [EDITORIAL.md](EDITORIAL.md), [AGENTS.md](AGENTS.md), and [discovery/README.md](discovery/README.md).

Artwork references come from original event or venue sources when available and carry provenance. A source image URL or attribution does **not** establish broad reuse rights; continue reviewing permissions and retain neutral treatments when suitable art is unavailable.

## Running and testing

SHOWS is static HTML, CSS and browser JavaScript; it has no production backend, mandatory account, or bundler. For a local preview:

```sh
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). A local HTTP server mirrors how the snapshot is served.

Run focused checks before PRs:

```sh
node --check app.js
node --check events.js
node tests/validate.js
node tests/music-filters.js
node tests/discovery.js
```

[CI workflows](.github/workflows/check.yml) run more extensive source, event, browser and accessibility tests. Automated WCAG checks are not a substitute for keyboard, screen-reader and real-device QA.

## Research, diagnostics and maintenance

The source/review Markdown documents preserve historical findings; they are **not** all current coverage reports. Read current data and the latest approved run before quoting counts or source health. The many manually dispatched `probe-*.yml` workflows and `scripts/probe-*.js` files are read-only **source diagnostics**, not alternate public pages or event import pipelines. Keep them while they are needed for blocked providers or regression investigations, and remove them only after checking active importer dependencies.

The previous SHOWS A/B UI comparison has been settled in favor of the mixed, date-first production calendar. Its `preview-a/` and `preview-b/` routes and legacy preview renderer were removed from the portfolio; do not republish them. Retain meaningful importer tests and the currently used `preview.css` stylesheet.

For implementation constraints and approval rules, start with [AGENTS.md](AGENTS.md).