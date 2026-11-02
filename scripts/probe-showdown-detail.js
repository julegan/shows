#!/usr/bin/env node
"use strict";
const {get}=require("./probe-showdown-source");
const URLS=[
 "https://www.showdownpdx.com/tm-event/square-dancing-with-old-time-highway-and-caller-amy-hofer/",
 "https://www.showdownpdx.com/tm-event/nug-how-strange-it-is-and-bonus-room/"
];
async function main(){
 for(const url of URLS){
  const raw=await get(url),visible=raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ");
  const yearDates=[...new Set(raw.match(/(?:20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]20\d{2}|\d{8}T\d{6}Z?)/g)||[])].slice(0,40);
  const google=[...raw.matchAll(/(?:href|data-url)=["']([^"']*google\.com\/calendar[^"']*)["']/gi)].map(m=>m[1].slice(0,800)).slice(0,6);
  const calendar=[...raw.matchAll(/(?:href|data-[\w-]+)=["']([^"']*(?:dates=|start_time|event_date|startDate|2026)[^"']*)["']/gi)].map(m=>m[1].slice(0,400)).slice(0,15);
  const schema=[...raw.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1].slice(0,1800));
  const markers=["tw-event-date","tw-event-time","google.com/calendar","tw-event-name","tw-calendar","event-img","startDate"].map(x=>[x,raw.indexOf(x)]);
  const start=raw.indexOf("Google Calendar");
  console.log(JSON.stringify({url,bytes:raw.length,yearDates,google,calendar,schema,markers,visibleSnippet:visible.slice(Math.max(0,visible.search(/Square Dancing|Nug, How Strange/)-200),visible.search(/Square Dancing|Nug, How Strange/)+800),
    rawCalendarSnippet:start>-1?raw.slice(start-240,start+900):null},null,2));
 }
}
main().catch(e=>{console.error(String(e));process.exitCode=1});
