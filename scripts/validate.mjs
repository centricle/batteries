#!/usr/bin/env node
// Validate battery and chemistry JSON against src/lib/schema.mjs.
//   node scripts/validate.mjs            every file
//   node scripts/validate.mjs a.json ... only these battery files
// Exits 1 on any error. Also checks cross-file rules: unique ids, unique
// codes per battery, interchange targets that exist, no slug collisions
// between ids and alias redirects.
import fs from 'node:fs';
import path from 'node:path';
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
  deviceIds.add(r.data.id);
}

const n = only ? only.size : batteries.length;
if (errors) {
  console.error(`\n${errors} error(s)`);
  process.exit(1);
}
console.log(`✓ ${n} battery file(s) valid${only ? '' : `, ${readDir(cDir).length} chemistry file(s), ${deviceIds.size} device file(s)`}`);
