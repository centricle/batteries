// Plain-language helpers for what a visitor reads at the top of a battery page.
// The reader is replacing a battery, not designing a device: sizes in words and
// both units, voltages written out, uses from the data. Every number still
// comes from the entry; these functions only retell it.
//
// No runtime imports, so scripts/plain-check.mjs can load this file with Node's
// type stripping and assert on it at build time.
import type { Battery } from './data';

type B = Pick<Battery, 'id' | 'name' | 'form' | 'category' | 'dimensions' | 'variants' | 'codes' | 'devices' | 'geometry'> & { plain?: string };
type V = Battery['variants'][number];

const num = (n: number) => String(Number(n.toFixed(2)));

/** "a, b and c". When the last item already has an "and" ("wireless mice and
 *  keyboards"), commas only; when an earlier one does, a serial comma. */
export function list(items: string[]): string {
  if (items.length <= 1) return items.join('');
  const last = items[items.length - 1];
  const head = items.slice(0, -1);
  if (items.length > 2 && last.includes(' and ')) return items.join(', ');
  const serial = items.length > 2 && head.some((i) => i.includes(' and '));
  return `${head.join(', ')}${serial ? ',' : ''} and ${last}`;
}

// ------------------------------------------------------------------ a or an

// Letters whose spoken name starts with a vowel sound: "an F", "an LR44".
const VOWEL_LETTERS = new Set(['A', 'E', 'F', 'H', 'I', 'L', 'M', 'N', 'O', 'R', 'S', 'X']);

/** "a" or "an" by how the name is said: an AA, an LR44, an 18650, a CR2032, a 9V. */
export function art(name: string): 'a' | 'an' {
  const s = name.trim();
  const digits = /^\d+/.exec(s)?.[0];
  if (digits) {
    if (digits[0] === '8') return 'an';
    // 11 and 18 are said "eleven", "eighteen" when the number is read in pairs:
    // 18, 1865, 18650. Three digits are read "one ...": a 180.
    if ((digits.startsWith('11') || digits.startsWith('18')) && [2, 4, 5].includes(digits.length)) return 'an';
    return 'a';
  }
  const word = /^[A-Za-z]+/.exec(s)?.[0];
  if (!word) return 'a';
  // Capitals are spelled out (AA, CR2032, SR626SW); a word with lowercase
  // letters is said as a word (Sub-C).
  if (word === word.toUpperCase()) return VOWEL_LETTERS.has(word[0]) ? 'an' : 'a';
  return /^[aeio]/i.test(word) ? 'an' : 'a';
}

/** "an AA", "a CR2032". */
export const withArt = (name: string) => `${art(name)} ${name}`;

// ------------------------------------------------------------------ inches

/** Millimeters to the nearest 1/16 inch: "2 in", "9/16 in", "1 3/8 in". */
export function inFrac(mm: number): string {
  const n = Math.round((mm / 25.4) * 16);
  if (n === 0) return 'less than 1/16 in';
  const whole = Math.floor(n / 16);
  let rem = n % 16;
  let den = 16;
  while (rem && rem % 2 === 0) {
    rem /= 2;
    den /= 2;
  }
  if (!rem) return `${whole} in`;
  return whole ? `${whole} ${rem}/${den} in` : `${rem}/${den} in`;
}

// ------------------------------------------------------------------ coins

// US coin diameters in millimeters. 31 U.S.C. 5112(a) sets them in inches
// (dime 0.705, one-cent coin 0.75, 5-cent coin 0.835, quarter dollar 0.955);
// these are those figures times 25.4, to two places. Read 2026-11-23 at
// https://www.law.cornell.edu/uscode/text/31/5112. The United States Mint's
// coin specifications page refuses automated readers, so it is not the source.
// The law says one-cent coin; people say penny.
export const US_COINS = [
  { name: 'dime', mm: 17.91 },
  { name: 'penny', mm: 19.05 },
  { name: 'nickel', mm: 21.21 },
  { name: 'quarter', mm: 24.26 },
] as const;

