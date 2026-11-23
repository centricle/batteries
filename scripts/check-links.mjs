#!/usr/bin/env node
// Check every internal link in the built site resolves to a page, a file, or a
// rule in _redirects. Run after `npm run build`. Exits 1 on any dead link.
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../dist');
const redirects = new Set();
const splats = [];
for (const line of fs.readFileSync(path.join(dist, '_redirects'), 'utf8').split('\n')) {
  const from = line.trim().split(/\s+/)[0];
  if (!from || from.startsWith('#')) continue;
  if (from.endsWith('/*')) splats.push(from.slice(0, -1));
  else redirects.add(from.replace(/\/$/, ''));
}

function exists(p) {
  const clean = decodeURIComponent(p.split(/[?#]/)[0]).replace(/\/$/, '') || '/';
  if (clean === '/') return true;
  const f = path.join(dist, clean);
  if (fs.existsSync(f) && fs.statSync(f).isFile()) return true;
  if (fs.existsSync(path.join(f, 'index.html'))) return true;
  if (fs.existsSync(f + '.html')) return true;
  if (redirects.has(clean)) return true;
  return splats.some((s) => clean.startsWith(s));
}

const pages = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) pages.push(p);
  }
})(dist);

const dead = new Map();
let checked = 0;
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  for (const m of html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
    const url = m[1];
    if (url.startsWith('//')) continue;
    checked++;
    if (!exists(url)) {
      const from = '/' + path.relative(dist, file).replace(/index\.html$/, '').replace(/\.html$/, '');
      if (!dead.has(url)) dead.set(url, new Set());
      dead.get(url).add(from);
    }
  }
}
for (const [url, from] of dead) console.log(`DEAD ${url}  (from ${[...from].slice(0, 3).join(', ')}${from.size > 3 ? ` +${from.size - 3}` : ''})`);
console.log(`${pages.length} pages, ${checked} internal links, ${dead.size} dead`);
process.exit(dead.size ? 1 : 0);
