// A number and its unit symbol are written closed up, as on the battery and
// its package: 3V, 85°C, 0.68Wh, 20mm, 2,850mAh. Scans the built pages, so it
// catches templates, data and guides alike. Left as written: a publisher's
// title (<cite>), a quotation (<blockquote>, <q>), code, scripts, styles and
// drawings. "2/3 A" is a size name, not amps.
//
// Run after a build: npm run build && npm run check:units
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const UNIT = /(?<![/\w.])(\d(?:[\d,]*\d)?(?:\.\d+)?)[   ](mAh|mWh|Wh|Ah|mV|V|mm|cm|°C|°F|mA|µA|A|W|kg|g|mL|kΩ|mΩ|Ω|ms|h)(?![\w-])/g;
const SKIP = ['script', 'style', 'svg', 'cite', 'blockquote', 'q', 'code', 'pre'];

const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", deg: '°', micro: 'µ', Omega: 'Ω' };
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m);

function visibleText(html) {
  const meta = [...html.matchAll(/<meta\s+(?:name|property)="(?:description|og:description|twitter:description)"\s+content="([^"]*)"/g)].map((m) => m[1]);
  let s = html;
  for (const tag of SKIP) s = s.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, 'gi'), ' ');
  // A block boundary is a line break, so a figure ending one cell or
  // paragraph never pairs with a letter starting the next.
  s = s.replace(/<head\b[\s\S]*?<\/head>/i, ' ')
    .replace(/<\/?(?:p|li|ol|ul|td|th|tr|div|section|h[1-6]|dt|dd|br|figure|figcaption|nav|header|footer|main|article|aside|button|label|option)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  return decode([...meta, s].join('\n'));
}

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (name !== 'api' && name !== 'models') yield* files(p); }
    else if (/\.(html|txt)$/.test(name)) yield p;
  }
}

let found = 0;
const byFile = new Map();
for (const f of files(DIST)) {
  const raw = readFileSync(f, 'utf8');
  const text = f.endsWith('.html') ? visibleText(raw) : raw;
  for (const m of text.matchAll(UNIT)) {
    const at = text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 20).replace(/\s+/g, ' ').trim();
    if (!byFile.has(f)) byFile.set(f, []);
    byFile.get(f).push(`"${m[0]}" in ...${at}...`);
    found++;
  }
}

if (found) {
  for (const [f, hits] of byFile) {
    console.error(`${relative(DIST, f)}:`);
    for (const h of hits.slice(0, 5)) console.error(`  ${h}`);
    if (hits.length > 5) console.error(`  and ${hits.length - 5} more`);
  }
  console.error(`\n✗ ${found} spaced units in ${byFile.size} file(s). Write them closed up: 3V, 85°C, 20mm.`);
  process.exit(1);
}
console.log('✓ units closed up on every built page');
