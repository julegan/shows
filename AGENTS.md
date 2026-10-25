# Working on SHOWS

Julie Owens directs and approves this project. Submit changes through pull requests; do not commit to main or merge a PR on her behalf. New event additions require her review before publication.

## Preserve the editorial priority

Read [EDITORIAL.md](EDITORIAL.md) before researching or changing event coverage. Underground metal, punk, goth, rock, hardcore, and adjacent DIY scenes are the core. The approved default mixed feed contains music plus a selective layer of independent art, DIY, zines and unusual markets; routine farmers markets and generic city/community events no longer belong in default discovery. Do not prioritize importing unrelated recurring events to inflate event counts.

Begin an expansion with the core venues and independent promoters. Record gaps when a source is inaccessible or ambiguous, and continue looking for primary ticket, artist, label, or promoter evidence. Do not fill a music coverage gap with unrelated events just to increase the event count. Report unique music bills separately from recurring market occurrences.

Use verified public listings in Portland city limits. Preserve stable event IDs, original source categories, source URLs, check dates, and the distinction between source statements and SHOWS classifications. Do not invent dates, genre labels, costs, age restrictions, accessibility features, or end times. Label DJ nights and tribute bills accurately. Hold conflicting dates or start times for review.

## Source and deployment

This repository is the canonical SHOWS source. `julegan/portfolio` contains the deployed snapshot at `dist/projects/shows/`; prepare the corresponding portfolio PR for a release, preserving its return link to `/projects/`. Do not create a separate public deployment unless Julie requests one.

The homepage is date-first from Portland's current day; Month and Places are secondary views. Keep search, music-style filters, free/saved, individual/series exports, and Google/Apple Calendar useful. Maintain accessible controls, explicit Pacific offsets, and the disclosed editable export placeholder for unknown end times. Run the repository's existing checks after changes.

## Venue-first discovery and original flyers

The canonical source list is `discovery/venues.json`; source adapters live in `discovery/sources.json` and `scripts/`. Intake every upcoming dated event from each supported venue, then classify; do not drop bills because genre detection is uncertain. Prioritize closing missing-data gaps for core underground venues and report counts by venue, not just event totals. Use `node scripts/audit-venue-coverage.js` to inspect gaps. Save original event poster URLs only with linked evidence, creator/source attribution and rights review; use no invented graphic placeholders. Automated importers should open PRs, not publish.
