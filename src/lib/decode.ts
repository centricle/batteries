// Battery code decoder: IEC 60086 (primary), IEC 61951 (NiMH, NiCd), IEC 61960
// (lithium-ion) and ANSI C18. Pure functions with no DOM, so the /decode page
// runs them in the browser and its server-rendered example uses the same code.
// The built-in tables follow IEC 60086-1 as summarized by Wikipedia's "Battery
// nomenclature" and "List of battery sizes" (read 2026-11-22). When
// data/iec-system.json exists, mergeTables() lets its entries override these.

export type Role = 'series' | 'chem' | 'shape' | 'size' | 'suffix' | 'parallel' | 'prefix' | 'model' | 'name' | 'voltage';

export interface Segment {
  text: string;
  role: Role;
  title: string;
  meaning: string;
}

export interface Decoded {
  input: string;
  system: string;
  segments: Segment[];
  summary: string;
  voltage?: { cells: number; per: number; total: number };
  dims?: { d?: number; h?: number; approx?: boolean };
  notes: string[];
  /** True when the pattern was recognized but a part of it was not. */
  partial?: boolean;
  /** For IEC codes with a suffix: the code without it (SR626SW -> SR626). */
  core?: string;
}

export interface ChemEntry { name: string; v?: number; chemistry?: string; withdrawn?: boolean; note?: string }
export interface SizeEntry { name?: string; d?: number; h?: number; note?: string }

export interface Tables {
  chem: Record<string, ChemEntry>;
  recharge: Record<string, ChemEntry>;
  shape: Record<string, { name: string; note?: string }>;
  legacy: Record<string, SizeEntry>;
  diameter: Record<string, number>;
  suffix: Record<string, string>;
  liAnode: Record<string, string>;
  liCathode: Record<string, { name: string; note?: string }>;
  ansiSize: Record<string, string>;
  ansiSuffix: Record<string, { name: string; iec?: string }>;
  source: string;
}

// ------------------------------------------------------------------ tables