/** A flat round battery against the US coin closest in size. */
export function coinCompare(mm: number): string {
  const nearest = [...US_COINS].sort((a, b) => Math.abs(a.mm - mm) - Math.abs(b.mm - mm))[0];
  if (Math.abs(nearest.mm - mm) <= 0.7) return `about the size of a US ${nearest.name}`;
  const bigger = US_COINS.find((c) => c.mm > mm && c.mm - mm <= 2.5);
  if (bigger) return `a little smaller than a US ${bigger.name}`;
  const smaller = [...US_COINS].reverse().find((c) => c.mm < mm && mm - c.mm <= 2.5);
  if (smaller) return `a little larger than a US ${smaller.name}`;
  return mm < US_COINS[0].mm ? 'smaller than a US dime' : 'larger than a US quarter';
}

// ------------------------------------------------------------------ size

type Part = [number, string];

function sizeParts(b: B): Part[] {
  const d = b.dimensions;
  if (b.form === 'disc') return [[d.diameter!.nominal, 'across'], [d.height.nominal, 'thick']];
  if (d.diameter && !d.width) return [[d.height.nominal, 'long'], [d.diameter.nominal, 'across']];
  const w = d.width!.nominal;
  const p = d.depth!.nominal;
  if (Math.abs(w - p) < 0.05) return [[d.height.nominal, 'tall'], [w, 'square']];
  return [[d.height.nominal, 'tall'], [w, 'wide'], [p, p / w < 0.75 ? 'thick' : 'deep']];
}

/** "50.5mm long and 14.5mm across (about 2 in by 9/16 in)". */
export function plainSize(b: B, opts: { inches?: boolean } = {}): string {
  const parts = sizeParts(b);
  const mm = list(parts.map(([n, w]) => `${num(n)}mm ${w}`));
  if (opts.inches === false) return mm;
  return `${mm} (about ${parts.map(([n]) => inFrac(n)).join(' by ')})`;
}

// ------------------------------------------------------------------ kinds

// How each kind is said inside a sentence. `word` describes the battery in the
// lead ("a 3-volt lithium battery"); `fine` tells two kinds apart when a size
// comes in both ("silver oxide ones are 1.55 volts").
const KIND_WORDS: Record<string, { word: string; fine: string }> = {
  alkaline: { word: 'alkaline', fine: 'alkaline' },
  'zinc-carbon': { word: 'zinc-carbon', fine: 'heavy duty' },
  'zinc-chloride': { word: 'zinc chloride', fine: 'heavy duty' },
  'nickel-oxyhydroxide': { word: 'NiOx', fine: 'NiOx' },
  'lithium-iron-disulfide': { word: 'lithium', fine: 'lithium' },
  'lithium-manganese-dioxide': { word: 'lithium', fine: 'lithium' },
  'lithium-carbon-monofluoride': { word: 'lithium', fine: 'BR lithium' },
  'lithium-thionyl-chloride': { word: 'lithium', fine: 'ER lithium' },
  'silver-oxide': { word: 'silver oxide', fine: 'silver oxide' },
  'zinc-air': { word: 'zinc-air', fine: 'zinc-air' },
  'mercury-oxide': { word: 'mercury', fine: 'mercury' },
  nimh: { word: 'rechargeable NiMH', fine: 'NiMH' },
  nicd: { word: 'rechargeable NiCd', fine: 'NiCd' },
  'nickel-zinc': { word: 'rechargeable NiZn', fine: 'NiZn' },
  'lithium-ion': { word: 'rechargeable lithium-ion', fine: 'lithium-ion' },
  'lithium-iron-phosphate': { word: 'rechargeable LiFePO4', fine: 'LiFePO4' },
  'lithium-ion-regulated': { word: 'rechargeable lithium', fine: 'lithium' },
  'lithium-manganese-rechargeable': { word: 'rechargeable lithium', fine: 'ML' },
  'lithium-vanadium-rechargeable': { word: 'rechargeable lithium', fine: 'VL' },
  'lithium-titanate': { word: 'rechargeable lithium', fine: 'LTO' },
};
const kindWord = (id: string) => KIND_WORDS[id] ?? { word: id, fine: id };
/** The short word for a kind in a list: "alkaline", "NiMH", "heavy duty". */
export const kindFine = (id: string) => kindWord(id).fine;

/** A variant sold under a different name in the same size (BR2032, LIR2032 on
 *  the CR2032 page): its label is a battery name, not a description. The
 *  summary describes the battery the page's name means. */
