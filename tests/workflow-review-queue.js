"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {spawnSync}=require("node:child_process");
const text=fs.readFileSync(path.resolve(__dirname,"../.github/workflows/discover.yml"),"utf8");
const required=[
 "Find one existing rolling discovery review",
 "Discover source-listed upcoming events",
 "Propose official art for existing and newly discovered music listings",
 "Record source outcomes and monthly horizon",
 "Retain both review reports even on no-change days",
 "Validate combined source, artwork and calendar data",
 "Create or refresh a single rolling SHOWS review PR"
];
for(const name of required){
 const entry=text.indexOf("      - name: "+name);
 assert(entry>=0,name+" present");
 const next=text.indexOf("      - name: ",entry+1);
 const section=text.slice(entry,next<0?undefined:next);
 assert(!section.includes("if: steps.pending.outputs.skip != 'true'"),name+" must not be skipped because a review is open");
}
const proposal=text.slice(text.indexOf("      - name: Create or refresh a single rolling SHOWS review PR"));
assert(proposal.includes('gh pr edit "$number" --body-file'),"Rolling PR body must be updated with current source evidence");
assert(proposal.includes('git push --force-with-lease='),"Pending bot branch cannot be force-updated without a lease");
assert(proposal.includes('gh pr create --title'),"A new reviewed PR is opened when needed");
assert(!proposal.includes('gh pr merge'),"Discovery workflow never merges or publishes its proposals");
assert(!proposal.includes('git push origin main'),"Workflow never writes directly to main");
assert(text.includes('gh pr list --state open'),"Detect one existing generated review PR");
assert(text.includes('test("^automation/refresh-[0-9]{8}-[0-9]+$")'),"Only generated review PRs may be refreshed");
assert(text.includes('Refusing to overwrite a non-bot-authored PR.'),"Human-owned PRs are protected");
assert(text.includes('Pending review modifies unexpected files.'),"Non-dataset edits are protected");
assert(/uses:\s*actions\/upload-artifact@[a-f0-9]{40}\b/.test(text),"Source reports remain available even on unchanged review days");
const offset=proposal.indexOf("        run: |\n");
assert(offset>=0,"Rolling discovery step must contain a shell script");
const script=proposal.slice(offset+"        run: |\n".length).split("\n")
  .map(line=>line.startsWith("          ")?line.slice(10):line).join("\n");
const syntax=spawnSync("bash",["-n"],{input:script,encoding:"utf8"});
assert.equal(syntax.status,0,syntax.stderr||"Rolling discovery shell syntax invalid");
console.log("PASS — continued collection and one bot-owned rolling review PR with approval and lease guards.");