export const BUILTIN: Tables = {
  // IEC 60086-1 electrochemical system letters. '' is the absent letter.
  chem: {
    '': { name: 'Zinc-carbon', v: 1.5, chemistry: 'zinc-carbon', note: 'No letter: zinc negative, ammonium or zinc chloride electrolyte, manganese dioxide positive.' },
    A: { name: 'Zinc-air, neutral electrolyte', v: 1.4, chemistry: 'zinc-air', note: 'Rare in consumer cells; consumer zinc-air cells use P.' },
    B: { name: 'Lithium carbon monofluoride', v: 3.0, chemistry: 'lithium-carbon-monofluoride' },
    C: { name: 'Lithium manganese dioxide', v: 3.0, chemistry: 'lithium-manganese-dioxide' },
    E: { name: 'Lithium thionyl chloride', v: 3.6, chemistry: 'lithium-thionyl-chloride' },
    F: { name: 'Lithium iron disulfide', v: 1.5, chemistry: 'lithium-iron-disulfide' },
    G: { name: 'Lithium copper oxide', v: 1.5, note: 'Rare in consumer cells.' },
    L: { name: 'Alkaline', v: 1.5, chemistry: 'alkaline', note: 'Zinc negative, alkali metal hydroxide electrolyte, manganese dioxide positive.' },
    M: { name: 'Mercuric oxide', v: 1.35, chemistry: 'mercury-oxide', withdrawn: true },
    N: { name: 'Mercuric oxide and manganese dioxide', v: 1.4, chemistry: 'mercury-oxide', withdrawn: true },
    P: { name: 'Zinc-air', v: 1.4, chemistry: 'zinc-air', note: 'Alkaline electrolyte; the hearing aid chemistry.' },
    S: { name: 'Silver oxide', v: 1.55, chemistry: 'silver-oxide' },
    Z: { name: 'Nickel oxyhydroxide', v: 1.5, chemistry: 'nickel-oxyhydroxide' },
  },
  // IEC 61951-1 and -2: rechargeable cells that share primary sizes.
  recharge: {
    H: { name: 'Nickel-metal hydride (rechargeable)', v: 1.2, chemistry: 'nimh', note: 'IEC 61951-2.' },
    K: { name: 'Nickel-cadmium (rechargeable)', v: 1.2, chemistry: 'nicd', note: 'IEC 61951-1.' },
  },
  shape: {
    R: { name: 'Round', note: 'Cylindrical, coin or button.' },
    P: { name: 'Prismatic', note: 'Non-round.' },
    F: { name: 'Flat (layer-built)', note: 'Still in use, not used for new designations.' },
    S: { name: 'Square or rectangular', note: 'Still in use, not used for new designations.' },
  },
  // Size numbers kept from earlier editions of IEC 60086, keyed by shape + number.
  // Dimensions are nominal diameter x height in mm.
  legacy: {
    R03: { name: 'AAA', d: 10.5, h: 44.5 },
    R1: { name: 'N', d: 12, h: 30.2 },
    R6: { name: 'AA', d: 14.5, h: 50.5 },
    R9: { name: 'Button, 625 size', d: 15.5, h: 6.0 },
    R12: { name: 'B', d: 21.5, h: 60 },
    R14: { name: 'C', d: 26.2, h: 50 },
    R20: { name: 'D', d: 34.2, h: 61.5 },
    R23: { name: 'A', d: 17, h: 50 },
    R25: { name: 'F', d: 32, h: 91 },
    R40: { name: 'No. 6', d: 67, h: 172 },
    R61: { name: 'Inner cell of a 9 V battery', note: 'Six of them stack into a 6LR61. Similar in size to AAAA.' },
    R41: { name: 'Button', d: 7.9, h: 3.6 },
    R42: { name: 'Button', d: 11.6, h: 3.6 },
    R43: { name: 'Button', d: 11.6, h: 4.2 },
    R44: { name: 'Button', d: 11.6, h: 5.4 },
    R45: { name: 'Button', d: 9.5, h: 3.6 },
    R48: { name: 'Button', d: 7.9, h: 5.4 },
    R52: { name: 'Button', d: 15.8, h: 11.1 },
    R54: { name: 'Button', d: 11.6, h: 3.1 },
    R55: { name: 'Button', d: 11.6, h: 2.1 },
    R56: { name: 'Button', d: 11.6, h: 2.6 },
    R57: { name: 'Button', d: 9.5, h: 2.6 },
    R58: { name: 'Button', d: 7.9, h: 2.1 },
    R59: { name: 'Button', d: 7.9, h: 2.6 },
    R60: { name: 'Button', d: 6.8, h: 2.1 },
    R62: { name: 'Button', d: 5.8, h: 1.6 },
    R63: { name: 'Button', d: 5.8, h: 2.1 },
    R64: { name: 'Button', d: 5.8, h: 2.7 },
    R65: { name: 'Button', d: 6.8, h: 1.65 },
    R66: { name: 'Button', d: 6.8, h: 2.6 },
    R67: { name: 'Button', d: 7.9, h: 1.65 },
    R68: { name: 'Button', d: 9.5, h: 1.6 },
    R69: { name: 'Button', d: 9.5, h: 2.1 },
    R70: { name: 'Button', d: 5.8, h: 3.6 },
    F22: { name: 'Flat cell, size 22', note: 'Six of them stack into a 6F22 (9 V) battery.' },
  },
  // IEC recommended diameter codes: code -> maximum diameter in mm.
  diameter: { '4': 4.8, '5': 5.8, '6': 6.8, '7': 7.9, '9': 9.5, '10': 10, '11': 11.6, '12': 12.5, '16': 16, '20': 20, '23': 23, '24': 24.5 },
  suffix: {
    SW: 'Low drain silver oxide cell (manufacturer usage). W alone marks the high drain version of the same size.',
    W: 'Meets IEC 60086-3, the watch battery standard. In manufacturer usage, W alone marks a high drain cell and SW a low drain cell.',
    X: 'Terminal style or variant of the same battery.',
    Y: 'Terminal style or variant of the same battery.',
    S: 'Performance level or electrolyte variant (manufacturer-defined).',
    P: 'Performance level (manufacturer-defined); often a high-power or photo grade.',
    C: 'Performance level (manufacturer-defined).',
    CF: 'Performance level (manufacturer-defined).',
    HH: 'Performance level (manufacturer-defined).',
    HB: 'Performance level (manufacturer-defined).',
  },
  // IEC 61960 lithium-ion letters.
  liAnode: { I: 'Lithium-ion (intercalation) negative electrode', L: 'Lithium metal or lithium alloy negative electrode' },
  liCathode: {
    C: { name: 'Cobalt-based positive electrode', note: 'Lithium cobalt oxide (LCO) in common usage.' },
    N: { name: 'Nickel-based positive electrode', note: 'Nickel manganese cobalt (NMC) or nickel cobalt aluminum (NCA) in common usage.' },
    M: { name: 'Manganese-based positive electrode', note: 'Lithium manganese oxide (LMO) in common usage.' },
    V: { name: 'Vanadium-based positive electrode' },
    T: { name: 'Titanium-based positive electrode' },
    F: { name: 'Iron phosphate positive electrode', note: 'LiFePO4. Manufacturer usage; F is not among the IEC 61960 positive electrode letters.' },
  },
  ansiSize: { '13': 'D', '14': 'C', '15': 'AA', '24': 'AAA', '25': 'AAAA' },
  ansiSuffix: {
    '': { name: 'Carbon-zinc', iec: '' },
    A: { name: 'Alkaline', iec: 'L' },
    AC: { name: 'Alkaline, industrial', iec: 'L' },
    AP: { name: 'Alkaline, photographic', iec: 'L' },
    C: { name: 'Carbon-zinc, industrial', iec: '' },
    CD: { name: 'Carbon-zinc, industrial heavy duty', iec: '' },
    D: { name: 'Carbon-zinc, heavy duty', iec: '' },
    F: { name: 'Carbon-zinc, general purpose', iec: '' },
    H: { name: 'Nickel-metal hydride (rechargeable)', iec: 'H' },
    K: { name: 'Nickel-cadmium (rechargeable)', iec: 'K' },
    LB: { name: 'Lithium carbon monofluoride', iec: 'B' },
    LC: { name: 'Lithium manganese dioxide', iec: 'C' },
    LF: { name: 'Lithium iron disulfide', iec: 'F' },
    M: { name: 'Mercuric oxide (withdrawn)', iec: 'M' },
    SO: { name: 'Silver oxide', iec: 'S' },
    SOP: { name: 'Silver oxide, photographic', iec: 'S' },
    Z: { name: 'Zinc-air', iec: 'P' },
    ZD: { name: 'Zinc-air, heavy duty', iec: 'P' },
  },
  source: 'built-in',
};

// Modifier letters for a size code: A..L without F and I, worth 0..9 tenths.
const MOD = 'ABCDEGHJKL';

