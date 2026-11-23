// Load, validate and derive. Everything the pages show comes through here, so
// a value is computed once and every page agrees.
import fs from 'node:fs';
import path from 'node:path';
import { batterySchema, chemistrySchema, CATEGORIES } from './schema.mjs';
import type { z } from 'zod';

export type Battery = z.infer<typeof batterySchema>;
export type Variant = Battery['variants'][number];
export type Chemistry = z.infer<typeof chemistrySchema>;
export type Source = Battery['sources'][number];

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

export const CATEGORY_META: CategoryMeta[] = [
  { id: 'household', slug: 'household', name: 'Household cells', short: 'Household', description: 'AA, AAA, C, D, 9V and the other standard sizes sold in alkaline, lithium and rechargeable chemistries.', legacy: ['/traditional'] },
  { id: 'li-ion', slug: 'lithium-ion', name: 'Lithium-ion cells', short: 'Lithium-ion', description: 'Rechargeable cylindrical cells named by size: 18650, 21700, 14500 and the rest, including LiFePO4.' },
  { id: 'coin', slug: 'coin-cells', name: 'Coin cells', short: 'Coin', description: 'Flat 3 V lithium cells named by diameter and thickness: CR2032, CR2025, CR1220 and their rechargeable counterparts.' },
  { id: 'button', slug: 'button-cells', name: 'Button and watch cells', short: 'Button', description: 'Alkaline and silver oxide button cells, with the full cross-reference of LR, SR, AG and manufacturer numbers.' },
  { id: 'hearing-aid', slug: 'hearing-aid', name: 'Hearing aid cells', short: 'Hearing aid', description: 'Zinc-air cells in sizes 5, 10, 312, 13 and 675, identified by a standard color tab.' },
  { id: 'photo', slug: 'photo', name: 'Photo lithium cells', short: 'Photo', description: 'CR123A, CR2 and the multi-cell camera packs: CR-P2, 2CR5 and CR-V3.', legacy: ['/camera'] },
  { id: 'specialty', slug: 'specialty', name: 'Specialty cells', short: 'Specialty', description: 'High-voltage stacks, lantern and flat packs, fractional sizes and industrial lithium cells.' },
];
export const categoryById = Object.fromEntries(CATEGORY_META.map((c) => [c.id, c])) as Record<string, CategoryMeta>;

let cache: { batteries: Battery[]; chemistries: Chemistry[] } | null = null;

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
  if (errors.length) {
    // Fail the build: bad data must never ship. `npm run validate` shows the same list.
    throw new Error(`Invalid data:\n${errors.join('\n')}`);
  }
  const order = Object.fromEntries(CATEGORY_META.map((c, i) => [c.id, i]));
  batteries.sort((a, b) => order[a.category] - order[b.category] || sizeKey(a) - sizeKey(b) || natural(a.name, b.name));
  cache = { batteries, chemistries };
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

// ------------------------------------------------------------- formatting

export const CHEM_FALLBACK: Record<string, { name: string; short: string; color: string }> = {
  alkaline: { name: 'Alkaline', short: 'Alkaline', color: '#3B6FD8' },
  'zinc-carbon': { name: 'Zinc-carbon', short: 'Zinc-carbon', color: '#7A7F87' },
  'zinc-chloride': { name: 'Zinc chloride', short: 'Zinc chloride', color: '#5E6B7D' },
  'nickel-oxyhydroxide': { name: 'Nickel oxyhydroxide', short: 'NiOOH', color: '#6C5BD4' },
  'lithium-iron-disulfide': { name: 'Lithium iron disulfide', short: 'Li-FeS₂', color: '#0E9F8E' },
  'lithium-manganese-dioxide': { name: 'Lithium manganese dioxide', short: 'Li-MnO₂', color: '#1B8A5A' },
  'lithium-carbon-monofluoride': { name: 'Lithium carbon monofluoride', short: 'Li-CFx', color: '#4E8A2E' },
  'lithium-thionyl-chloride': { name: 'Lithium thionyl chloride', short: 'Li-SOCl₂', color: '#2E7D6B' },
  'silver-oxide': { name: 'Silver oxide', short: 'Silver oxide', color: '#8C96A3' },
  'zinc-air': { name: 'Zinc-air', short: 'Zinc-air', color: '#C9A227' },
  'mercury-oxide': { name: 'Mercury oxide', short: 'Mercury', color: '#8E3B46' },
  nimh: { name: 'Nickel-metal hydride', short: 'NiMH', color: '#D9822B' },
  nicd: { name: 'Nickel-cadmium', short: 'NiCd', color: '#B5562E' },
  'nickel-zinc': { name: 'Nickel-zinc', short: 'NiZn', color: '#A16207' },
  'lithium-ion': { name: 'Lithium-ion', short: 'Li-ion', color: '#D23F5B' },
  'lithium-iron-phosphate': { name: 'Lithium iron phosphate', short: 'LiFePO₄', color: '#8B3FD2' },
  'lithium-ion-regulated': { name: 'Lithium-ion, 1.5 V regulated', short: '1.5 V Li-ion', color: '#E0568A' },
  'lithium-manganese-rechargeable': { name: 'Rechargeable lithium manganese', short: 'ML', color: '#3F9D3F' },
  'lithium-vanadium-rechargeable': { name: 'Rechargeable lithium vanadium', short: 'VL', color: '#5B8C1E' },
  'lithium-titanate': { name: 'Lithium titanate', short: 'LTO', color: '#6B4FA0' },
};

