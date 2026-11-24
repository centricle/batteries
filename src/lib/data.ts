// Load, validate and derive. Everything the pages show comes through here, so
// a value is computed once and every page agrees.
import fs from 'node:fs';
import path from 'node:path';
import { batterySchema, chemistrySchema, deviceSchema, CATEGORIES, DEVICE_CATEGORIES } from './schema.mjs';
import type { z } from 'zod';
import { COMMON } from './plain';

export type Battery = z.infer<typeof batterySchema>;
export type Variant = Battery['variants'][number];
export type Chemistry = z.infer<typeof chemistrySchema>;
export type Source = Battery['sources'][number];
export type Device = z.infer<typeof deviceSchema>;

const ROOT = process.cwd();
const read = (dir: string) => {
  const d = path.join(ROOT, dir);
  if (!fs.existsSync(d)) return [];
  return fs
    .readdirSync(d)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ f, json: JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')) }));
};

export interface CategoryMeta {
  id: (typeof CATEGORIES)[number];
  slug: string;
  name: string;
  short: string;
  description: string;
  legacy?: string[];
}

// Names and descriptions are what a visitor reads; slugs and ids are URLs and
// data keys and stay as they are. Order is the order pages list them in.
export const CATEGORY_META: CategoryMeta[] = [
  { id: 'household', slug: 'household', name: 'Household batteries', short: 'Household', description: 'AA, AAA, C, D and 9V. The ones in remotes, flashlights and toys.', legacy: ['/traditional'] },
  { id: 'coin', slug: 'coin-cells', name: 'Coin batteries', short: 'Coin', description: 'Flat 3-volt lithium batteries about the size of a coin. Key fobs, trackers and watches.' },
  { id: 'button', slug: 'button-cells', name: 'Button batteries', short: 'Button', description: 'Small, thick, round 1.5-volt batteries. Watches, calculators, toys and thermometers.' },
  { id: 'hearing-aid', slug: 'hearing-aid', name: 'Hearing aid batteries', short: 'Hearing aid', description: 'Sizes 5, 10, 312, 13 and 675, each with its own tab color.' },
  { id: 'li-ion', slug: 'lithium-ion', name: 'Rechargeable lithium-ion', short: 'Lithium-ion', description: '18650, 21700 and similar. Flashlights, power tools and battery packs.' },
  { id: 'photo', slug: 'photo', name: 'Camera batteries', short: 'Camera', description: 'CR123A, CR2 and other lithium batteries for cameras, sensors and alarms.', legacy: ['/camera'] },
  { id: 'specialty', slug: 'specialty', name: 'Everything else', short: 'Other', description: 'Lantern batteries, 12-volt remote batteries and other less common sizes.' },
];
export const categoryById = Object.fromEntries(CATEGORY_META.map((c) => [c.id, c])) as Record<string, CategoryMeta>;

let cache: { batteries: Battery[]; chemistries: Chemistry[]; devices: Device[] } | null = null;

function natural(a: string, b: string) {
  return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
}

