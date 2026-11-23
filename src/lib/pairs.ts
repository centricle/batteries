// Head-to-head pages: which pairs get one, and what to say about them.
// Every sentence is assembled from the data, so a pair page can never disagree
// with the two battery pages it links.
import { batteries, batteryById, similar, interchangeFor, fmt, primaryVariant, capacityLabel, chem, shapeWord, type Battery } from './data';

// The verdict a visitor reads, the same on battery pages and pair pages.
export const REL_META: Record<string, { label: string; cls: string }> = {
  equivalent: { label: 'Works the same', cls: 'ok' },
  'same-size': { label: 'Looks alike, not a swap', cls: 'info' },
  'fits-with-caveat': { label: 'Fits, with a catch', cls: 'warn' },
  'do-not-substitute': { label: 'Do not use', cls: 'danger' },
};

export interface Pair {
  slug: string;
  a: Battery;
  b: Battery;
  relations: { from: Battery; to: Battery; relation: string; note: string }[];
}

/** Rough popularity: how many names a size goes by. Puts the commoner name first. */
const weight = (b: Battery) => b.codes.length + (b.status === 'current' ? 5 : 0);

let cache: Map<string, Pair> | null = null;

export function pairs(): Map<string, Pair> {
  if (cache) return cache;
  const seen = new Map<string, Pair>();
  const add = (x: Battery, y: Battery) => {
    const [a, b] = weight(x) > weight(y) || (weight(x) === weight(y) && x.id < y.id) ? [x, y] : [y, x];
    const key = [a.id, b.id].sort().join('|');
    if (seen.has(key)) return;
    const relations = [
      ...a.interchange.filter((r) => r.id === b.id).map((r) => ({ from: a, to: b, relation: r.relation, note: r.note })),
      ...b.interchange.filter((r) => r.id === a.id).map((r) => ({ from: b, to: a, relation: r.relation, note: r.note })),
    ];
    seen.set(key, { slug: `${a.id}-vs-${b.id}`, a, b, relations });
  };
  for (const x of batteries()) {
    for (const r of interchangeFor(x)) add(x, batteryById(r.id)!);
    for (const s of similar(x, 3)) if (s.dist < 0.3) add(x, s.battery);
  }
  cache = new Map([...seen.values()].map((p) => [p.slug, p]));
  return cache;
}

export function pairSlug(x: Battery, y: Battery): string | undefined {
  for (const s of [`${x.id}-vs-${y.id}`, `${y.id}-vs-${x.id}`]) if (pairs().has(s)) return s;
  return undefined;
}

export function pairsFor(b: Battery): Pair[] {
  return [...pairs().values()].filter((p) => p.a.id === b.id || p.b.id === b.id);
}

const mm = (n: number) => `${fmt(n)} mm`;
const hWord = (b: Battery) => (b.form === 'disc' ? 'thick' : b.form === 'cylinder' ? 'long' : 'tall');

function dimsSentence(b: Battery) {
  const d = b.dimensions;
  if (d.diameter && (b.form === 'cylinder' || b.form === 'disc')) return `${mm(d.diameter.nominal)} across and ${mm(d.height.nominal)} ${hWord(b)}`;
  return `${mm(d.width!.nominal)} wide, ${mm(d.depth!.nominal)} thick and ${mm(d.height.nominal)} tall`;
}

/** The answer paragraph at the top of a pair page. */
export function verdict(p: Pair): string[] {
  const { a, b } = p;
  const out: string[] = [];
  const da = a.dimensions, db = b.dimensions;
  const va = primaryVariant(a), vb = primaryVariant(b);
  const sameShape = a.form === b.form;
  const dd = da.diameter && db.diameter ? db.diameter.nominal - da.diameter.nominal : null;
  const dh = db.height.nominal - da.height.nominal;
  if (sameShape && dd !== null && Math.abs(dd) < 0.05 && Math.abs(dh) < 0.05) {
    out.push(`The ${a.name} and ${b.name} are the same size: ${dimsSentence(a)}.`);
  } else if (sameShape && dd !== null && Math.abs(dd) < 0.05) {
    out.push(`The ${a.name} and ${b.name} are both ${mm(da.diameter!.nominal)} across. The ${a.name} is ${mm(da.height.nominal)} ${hWord(a)} and the ${b.name} is ${mm(db.height.nominal)}, a difference of ${mm(Math.abs(dh))}.`);
  } else {
    out.push(`The ${a.name} is a ${shapeWord(a)} ${dimsSentence(a)}. The ${b.name} is a ${shapeWord(b)} ${dimsSentence(b)}.`);
  }
  const ca = chem(va.chemistry), cb = chem(vb.chemistry);
  if (va.voltage.nominal === vb.voltage.nominal && va.chemistry === vb.chemistry) {
    out.push(`Both are most often made as ${ca.name.toLowerCase()} batteries at ${fmt(va.voltage.nominal)} V.`);
  } else {
    out.push(`The ${a.name} is most often ${ca.name.toLowerCase()} at ${fmt(va.voltage.nominal)} V; the ${b.name} is most often ${cb.name.toLowerCase()} at ${fmt(vb.voltage.nominal)} V.`);
  }
  const capA = capacityLabel(va), capB = capacityLabel(vb);
  if (capA && capB) out.push(`Typical rated capacity is ${capA} for the ${a.name} and ${capB} for the ${b.name}, each at its maker's own test conditions.`);
  return out;
}

export function faqs(p: Pair) {
  const { a, b } = p;
  const out = [{ q: `What is the difference between the ${a.name} and ${b.name}?`, a: verdict(p).join(' ') }];
  for (const r of p.relations) out.push({ q: `Can a ${r.to.name} replace a ${r.from.name}?`, a: `${REL_META[r.relation].label}. ${r.note}` });
  return out;
}