// Manufacturer and industry prefixes that look like IEC letters but are not.
const PREFIXES: Record<string, { title: string; meaning: string; rest: 'size' | 'number' | 'cell' }> = {
  LIR: { title: 'Lithium-ion, round', meaning: 'Industry prefix for rechargeable lithium-ion coin and small round cells, 3.6 to 3.7 V. Not an IEC 60086 code.', rest: 'size' },
  ML: { title: 'Panasonic: manganese lithium, rechargeable', meaning: 'Panasonic prefix for rechargeable lithium manganese coin cells, 3 V.', rest: 'size' },
  VL: { title: 'Panasonic: vanadium lithium, rechargeable', meaning: 'Panasonic prefix for rechargeable vanadium pentoxide lithium coin cells, 3 V.', rest: 'size' },
  MS: { title: 'Seiko: manganese silicon lithium, rechargeable', meaning: 'Seiko Instruments prefix for rechargeable manganese silicon lithium cells, 3 V. Not the IEC letters M (mercury) and S (square).', rest: 'size' },
  LSH: { title: 'Saft: lithium thionyl chloride, high power', meaning: 'Saft prefix for high-power lithium thionyl chloride cells, 3.6 V.', rest: 'size' },
  LS: { title: 'Saft: lithium thionyl chloride', meaning: 'Saft prefix for lithium thionyl chloride cells, 3.6 V. The IEC equivalent letters are ER.', rest: 'size' },
  NCR: { title: 'Panasonic lithium-ion', meaning: "Panasonic's prefix for its nickel-based lithium-ion cells. Not an IEC 61960 code.", rest: 'size' },
  UR: { title: 'Panasonic (Sanyo) lithium-ion', meaning: 'Panasonic and former Sanyo prefix for lithium-ion cells.', rest: 'size' },
  US: { title: 'Sony and Murata lithium-ion', meaning: 'Sony, now Murata, prefix for lithium-ion cells.', rest: 'size' },
  AG: { title: 'Alkaline button, industry number', meaning: 'Industry numbering for alkaline button cells. The number is a sequence, not a size: AG13 is LR44.', rest: 'number' },
  SG: { title: 'Silver oxide button, industry number', meaning: 'Industry numbering for silver oxide button cells, parallel to AG.', rest: 'number' },
  PX: { title: 'Legacy Eveready and Duracell number', meaning: 'Prefix from the mercury cell era, still used on some replacements.', rest: 'number' },
  EPX: { title: 'Energizer number', meaning: 'Energizer prefix for replacements of former PX cells.', rest: 'number' },
  MN: { title: 'Duracell number', meaning: 'Duracell alkaline product numbering (MN1500 is AA).', rest: 'number' },
  DL: { title: 'Duracell lithium', meaning: 'Duracell prefix for lithium cells; the rest is the cell name.', rest: 'cell' },
  EL: { title: 'Energizer lithium', meaning: 'Energizer prefix for lithium cells; the rest is the cell name.', rest: 'cell' },
  KL: { title: 'Kodak lithium', meaning: 'Kodak prefix for lithium cells; the rest is the cell name.', rest: 'cell' },
};

// Names that are not systematic codes.
const COMMON: Record<string, { iec: string; note: string }> = {
  AAAA: { iec: 'LR8D425', note: 'Common name. IEC: LR8D425 (alkaline). ANSI: 25.' },
  AAA: { iec: 'LR03', note: 'Common name. IEC size R03: LR03 alkaline, HR03 NiMH, FR03 lithium. ANSI: 24.' },
  AA: { iec: 'LR6', note: 'Common name. IEC size R6: LR6 alkaline, HR6 NiMH, FR6 lithium. ANSI: 15.' },
  A: { iec: 'LR23', note: 'Common name. IEC size R23.' },
  B: { iec: 'LR12', note: 'Common name. IEC size R12.' },
  C: { iec: 'LR14', note: 'Common name. IEC size R14: LR14 alkaline, HR14 NiMH. ANSI: 14.' },
  D: { iec: 'LR20', note: 'Common name. IEC size R20: LR20 alkaline, HR20 NiMH. ANSI: 13.' },
  N: { iec: 'LR1', note: 'Common name. IEC size R1.' },
  F: { iec: 'LR25', note: 'Common name. IEC size R25.' },
  '9V': { iec: '6LR61', note: 'Common name. IEC: 6LR61 (alkaline), 6F22 (zinc-carbon), 6HR61 (NiMH). ANSI: 1604.' },
  PP3: { iec: '6LR61', note: 'Older British name for the 9 V battery.' },
  SUBC: { iec: 'HR22C429', note: 'Common name for a rechargeable size. IEC: HR22C429 (NiMH), KR22C429 (NiCd).' },
};

// Whole-code exceptions: manufacturer names that sit in the IEC namespace.
const EXCEPTIONS: Record<string, { segments: Omit<Segment, 'text'>[]; split: string[]; summary: string; notes?: string[] }> = {
  CR123A: {
    split: ['C', 'R', '123A'],
    segments: [
      { role: 'chem', title: 'Lithium manganese dioxide', meaning: '3.0 V nominal.' },
      { role: 'shape', title: 'Round', meaning: 'Cylindrical cell.' },
      { role: 'name', title: 'Size name, not a size code', meaning: 'A manufacturer name that became standard. The systematic IEC code is CR17345: 17 mm by 34.5 mm.' },
    ],
    summary: 'A 3 V lithium manganese dioxide photo cell. The systematic IEC code is CR17345 (17 mm by 34.5 mm).',
  },
  CR2: {
    split: ['C', 'R', '2'],
    segments: [
      { role: 'chem', title: 'Lithium manganese dioxide', meaning: '3.0 V nominal.' },
      { role: 'shape', title: 'Round', meaning: 'Cylindrical cell.' },
      { role: 'name', title: 'Size name, not a size code', meaning: 'The systematic IEC code is CR15H270: 15 mm plus modifier H (0.6 mm), so 15.6 mm, by 27.0 mm.' },
    ],
    summary: 'A 3 V lithium manganese dioxide photo cell. The systematic IEC code is CR15H270 (15.6 mm by 27.0 mm).',
  },
  CRP2: {
    split: ['C', 'R', '-P2'],
    segments: [
      { role: 'chem', title: 'Lithium manganese dioxide', meaning: '3.0 V per cell.' },
      { role: 'shape', title: 'Round cells', meaning: 'The pack holds round cells.' },
      { role: 'name', title: 'Pack name', meaning: 'A two-cell 6 V photo pack. P2 is a manufacturer pack name, not a size code.' },
    ],
    summary: 'A 6 V lithium photo pack of two cells in series.',
  },
  CRV3: {
    split: ['C', 'R', '-V3'],
    segments: [
      { role: 'chem', title: 'Lithium manganese dioxide', meaning: '3.0 V per cell.' },
      { role: 'shape', title: 'Round cells', meaning: 'The pack holds round cells.' },
      { role: 'name', title: 'Pack name', meaning: 'A 3 V pack the size of two AA cells side by side. V3 is a manufacturer name, not a size code.' },
    ],
    summary: 'A 3 V lithium pack the size of two AA cells side by side.',
  },
  '2CR5': {
    split: ['2', 'C', 'R', '5'],
    segments: [
      { role: 'series', title: '2 cells in series', meaning: '2 × 3.0 V = 6 V.' },
      { role: 'chem', title: 'Lithium manganese dioxide', meaning: '3.0 V per cell.' },
      { role: 'shape', title: 'Round cells', meaning: 'The pack holds round cells.' },
      { role: 'size', title: 'Size code 5', meaning: 'The standardized code for this pack, not a cell dimension.' },
    ],
    summary: 'A 6 V lithium photo pack of two round cells in series.',
  },
};

