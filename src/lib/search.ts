// Client-side ranking over /api/search-index.json. Shared by the command
// palette, the /search page, the home page search and the decoder.
//
// Score tiers, highest first: an exact battery name, code or device name
// (900 to 1000); a name or code that starts with the query, or a device whose
// own name, maker or model has every word (580 to 700); then the plain-word
// matches (530 to 555): a battery whose uses or category match ("garage door",
// "hearing aid") and a device whose category words match ("car remote").
// Exact names always win, so "cr2032" and "aa" put that battery on top.
export interface Entry {
  id: string;
  n: string; // name
  c: string; // category
  s: string; // size label
  v: string; // voltages
  k: string[]; // codes and aliases
  f: string; // form
  d: number | null;
  h: number;
  w: number | null;
  p: number | null;
  x: string[]; // chemistry shorts
  col: string;
  u?: [string, number][]; // what it is used in, with a weight (see usePhrases in data.ts)
  pop?: number; // 0 to 9.5, the sizes people look for most
}

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9.]/g, '');

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

// Words that carry no meaning in a battery search: "battery for my garage
// door" means "garage door". An article goes only when other words remain,
// because "A" is a battery.
const FILLER = /\b(batteries|battery|for|my|in|of|what|which|does|do|take|takes|size|replacement|need|i)\b/gi;
const ARTICLE = /\b(a|an|the)\b/gi;
export function cleanQuery(query: string): string {
  let s = query.replace(FILLER, ' ');
  if (words(s).length > 1) s = s.replace(ARTICLE, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s || query.trim();
}

const singular = (w: string) =>
  /ies$/.test(w) ? `${w.slice(0, -3)}y` : /(ch|sh|x|ss)es$/.test(w) ? w.slice(0, -2) : /[^s]s$/.test(w) ? w.slice(0, -1) : w;
/** A query word matches a word when it starts it: "remote" and "remotes". */
const hit = (q: string, h: string) => h.startsWith(q) || (q.length > 3 && h.startsWith(singular(q)));
const allHit = (qw: string[], hay: string[]) => qw.every((q) => hay.some((h) => hit(q, h)));

export function rank(index: Entry[], query: string, limit = 12) {
  const clean = cleanQuery(query);
  const q = norm(clean);
  const qw = words(clean);
  // Plain-word matching needs a real word: not "c", "aa" or "9v".
  const plain = qw.length > 0 && Math.max(...qw.map((w) => w.length)) >= 3 && /[a-z]{3}/.test(clean.toLowerCase());
  const out: { e: Entry; score: number; why: string }[] = [];
  const dims = clean.match(/(\d+(?:\.\d+)?)\s*(?:mm)?\s*[x×*by ]+\s*(\d+(?:\.\d+)?)/i);
  const volt = clean.match(/^\s*(\d+(?:\.\d+)?)\s*v(?:olts?)?\s*$/i);
  for (const e of index) {
    let score = 0;
    let why = '';
    const name = norm(e.n);
    const id = norm(e.id);
    if (q && (q === name || q === id)) score = 1000;
    else if (q && name.startsWith(q)) score = 700 - name.length;
    for (const k of e.k) {
      const nk = norm(k);
      if (!nk || !q) continue;
      let s = 0;
      if (nk === q) s = 900;
      else if (nk.startsWith(q) && q.length >= 2) s = 600 - nk.length;
      else if (q.length >= 3 && nk.includes(q)) s = 300 - nk.length;
      if (s > score) {
        score = s;
        why = k;
      }
    }
    if (!score && q.length >= 2 && name.includes(q)) score = 400;
    if (plain && e.u) {
      // Every word of the query in one phrase: "garage door" in "Garage door
      // opener remotes". The match is shown as the battery itself, not as one
      // of its names, so `why` is cleared.
      for (const [phrase, w] of e.u) {
        if (!allHit(qw, words(phrase))) continue;
        const s = 530 + Math.min(w, 15) + (e.pop ?? 0);
        if (s > score) {
          score = s;
          why = '';
        }
      }
    }
    if (dims) {
      const a = parseFloat(dims[1]);
      const b = parseFloat(dims[2]);
      const pairs = e.d ? [[e.d, e.h]] : e.w ? [[e.w, e.p ?? 0], [e.w, e.h], [e.p ?? 0, e.h]] : [];
      for (const [x, y] of pairs) {
        const dist = Math.hypot((a - x) / Math.max(x, 1), (b - y) / Math.max(y, 1));
        if (dist < 0.12) {
          const s = 800 - dist * 3000;
          if (s > score) { score = s; why = `${e.s}`; }
        }
      }
    }
    if (volt) {
      const target = parseFloat(volt[1]);
      if (e.v.split(' / ').some((v) => Math.abs(parseFloat(v) - target) < 0.051)) {
        score = Math.max(score, 200);
        why = why || `${volt[1]}V`;
      }
    }
    if (why && norm(why) === name) why = '';
    if (score > 0) out.push({ e, score, why });
  }
  out.sort((a, b) => b.score - a.score || (b.e.pop ?? 0) - (a.e.pop ?? 0) || a.e.n.localeCompare(b.e.n, 'en', { numeric: true }));
  return out.slice(0, limit);
}

// Devices ("what battery does my X take"), from /api/device-index.json.
export interface DeviceEntry {
  id: string; // device id, page at /devices/{id}
  n: string; // title, "Apple AirTag"
  k: string[]; // maker, name, models
  g?: string[]; // what kind of device: category name and everyday words for it
  b: string; // battery name, "CR2032"
  bid: string; // battery id
  q: number; // count
  c: string; // category name
}

/** Every query word must start some word of the device's name, maker or
 *  models (specific), or of those plus its category words (generic). */
export function rankDevices(index: DeviceEntry[], query: string, limit = 6) {
  const clean = cleanQuery(query);
  const q = norm(clean);
  const qw = words(clean);
  if (q.length < 2 || !qw.length) return [];
  const out: { d: DeviceEntry; score: number }[] = [];
  for (const d of index) {
    const own = [d.n, ...d.k];
    const hw = own.flatMap(words);
    let score = 0;
    if (norm(d.n) === q || d.k.some((k) => norm(k) === q)) score = 950;
    else if (allHit(qw, hw)) score = 620 + qw.length * 10 - d.n.length / 100;
    else if (d.g && allHit(qw, [...hw, ...d.g.flatMap(words)])) score = 540 - d.n.length / 100;
    else if (q.length >= 4 && norm(own.join(' ')).includes(q)) score = 450;
    if (score) out.push({ d, score });
  }
  out.sort((a, b) => b.score - a.score || a.d.n.localeCompare(b.d.n, 'en', { numeric: true }));
  return out.slice(0, limit);
}