export const soldAsOther = (b: B, v: V) =>
  !!v.label &&
  v.label.toLowerCase() !== b.name.toLowerCase() &&
  (/^[A-Z]{1,5}\d[A-Z0-9/-]*$/.test(v.label) || b.codes.some((c) => c.code.toLowerCase() === v.label!.toLowerCase()));

export function coreVariants(b: B): V[] {
  const core = b.variants.filter((v) => !soldAsOther(b, v));
  return core.length ? core : b.variants;
}

interface Kind { chemistry: string; rechargeable: boolean; volts: number[] }

function kinds(vs: V[]): Kind[] {
  const m = new Map<string, Kind>();
  for (const v of vs) {
    if (!m.has(v.chemistry)) m.set(v.chemistry, { chemistry: v.chemistry, rechargeable: v.rechargeable, volts: [] });
    const k = m.get(v.chemistry)!;
    if (!k.volts.includes(v.voltage.nominal)) k.volts.push(v.voltage.nominal);
  }
  return [...m.values()];
}

/** "1.5", "8.4 or 9.6", "3.6 to 3.7": the voltages of one kind, low to high. */
export function voltPhrase(volts: number[]): string {
  const s = [...volts].sort((a, b) => a - b);
  if (s.length === 1) return num(s[0]);
  if (s.length === 2) return `${num(s[0])} or ${num(s[1])}`;
  return `${num(s[0])} to ${num(s[s.length - 1])}`;
}

/** The sentence about voltage, or null when one voltage covers every kind (it
 *  then goes in the lead as "3-volt"). */
function voltSentence(ks: Kind[]): string | null {
  const main = ks[0];
  const mainP = voltPhrase(main.volts);
  if (ks.every((k) => voltPhrase(k.volts) === mainP) && main.volts.length === 1) return null;
  if (ks.length === 1) return `It is ${mainP} volts, depending on the maker.`;
  const said = new Set([mainP]);
  const extras: string[] = [];
  const other = ks.find((k) => k.rechargeable !== main.rechargeable && !said.has(voltPhrase(k.volts)));
  if (other) {
    extras.push(`${other.rechargeable ? 'rechargeable' : 'single-use'} ones are ${voltPhrase(other.volts)} volts`);
    said.add(voltPhrase(other.volts));
  }
  const same = ks.find((k) => k !== main && k.rechargeable === main.rechargeable && !said.has(voltPhrase(k.volts)));
  if (same) extras.unshift(`${kindWord(same.chemistry).fine} ones are ${voltPhrase(same.volts)} volts`);
  const lead = main.rechargeable && ks.some((k) => !k.rechargeable) ? `Most are rechargeable, at ${mainP} volts` : `Most are ${mainP} volts`;
  if (!extras.length) return `${lead}.`;
  return `${lead}; ${extras.length === 2 ? `${extras[0]}, and ${extras[1]}` : extras[0]}.`;
}

// ------------------------------------------------------------------ uses

const KEEP_CASE = /^(Bluetooth|LED|USB|RF|BIOS|CMOS|TV|AED|GPS|IoT)\b/;

/** "Computer motherboards (BIOS and RTC backup)" to "computer motherboards". */
export function plainUse(s: string): string {
  const t = s.replace(/\s*\([^)]*\)/g, '').trim();
  if (KEEP_CASE.test(t) || /^[A-Z]{2}/.test(t)) return t;
  return t[0].toLowerCase() + t.slice(1);
}

// "Memory backup" is a job, not a thing a person holds; it reads wrong after
// "Common in". Such entries are used only when the list has nothing else.
const isJob = (s: string) => /\b(backup|save memory)$/i.test(s.replace(/\s*\([^)]*\)/g, '').trim());

/** Every use in one plain sentence, jobs in a second one: "Also common in
 *  remote controls and toys. Also used for memory backup." */
export function usesSentence(b: B, lead = 'Common in'): string {
  const all = b.devices ?? [];
  const things = all.filter((s) => !isJob(s)).map(plainUse);
  const jobs = all.filter(isJob).map(plainUse);
  return [
    things.length ? `${lead} ${list(things)}.` : '',
    jobs.length ? `${things.length ? 'Also used' : 'Used'} for ${list(jobs)}.` : '',
  ].filter(Boolean).join(' ');
}