// ------------------------------------------------------------- formatting

/** Lowercase a leading capital for mid-sentence use, leaving acronyms and formulas alone. */
const lc = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const f = (n: number, max = 2) => Number(n.toFixed(max)).toLocaleString('en-US', { maximumFractionDigits: max });
const mm = (n: number) => `${f(n)} mm`;

function chemSeg(t: Tables, letter: string): Segment | null {
  const c = t.chem[letter] ?? t.recharge[letter];
  if (!c) return null;
  const std = t.recharge[letter] ? 'IEC 61951' : 'IEC 60086-1';
  return {
    text: letter || '·',
    role: 'chem',
    title: letter ? c.name : `No letter: ${lc(c.name)}`,
    meaning: [c.v ? `${f(c.v)} V nominal.` : '', c.withdrawn ? 'Withdrawn from the standard.' : '', c.note ?? '', `(${std})`].filter(Boolean).join(' '),
  };
}

/** Size digits after the shape letter: legacy number, or diameter + height. */
function sizeSegs(t: Tables, shape: string, size: string): { segs: Segment[]; dims?: Decoded['dims']; ok: boolean; name?: string } {
  // Diameter with a modifier letter: 8D425 = 8.3 mm x 42.5 mm.
  const mod = size.match(/^(\d{1,2})([A-HJ-L])(\d{2,3})$/);
  if (mod) {
    const d = parseInt(mod[1], 10) + MOD.indexOf(mod[2]) / 10;
    const h = parseInt(mod[3], 10) / 10;
    return {
      ok: true,
      dims: { d, h },
      segs: [
        { text: mod[1] + mod[2], role: 'size', title: `Diameter ${mm(d)}`, meaning: `${mod[1]} mm plus modifier ${mod[2]} (${MOD.indexOf(mod[2])} tenths): ${mm(d)} maximum.` },
        { text: mod[3], role: 'size', title: `Height ${mm(h)}`, meaning: `Height in tenths of a millimeter: ${mod[3]} = ${mm(h)}.` },
      ],
    };
  }
  // Oblique form for cells 100 mm or larger: diameter/height in mm.
  const ob = size.match(/^(\d+)\/(\d+)$/);
  if (ob) {
    const d = parseInt(ob[1], 10), h = parseInt(ob[2], 10);
    return { ok: true, dims: { d, h }, segs: [{ text: size, role: 'size', title: `${d} by ${h} mm`, meaning: 'A dimension of 100 mm or more is written diameter / height in whole millimeters.' }] };
  }
  if (/^\d{1,2}$/.test(size)) {
    const key = shape + size;
    const L = t.legacy[key];
    if (L) {
      const dimsTxt = L.d && L.h ? `${mm(L.d)} by ${mm(L.h)} nominal.` : '';
      return {
        ok: true,
        name: L.name,
        dims: L.d && L.h ? { d: L.d, h: L.h, approx: true } : undefined,
        segs: [{ text: size, role: 'size', title: `Size ${size}${L.name ? `: ${L.name}` : ''}`, meaning: [`A legacy size number from earlier editions of IEC 60086, not a measurement.`, dimsTxt, L.note ?? ''].filter(Boolean).join(' ') }],
      };
    }
    return { ok: false, segs: [{ text: size, role: 'size', title: `Size ${size}`, meaning: 'A one- or two-digit legacy size number. This one is not in the table this page uses.' }] };
  }
  if (shape !== 'R') {
    return { ok: true, segs: [{ text: size, role: 'size', title: `Size code ${size}`, meaning: `A size code for a ${t.shape[shape]?.name.toLowerCase() ?? 'non-round'} cell or battery. For non-round shapes it does not read as diameter and height.` }] };
  }
  if (/^\d{3,5}$/.test(size)) {
    // 3 digits: one-digit diameter code + height in tenths (626 = 6.8 x 2.6).
    // 4 digits: two-digit diameter + height in tenths (2032 = 20 x 3.2).
    // 5 digits: two-digit diameter + three-digit height in tenths (17345 = 17 x 34.5).
    const dLen = size.length === 3 ? 1 : 2;
    const dc = size.slice(0, dLen);
    const hc = size.slice(dLen);
    const h = parseInt(hc, 10) / 10;
    const table = t.diameter[String(parseInt(dc, 10))];
    const d = table ?? parseInt(dc, 10);
    return {
      ok: true,
      dims: { d, h, approx: !table },
      segs: [
        { text: dc, role: 'size', title: table ? `Diameter up to ${mm(d)}` : `Diameter about ${mm(d)}`, meaning: table ? `Diameter code ${dc}: ${mm(d)} maximum (IEC recommended diameter codes).` : `Diameter in whole millimeters, truncated: ${dc} = ${mm(d)} and up to just under ${mm(d + 1)}.` },
        { text: hc, role: 'size', title: `Height ${mm(h)}`, meaning: `Height (thickness for a coin) in tenths of a millimeter: ${hc} = ${mm(h)}.` },
      ],
    };
  }
  return { ok: false, segs: [{ text: size, role: 'size', title: 'Size', meaning: 'Not a size pattern this page recognizes.' }] };
}

function suffixSeg(t: Tables, s: string): Segment {
  const m = t.suffix[s];
  if (m) return { text: s, role: 'suffix', title: `Suffix ${s}`, meaning: m };
  if (s.length === 1 && MOD.includes(s)) return { text: s, role: 'suffix', title: `Modifier ${s}`, meaning: `A dimension modifier (${MOD.indexOf(s)} on the A to L scale) or a variant letter.` };
  return { text: s, role: 'suffix', title: `Suffix ${s}`, meaning: 'Variant, terminal or performance letters. Their meaning is set by the maker.' };
}