export function load() {
  if (cache) return cache;
  const errors: string[] = [];
  const batteries: Battery[] = [];
  for (const { f, json } of read('data/batteries')) {
    const r = batterySchema.safeParse(json);
    if (!r.success) {
      errors.push(`${f}: ${r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
      continue;
    }
    batteries.push(r.data);
  }
  const chemistries: Chemistry[] = [];
  for (const { f, json } of read('data/chemistries')) {
    const r = chemistrySchema.safeParse(json);
    if (!r.success) {
      errors.push(`${f}: ${r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
      continue;
    }
    chemistries.push(r.data);
  }
  const devices: Device[] = [];
  for (const { f, json } of read('data/devices')) {
    const r = deviceSchema.safeParse(json);
    if (!r.success) {
      errors.push(`devices/${f}: ${r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
      continue;
    }
    if (!batteries.some((b) => b.id === r.data.battery)) errors.push(`devices/${f}: battery "${r.data.battery}" has no entry`);
    devices.push(r.data);
  }
  if (errors.length) {
    // Fail the build: bad data must never ship. `npm run validate` shows the same list.
    throw new Error(`Invalid data:\n${errors.join('\n')}`);
  }
  const order = Object.fromEntries(CATEGORY_META.map((c, i) => [c.id, i]));
  batteries.sort((a, b) => order[a.category] - order[b.category] || sizeKey(a) - sizeKey(b) || natural(a.name, b.name));
  const dorder = Object.fromEntries(DEVICE_CATEGORIES.map((c, i) => [c, i]));
  devices.sort((a, b) => dorder[a.category] - dorder[b.category] || natural(a.maker, b.maker) || natural(a.name, b.name));
  cache = { batteries, chemistries, devices };
  return cache;
}

/** Sort within a category by volume, so lists read small to large. */
function sizeKey(b: Battery) {
  const d = b.dimensions;
  if (d.diameter) return Math.PI * (d.diameter.nominal / 2) ** 2 * d.height.nominal;
  return (d.width?.nominal ?? 1) * (d.depth?.nominal ?? 1) * d.height.nominal;
}

export const batteries = () => load().batteries;
export const chemistries = () => load().chemistries;
export const batteryById = (id: string) => batteries().find((b) => b.id === id);
export const chemistryById = (id: string) => chemistries().find((c) => c.id === id);
export const devices = () => load().devices;
export const deviceById = (id: string) => devices().find((d) => d.id === id);
export const devicesFor = (batteryId: string) => devices().filter((d) => d.battery === batteryId);

// `words` are what people type for the whole category ("car remote", "smoke
// detector"). Search only: they make a device findable by its kind, never a
// claim about one device.
export const DEVICE_CATEGORY_META: Record<(typeof DEVICE_CATEGORIES)[number], { name: string; one: string; words: string[] }> = {
  tracker: { name: 'Item trackers', one: 'tracker', words: ['item tracker', 'Bluetooth tracker', 'key finder'] },
  'car-key': { name: 'Car key fobs', one: 'key fob', words: ['car key', 'car remote', 'key fob', 'keyless remote', 'keyless entry', 'remote key', 'smart key'] },
  garage: { name: 'Garage door remotes', one: 'garage remote', words: ['garage door', 'garage door opener', 'garage opener', 'garage remote'] },
  remote: { name: 'TV remotes and controllers', one: 'remote', words: ['TV remote', 'remote control', 'game controller'] },
  'smart-home': { name: 'Smart home sensors and locks', one: 'smart home device', words: ['smart home', 'home sensor', 'smart lock'] },
  safety: { name: 'Smoke and CO alarms', one: 'alarm', words: ['smoke alarm', 'smoke detector', 'CO alarm', 'CO detector', 'carbon monoxide alarm', 'carbon monoxide detector'] },
  health: { name: 'Health devices', one: 'health device', words: ['medical device', 'health monitor'] },
  fitness: { name: 'Fitness sensors', one: 'sensor', words: ['fitness sensor', 'heart rate monitor', 'chest strap', 'bike sensor'] },
  watch: { name: 'Watches', one: 'watch', words: ['watch', 'wristwatch'] },
  tool: { name: 'Tools and meters', one: 'tool', words: ['tool', 'meter', 'tester'] },
  household: { name: 'Household', one: 'device', words: ['household', 'home', 'kitchen'] },
  computer: { name: 'Computer accessories', one: 'accessory', words: ['computer', 'computer accessory'] },
  camera: { name: 'Cameras', one: 'camera', words: ['camera'] },
  audio: { name: 'Audio', one: 'device', words: ['audio'] },
  toy: { name: 'Toys', one: 'toy', words: ['toy', 'game'] },
};

// A battery's own `devices` strings that name one of the categories above get
// that category's words too, so "TV remote" finds the batteries listed for
// "Remote controls". The words name the same thing; no use is added.
const USE_CATEGORY: [RegExp, (typeof DEVICE_CATEGORIES)[number]][] = [
  [/\bremote controls?\b/i, 'remote'],
  [/\bsmoke\b|carbon monoxide/i, 'safety'],
  [/\bkey fobs?\b|\bkeyless\b|\bcar alarm remotes?\b/i, 'car-key'],
  [/\bgarage door\b/i, 'garage'],
  [/\b(item|bluetooth) trackers?\b/i, 'tracker'],
  [/\bwatch(es)?\b|\bwristwatch/i, 'watch'],
];
const categoryWords = (c: (typeof DEVICE_CATEGORIES)[number]) => [DEVICE_CATEGORY_META[c].name, ...DEVICE_CATEGORY_META[c].words];
export const DEVICE_CATEGORY_ORDER = DEVICE_CATEGORIES;

/** "Apple AirTag", but "Toyota RAV4 smart key" when the name already starts with the maker. */
export const deviceTitle = (d: Device) => (d.name.toLowerCase().startsWith(d.maker.toLowerCase()) ? d.name : `${d.maker} ${d.name}`);

/** The one-sentence answer, the line an answer engine should quote. */
export function deviceAnswer(d: Device) {
  const b = batteryById(d.battery)!;
  const code = d.code ?? b.name;
  const n = d.count === 1 ? `one ${code}` : `${d.count} ${code}`;
  const yrs = d.years ? ` (${d.years.endsWith('-') ? `${d.years.slice(0, -1)} on` : d.years.replace('-', '–')})` : '';
  return `The ${deviceTitle(d)}${yrs} takes ${n} ${d.count === 1 ? 'battery' : 'batteries'}, according to ${d.source.publisher}.`;
}

// ------------------------------------------------------------- formatting

// Wrap colors are pale washes: each kind keeps its hue, chroma is at most 0.06
// and lightness runs from oklch L 0.60 to 0.74. Alkaline is the mark's body
// color, #6D89A7. Keep these in step with data/chemistries/*.json and the
// `wrap` default in src/lib/geometry/model.js.
export const CHEM_FALLBACK: Record<string, { name: string; short: string; color: string }> = {
  alkaline: { name: 'Alkaline', short: 'Alkaline', color: '#6D89A7' },
  'zinc-carbon': { name: 'Zinc-carbon', short: 'Zinc-carbon', color: '#9CA0A3' },
  'zinc-chloride': { name: 'Zinc chloride', short: 'Zinc chloride', color: '#898F96' },
  'nickel-oxyhydroxide': { name: 'Nickel oxyhydroxide', short: 'NiOOH', color: '#9190B9' },
  'lithium-iron-disulfide': { name: 'Lithium iron disulfide', short: 'Li-FeS₂', color: '#88B2AB' },
  'lithium-manganese-dioxide': { name: 'Lithium manganese dioxide', short: 'Li-MnO₂', color: '#7EA18C' },
  'lithium-carbon-monofluoride': { name: 'Lithium carbon monofluoride', short: 'Li-CFx', color: '#89A37F' },
  'lithium-thionyl-chloride': { name: 'Lithium thionyl chloride', short: 'Li-SOCl₂', color: '#7C9890' },
  'silver-oxide': { name: 'Silver oxide', short: 'Silver oxide', color: '#A6ABB0' },
  'zinc-air': { name: 'Zinc-air', short: 'Zinc-air', color: '#B9AA81' },
  'mercury-oxide': { name: 'Mercury oxide', short: 'Mercury', color: '#9B7577' },
  nimh: { name: 'Nickel-metal hydride', short: 'NiMH', color: '#C7A285' },
  nicd: { name: 'Nickel-cadmium', short: 'NiCd', color: '#B78D7D' },
  'nickel-zinc': { name: 'Nickel-zinc', short: 'NiZn', color: '#AB9075' },
  'lithium-ion': { name: 'Lithium-ion', short: 'Li-ion', color: '#C08F93' },
  'lithium-iron-phosphate': { name: 'Lithium iron phosphate', short: 'LiFePO₄', color: '#9A8AB1' },
  'lithium-ion-regulated': { name: 'Lithium-ion, 1.5V regulated', short: '1.5V Li-ion', color: '#CB9BA9' },
  'lithium-manganese-rechargeable': { name: 'Rechargeable lithium manganese', short: 'ML', color: '#8FAF8D' },
  'lithium-vanadium-rechargeable': { name: 'Rechargeable lithium vanadium', short: 'VL', color: '#90A57F' },
  'lithium-titanate': { name: 'Lithium titanate', short: 'LTO', color: '#8A80A4' },
};

export function chem(id: string) {
  const c = chemistryById(id);
  const f = CHEM_FALLBACK[id] ?? { name: id, short: id, color: '#8B96A5' };
  const name = c?.name ?? f.name;
  // plainName and plain are what visitors read; name and short are technical.
  return { id, name, short: c?.short ?? f.short, color: c?.color ?? f.color, plainName: c?.plain_name ?? name, plain: c?.plain ?? '', status: c?.status ?? 'current', rechargeable: c?.rechargeable, exists: !!c };
}

export const fmt = (n: number | undefined, max = 2) =>
  n === undefined ? '' : Number(n.toFixed(max)).toLocaleString('en-US', { maximumFractionDigits: max });
export const inch = (mm: number) => (mm / 25.4).toFixed(mm < 25.4 ? 3 : 2);
export const volts = (v: number) => `${fmt(v, 2)}V`;

/** "14.5 × 50.5mm" in the order a person reads the size. */
export function sizeLabel(b: Battery, unit = true) {
  const d = b.dimensions;
  const u = unit ? 'mm' : '';
  if (b.form === 'cylinder' || b.form === 'disc' || (b.form === 'twin' && d.diameter && !d.width)) return `${fmt(d.diameter!.nominal)} × ${fmt(d.height.nominal)}${u}`;
  return `${fmt(d.width!.nominal)} × ${fmt(d.depth!.nominal)} × ${fmt(d.height.nominal)}${u}`;
}

export function shapeWord(b: Battery) {
  if (b.form === 'disc') return b.category === 'coin' ? 'coin battery' : b.category === 'hearing-aid' ? 'hearing aid battery' : 'button battery';
  if (b.form === 'cylinder') return b.category === 'li-ion' ? 'round lithium-ion battery' : 'round battery';
  if (b.form === 'prismatic') return 'rectangular battery';
  if (b.form === 'lantern') return 'lantern battery';
  if (b.form === 'flatpack') return 'flat pack battery';
  return 'twin battery pack';
}

/** Distinct nominal voltages across variants, primary first. */
export function voltages(b: Battery) {
  return [...new Set(b.variants.map((v) => v.voltage.nominal))];
}

export function capacityLabel(v: Variant) {
  const c = v.capacity_mah;
  if (!c) return '';
  if (c.typical) return `${fmt(c.typical, 0)}mAh`;
  if (c.range) return `${fmt(c.range[0], 0)}–${fmt(c.range[1], 0)}mAh`;
  return '';
}

/** Primary variants first: the one most people mean by the name. */
export function primaryVariant(b: Battery) {
  return b.variants[0];
}

/** Chemistry groups: one row per chemistry, collapsing labeled product variants. */
export function chemistryGroups(b: Battery) {
  const m = new Map<string, Variant[]>();
  for (const v of b.variants) {
    if (!m.has(v.chemistry)) m.set(v.chemistry, []);
    m.get(v.chemistry)!.push(v);
  }
  return [...m].map(([id, vs]) => ({ chem: chem(id), variants: vs }));
}

/** One-sentence answer, generated from data so it can never disagree with the table. */
export function summary(b: Battery) {
  const d = b.dimensions;
  const groups = chemistryGroups(b);
  const size =
    b.form === 'disc'
      ? `${fmt(d.diameter!.nominal)}mm in diameter and ${fmt(d.height.nominal)}mm thick`
      : b.form === 'cylinder'
        ? `${fmt(d.diameter!.nominal)}mm in diameter and ${fmt(d.height.nominal)}mm long`
        : `${fmt(d.width!.nominal)} × ${fmt(d.depth!.nominal)} × ${fmt(d.height.nominal)}mm`;
  if (groups.length === 1) {
    const v = primaryVariant(b);
    const cap = capacityLabel(v);
    const cn = groups[0].chem.name.toLowerCase();
    const shape = shapeWord(b).replace(`${cn} `, '');
    return `The ${b.name} is a ${volts(v.voltage.nominal)} ${cn} ${shape}, ${size}${cap ? `, with a typical capacity of ${cap}` : ''}.`;
  }
  const list = groups.slice(0, 4).map((g) => `${g.chem.name.toLowerCase()} (${volts(g.variants[0].voltage.nominal)}${g.variants[0].rechargeable ? ', rechargeable' : ''})`);
  const more = groups.length > 4 ? `, and ${groups.length - 4} more` : '';
  const listStr = list.length > 1 ? `${list.slice(0, -1).join(', ')}${more ? ', ' : ' and '}${list[list.length - 1]}${more}` : list[0];
  return `The ${b.name} is a ${shapeWord(b)} ${size}. It is made in ${groups.length} chemistries: ${listStr}.`;
}

// --------------------------------------------------------------- codes

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/\//g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9.]/g, '');

/** Every code grouped by system, IEC/ANSI/JIS first, manufacturers alphabetical. */
export function codesBySystem(b: Battery) {
  const pri = ['IEC', 'ANSI', 'JIS', 'NEDA', 'Military'];
  const m = new Map<string, Battery['codes']>();
  for (const c of b.codes) {
    if (!m.has(c.system)) m.set(c.system, []);
    m.get(c.system)!.push(c);
  }
  return [...m].sort(([a], [b2]) => {
    const ia = pri.indexOf(a), ib = pri.indexOf(b2);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return natural(a, b2);
  });
}

/** code slug -> battery id for 301s; ambiguous or colliding slugs are dropped. */
export function aliasRedirects(reserved: Set<string>) {
  const owner = new Map<string, string | null>();
  for (const b of batteries()) {
    const names = [...b.codes.map((c) => c.code), ...b.aliases, b.name];
    for (const n of names) {
      const s = slugify(n);
      if (!s || s === b.id || reserved.has(s) || batteryById(s)) continue;
      if (owner.has(s) && owner.get(s) !== b.id) owner.set(s, null);
      else owner.set(s, b.id);
    }
  }
  return [...owner].filter(([, v]) => v).map(([from, to]) => ({ from: `/${from}`, to: `/${to}` }));
}

// ------------------------------------------------------------- similarity

function shapeClass(b: Battery) {
  if (b.form === 'disc') return 'disc';
  if (b.form === 'cylinder') return 'cylinder';
  return 'box';
}

/** Nearest physical sizes, with the measured difference. */
export function similar(b: Battery, n = 6) {
  const cls = shapeClass(b);
  const d0 = b.dimensions;
  return batteries()
    .filter((x) => x.id !== b.id && shapeClass(x) === cls)
    .map((x) => {
      const d = x.dimensions;
      let dist: number, deltas: { label: string; mm: number }[];
      if (cls === 'box') {
        const dw = (d.width?.nominal ?? 0) - (d0.width?.nominal ?? 0);
        const dp = (d.depth?.nominal ?? 0) - (d0.depth?.nominal ?? 0);
        const dh = d.height.nominal - d0.height.nominal;
        dist = Math.hypot(dw / (d0.width?.nominal ?? 1), dp / (d0.depth?.nominal ?? 1), dh / d0.height.nominal);
        deltas = [{ label: 'width', mm: dw }, { label: 'depth', mm: dp }, { label: 'height', mm: dh }];
      } else {
        const dd = (d.diameter?.nominal ?? 0) - (d0.diameter?.nominal ?? 0);
        const dh = d.height.nominal - d0.height.nominal;
        dist = Math.hypot(dd / (d0.diameter?.nominal ?? 1), (dh / d0.height.nominal) * 0.6);
        deltas = [{ label: 'diameter', mm: dd }, { label: cls === 'disc' ? 'thickness' : 'length', mm: dh }];
      }
      return { battery: x, dist, deltas };
    })
    .sort((a, c) => a.dist - c.dist)
    .slice(0, n);
}

export function interchangeFor(b: Battery) {
  // Relations declared on this entry, plus the reverse declarations on others.
  const out = new Map<string, { id: string; relation: string; note: string; reverse: boolean }>();
  for (const ic of b.interchange) out.set(ic.id, { ...ic, reverse: false });
  for (const x of batteries()) {
    if (x.id === b.id) continue;
    for (const ic of x.interchange) if (ic.id === b.id && !out.has(x.id)) out.set(x.id, { id: x.id, relation: ic.relation, note: ic.note, reverse: true });
  }
  return [...out.values()].filter((r) => batteryById(r.id));
}

// ------------------------------------------------------------- client data

/** What the 3D viewer needs to rebuild the model in the browser. */
/** The kind as printed on the generic label of the 3D model. A chemical
 *  formula (Li-MnO₂, Li-FeS₂, HgO) means nothing to most readers, so those
 *  print the plain kind word up to its first "(" or ",": "Lithium" from
 *  "Lithium (3V)". Abbreviations (Li-ion, NiMH, LTO) stay. */
const FORMULA = /[₀-₉]|MnO|FeS|SOCl|CFx|HgO/;
export const labelKind = (c: { short: string; plainName: string }) =>
  FORMULA.test(c.short) ? c.plainName.split(/[(,]/)[0].trim() : c.short;

// src/lib/viewer.ts draws the label text from `short` here.
export function modelSpec(b: Battery) {
  const v = primaryVariant(b);
  return {
    id: b.id,
    name: b.name,
    form: b.form,
    category: b.category,
    dimensions: b.dimensions,
    geometry: b.geometry,
    color: chem(v.chemistry).color,
    voltage: v.voltage.nominal,
    chemistry: labelKind(chem(v.chemistry)),
    chemistries: chemistryGroups(b).map((g) => ({ id: g.chem.id, short: labelKind(g.chem), color: g.chem.color, voltage: g.variants[0].voltage.nominal })),
  };
}

/** What a battery is used in, as search phrases with a weight: its category
 *  name, its own `devices` strings (earlier ones weigh more), the category
 *  words those strings name, and the words for each kind of device the device
 *  pages say takes it, weighted by how many do. */
function usePhrases(b: Battery): [string, number][] {
  const m = new Map<string, [string, number]>();
  const add = (s: string, w: number) => {
    const k = s.toLowerCase();
    if (!m.has(k) || m.get(k)![1] < w) m.set(k, [s, w]);
  };
  add(categoryById[b.category].name, 1);
  b.devices.forEach((s, i) => {
    const w = 3 - Math.min(i, 3);
    add(s.replace(/\s*\([^)]*\)/g, ''), w);
    for (const [re, c] of USE_CATEGORY) if (re.test(s)) categoryWords(c).forEach((x) => add(x, w));
  });
  const counts = new Map<string, number>();
  for (const d of devicesFor(b.id)) counts.set(d.category, (counts.get(d.category) ?? 0) + 1);
  for (const [c, n] of counts) categoryWords(c as (typeof DEVICE_CATEGORIES)[number]).forEach((x) => add(x, n));
  return [...m.values()];
}

export function searchIndex() {
  return batteries().map((b) => ({
    id: b.id,
    n: b.name,
    c: categoryById[b.category].short,
    s: sizeLabel(b),
    v: voltages(b).map((x) => fmt(x, 2)).join(' / '),
    k: [...new Set([...b.codes.map((c) => c.code), ...b.aliases])],
    f: b.form,
    d: b.dimensions.diameter?.nominal ?? null,
    h: b.dimensions.height.nominal,
    w: b.dimensions.width?.nominal ?? null,
    p: b.dimensions.depth?.nominal ?? null,
    x: chemistryGroups(b).map((g) => g.chem.short),
    col: chem(primaryVariant(b).chemistry).color,
    u: usePhrases(b),
    // The sizes people look for most rank first among equal use matches.
    pop: COMMON.includes(b.id) ? (COMMON.length - COMMON.indexOf(b.id)) / 2 : 0,
  }));
}

export function allSources() {
  const m = new Map<string, Source & { usedBy: string[] }>();
  for (const b of batteries()) {
    for (const s of b.sources) {
      const key = s.url ?? `${s.publisher}|${s.title}`;
      if (!m.has(key)) m.set(key, { ...s, usedBy: [] });
      m.get(key)!.usedBy.push(b.id);
    }
  }
  for (const c of chemistries()) {
    for (const s of c.sources) {
      const key = s.url ?? `${s.publisher}|${s.title}`;
      if (!m.has(key)) m.set(key, { ...s, usedBy: [] });
      m.get(key)!.usedBy.push(`chemistry/${c.id}`);
    }
  }
  return [...m.values()].sort((a, b) => natural(a.publisher, b.publisher) || natural(a.title, b.title));
}

export function stats() {
  const bs = batteries();
  return {
    batteries: bs.length,
    codes: bs.reduce((n, b) => n + b.codes.length, 0),
    variants: bs.reduce((n, b) => n + b.variants.length, 0),
    sources: allSources().length,
    chemistries: new Set(bs.flatMap((b) => b.variants.map((v) => v.chemistry))).size,
  };
}

export function deviceIndex() {
  return devices().map((d) => ({
    id: d.id,
    n: deviceTitle(d),
    k: [d.maker, d.name, d.models ?? ''].filter(Boolean),
    g: [DEVICE_CATEGORY_META[d.category].one, ...categoryWords(d.category)],
    b: batteryById(d.battery)!.name,
    bid: d.battery,
    q: d.count,
    c: DEVICE_CATEGORY_META[d.category].name,
  }));
}