export function chem(id: string) {
  const c = chemistryById(id);
  const f = CHEM_FALLBACK[id] ?? { name: id, short: id, color: '#5b6573' };
  return { id, name: c?.name ?? f.name, short: c?.short ?? f.short, color: c?.color ?? f.color, exists: !!c };
}

export const fmt = (n: number | undefined, max = 2) =>
  n === undefined ? '' : Number(n.toFixed(max)).toLocaleString('en-US', { maximumFractionDigits: max });
export const inch = (mm: number) => (mm / 25.4).toFixed(mm < 25.4 ? 3 : 2);
export const volts = (v: number) => `${fmt(v, 2)} V`;

/** "14.5 × 50.5 mm" in the order a person reads the size. */
export function sizeLabel(b: Battery, unit = true) {
  const d = b.dimensions;
  const u = unit ? ' mm' : '';
  if (b.form === 'cylinder' || b.form === 'disc' || (b.form === 'twin' && d.diameter && !d.width)) return `${fmt(d.diameter!.nominal)} × ${fmt(d.height.nominal)}${u}`;
  return `${fmt(d.width!.nominal)} × ${fmt(d.depth!.nominal)} × ${fmt(d.height.nominal)}${u}`;
}

export function shapeWord(b: Battery) {
  if (b.form === 'disc') return b.category === 'coin' ? 'coin cell' : b.category === 'hearing-aid' ? 'hearing aid cell' : 'button cell';
  if (b.form === 'cylinder') return b.category === 'li-ion' ? 'cylindrical lithium-ion cell' : 'cylindrical cell';
  if (b.form === 'prismatic') return 'rectangular battery';
  if (b.form === 'lantern') return 'lantern battery';
  if (b.form === 'flatpack') return 'flat pack battery';
  return 'two-cell pack';
}

/** Distinct nominal voltages across variants, primary first. */
export function voltages(b: Battery) {
  return [...new Set(b.variants.map((v) => v.voltage.nominal))];
}

export function capacityLabel(v: Variant) {
  const c = v.capacity_mah;
  if (!c) return '';
  if (c.typical) return `${fmt(c.typical, 0)} mAh`;
  if (c.range) return `${fmt(c.range[0], 0)}–${fmt(c.range[1], 0)} mAh`;
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
      ? `${fmt(d.diameter!.nominal)} mm in diameter and ${fmt(d.height.nominal)} mm thick`
      : b.form === 'cylinder'
        ? `${fmt(d.diameter!.nominal)} mm in diameter and ${fmt(d.height.nominal)} mm long`
        : `${fmt(d.width!.nominal)} × ${fmt(d.depth!.nominal)} × ${fmt(d.height.nominal)} mm`;
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
    chemistry: chem(v.chemistry).short,
    chemistries: chemistryGroups(b).map((g) => ({ id: g.chem.id, short: g.chem.short, color: g.chem.color, voltage: g.variants[0].voltage.nominal })),
  };
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