// ----------------------------------------------------------------- decode

export function clean(input: string) {
  return input.trim().toUpperCase().replace(/[\s_]+/g, '').replace(/[‐-―]/g, '-');
}

/** Decode one code. Returns null when no rule recognizes it. */
export function decode(input: string, t: Tables = BUILTIN, opts: { liIon?: boolean } = {}): Decoded | null {
  const raw = clean(input);
  if (!raw) return null;
  const key = raw.replace(/-/g, '');

  // 1. Manufacturer names in the IEC namespace.
  const ex = EXCEPTIONS[key];
  if (ex) {
    const total = ex.segments.find((s) => s.role === 'series') ? 6 : undefined;
    return {
      input: raw,
      system: 'Named size in IEC letters',
      segments: ex.segments.map((s, i) => ({ ...s, text: ex.split[i] })),
      summary: ex.summary,
      voltage: total ? { cells: 2, per: 3, total } : undefined,
      notes: ex.notes ?? [],
    };
  }

  // 2. Common names.
  const cm = COMMON[key];
  if (cm) {
    return {
      input: raw,
      system: 'Common name',
      segments: [{ text: raw, role: 'name', title: 'Common size name', meaning: cm.note }],
      summary: `${raw} is a common name, not a systematic code. ${cm.note}`,
      notes: [`Decode the IEC code instead: ${cm.iec}.`],
    };
  }

  // 3. IEC 61960 lithium-ion: [cells] I/L, cathode, R/P, then dimensions.
  const li = raw.match(/^(\d{1,2})?([IL])([CNMVTF])([RP])-?(\d{2})\/(\d{1,3})(?:\/(\d{1,3}))?(?:-(\d+))?$/);
  const li5 = raw.match(/^(\d{1,2})?([IL])([CNMVTF])([RP])-?(\d{4,5})(?:-?([A-Z0-9][A-Z0-9-]*))?$/);
  if (li || li5) {
    const m = (li ?? li5)!;
    const segs: Segment[] = [];
    const cells = m[1] ? parseInt(m[1], 10) : 1;
    if (m[1]) segs.push({ text: m[1], role: 'series', title: `${m[1]} cells in series`, meaning: 'Number of cells connected in series (batteries only).' });
    segs.push({ text: m[2], role: 'chem', title: t.liAnode[m[2]] ?? m[2], meaning: m[2] === 'I' ? 'First letter: the negative electrode. I = lithium-ion.' : 'First letter: the negative electrode. L = lithium metal or alloy.' });
    const cat = t.liCathode[m[3]];
    segs.push({ text: m[3], role: 'chem', title: cat?.name ?? `Positive electrode ${m[3]}`, meaning: ['Second letter: the positive electrode.', cat?.note ?? ''].filter(Boolean).join(' ') });
    segs.push({ text: m[4], role: 'shape', title: m[4] === 'R' ? 'Round (cylindrical)' : 'Prismatic', meaning: 'Third letter: the shape.' });
    let dims: Decoded['dims'];
    const notes: string[] = [];
    if (li) {
      const d = parseInt(li[5], 10);
      if (li[7]) {
        segs.push({ text: `${li[5]}/${li[6]}/${li[7]}`, role: 'size', title: `${li[5]} × ${li[6]} × ${li[7]} mm`, meaning: 'Maximum thickness / width / height in mm (prismatic).' });
      } else {
        const h = parseInt(li[6], 10);
        dims = { d, h };
        segs.push({ text: `${li[5]}/${li[6]}`, role: 'size', title: `${mm(d)} by ${mm(h)}`, meaning: 'Maximum diameter / maximum height in mm.' });
      }
      if (li[8]) segs.push({ text: `-${li[8]}`, role: 'parallel', title: `${li[8]} in parallel`, meaning: 'Number of parallel strings (shown only when more than one).' });
    } else {
      const s = li5![5];
      const d = parseInt(s.slice(0, 2), 10);
      const h = s.length === 5 ? parseInt(s.slice(2), 10) / 10 : parseInt(s.slice(2), 10);
      dims = { d, h };
      segs.push({ text: s.slice(0, 2), role: 'size', title: `Diameter ${mm(d)}`, meaning: 'Diameter in whole millimeters.' });
      segs.push({ text: s.slice(2), role: 'size', title: `Length ${mm(h)}`, meaning: s.length === 5 ? `Length in tenths of a millimeter: ${s.slice(2)} = ${mm(h)}.` : `Length in whole millimeters: ${s.slice(2)} mm.` });
      if (li5![6]) segs.push({ text: li5![6], role: 'model', title: 'Manufacturer model', meaning: "The maker's model code for this specific cell. It sets capacity and current ratings, not size." });
      notes.push('The five-digit size (18650) is the form makers print. IEC 61960 itself writes maximum dimensions with slashes, for example ICR19/66.');
    }
    const kind = m[4] === 'R' ? 'cylindrical' : 'prismatic';
    const chemTxt = m[3] === 'F' ? 'lithium iron phosphate' : `lithium-ion (${(cat?.name ?? '').toLowerCase().replace(' positive electrode', '')})`;
    const dimTxt = dims ? `, ${mm(dims.d!)} in diameter and ${mm(dims.h!)} long` : '';
    return {
      input: raw,
      system: 'IEC 61960 (lithium-ion)',
      segments: segs,
      summary: `${cells > 1 ? `A battery of ${cells} ` : 'A '}${chemTxt} ${kind} cell${cells > 1 ? 's' : ''}${dimTxt}.`,
      dims,
      notes,
    };
  }

  // 4. Manufacturer prefixes that would otherwise misparse as IEC letters.
  for (const p of Object.keys(PREFIXES).sort((a, b) => b.length - a.length)) {
    if (!key.startsWith(p)) continue;
    const rest = key.slice(p.length);
    if (!/^\d/.test(rest)) continue;
    const P = PREFIXES[p];
    const segs: Segment[] = [{ text: p, role: 'prefix', title: P.title, meaning: P.meaning }];
    let dims: Decoded['dims'];
    const digits = rest.match(/^(\d+)(.*)$/)!;
    if (P.rest === 'size' && /^\d{3,5}$/.test(digits[1])) {
      const s = sizeSegs(t, 'R', digits[1]);
      segs.push(...s.segs);
      dims = s.dims;
      if (digits[2]) segs.push({ text: digits[2], role: 'model', title: 'Model or variant', meaning: "The maker's model or variant letters." });
    } else {
      segs.push({ text: rest, role: 'model', title: P.rest === 'cell' ? 'Cell name' : 'Product number', meaning: P.rest === 'cell' ? `The cell name: compare ${/^\d+[A-Z]?$/.test(rest) ? 'CR' : ''}${rest}.` : 'A catalog number. It does not encode dimensions.' });
    }
    return { input: raw, system: 'Manufacturer prefix', segments: segs, summary: `${P.title}. ${P.meaning}`, dims, notes: [] };
  }

  // 5. Fractional sizes: CR1/3N, 2/3A, 1/2AA.
  const fr = raw.match(/^(\d{1,2}(?=[A-Z]))?([A-Z]?)(R?)(\d)\/(\d)(AAAA|AAA|AA|A|N|C|D)$/);
  if (fr && (!fr[2] || t.chem[fr[2]] || t.recharge[fr[2]])) {
    const [, series, letter, shape, num, den, base] = fr;
    const segs: Segment[] = [];
    const c = letter ? t.chem[letter] ?? t.recharge[letter] : undefined;
    const cells = series ? parseInt(series, 10) : 1;
    if (series) segs.push({ text: series, role: 'series', title: `${series} cells in series`, meaning: c?.v ? `${series} × ${f(c.v)} V = ${f(cells * c.v)} V nominal.` : 'Number of cells in series.' });
    if (letter) segs.push(chemSeg(t, letter)!);
    if (shape) segs.push({ text: 'R', role: 'shape', title: 'Round', meaning: 'Cylindrical cell.' });
    const words: Record<string, string> = { '1/2': 'Half', '1/3': 'One third', '2/3': 'Two thirds', '4/5': 'Four fifths', '1/4': 'One quarter', '3/4': 'Three quarters' };
    const fracTxt = `${num}/${den}`;
    segs.push({ text: fracTxt, role: 'size', title: `${words[fracTxt] ?? fracTxt} of the length`, meaning: 'A fractional size: the diameter of the base size with a fraction of its length. The fraction is nominal; check the listed length.' });
    const L = t.legacy[{ AA: 'R6', AAA: 'R03', A: 'R23', N: 'R1', C: 'R14', D: 'R20' }[base] ?? ''];
    segs.push({ text: base, role: 'size', title: `Base size ${base}`, meaning: L?.d && L?.h ? `${base} is ${mm(L.d)} by ${mm(L.h)}.` : `The ${base} size.` });
    return {
      input: raw,
      system: 'Fractional size',
      segments: segs,
      summary: `${cells > 1 ? `${cells} ` : 'A '}${c ? lc(c.name) + ' ' : ''}cell${cells > 1 ? 's' : ''} with the diameter of ${base} and about ${(words[fracTxt] ?? fracTxt).toLowerCase()} of its length.`,
      voltage: c?.v ? { cells, per: c.v, total: cells * c.v } : undefined,
      notes: [],
    };
  }

  // 6. IEC 60086 primary and IEC 61951 rechargeable.
  const iec = raw.match(/^(\d{1,2}(?=[A-Z]))?([A-Z]?)([RFSP])(\d+(?:[A-HJ-L]\d{2,3})?(?:\/\d+)?)([A-Z]*)(?:-(\d+))?$/);
  if (iec) {
    const [, series, letter, shape, size, suffix, par] = iec;
    const cs = chemSeg(t, letter);
    if (cs) {
      const segs: Segment[] = [];
      const c = t.chem[letter] ?? t.recharge[letter];
      const cells = series ? parseInt(series, 10) : 1;
      if (series) segs.push({ text: series, role: 'series', title: `${series} cells in series`, meaning: c.v ? `${series} × ${f(c.v)} V = ${f(cells * c.v)} V nominal.` : 'Number of cells in series.' });
      segs.push(cs);
      const sh = t.shape[shape];
      segs.push({ text: shape, role: 'shape', title: sh.name, meaning: sh.note ?? '' });
      const sz = sizeSegs(t, shape, size);
      segs.push(...sz.segs);
      if (suffix) {
        // Split known two-letter suffixes first (SW), then single letters.
        const parts = t.suffix[suffix] || suffix.length === 1 ? [suffix] : suffix.match(/SW|CF|HH|HB|[A-Z]/g) ?? [suffix];
        parts.forEach((s) => segs.push(suffixSeg(t, s)));
      }
      if (par) segs.push({ text: `-${par}`, role: 'parallel', title: `${par} in parallel`, meaning: 'Number of parallel strings of cells.' });
      const shapeWord = shape === 'R' ? (sz.dims && sz.dims.d && sz.dims.h && sz.dims.h < sz.dims.d ? 'button or coin' : 'round') : sh.name.toLowerCase();
      const chemName = lc(c.name.replace(' (rechargeable)', ''));
      const dimTxt = sz.dims?.d && sz.dims?.h ? `, ${sz.dims.approx ? 'about ' : ''}${mm(sz.dims.d)} in diameter and ${mm(sz.dims.h)} ${sz.dims.h < sz.dims.d ? 'thick' : 'tall'}` : '';
      const legacyName = sz.name && /^([A-Z]{1,4}|No\. \d+)$/.test(sz.name) ? ` (size ${size}: ${sz.name})` : '';
      const strings = par ? `${par} parallel strings of ${cells}` : `${cells}`;
      const summary = cells > 1
        ? `A ${f(cells * (c.v ?? 0))} V battery of ${strings} ${chemName} ${shapeWord} cells in series${legacyName}.`
        : `One ${chemName}${t.recharge[letter] ? ' rechargeable' : ''} ${shapeWord} cell${c.v ? ` at ${f(c.v)} V` : ''}${legacyName}${dimTxt}.`;
      return {
        input: raw,
        system: t.recharge[letter] ? 'IEC 61951 (NiMH and NiCd)' : 'IEC 60086 (primary)',
        segments: segs,
        summary,
        voltage: c.v ? { cells, per: c.v, total: cells * c.v } : undefined,
        dims: cells > 1 ? undefined : sz.dims,
        notes: [],
        partial: !sz.ok,
        core: suffix || par ? `${series ?? ''}${letter}${shape}${size}` : undefined,
      };
    }
  }

  // 7. ANSI C18 rechargeable form: 1.2H2 (voltage, system letter, size number).
  const ar = raw.match(/^(\d{1,2}\.\d)([HK])(\d+)$/);
  if (ar) {
    const s = t.ansiSuffix[ar[2]];
    return {
      input: raw,
      system: 'ANSI C18 (rechargeable)',
      segments: [
        { text: ar[1], role: 'voltage', title: `${ar[1]} V nominal`, meaning: 'Nominal voltage of the cell or battery.' },
        { text: ar[2], role: 'chem', title: s.name, meaning: `ANSI system letter; IEC letter ${s.iec}.` },
        { text: ar[3], role: 'size', title: `Size number ${ar[3]}`, meaning: 'An ANSI size number in the rechargeable series. It does not encode dimensions.' },
      ],
      summary: `A ${ar[1]} V ${lc(s.name)} battery in ANSI rechargeable size ${ar[3]}.`,
      notes: [],
    };
  }

  // 8. ANSI C18 primary: size number + system suffix (15A, 1604A, 5004LC).
  const an = raw.match(/^(\d{1,5})(A|AC|AP|C|CD|D|F|H|K|LB|LC|LF|M|SO|SOP|Z|ZD)$/);
  if (an) {
    const s = t.ansiSuffix[an[2]];
    const name = t.ansiSize[an[1]];
    const sizeMeaning = name
      ? `ANSI size number ${an[1]} = ${name}.`
      : /^5\d{3}$/.test(an[1])
        ? 'A number in the 5000 range, which ANSI assigns to lithium coin cells. It does not encode dimensions.'
        : /^7\d{3}$/.test(an[1])
          ? 'A number in the 7000 range, used for zinc-air button cells. It does not encode dimensions.'
          : 'An ANSI size number. It does not encode dimensions.';
    return {
      input: raw,
      system: 'ANSI C18',
      segments: [
        { text: an[1], role: 'size', title: name ? `Size ${an[1]}: ${name}` : `Size number ${an[1]}`, meaning: sizeMeaning },
        { text: an[2], role: 'chem', title: s.name, meaning: `ANSI suffix for the electrochemical system. IEC letter: ${s.iec || 'none (zinc-carbon)'}.` },
      ],
      summary: `ANSI ${raw}: ${lc(s.name)}${name ? `, size ${name}` : ''}.`,
      notes: [],
    };
  }

  // 9. Bare digits.
  if (/^\d{5}$/.test(key)) {
    const d = parseInt(key.slice(0, 2), 10);
    const h = parseInt(key.slice(2), 10) / 10;
    return {
      input: raw,
      system: 'Size digits (lithium-ion convention)',
      segments: [
        { text: key.slice(0, 2), role: 'size', title: `Diameter ${mm(d)}`, meaning: 'Diameter in whole millimeters.' },
        { text: key.slice(2), role: 'size', title: `Length ${mm(h)}`, meaning: `Length in tenths of a millimeter: ${key.slice(2)} = ${mm(h)}.` },
      ],
      summary: `A cylindrical cell ${mm(d)} in diameter and ${mm(h)} long. The digits give only the size; the chemistry is not encoded.`,
      dims: { d, h },
      notes: ['Most cells named this way are lithium-ion (3.6 to 3.7 V) or lithium iron phosphate (3.2 V). The size alone does not say which.'],
    };
  }
  if (/^\d{4}$/.test(key) && opts.liIon) {
    const d = parseInt(key.slice(0, 2), 10);
    const h = parseInt(key.slice(2), 10);
    return {
      input: raw,
      system: 'Size digits (lithium-ion convention)',
      segments: [
        { text: key.slice(0, 2), role: 'size', title: `Diameter ${mm(d)}`, meaning: 'Diameter in whole millimeters.' },
        { text: key.slice(2), role: 'size', title: `Length ${mm(h)}`, meaning: 'Length in whole millimeters. Four digits are either a large-format name (4680) or a shortened five-digit name (2170 for 21700).' },
      ],
      summary: `A cylindrical cell about ${mm(d)} in diameter and ${mm(h)} long. The digits give only the size; the chemistry is not encoded.`,
      dims: { d, h, approx: true },
      notes: [],
    };
  }
  if (/^\d{4}$/.test(key)) {
    const d = parseInt(key.slice(0, 2), 10);
    const h = parseInt(key.slice(2), 10) / 10;
    return {
      input: raw,
      system: 'Size digits only',
      segments: [
        { text: key.slice(0, 2), role: 'size', title: `Diameter about ${mm(d)}`, meaning: 'Read as a coin cell code: diameter in whole millimeters.' },
        { text: key.slice(2), role: 'size', title: `Thickness ${mm(h)}`, meaning: `Thickness in tenths of a millimeter: ${key.slice(2)} = ${mm(h)}.` },
      ],
      summary: `Read as coin cell digits: about ${mm(d)} across and ${mm(h)} thick, as in CR${key}. Without letters the chemistry is not given.`,
      dims: { d, h, approx: true },
      notes: ['Four digits can also be a shortened lithium-ion name (2170 for 21700) or a catalog number. The cross-reference below settles it when the code is listed.'],
    };
  }
  if (/^\d{1,3}[A-Z]{0,2}$/.test(key)) {
    return {
      input: raw,
      system: 'Manufacturer or hearing aid number',
      segments: [{ text: raw, role: 'model', title: 'Catalog number', meaning: 'Watch cell numbers (377, 364), hearing aid sizes (312, 13, 675) and similar are catalog numbers. They do not encode dimensions or chemistry.' }],
      summary: `${raw} is a catalog or size number, not a systematic code. It identifies a cell only through a cross-reference.`,
      notes: [],
    };
  }
  return null;
}

