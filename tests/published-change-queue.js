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
assert(workflow.includes('grep -Eq '),"Published changes must open a review PR without a new-event dataset diff");
assert(workflow.includes('Potential changes: [1-9][0-9]*'),"Do not open status-change PR for zero actionable findings");
assert(workflow.includes('git show "$old_sha:'+proposedFile+'"'),
  "An open rolling PR must compare official-change evidence separately from events.js");
assert(workflow.includes('cmp -s /tmp/shows-pending-changes.md '+proposedFile),
  "An existing event-data snapshot is not sufficient to suppress a changed-status alert");
assert(workflow.includes('git add -- events.js '+proposedFile),
  "Review PR must include official-change evidence without altering published events");
assert(workflow.includes('No published events are automatically modified or removed.'),
  "PR summary must state the no-automatic-change constraint");
assert(!reviewer.includes("fs.writeFileSync"),"Schedule-change detection is pure advisory logic");
assert(reviewer.includes("Missing from a feed is NOT an event cancellation"),
  "Absent feed entries must never automatically be labeled canceled");
console.log("PASS — source-confirmed published event changes open or refresh a safe editorial PR even without new bills");
