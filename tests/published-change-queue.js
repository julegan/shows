"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const workflow=fs.readFileSync(path.join(__dirname,"../.github/workflows/discover.yml"),"utf8");
const importer=fs.readFileSync(path.join(__dirname,"../scripts/discover-events.js"),"utf8");
const reviewer=fs.readFileSync(path.join(__dirname,"../scripts/source-change-review.js"),"utf8");
const proposedFile="discovery/published-change-review.md";
assert(importer.includes('fs.writeFileSync(path.join(root,"'+proposedFile+'"),renderChangeReview(changes))'),
  "Every successful source scan must produce a focused published-change review report");
assert(workflow.includes(proposedFile),"Action must retain source-change evidence");
assert(workflow.includes('if git diff --quiet -- events.js; then'),"No review PR is opened for report-only source drift");
assert(workflow.includes('discovery/verified-corrections-review.md'),"Verified source correction report is retained with original evidence");
assert(workflow.includes('git show "$old_sha:'+proposedFile+'"'),
  "An open rolling PR must compare official-change evidence separately from events.js");
assert(workflow.includes('cmp -s /tmp/shows-pending-changes.md '+proposedFile),
  "An existing event-data snapshot is not sufficient to suppress a changed-status alert");
assert(workflow.includes('git add -- events.js '+proposedFile),
  "Review PR stages source-confirmed event edits only for owner approval");
assert(workflow.includes('No published events are automatically modified or removed.'),
  "PR summary must state the no-automatic-change constraint");
assert(!reviewer.includes("fs.writeFileSync"),"Schedule-change detection is pure advisory logic");
assert(reviewer.includes("Missing from a feed is NOT an event cancellation"),
  "Absent feed entries must never automatically be labeled canceled");
console.log("PASS — source drift is retained in artifacts while review PRs require actual verifiable event edits");
