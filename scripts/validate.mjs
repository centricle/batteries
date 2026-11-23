#!/usr/bin/env node
// Validate battery and chemistry JSON against src/lib/schema.mjs.
//   node scripts/validate.mjs            every file
//   node scripts/validate.mjs a.json ... only these battery files
// Exits 1 on any error. Also checks cross-file rules: unique ids, unique
// codes per battery, interchange targets that exist, no slug collisions
// between ids and alias redirects, no "cell" in text a visitor reads. A full
// run also runs scripts/plain-check.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { batterySchema, chemistrySchema, deviceSchema } from '../src/lib/schema.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const bDir = path.join(root, 'data/batteries');
const cDir = path.join(root, 'data/chemistries');
const dDir = path.join(root, 'data/devices');

const args = process.argv.slice(2);
const only = args.length ? new Set(args.map((a) => path.basename(a))) : null;

let errors = 0;
const fail = (file, msg) => {
  errors++;
  console.error(`✗ ${file}: ${msg}`);
};

const readDir = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : []);

// "Battery", never "cell", in anything a visitor reads.
// The fields below are the hand-written ones that reach a page,
// checked sentence by sentence so a long body names the sentence that failed.
// Left out on purpose: code names and aliases (names people type; nicknames()
// in src/lib/plain.ts keeps "Coin cell" off the page), sources and a device's
// source (other people's titles, and the maker's own quoted sentence),
// legacy_paths and ids (URLs), terminal notes (open data only), and the
// glossary, which defines the word.
const SAYS_CELL = /\bcells?\b/i;
// Sentences that cannot lose the word without changing a fact, by file and
// exact sentence, so a new one still fails. File names are as fail() prints them.
const CELL_OK = new Set(
  [
    // A maker's capacity rating condition, the end voltage of each cell inside.
    ['9v.json', '200 mAh rated at 0.2 C to 7.0 V, 20 °C (Varta 56722); 175 mAh at 35 mA to 1.0 V per cell (Energizer NH22-175); 210 mAh typical (GP20R8H)'],
    ['lantern-6v.json', '25 mA continuous to 0.8 V per cell'],
    // A cutoff or charge voltage stated per cell. "Per battery" would be wrong
    // for a battery with several inside, such as a 9V.
    ['alkaline.json', 'Energizer recommends 0.8 V per cell as the minimum cutoff, because deeper discharge raises the chance of excessive internal gassing; by 0.8 V about 95% of the usable capacity has been removed.'],
    ['nimh.json', 'The usual discharge cutoff is 0.9 V per cell, 75% of the 1.2 V midpoint, though at high drain rates (1 to 4 C) that cutoff can leave capacity unused.'],
    ['nickel-zinc.json', "Battery University and PKCELL both specify charging to 1.9 V per cell (constant current, then constant voltage in PKCELL's case), and both Battery University and Wikipedia state that trickle charging is not recommended."],
    // A fuel cell is a different device, not a battery.
    ['zinc-air.json', 'Thin electrodes developed from fuel-cell research in the 1970s made small button and prismatic batteries practical for hearing aids.'],
  ].map(([file, s]) => `${file}\n${s}`),
);
const noCell = (file, fields) => {
  for (const [field, text] of fields) {
    if (typeof text !== 'string') continue;
    for (const s of text.split(/(?<=[.!?])\s+|\n+/))
      if (SAYS_CELL.test(s) && !CELL_OK.has(`${file}\n${s}`)) fail(file, `${field} says "cell"; say "battery": "${s}"`);
  }
};
const batteryText = (b) => [
  ['notes', b.notes],
  ['history', b.history],
  ['plain', b.plain],
  ['dimensions.note', b.dimensions.note],
  ['geometry.note', b.geometry.note],
  ['geometry.tab_color_name', b.geometry.tab_color_name],
  ...b.variants.flatMap((v, i) => [
    [`variants.${i}.label`, v.label],
    [`variants.${i}.subtype`, v.subtype],
    [`variants.${i}.notes`, v.notes],
    [`variants.${i}.capacity_mah.conditions`, v.capacity_mah?.conditions],
    [`variants.${i}.self_discharge`, v.self_discharge],
  ]),
  ...b.safety.map((s, i) => [`safety.${i}`, s]),
  ...b.devices.map((s, i) => [`devices.${i}`, s]),
  ...b.interchange.map((r, i) => [`interchange.${i}.note`, r.note]),
  ...b.codes.map((c, i) => [`codes.${i}.note`, c.note]),
];
// plain and plain_name are checked on their own below.
const chemistryText = (c) => [
  ...['name', 'short', 'summary', 'body', 'anode', 'cathode', 'electrolyte', 'self_discharge'].map((k) => [k, c[k]]),
  ...['strengths', 'limitations', 'safety'].flatMap((k) => c[k].map((s, i) => [`${k}.${i}`, s])),
];
const deviceText = (d) => ['name', 'maker', 'models', 'code', 'note'].map((k) => [k, d[k]]);