// ------------------------------------------------- external table merging

type Loose = Record<string, any>;

/** Turn a map or an array of objects into a map keyed by letter/code/number. */
function keyed(v: unknown): Loose {
  if (!v) return {};
  if (Array.isArray(v)) {
    const out: Loose = {};
    for (const row of v) {
      if (!row || typeof row !== 'object') continue;
      const k = row.letter ?? row.code ?? row.number ?? row.key ?? row.id ?? row.size;
      if (k !== undefined && k !== null) out[String(k).toUpperCase()] = row;
    }
    return out;
  }
  if (typeof v === 'object') {
    const out: Loose = {};
    for (const [k, row] of Object.entries(v as Loose)) out[k.toUpperCase()] = row;
    return out;
  }
  return {};
}
const pick = (o: Loose, ...ks: string[]) => {
  if (typeof o === 'string') return o;
  for (const k of ks) if (o?.[k] !== undefined && o[k] !== null && o[k] !== '') return o[k];
  return undefined;
};
const num = (x: unknown) => (typeof x === 'number' ? x : typeof x === 'string' && x.trim() !== '' && !isNaN(+x) ? +x : undefined);
const find = (ext: Loose, ...ks: string[]) => {
  for (const k of ks) if (ext[k]) return ext[k];
  return undefined;
};

