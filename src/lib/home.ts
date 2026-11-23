// Plain-word helpers for the home page. Pure functions with type-only imports,
// so the browser search script can use them without pulling in the data loader.
import type { Battery } from './data';
import type { Entry, DeviceEntry } from './search';

const num = (n: number) => String(Number(n.toFixed(2)));
const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

/** "a" or "an" by how the number is said: an 8, an 11, an 18, a 1.5, a 12. */
export function numArticle(n: string) {
  const int = n.split('.')[0];
  return int.startsWith('8') || int === '11' || int === '18' ? 'an' : 'a';
}

/** The kind of battery in a result line, by category id. Empty means just "battery". */
export const KIND_WORD: Record<string, string> = {
  household: 'household',
  'li-ion': 'rechargeable lithium-ion',
  coin: 'coin',
  button: 'button',
  'hearing-aid': 'hearing aid',
  photo: 'camera',
  specialty: '',
};

/** Size in plain words from search index fields: "20 mm across and 3.2 mm thick". */
function indexSize(e: Entry) {
  if (e.d != null && (e.f === 'cylinder' || e.f === 'disc' || e.w == null)) {
    return `${num(e.d)} mm across and ${num(e.h)} mm ${e.f === 'disc' ? 'thick' : 'long'}`;
  }
  const parts = [e.w != null ? `${num(e.w)} mm wide` : '', e.p != null ? `${num(e.p)} mm thick` : '', `${num(e.h)} mm tall`].filter(Boolean);
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
}

/**
 * One plain line for a battery in the search results:
 * "A 3-volt coin battery, 20 mm across and 3.2 mm thick." The first voltage in
 * the index is the main kind's, so a size sold in several kinds shows the one
 * most people mean. `kinds` maps the index's category label to KIND_WORD.
 */
export function batteryLine(e: Entry, why: string, kinds: Record<string, string>) {
  const v = (e.v.split('/')[0] ?? '').trim();
  const kind = kinds[e.c] ?? '';
  const what = v ? `${numArticle(v)} ${v}-volt ${kind ? `${kind} ` : ''}battery` : `a ${kind ? `${kind} ` : ''}battery`;
  const also = why && e.k.includes(why) ? `Also called ${why}. ` : '';
  return `${also}${what[0].toUpperCase()}${what.slice(1)}, ${indexSize(e)}.`;
}

/** "Takes one CR2032 battery", "Takes 6 AA batteries". */
export function deviceLine(d: DeviceEntry) {
  return d.q === 1 ? `Takes one ${d.b} battery.` : `Takes ${d.q} ${d.b} batteries.`;
}

/**
 * Which entries of each battery's own `devices` list the home page names, by
 * index: the uses a person replacing that battery is most likely holding. The
 * first entries in the data are not always those (a CR2032 is also a
 * motherboard battery, a 9V also powers guitar pedals). Indexes point into the
 * data file, so check them when its `devices` list is reordered.
 */
export const HOME_USES: Record<string, number[]> = {
  aaa: [0, 1],
  aa: [0, 1],
  c: [0, 1, 2],
  d: [0, 1],
  '9v': [0],
  cr123a: [0, 3, 4],
  '18650': [4, 1, 2],
  cr2032: [0, 1, 3],
  lr44: [1, 2, 6],
  '312': [0],
};

/**
 * The chosen entries of a battery's `devices` list as one plain comma list,
 * only the first word capitalized. Every word comes from the data; bracketed
 * detail is dropped ("Computer motherboards (BIOS and RTC backup)" reads
 * "Computer motherboards"). Without picks, the first two entries.
 */
export function usesLine(list: string[], picks: number[] = [0, 1]) {
  const items = picks.map((i) => list[i]?.replace(/\s*\([^)]*\)/g, '').trim()).filter((s): s is string => !!s);
  return items.map((s, i) => (i === 0 ? s : lowerFirst(s))).join(', ');
}

/** "20 mm across, 3.2 mm thick" for a flat round battery. */
export function acrossThick(b: Battery) {
  return `${num(b.dimensions.diameter!.nominal)} mm across, ${num(b.dimensions.height.nominal)} mm thick`;
}

// Brands most often on US store shelves first, so the names a shopper sees
// come up before regional and watchmaker numbers. Order only, never shown.
const BRAND_ORDER = ['Energizer', 'Duracell', 'Rayovac', 'Panasonic', 'Sony', 'Maxell', 'Renata', 'Varta', 'Murata', 'Toshiba', 'GP', 'Seiko', 'Citizen', 'Timex', 'Bulova'];
const NOT_A_BRAND = new Set(['IEC', 'ANSI', 'JIS', 'NEDA', 'Military', 'Generic']);
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Up to `n` brand names for the same battery, from its `codes`: same kind as
 * the main one, not the page name itself, one per distinct code.
 * CR2032 gives Energizer ECR2032 and Duracell DL2032.
 */
export function brandNames(b: Battery, n = 2) {
  const kind = b.variants[0].chemistry;
  const rank = (brand: string) => (BRAND_ORDER.includes(brand) ? BRAND_ORDER.indexOf(brand) : 99);
  const candidates = b.codes
    .map((c, i) => ({ brand: c.system, code: c.code, chemistry: c.chemistry, i }))
    .filter((c) => !NOT_A_BRAND.has(c.brand) && (!c.chemistry || c.chemistry === kind))
    .sort((a, c) => rank(a.brand) - rank(c.brand) || a.i - c.i);
  // One name per brand first (Energizer 377 and Duracell D377, not Energizer
  // 377 and Energizer 376), then a brand's second name if there is room.
  const seen = new Set([key(b.name)]);
  const brands = new Set<string>();
  const picks: { brand: string; code: string }[] = [];
  for (const pass of [0, 1]) {
    for (const c of candidates) {
      if (picks.length === n) return picks;
      if (seen.has(key(c.code)) || (pass === 0 && brands.has(c.brand))) continue;
      seen.add(key(c.code));
      brands.add(c.brand);
      picks.push({ brand: c.brand, code: c.code });
    }
  }
  return picks;
}
