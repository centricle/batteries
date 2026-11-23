#!/usr/bin/env node
// Tell Bing (and the other IndexNow engines) which URLs exist or changed.
// ChatGPT search draws on Bing's index, so this is the fastest route from a
// deploy to being citable there. Run it after a production deploy, never
// before: the engines fetch the URLs right away.
//
//   node scripts/indexnow.mjs            dry run: print what would be sent
//   node scripts/indexnow.mjs --send     submit every URL in dist/sitemap-0.xml
//
// The key file public/<key>.txt proves the site owns the key. IndexNow keys
// are public by design.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const KEY = '8953d2ffd25896d3e7954799a4c1b9a8';
const HOST = 'batteries.fyi';

if (!fs.existsSync(path.join(root, 'public', `${KEY}.txt`))) throw new Error(`public/${KEY}.txt is missing`);
const sitemap = path.join(root, 'dist', 'sitemap-0.xml');
if (!fs.existsSync(sitemap)) throw new Error('dist/sitemap-0.xml is missing: run npm run build first');
const urls = [...fs.readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (!process.argv.includes('--send')) {
  console.log(`${urls.length} URLs would be submitted (dry run; pass --send after the production deploy)`);
  console.log(urls.slice(0, 5).join('\n'), '\n…');
  process.exit(0);
}

// The protocol takes up to 10,000 URLs per request.
for (let i = 0; i < urls.length; i += 10000) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls.slice(i, i + 10000) }),
  });
  console.log(`IndexNow ${res.status} ${res.statusText} for ${Math.min(10000, urls.length - i)} URLs`);
}
