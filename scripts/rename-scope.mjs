#!/usr/bin/env node
//
// Rewrites the published package scope across the repo.
//
// Upstream keeps publishing under @open-slide/*, so every merge from upstream
// brings the old names back. Run this after merging to move them onto the
// fork's scope again. Re-running it is a no-op.
//
//   node scripts/rename-scope.mjs          # report what would change
//   node scripts/rename-scope.mjs --write  # apply

import fs from 'node:fs';
import path from 'node:path';

const SCOPE = '@kywk';
const RENAMES = [
  ['@open-slide/core', `${SCOPE}/open-slide-core`],
  ['@open-slide/cli', `${SCOPE}/open-slide-cli`],
];

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.next',
  '.turbo',
  'test-results',
  'playwright-report',
]);
const SKIP_FILES = new Set(['pnpm-lock.yaml', 'LICENSE', 'rename-scope.mjs']);
// Generated from packages/core/skills and the e2e runner; rebuilt on build.
const SKIP_PATHS = ['packages/cli/template/.agents', 'packages/core/e2e/.scratch'];

const args = process.argv.slice(2);
const write = args.includes('--write');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), files);
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue;
      if (entry.name === 'CHANGELOG.md') continue;
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

let changed = 0;

for (const file of walk(process.cwd())) {
  const rel = path.relative(process.cwd(), file);
  if (SKIP_PATHS.some((prefix) => rel.startsWith(prefix))) continue;

  const original = fs.readFileSync(file, 'utf8');
  if (original.includes('\0')) continue;

  let next = original;
  for (const [from, to] of RENAMES) {
    next = next.split(from).join(to);
  }
  if (next === original) continue;

  changed++;
  if (write) {
    fs.writeFileSync(file, next);
    console.log(`rewrote ${rel}`);
  } else {
    console.log(`would rewrite ${rel}`);
  }
}

console.log(
  changed === 0 ? 'nothing to rename' : `${changed} file(s) ${write ? 'rewritten' : 'to rewrite'}`,
);