/** Up to three uses, from the entry's own `devices` list, in its order. */
export function plainUses(b: B, n = 3): { items: string[]; jobs: boolean } {
  const all = b.devices ?? [];
  const things = all.filter((s) => !isJob(s));
  const pick = things.length ? things : all;
  return { items: pick.slice(0, n).map(plainUse), jobs: !things.length && all.length > 0 };
}

// ------------------------------------------------------------------ summary

const TERMINALS: Record<string, string> = {
  'snap-male': 'two snap terminals',
  spring: 'two springs',
  screw: 'two screw terminals',
  strip: 'two metal strip terminals',
};

/** The opening paragraph, generated from the data. */
export function generatedSummary(b: B): string {
  const d = b.dimensions;
  const ks = kinds(coreVariants(b));
  const vs = voltSentence(ks);
  const words = [...new Set(ks.map((k) => kindWord(k.chemistry).word))];
  const allRech = ks.every((k) => k.rechargeable);
  const adj: string[] = [];
  if (!vs) adj.push(`${num(ks[0].volts[0])}-volt`);
  if (words.length === 1) adj.push(words[0]);
  else if (allRech) adj.push('rechargeable');
  const desc = adj.length ? `${adj.join(' ')} ` : '';
  const term = b.geometry?.positive?.style ? TERMINALS[b.geometry.positive.style] : undefined;
  const withTerm = term ? ` with ${term} on top` : '';
  const size = plainSize(b);
  const out: string[] = [];

  if (b.form === 'disc') {
    const D = d.diameter!.nominal;
    const flat = d.height.nominal / D <= 0.3;
    const shape = [D < 13 ? 'small' : '', flat ? 'flat' : '', 'round'].filter(Boolean).join(', ');
    const noun = b.category === 'button' ? 'button battery' : b.category === 'hearing-aid' ? 'hearing aid battery' : 'battery';
    out.push(`${capFirst(`${art(shape)} ${shape}`)} ${desc}${noun}, ${size}, ${coinCompare(D)}.`);
    if (b.category === 'hearing-aid' && b.geometry?.tab_color_name) out.push(`The sticker tab is ${b.geometry.tab_color_name.toLowerCase()}.`);
  } else if (b.form === 'cylinder') {
    out.push(`A round ${desc}battery ${size}.`);
  } else if (b.form === 'twin') {
    out.push(`${capFirst(`${art(desc || 'battery')} ${desc}`)}battery shaped like two round batteries side by side, ${size}.`);
  } else if (b.form === 'lantern') {
    out.push(`A large ${desc}lantern battery${withTerm}, ${size}.`);
  } else if (b.form === 'flatpack') {
    out.push(`A flat, rectangular ${desc}battery${withTerm}, ${size}.`);
  } else {
    out.push(`A rectangular ${desc}battery${withTerm}, ${size}.`);
  }
  if (vs) out.push(vs);
  const uses = plainUses(b);
  if (uses.jobs) out.push(`Used for ${list(uses.items)}.`);
  else if (uses.items.length === 1) out.push(`Used in ${uses.items[0]}.`);
  else if (uses.items.length > 1) out.push(`Common in ${list(uses.items)}.`);
  return out.join(' ');
}

/** The hand-written `plain` string when the entry has one, else the generated one. */
export function plainSummary(b: B): string {
  return b.plain?.trim() || generatedSummary(b);
}

function capFirst(s: string) {
  return s[0].toUpperCase() + s.slice(1);
}

// ------------------------------------------------------------------ at a glance

/** "No", "Yes" or "Sold both ways", judged on the battery the name means. */
export function plainRechargeable(b: B): string {
  const core = coreVariants(b);
  const r = core.filter((v) => v.rechargeable).length;
  const base = r === 0 ? 'No' : r === core.length ? 'Yes' : 'Sold both ways';
  const other = b.variants.filter((v) => soldAsOther(b, v) && v.rechargeable !== (r > 0)).map((v) => v.label!);
  if (r === 0 && other.length) return `No. The rechargeable version is sold as ${list([...new Set(other)])}.`;
  return base;
}

