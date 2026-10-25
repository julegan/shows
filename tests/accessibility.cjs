"use strict";
const assert=require("node:assert/strict");
const { chromium }=require("playwright");
const axePath=require.resolve("axe-core/axe.min.js");
const isPortfolio=process.env.SHOWS_PORTFOLIO==="1";
const origin="http://127.0.0.1:4173";
const standards=["wcag2a","wcag2aa","wcag21a","wcag21aa"];
async function audit(page,label){
  await page.addScriptTag({path:axePath});
  const results=await page.evaluate(tags=>window.axe.run(document,{
    runOnly:{type:"tag",values:tags},
    rules:{"color-contrast":{enabled:true}}
  }),standards);
  const violations=results.violations.map(v=>({
    id:v.id,impact:v.impact,help:v.help,where:v.nodes.map(n=>n.target.join(" ")).slice(0,12)
  }));
  console.log(JSON.stringify({view:label,violations,passes:results.passes.length}));
  return violations.map(v=>({view:label,...v}));
}
async function assertFavicon(page,label){
  const href=await page.locator('link[rel="icon"]').getAttribute("href");
  assert(href, label+" must declare a favicon");
  const result=await page.evaluate(async url=>{
    const response=await fetch(url,{cache:"no-store"});
    return {ok:response.ok,status:response.status,text:await response.text()};
  },new URL(href,page.url()).href);
  assert(result.ok&&result.text.includes("<svg"),label+" favicon resource must load as an SVG");
}
async function showsViews(browser,viewport){
  const page=await browser.newPage({viewport});
  const pageErrors=[];
  const errors=[];
  page.on("pageerror",e=>pageErrors.push(e.message));
  const response=await page.goto(origin+(isPortfolio?"/projects/shows/":"/"),{waitUntil:"domcontentloaded"});
  assert.equal(response.status(),200,"SHOWS homepage must load");
  if(isPortfolio)await assertFavicon(page,"SHOWS");
  const ymd=()=>{
    const fields=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
    const p=t=>fields.find(x=>x.type===t).value;return p("year")+"-"+p("month")+"-"+p("day");
  };
  const start=ymd();
  assert.equal(await page.locator("#fromDate").inputValue(),start,"Homepage defaults to today's Portland-local date");
  assert.equal(await page.locator('[data-view="dates"]').getAttribute("aria-pressed"),"true","Chronological list is default");
  assert.equal(await page.locator("#monthControls").isVisible(),false,"Month controls should not dominate the landing page");
  assert.equal(await page.locator(".shows-month-grid").count(),0,"Month overview should not load by default");
  assert(!(/mobile-first experiment|compare these two working layouts/i).test(await page.locator("body").innerText()),"No test copy in released homepage");
  errors.push(...await audit(page,"SHOWS date-first "+viewport.width));
  // Browsing earlier dates is possible without loading them by default.
  await page.locator("#fromDate").fill("2026-10-17");
  assert.equal(await page.locator("#fromDate").inputValue(),"2026-10-17");
  const list=page.locator(".preview-event");
  assert(await list.count()>0,"Historical events can be browsed intentionally");
  assert(!(await page.locator("#results").innerText()).includes("Lents Farmers Market"),"Routine farmers markets stay out of the feed");
  const art=page.locator(".preview-event .preview-art").first();
  assert(await art.isVisible(),"Original flyer or neutral missing-source treatment remains visible");
  await list.first().click();
  assert(await page.locator("#eventDialog").evaluate(el=>el.open),"Event dialog opens");
  assert(await page.locator("#eventDialog .preview-detail-art").isVisible(),"Artwork is visible in detail");
  const google=await page.locator("#eventDialog a").filter({hasText:"Google Calendar"}).getAttribute("href");
  assert(google&&google.includes("calendar.google.com"),"Google Calendar export exists");
  const dl=page.waitForEvent("download");
  await page.locator("[data-ics]").first().click();
  const file=await dl;
  assert(file.suggestedFilename().endsWith(".ics"),"Apple/Outlook export downloads a calendar file");
  errors.push(...await audit(page,"SHOWS event detail "+viewport.width));
  const eventTitle=await page.locator("#dialogTitle").innerText();
  await page.locator("[data-save]").first().click();
  await page.locator("[data-close]").click();
  await page.locator("#savedOnly").click();
  assert.equal(await page.locator("#savedOnly").getAttribute("aria-pressed"),"true");
  assert((await page.locator("#results").innerText()).includes(eventTitle),"Saved filter returns the saved event");
  await page.locator("#clearFilters").click();
  assert.equal(await page.locator("#savedOnly").getAttribute("aria-pressed"),"false");
  await page.locator("#freeOnly").click();
  assert.equal(await page.locator("#freeOnly").getAttribute("aria-pressed"),"true");
  await page.locator("#clearFilters").click();
  await page.locator('[data-view="places"]').click();
  assert.equal(await page.locator('[data-view="places"]').getAttribute("aria-pressed"),"true");
  assert(await page.locator(".preview-place").count()>0,"Places still groups events by venue");
  errors.push(...await audit(page,"SHOWS places "+viewport.width));
  await page.locator('[data-view="month"]').click();
  assert.equal(await page.locator('[data-view="month"]').getAttribute("aria-pressed"),"true");
  assert(await page.locator("#monthControls").isVisible(),"Month navigation visible in month mode");
  assert(await page.locator(".shows-month-date").count()>=28,"Month overview has navigable dates");
  errors.push(...await audit(page,"SHOWS optional month "+viewport.width));
  if(viewport.width<=680){
    const gridFits=await page.locator(".shows-month-grid").evaluate(el=>el.scrollWidth<=el.clientWidth+1);
    assert(gridFits,"Mobile month grid must not scroll horizontally");
  }
  await page.locator("#nextMonth").click();
  assert.match(await page.locator("#monthPeriod").innerText(),/November|December|January|February|March|April|May|June|July|August|September|October/);
  const day=page.locator(".shows-month-date").first();
  const selected=await day.getAttribute("data-day");
  await day.click();
  assert.equal(await page.locator("#fromDate").inputValue(),selected,"Selecting month day opens the date-first list");
  assert.equal(await page.locator('[data-view="dates"]').getAttribute("aria-pressed"),"true");
  await page.locator("#search").fill("nonexistent--show--query--987987");
  assert.match(await page.locator("#results").innerText(),/No listings found/,"Empty search has an explanation");
  await page.locator("#jumpToday").click();
  assert.equal(await page.locator("#fromDate").inputValue(),start,"Today button restores default date");
  assert.deepEqual(pageErrors,[],"No uncaught browser errors");
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  assert.equal(overflow,false,"Homepage must fit horizontally at "+viewport.width);
  await page.close();
  return errors;
}
async function main(){
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const issues=[];
 try{
  if(isPortfolio){
   for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const page=await browser.newPage({viewport});
    await page.goto(origin+"/",{waitUntil:"networkidle"});
    issues.push(...await audit(page,"Portfolio home "+viewport.width));
    await assertFavicon(page,"Portfolio home");
    await page.goto(origin+"/projects/",{waitUntil:"networkidle"});
    issues.push(...await audit(page,"Portfolio projects "+viewport.width));
    await assertFavicon(page,"Projects");
    await page.close();
   }
  }
  for(const viewport of [{width:1440,height:900},{width:390,height:844}])issues.push(...await showsViews(browser,viewport));
 }finally{await browser.close();}
 if(issues.length){
  console.error("WCAG 2.1 AA automated scan: "+issues.length+" violation types across states.");
  process.exitCode=1;
 }else console.log("WCAG 2.1 AA automated scan passed in all tested pages and states.");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
