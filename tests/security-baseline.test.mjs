import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflowsDir = join(root, '.github', 'workflows');
const workflows = readdirSync(workflowsDir).filter((name) => /\.ya?ml$/.test(name));
const read = (name) => readFileSync(join(workflowsDir, name), 'utf8');
const writeAllowed = new Set(['discover.yml', 'artwork-backfill.yml']);

test('all workflows declare least-privilege top-level permissions', () => {
  assert.ok(workflows.includes('security.yml'), 'Missing security workflow');
  for (const name of workflows) {
    const body = read(name);
    const match = body.match(/^permissions:\s*\n((?: {2}[^\n]+\n)+)/m);
    assert.ok(match, `Missing top-level token permissions in ${name}`);
    const lines = match[1].trim().split(/\n/).map((line) => line.trim());
    const hasWrite = lines.some((line) => /:\s*write\s*$/.test(line));
    if (writeAllowed.has(name)) {
      assert.ok(lines.includes('contents: write') && lines.includes('pull-requests: write'),
        `${name} requires limited permissions to propose editorial PRs`);
    } else {
      assert.ok(lines.includes('contents: read'), `${name} must have read-only contents access`);
      assert.ok(!hasWrite, `Unexpected write permission in ${name}`);
    }
  }
});

test('all third-party GitHub Actions use full 40-character commit SHA pins', () => {
  let total = 0;
  for (const name of workflows) {
    const body = read(name);
    for (const match of body.matchAll(/^\s*-\s*uses:\s*([^\s#]+)/gm)) {
      const target = match[1];
      if (target.startsWith('./')) continue;
      assert.match(target, /^[-\w./]+@[a-f0-9]{40}$/,
        `Unpinned external Action in ${name}: ${target}`);
      total++;
    }
  }
  assert.ok(total > 10, 'Expected to verify Action pins across the SHOWS workflows');
});
