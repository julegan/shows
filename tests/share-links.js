"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const app = fs.readFileSync("app.js", "utf8");
const fixture = {
  id:"gig-100", title:"Test Group + Guests", category:"Music",
  startsAt:"2026-11-14T19:00:00-08:00", startTimeKind:"doors",
  venue:"Test Venue", neighborhood:"Portland", url:"https://example.com/show",
  accessibility:"Step-free entry", sourceCheckedAt:"2026-11-09",
  artwork:{url:"https://example.com/flyer.png",sourceUrl:"https://example.com/show",credit:"Test Venue",usageApproved:true}
};
function start(address, useNativeShare = true) {
  const location = new URL(address);
  const nodes = new Map();
  const shares = [], copies = [];
  function node(id) {
    if (!nodes.has(id)) {
      nodes.set(id, {
        listeners:{}, dataset:{}, value:"", hidden:false, innerHTML:"", textContent:"",
        addEventListener(type,callback){this.listeners[type]=callback;},
        setAttribute(){},appendChild(){},remove(){},focus(){},
        showModal(){this.open=true;},close(){this.open=false;this.listeners.close?.();},
        querySelector(){return {focus(){}}}
      });
    }
    return nodes.get(id);
  }
  const document = {
    getElementById:node, querySelectorAll(){return [];},
    createElement(){return {append(){},remove(){}};},
    addEventListener(){},body:{appendChild(){}}
  };
  const navigator = useNativeShare
    ? {share:async value => shares.push(value)}
    : {clipboard:{writeText:async value => copies.push(value)}};
  const context = {
    window:{SHOWS_EVENTS:[fixture]},document,location,history:{
      replaceState(_a,_b,path){location.href=new URL(path,location.origin).href;}
    }, navigator,localStorage:{getItem(){return null;},setItem(){}},
    URL,Intl,Date,setTimeout(){},HTMLImageElement:class{}
  };
  vm.runInNewContext(app,context);
  return {location,nodes,shares,copies,dialog:node("eventDialog")};
}
function shareClick(session) {
  const target={dataset:{share:fixture.id},textContent:""};
  return session.dialog.listeners.click({
    target:{closest(selector){return selector==="button" ? target : null;}}
  });
}
(async () => {
  const query = start("https://julieowens.me/projects/shows/?event=gig-100");
  assert.equal(query.dialog.open,true,"query deep link opens event details");
  const detail = query.nodes.get("dialogContent").innerHTML;
  assert.match(detail,/Test Group \+ Guests/);
  const readingOrder = ["dialogTitle","detail-info","Step-free entry","Official listing","preview-detail-art",
    "detail-description","Share event","detail-footnote","detail-sources","Sources:","Source checked","Artwork attribution"];
  let last = -1;
  for (const marker of readingOrder) {
    const position = detail.indexOf(marker);
    assert(position > last, marker + " follows the preceding detail section in reading order");
    last = position;
  }
  await shareClick(query);
  assert.equal(query.shares.length,1);
  assert.equal(query.shares[0].url,"https://julieowens.me/projects/shows/?event=gig-100");
  assert.match(query.shares[0].text,/Doors 7:00 PM/);
  assert.match(query.shares[0].text,/Test Venue/);
  query.dialog.close();
  assert.equal(query.location.search,"","closing removes only the event query");
  assert.equal(query.dialog.open,false);

  const hash = start("https://julieowens.me/projects/shows/#event=gig-100");
  assert.equal(hash.dialog.open,true,"old hash deep link still opens");
  assert.equal(hash.location.search,"?event=gig-100","legacy links become canonical query links");
  assert.equal(hash.location.hash,"");

  const unknown = start("https://julieowens.me/projects/shows/?event=missing");
  assert.equal(unknown.dialog.open,undefined,"unknown event does not display a fabricated modal");

  const copy = start("https://julieowens.me/projects/shows/?event=someone-else",false);
  await shareClick(copy);
  assert.equal(copy.copies.length,1);
  assert.match(copy.copies[0],/Test Group \+ Guests/);
  assert.match(copy.copies[0],/Test Venue/);
  assert.match(copy.copies[0],/\?event=gig-100/);
  assert.doesNotMatch(copy.copies[0],/someone-else/);
  console.log("PASS — old/new SHOWS deep links, event-specific native share/copy and close behavior");
})().catch(e => {console.error(e);process.exitCode=1;});