/**
 * Merge an iec-system.json of unknown exact shape over the built-in tables.
 * Only entries that carry a usable name replace a built-in one, so a partial
 * or differently shaped file degrades to the built-in tables.
 */
export function mergeTables(ext: unknown): Tables {
  if (!ext || typeof ext !== 'object') return BUILTIN;
  const e = ext as Loose;
  const t: Tables = JSON.parse(JSON.stringify(BUILTIN));
  let used = 0;
  const chem = keyed(find(e, 'chemistry', 'chemistries', 'electrochemical', 'electrochemical_systems', 'systems', 'letters', 'chemistry_letters'));
  for (const [k, row] of Object.entries(chem)) {
    const letter = k === 'NONE' || k === '(NONE)' || k === '-' ? '' : k;
    if (!/^[A-Z]?$/.test(letter)) continue;
    const name = pick(row, 'name', 'chemistry', 'system', 'meaning', 'label');
    if (typeof name !== 'string') continue;
    const target = letter === 'H' || letter === 'K' ? t.recharge : t.chem;
    target[letter] = { ...target[letter], name, v: num(pick(row, 'voltage', 'nominal', 'nominal_voltage', 'v')) ?? target[letter]?.v, note: pick(row, 'note', 'notes') ?? target[letter]?.note };
    used++;
  }
  const shapes = keyed(find(e, 'shape', 'shapes', 'shape_letters'));
  for (const [k, row] of Object.entries(shapes)) {
    const name = pick(row, 'name', 'meaning', 'shape', 'label');
    if (/^[A-Z]$/.test(k) && typeof name === 'string') { t.shape[k] = { name, note: pick(row, 'note', 'notes') ?? t.shape[k]?.note }; used++; }
  }
  const sizes = keyed(find(e, 'legacy_sizes', 'sizes', 'size_codes', 'legacy', 'size_numbers'));
  for (const [k, row] of Object.entries(sizes)) {
    const id = /^[RFSP]/.test(k) ? k : `R${k}`;
    const name = pick(row, 'name', 'common', 'common_name', 'label');
    const d = num(pick(row, 'diameter', 'd', 'diameter_mm'));
    const h = num(pick(row, 'height', 'h', 'height_mm'));
    if (typeof name !== 'string' && d === undefined) continue;
    t.legacy[id] = { ...t.legacy[id], ...(typeof name === 'string' ? { name } : {}), ...(d ? { d } : {}), ...(h ? { h } : {}) };
    used++;
  }
  if (used) t.source = 'data/iec-system.json';
  return t;
}

