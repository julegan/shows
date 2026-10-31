# SHOWS: automation security baseline

SHOWS is a separate canonical development/data repository. The public portfolio publishes a reviewed static snapshot. Changes to source discovery and its GitHub Actions should not bypass the two-step editorial review.

## Controls in this change

- GitHub Actions are pinned to verified full commit SHA references rather than moveable version tags.
- All workflows declare explicit token permissions: read-only for validation and source probes; `contents: write` and `pull-requests: write` remain only for the two jobs that propose review PRs.
- Weekly Dependabot updates for GitHub Actions, subject to normal human review.
- A dedicated security CI check (`node --test tests/security-baseline.test.mjs`) detects newly unpinned Actions and accidental write-permission escalation.

## Review and operations

- Never automatically merge discovery or artwork changes. Verify event sources and images before merging SHOWS changes; then review the portfolio's separate sync PR.
- GitHub account MFA/passkeys, permissions and branch protections are configured in GitHub settings, not in this repository.
- Verify repository branch protection or rulesets separately. The connector cannot read current branch protection.
- Keep source probes read-only; periodically remove unused workflows after confirming they are no longer needed.
- Dependency locks, external URL/image handling, the `events.js` executable data migration and publishing CSP are separate follow-ups requiring testing.

This PR does not change event records, artwork, front-end scripts, or the production site. After merging, confirm security, accessibility, and calendar-validation workflows have completed successfully.
