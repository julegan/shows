#!/usr/bin/env node
'use strict';
// Read-only diagnostics for issue #56. Reachability does not grant API access.
const pages = [
  'https://www.treetix.com/',
  'https://www.highwatermarklounge.com/',
  'https://www.highwatermarklounge.com/index.cfm',
  'https://www.soundcontrolpdx.com/',
  'https://www.treetix.com/event?cal=highwatermark&id=204931'
];
async function inspect(url) {
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      headers: { Accept: 'text/html', 'User-Agent': 'SHOWS-event-review/0.1' },
      signal: AbortSignal.timeout(18000)
    });
    if (!response.ok) {
      await response.body?.cancel();
      return { url, status: response.status, result: 'unavailable; no event-count or cancellation inference' };
    }
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1500000) { await reader.cancel(); throw Error('Response exceeds 1.5 MB limit'); }
      chunks.push(Buffer.from(value));
    }
    const html = Buffer.concat(chunks).toString('utf8');
    return {
      url, status: response.status, bytes: size,
      publicListingPreview: /highwatermarklounge.com\/index.cfm|treetix.com\/event/.test(url) ? html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 16000) : undefined,
      eventCardSamples: url.endsWith('/index.cfm') ? [...html.matchAll(/<a[^>]*href="https:\/\/www\.treetix\.com\/event\?[^"]+"[^>]*>[\s\S]*?<\/a>/gi)].slice(0, 2).map(m => m[0]) : undefined,
      apiInvitationPresent: /REST API for event listing services/i.test(html),
      ticketLinkMarkers: (html.match(/treetix\.com\/event\?/gi) || []).length,
      result: 'public response only; not a validated feed or permission grant'
    };
  } catch (error) {
    return { url, result: 'access failure; no event-count or cancellation inference', error: error.message };
  }
}
async function run() {
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), mode: 'read-only; no retries, credentials, private API calls or event writes' }));
  for (const url of pages) console.log(JSON.stringify(await inspect(url)));
  console.log('Diagnostic complete. A successful job does not mean these sources are connected. Issue #56 remains blocked on documented API access.');
}
if (require.main === module) run().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { inspect };