/** Voltage written out by kind, one line per voltage: "1.5V alkaline, lithium
 *  and heavy duty", "1.2V rechargeable NiMH". Kinds no longer made are left
 *  to the full table when anything current remains. A same-size battery sold
 *  under another name gets its own line when its voltage differs:
 *  "3.6V rechargeable, sold as LIR2032". */
export function voltageLines(b: B, isCurrent: (chemistry: string) => boolean = () => true): string[] {
  const core = coreVariants(b);
  const current = core.filter((v) => isCurrent(v.chemistry));
  const use = current.length ? current : core;
  const lines = new Map<string, { rech: boolean; phrase: string; words: string[] }>();
  for (const k of kinds(use)) {
    const phrase = voltPhrase(k.volts);
    const key = `${k.rechargeable}|${phrase}`;
    if (!lines.has(key)) lines.set(key, { rech: k.rechargeable, phrase, words: [] });
    const l = lines.get(key)!;
    const w = kindWord(k.chemistry).fine;
    if (!l.words.includes(w)) l.words.push(w);
  }
  const out = [...lines.values()].map((l) => `${l.phrase}V ${l.rech ? 'rechargeable ' : ''}${list(l.words)}`);
  for (const v of b.variants.filter((x) => soldAsOther(b, x))) {
    const same = use.some((c) => c.voltage.nominal === v.voltage.nominal && c.rechargeable === v.rechargeable);
    const line = `${num(v.voltage.nominal)}V${v.rechargeable ? ' rechargeable' : ''}, sold as ${v.label}`;
    if (!same && !out.includes(line)) out.push(line);
  }
  return out;
}

/** Voltage for a tile, written out: "3 volts", "1.5 volts; rechargeable 1.2
 *  volts", "1.5 volts; silver oxide 1.55 volts". */
export function plainVoltsShort(b: B): string {
  const ks = kinds(coreVariants(b));
  const main = ks[0];
  const mainP = voltPhrase(main.volts);
  if (ks.every((k) => voltPhrase(k.volts) === mainP)) return `${mainP} volts`;
  const other = ks.find((k) => k.rechargeable !== main.rechargeable && voltPhrase(k.volts) !== mainP);
  if (other) return `${mainP} volts; ${other.rechargeable ? 'rechargeable' : 'single-use'} ${voltPhrase(other.volts)} volts`;
  const same = ks.find((k) => k !== main && voltPhrase(k.volts) !== mainP)!;
  return `${mainP} volts; ${kindWord(same.chemistry).fine} ${voltPhrase(same.volts)} volts`;
}

/** Common names fit for the top of a page: aliases that say "cell" or
 *  "primary" ("Coin cell", "15270 (lithium primary naming)") stay in the full
 *  list of other names, where people who type them will find them, and out of
 *  the short lists. */
export const nicknames = (b: { aliases?: string[] }) => (b.aliases ?? []).filter((a) => !/\b(cells?|primary)\b/i.test(a));

/** What a tile in a list of sizes shows under the name. */
export function tileFacts(b: B & { aliases?: string[] }) {
  // Two names fit on a tile, so the extra AG slot on button batteries is cut.
  const names = otherNames(b, 2).slice(0, 2);
  for (const a of nicknames(b)) if (names.length < 2 && !names.includes(a)) names.push(a);
  return { size: plainSize(b, { inches: false }), volts: plainVoltsShort(b), names };
}

const oz = (g: number) => {
  const o = g / 28.3495;
  return `${num(Number(o.toFixed(o < 0.1 ? 2 : 1)))} oz`;
};

/** "About 23g (0.8 oz), alkaline": the first listed kind's weight, else the
 *  range across the listed products. */
export function plainWeight(b: B): string {
  const pv = b.variants[0];
  if (pv.weight_g) return `About ${num(pv.weight_g)}g (${oz(pv.weight_g)}), ${soldAsOther(b, pv) ? pv.label : kindWord(pv.chemistry).fine}`;
  const ws = b.variants.map((v) => v.weight_g).filter((w): w is number => !!w);
  if (!ws.length) return 'Not published';
  const lo = Math.min(...ws);
  const hi = Math.max(...ws);
  if (lo === hi) return `About ${num(lo)}g (${oz(lo)})`;
  const [olo, ohi] = [oz(lo), oz(hi)];
  return `${num(lo)} to ${num(hi)}g (${olo === ohi ? olo : `${olo.replace(' oz', '')} to ${ohi}`}), depending on the product`;
}