const batteries = [];
for (const file of readDir(bDir)) {
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(path.join(bDir, file), 'utf8'));
  } catch (e) {
    fail(file, `invalid JSON: ${e.message}`);
    continue;
  }
  const r = batterySchema.safeParse(raw);
  if (!r.success) {
    if (!only || only.has(file)) for (const i of r.error.issues) fail(file, `${i.path.join('.')}: ${i.message}`);
    continue;
  }
  if (r.data.id + '.json' !== file) fail(file, `id "${r.data.id}" does not match filename`);
  batteries.push({ file, b: r.data });
}

for (const file of readDir(cDir)) {
  if (only) break;
  try {
    const r = chemistrySchema.safeParse(JSON.parse(fs.readFileSync(path.join(cDir, file), 'utf8')));
    if (!r.success) for (const i of r.error.issues) fail(file, `${i.path.join('.')}: ${i.message}`);
    // Optional in the schema so old files still parse, but every kind shown to
    // visitors needs its plain name and sentence.
    else if (!r.data.plain_name || !r.data.plain) fail(file, 'plain_name and plain are required on every chemistry');
    else if (/\bcells?\b/i.test(r.data.plain + ' ' + r.data.plain_name)) fail(file, 'plain text says "cell"; say "battery"');
    if (r.success) noCell(file, chemistryText(r.data));
  } catch (e) {
    fail(file, `invalid JSON: ${e.message}`);
  }
}

// Cross-file rules.
const ids = new Set(batteries.map((x) => x.b.id));
const aliasOwner = new Map();
for (const { file, b } of batteries) {
  if (only && !only.has(file)) continue;
  for (const ic of b.interchange) if (!ids.has(ic.id)) console.warn(`  ${file}: interchange target "${ic.id}" has no entry yet`);
  // The verdict is what a person acts on, so it must not contradict its note.
  // A note that says the swap does not fit or work cannot carry a verdict that
  // says it does. "a 13 does not fit a 312 compartment" on the 13 entry is
  // about the other direction and is skipped.
  const targets = new Set();
  for (const ic of b.interchange) {
    if (targets.has(ic.id)) fail(file, `two interchange entries for "${ic.id}"`);
    targets.add(ic.id);
    if (!['equivalent', 'same-size', 'fits-with-caveat'].includes(ic.relation)) continue;
    const said = [...ic.note.matchAll(/\b(?:does|do|will)\s+not\s+(?:fit|work)\b(?:\s+(?:in\s+)?an?\s+(\S+)\s+(?:holder|compartment))?|\bnot a drop-in\b|\bdo not swap\b/gi)];
    if (said.some((m) => !m[1] || m[1].toLowerCase() === b.name.toLowerCase()))
      fail(file, `interchange "${ic.id}" is "${ic.relation}" but its note says it does not fit or work; use "does-not-fit"`);
  }
  noCell(file, batteryText(b));
  const seen = new Set();
  for (const c of b.codes) {
    const k = `${c.system}:${c.code}`.toLowerCase();
    if (seen.has(k)) fail(file, `duplicate code ${c.system} ${c.code}`);
    seen.add(k);
  }
}
for (const { file, b } of batteries) {
  for (const c of b.codes) {
    const s = c.code.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!s || s === b.id) continue;
    if (ids.has(s)) {
      if (!only || only.has(file)) console.warn(`  ${file}: code ${c.code} collides with entry /${s} (no redirect will be made)`);
      continue;
    }
    const prev = aliasOwner.get(s);
    if (prev && prev !== b.id && (!only || only.has(file)))
      console.warn(`  ${file}: code ${c.code} also claimed by ${prev} (ambiguous, no redirect)`);
    aliasOwner.set(s, b.id);
  }
}

// Devices: schema, filename, and a battery id that exists.
const deviceIds = new Set();
for (const file of readDir(dDir)) {
  if (only) break;
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(path.join(dDir, file), 'utf8'));
  } catch (e) {
    fail(`devices/${file}`, `invalid JSON: ${e.message}`);
    continue;
  }
  const r = deviceSchema.safeParse(raw);
  if (!r.success) {
    for (const i of r.error.issues) fail(`devices/${file}`, `${i.path.join('.')}: ${i.message}`);
    continue;
  }
  if (r.data.id + '.json' !== file) fail(`devices/${file}`, `id "${r.data.id}" does not match filename`);
  if (!ids.has(r.data.battery)) fail(`devices/${file}`, `battery "${r.data.battery}" has no entry`);
  noCell(`devices/${file}`, deviceText(r.data));
  deviceIds.add(r.data.id);
}

// Plain-language helpers (src/lib/plain.ts): asserts on the sentences at the
// top of every battery page. A child process, so the TypeScript file loads
// with Node's type stripping on any Node 22.
if (!only && !errors) {
  const r = spawnSync(process.execPath, ['--experimental-strip-types', '--no-warnings', path.join(root, 'scripts/plain-check.mjs')], { stdio: 'inherit' });
  if (r.status !== 0) errors++;
}

const n = only ? only.size : batteries.length;
if (errors) {
  console.error(`\n${errors} error(s)`);
  process.exit(1);
}
console.log(`✓ ${n} battery file(s) valid${only ? '' : `, ${readDir(cDir).length} chemistry file(s), ${deviceIds.size} device file(s)`}`);
