// Client-side ranking over /api/search-index.json. Shared by the command
// palette, the /search page and the decoder.
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
}

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9.]/g, '');

export function rank(index: Entry[], query: string, limit = 12) {
  const q = norm(query);
  const out: { e: Entry; score: number; why: string }[] = [];
  const dims = query.match(/(\d+(?:\.\d+)?)\s*(?:mm)?\s*[x×*by ]+\s*(\d+(?:\.\d+)?)/i);
  const volt = query.match(/^\s*(\d+(?:\.\d+)?)\s*v(?:olts?)?\s*$/i);
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
        why = why || `${volt[1]} V`;
      }
    }
    if (why && norm(why) === name) why = '';
    if (score > 0) out.push({ e, score, why });
  }
  out.sort((a, b) => b.score - a.score || a.e.n.localeCompare(b.e.n, 'en', { numeric: true }));
  return out.slice(0, limit);
}

// Devices ("what battery does my X take"), from /api/device-index.json.
export interface DeviceEntry {
  id: string; // device id, page at /devices/{id}
  n: string; // title, "Apple AirTag"
  k: string[]; // maker, name, models, category words
  b: string; // battery name, "CR2032"
  bid: string; // battery id
  q: number; // count
  c: string; // category name
}

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

/** Every query word must start some word of the device's name, maker or models. */
export function rankDevices(index: DeviceEntry[], query: string, limit = 6) {
  const q = norm(query);
  const qw = words(query);
  if (q.length < 2 || !qw.length) return [];
  const out: { d: DeviceEntry; score: number }[] = [];
  for (const d of index) {
    const hay = [d.n, ...d.k];
    const hw = hay.flatMap(words);
    const flat = norm(hay.join(' '));
    let score = 0;
    if (norm(d.n) === q || d.k.some((k) => norm(k) === q)) score = 950;
    else if (qw.every((w) => hw.some((h) => h.startsWith(w)))) score = 620 + qw.length * 10 - d.n.length / 100;
    else if (q.length >= 4 && flat.includes(q)) score = 450;
    if (score) out.push({ d, score });
  }
  out.sort((a, b) => b.score - a.score || a.d.n.localeCompare(b.d.n, 'en', { numeric: true }));
  return out.slice(0, limit);
}