// ------------------------------------------------------------------ render

const ROLE_CLASS: Record<Role, string> = {
  series: 'bg-warn-soft border-warn',
  chem: 'bg-accent-soft border-accent',
  shape: 'bg-ok-soft border-ok',
  size: 'bg-surface-3 border-line-2',
  suffix: 'bg-surface-2 border-line-2 border-dashed',
  parallel: 'bg-surface-2 border-line-2 border-dashed',
  prefix: 'bg-warn-soft border-warn border-dashed',
  model: 'bg-surface-2 border-line-2 border-dashed',
  name: 'bg-surface-3 border-line-2',
  voltage: 'bg-warn-soft border-warn',
};
export const ROLE_LABEL: Record<Role, string> = {
  series: 'Cells in series',
  chem: 'Chemistry',
  shape: 'Shape',
  size: 'Size',
  suffix: 'Suffix',
  parallel: 'Parallel',
  prefix: 'Maker prefix',
  model: 'Model or number',
  name: 'Name',
  voltage: 'Voltage',
};

export const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** The colored tile breakdown, as an HTML string (server example and client share it). */
export function tilesHTML(d: Decoded) {
  const tiles = d.segments
    .map(
      (s) => `<li class="flex flex-col min-w-[5.5rem] max-w-[16rem] flex-1">
        <span class="block rounded-md border px-3 py-2 text-center font-mono text-[1.35rem] font-semibold text-ink ${ROLE_CLASS[s.role]}">${esc(s.text)}</span>
        <span class="mt-1.5 eyebrow">${esc(ROLE_LABEL[s.role])}</span>
        <span class="text-[0.7rem] font-semibold text-ink leading-snug">${esc(s.title)}</span>
        <span class="mt-0.5 text-[0.62rem] text-muted leading-snug">${esc(s.meaning)}</span>
      </li>`,
    )
    .join('');
  return `<ol class="flex flex-wrap gap-3" aria-label="Parts of ${esc(d.input)}">${tiles}</ol>`;
}
