"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const text=fs.readFileSync(path.resolve(__dirname,"../.github/workflows/discover.yml"),"utf8");
const required=[
 "Discover source-listed upcoming events",
 "Propose official art for existing and newly discovered music listings",
 "Record source outcomes and monthly horizon",
 "Retain both review reports even on no-change days",
 "Validate combined source, artwork and calendar data"
];
for(const name of required){
 const entry=text.indexOf("      - name: "+name);
 assert(entry>=0,name+" present");
 const next=text.indexOf("      - name: ",entry+1);
 const section=text.slice(entry,next<0?undefined:next);
 assert(!section.includes("if: steps.pending.outputs.skip != 'true'"),name+" must run even with open editorial review PR");
}
const name="Propose one combined editorial review PR";
const index=text.indexOf("      - name: "+name);
assert(index>=0);
const proposal=text.slice(index);
assert(proposal.includes("if: steps.pending.outputs.skip != 'true'"),
 "Only pushing a competing editorial PR is blocked by a pending review");
assert(text.includes('gh pr list --state open'),"Pending review still checked against Github");
assert(text.includes("actions/upload-artifact@v4"),"Source reports remain available after a skipped proposal");
console.log("PASS — daily collection and health reporting continue while duplicate editorial proposals remain blocked.");
