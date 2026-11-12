// =============================================================
//  BUILD-SW — refreshes the offline file list in service-worker.js.
//
//  Optional helper: the game itself has no build step. Run this
//  after adding, removing or changing game files, then commit:
//
//      node tools/build-sw.mjs
//
//  It finds every file the game needs (html, css, js, json, icons,
//  music), writes them into the FILES list, and sets CACHE_VERSION
//  to a hash of their contents, so installed copies update only
//  when something actually changed.
// =============================================================

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SW = join(ROOT, 'service-worker.js');

// Folders the game loads from, plus loose files at the root.
const DIRS = ['assets/icons', 'assets/music', 'css', 'data', 'js'];
const ROOT_FILES = ['index.html', 'manifest.json'];
const EXTS = new Set(['.html', '.css', '.js', '.mjs', '.json', '.png', '.svg', '.webp', '.jpg', '.mp3', '.ogg', '.m4a', '.wav']);

async function walk(dir) {
  let entries;
  try { entries = await readdir(join(ROOT, dir), { withFileTypes: true }); } catch { return []; }
  const out = [];
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (EXTS.has(extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

const files = [...ROOT_FILES, ...(await Promise.all(DIRS.map(walk))).flat()]
  .map(p => p.split(sep).join('/'))
  .sort();

const hash = createHash('sha256');
for (const f of files) hash.update(f).update(await readFile(join(ROOT, f)));
const version = 'driftfield-' + hash.digest('hex').slice(0, 10);

let src = await readFile(SW, 'utf8');
const list = ['  \'./\',', ...files.map(f => `  "./${f}",`)].join('\n');
src = src
  .replace(/const CACHE_VERSION = '[^']*';/, `const CACHE_VERSION = '${version}';`)
  .replace(/const FILES = \[[\s\S]*?\n\];/, `const FILES = [\n${list}\n];`);
await writeFile(SW, src);

console.log(`service-worker.js: ${files.length + 1} files, CACHE_VERSION ${version}`);
console.log(relative(process.cwd(), SW) || SW);
