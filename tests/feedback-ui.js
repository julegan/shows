const assert = require("node:assert/strict");
const fs = require("node:fs");
const html = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const logic = fs.readFileSync("feedback.js", "utf8");
const css = fs.readFileSync("theme.css", "utf8");
for (const id of ["feedbackInvite", "feedbackDialog", "feedbackForm", "feedbackCategory", "feedbackDetails", "feedbackLink", "feedbackVerification", "feedbackStatus"]) {
  assert.match(html, new RegExp('id="' + id + '"'), "Missing feedback control: " + id);
}
assert.match(html, /id="feedbackInvite"[^>]*hidden/, "Feedback must be hidden until endpoint is enabled");
assert.match(html, /public GitHub issue/, "Public issue privacy notice required");
assert.match(html, /<script src="\.\/feedback\.js"><\/script>/);
assert.match(logic, /fetch\(endpoint \+ "\/config"/, "Availability gate required");
assert.match(logic, /window\.SHOWS_OPEN_FEEDBACK/, "Event report shortcut required");
assert.match(logic, /\/api\/shows\/feedback/, "Same-origin feedback endpoint required");
assert.match(app, /data-report/, "Report listing action required");
assert.match(css, /\.shows-feedback-invite\[hidden\]/, "Hidden UI must remain hidden");
console.log("SHOWS in-app feedback controls validated");
