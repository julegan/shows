# Lola's Room — source integration, November 1, 2026

## Decision

**Enable first-party Lola's Room original venue roster for human-reviewed candidate PRs.** The owner has designated all 38 active SHOWS venues as equally relevant; Lola is a first-class room, *not* another label for Crystal Ballroom.

## Verified original source

- [Official Lola's Room calendar](https://www.mcmenamins.com/crystal-ballroom/lolas-room/music-events/) at **1332 W Burnside, Portland, OR 97209** independently publishes labelled **Lola's Room** event cards (title, weekday/month/day, original McMenamins event URLs and hours) and a structured **year-bearing autocomplete search index** linking those same original identities.
- Live [read-only runner #41369494786](https://github.com/julegan/shows/actions/runs/41369494786) found **26 desktop/mobile cards collapsing to 13 distinct original URLs**, **10 dated/timed Lola candidates**, and **3 explicit holds**.
- Holds: Nov 21, 2026 **2010s Dance Flashback** and Dec 31, 2026 **Y2K Ball** are shared Crystal-complex admissions; Nov 28 **Holiday Bazaar Brewfest** advertises a time range but no unambiguous start. They are NOT emitted as Lola-only candidates.
- The first attempt to inspect all 13 event detail pages in parallel yielded only 3 confirmed details plus HTTP **429** and timeouts. We removed routine fan-out, not provider restrictions. One bounded HTML request to the venue-owned calendar suffices for its original event cards and independent year-bearing date index. **No third-party ticket/widget/API requests** occur.

## Source implementation

- **`scripts/lolas-importer.js`** parses original cards and year-bearing indexed records, compares original event URLs, full date and weekday, title, explicit room, labelled hours, 2026/2027 Pacific time and doors-order where available; any source mismatches, cancellations or conflicting duplicate cards become holds.
- Adapter `lolas-mcmenamins-html` uses the existing canonical *review-only* discovery pipeline and original McMenamins event permalinks. Any future editing, publication, removal or source change requires review; the importer must not silently delete missing events.
- The 3 held records have specific source evidence from verified original detail pages or ambiguity in the venue-owned roster. A future revised event-detail process should only be considered if a provider-supported feed or rate-limited individual manual workflow is approved; no evasion.
- Source-card image URLs are retained with original source attribution and `usageApproved:null`. No permission to mirror images is assumed.
- The original Crystal Ballroom (`crystal-official-html`) and Mission Theater (`mission-official-html`) adapters remain unchanged, and room distinctions must continue to be checked against source evidence.

## Review and reporting

Only approved SHOWS event PRs enter canonical `events.js`; the Portfolio snapshot uses a separate review PR. New Lola listings remain unclassified until original format and relevance are reviewed. A blocked or empty page is *source availability*, not proof of no upcoming shows.