// Well-known makers whose names a shopper finds on a pack, in this order.
// Other makers, watchmakers' replacement numbers (Citizen 280-08) and US or
// Japanese standard numbers (5004LC, UM-3) stay in the full table.
const MAKERS = ['Duracell', 'Energizer', 'Panasonic', 'Rayovac', 'Maxell', 'Renata', 'Sony', 'Varta'];
/** A maker's catalog number rather than a name on the pack: one the data
 *  calls a type number ("Varta type number 6032") or a bare Varta number.
 *  Varta's lettered names (V13GA) count as names. A number a brand prints
 *  large on its own pack (Energizer 357) counts as a name too. */
const isTypeNumber = (c: B['codes'][number]) => /type number/i.test(c.note ?? '') || (c.system === 'Varta' && /^\d+$/.test(c.code));

/** A few other names a shopper sees on the pack for the main kind (or for
 *  any kind), at most one per system. May be empty.
 *  - First, the IEC name when it differs from the page's own name (LR6 on
 *    the AA), even when it is also listed as an alias (PR41 on the 312).
 *  - On a button battery, the AG size number of the same kind (AG13 on the
 *    LR44). It comes on top of n, so that line may show n + 1 names.
 *  - Then names from the well-known makers in MAKERS, in that order.
 *  Names for other kinds (BR1632A on a CR1632, AG4 on the silver oxide
 *  SR626SW), product model numbers and other-name variants (LIR2032) are left
 *  to the full table, so "Any battery sold as these is a CR2032" stays true. */
export function otherNames(b: B & { aliases?: string[] }, n = 3): string[] {
  const main = b.variants[0].chemistry;
  const labelTokens = new Set(b.variants.flatMap((v) => (v.label ?? '').split(/[\s(),]+/)).filter(Boolean).map((t) => t.toLowerCase()));
  const self = b.name.toLowerCase();
  const ofThisKind = (c: B['codes'][number]) => !labelTokens.has(c.code.toLowerCase()) && (!c.chemistry || c.chemistry === main);
  const out: string[] = [];
  const systems = new Set<string>();
  const taken = new Set([self, ...(b.aliases ?? []).map((s) => s.toLowerCase())]);
  const take = (c: B['codes'][number]) => {
    out.push(c.code);
    taken.add(c.code.toLowerCase());
    systems.add(c.system);
  };

  const iec = b.codes.find((c) => c.system === 'IEC' && ofThisKind(c) && c.code.toLowerCase() !== self);
  if (iec) take(iec);
  const ag = b.category === 'button' ? b.codes.find((c) => c.system === 'Generic' && /^AG\d+$/i.test(c.code) && ofThisKind(c)) : undefined;
  if (ag) take(ag);
  const limit = n + (ag ? 1 : 0);

  const sorted = b.codes
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => ofThisKind(c) && MAKERS.includes(c.system) && !isTypeNumber(c))
    .sort((x, y) => MAKERS.indexOf(x.c.system) - MAKERS.indexOf(y.c.system) || x.i - y.i);
  for (const { c } of sorted) {
    if (out.length >= limit) break;
    if (taken.has(c.code.toLowerCase()) || systems.has(c.system)) continue;
    take(c);
  }
  return out;
}

// ------------------------------------------------------------------ dates

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-11-22" to "November 22, 2026". */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

// ------------------------------------------------------------------ order

/** The sizes people look for most, first, in this order. */
export const COMMON = ['aa', 'aaa', 'c', 'd', '9v', 'cr2032', 'cr2025', 'cr2016', 'lr44', 'cr123a', '18650', 'a23', 'lr41', 'cr1632', 'cr2450', '312', '13', '10', '675'];

/** Comparator: COMMON ids first in that order, everything else keeps its
 *  existing order (Array.prototype.sort is stable). */
export function byCommon(a: { id: string }, b: { id: string }): number {
  const ia = COMMON.indexOf(a.id);
  const ib = COMMON.indexOf(b.id);
  if (ia === -1 && ib === -1) return 0;
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
}
