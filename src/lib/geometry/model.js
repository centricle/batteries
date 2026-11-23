// Battery entry -> parametric model. Every dimension comes from the entry's
// `dimensions` and `geometry` blocks; only cosmetic details (crimp depth,
// fillet radii, terminal proportions when a datasheet does not give them)
// use the defaults below, and `describe()` reports which ones it assumed so
// the page can say so.
import { sweep, face, helix, merge, fillet } from './mesh.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** A swept part plus its front (x-y) and side (z-y) elevation outlines. */
function part(name, material, o) {
  const mesh = sweep(o);
  const [tx, ty, tz] = o.at ?? [0, 0, 0];
  const prof = o.profile;
  const right = prof.map(([off, y]) => [tx + o.a + off, ty + y]);
  const left = prof.map(([off, y]) => [tx - (o.a + off), ty + y]).reverse();
  const sideR = prof.map(([off, y]) => [tz + o.b + off, ty + y]);
  const sideL = prof.map(([off, y]) => [tz - (o.b + off), ty + y]).reverse();
  return { name, material, mesh, front: [...right, ...left], side: [...sideR, ...sideL] };
}

function circlePart(name, material, radius, profile, extra = {}) {
  return part(name, material, { a: radius, b: radius, r: radius, profile, ...extra });
}

const dimsOf = (b) => {
  const d = b.dimensions;
  const g = (k) => d[k]?.nominal;
  return { D: g('diameter'), H: g('height'), W: g('width'), P: g('depth') };
};

// ---------------------------------------------------------------- cylinder
function cylinder(b, assumed) {
  const { D, H } = dimsOf(b);
  const R = D / 2;
  const geo = b.geometry ?? {};
  const pos = geo.positive ?? {};
  const isLiIon = b.category === 'li-ion';
  const style = pos.style ?? (isLiIon ? 'flat' : 'button');
  const parts = [];

  const roll = clamp(D * 0.07, 0.35, 1.6); // shrink wrap rolled over the ends
  const ew = 0.15;
  let pd, ph;
  if (style === 'button') {
    pd = pos.diameter ?? (assumed.push('positive terminal diameter'), clamp(D * (isLiIon ? 0.42 : 0.38), 1.5, 10));
    ph = pos.height ?? (assumed.push('positive terminal height'), clamp(0.6 + D * 0.03, 0.6, 2.0));
  } else {
    pd = pos.diameter ?? (assumed.push('positive cap diameter'), D * 0.56);
    ph = pos.height ?? 0.35;
  }
  ph = Math.min(ph, H * 0.2);
  const Hb = H - ph; // top of the can shoulder

  // Shrink wrap (label). Li-ion cans show the crimp groove through the wrap.
  const rr = clamp(D * 0.05, 0.25, 1.2);
  const wrapPts = [[-roll, ew], [0, ew, rr]];
  if (isLiIon || b.category === 'photo') {
    const gy = Hb - clamp(H * 0.045, 1.2, 4);
    const gd = clamp(D * 0.025, 0.2, 0.6);
    wrapPts.push([0, gy - 1.1, 0.6], [-gd, gy - 0.35, 0.3], [-gd, gy + 0.35, 0.3], [0, gy + 1.1, 0.6]);
  }
  wrapPts.push([0, Hb - ew, rr], [-roll, Hb - ew]);
  const wrap = circlePart('wrap', 'wrap', R, fillet(wrapPts, 6));
  parts.push(wrap);

  const inner = R - roll - 0.05;
  parts.push(circlePart('negative', 'steel', inner, [[0, 0, true], [0, ew + 0.12, true]]));

  if (style === 'button') {
    parts.push(circlePart('top', 'steel', inner, [[0, Hb - ew - 0.15, true], [0, Hb, true]]));
    if (!isLiIon) {
      // Insulating washer around the terminal on household cells.
      parts.push(circlePart('washer', 'insulator', Math.min(pd / 2 + D * 0.07, inner - 0.3), [[0, Hb - 0.1, true], [0, Hb + 0.06, true]]));
    } else {
      parts.push(circlePart('ring', 'ring', inner - 0.1, [[0, Hb - 0.1, true], [0, Hb + 0.18, true]]));
    }
    const fr = Math.min(ph * 0.45, pd * 0.15);
    parts.push(
      circlePart('positive', 'steel', pd / 2, fillet([[0, Hb - 0.1, true], [0, H, fr], [-pd / 2 + 0.02, H]], 5)),
    );
  } else {
    parts.push(circlePart('top', 'steel', inner, [[0, Hb - ew - 0.15, true], [0, Hb, true]]));
    parts.push(circlePart('ring', 'ring', inner - 0.1, [[0, Hb - 0.05, true], [0, Hb + Math.min(0.25, ph * 0.6), true]]));
    parts.push(circlePart('positive', 'steel', pd / 2, fillet([[0, Hb - 0.1, true], [0, H, 0.15], [-pd / 2 + 0.02, H]], 3)));
  }

  return {
    parts,
    label: { part: 'wrap', circumference: Math.PI * D, length: Hb, roll, band: bandOf(wrap.mesh) },
    terminals: { positive: [0, H, 0], negative: [0, 0, 0] },
  };
}

/** v range of the wrap's straight side wall (horizontal normals), for label text. */
function bandOf(mesh) {
  let v0 = 1, v1 = 0;
  for (let i = 0; i < mesh.positions.length / 3; i++) {
    if (Math.abs(mesh.normals[i * 3 + 1]) > 0.25) continue;
    const v = mesh.uvs[i * 2 + 1];
    v0 = Math.min(v0, v);
    v1 = Math.max(v1, v);
  }
  return v1 > v0 ? [v0, v1] : [0.1, 0.9];
}

// -------------------------------------------------------------------- disc
function disc(b, assumed) {
  const { D, H: T } = dimsOf(b);
  const R = D / 2;
  const geo = b.geometry ?? {};
  const zincAir = b.category === 'hearing-aid';
  const ratio = b.category === 'coin' ? 0.8 : 0.74;
  const Rc = (geo.negative?.diameter ?? (assumed.push('negative cap diameter'), D * ratio)) / 2;
  const hc = clamp(T * (zincAir ? 0.28 : 0.14), 0.12, 0.6); // cap protrusion
  const g = Math.max(0.15, Math.min(R - Rc - 0.1, D * 0.05));
  const parts = [];

  // Negative cap (bottom). Zinc-air cells have a taller, domed cap.
  const capTop = hc + 0.2;
  parts.push(circlePart('negative', 'steel', Rc, fillet([[-Rc + 0.01, 0], [0, 0, Math.min(0.3, hc * 0.8)], [0, capTop, true]], 4)));
  // Gasket ring visible between cap and can lip.
  parts.push(circlePart('gasket', 'gasket', Rc + g + 0.1, [[-(g + 0.12), hc - 0.03, true], [0, hc - 0.03, true], [0, hc + 0.22, true]]));
  // Positive can: lip, wall, flat top face.
  const lip = Math.min(0.35, T * 0.12);
  const canPts = [
    [-(R - (Rc + g)), hc + 0.02],
    [0, hc + 0.02 + lip, Math.min(0.45, T * 0.18)],
    [0, T, Math.min(0.3, T * 0.1)],
    [-R + 0.01, T],
  ];
  const can = circlePart('can', 'can', R, fillet(canPts, 6));
  parts.push(can);

  if (zincAir) {
    const tabR = R * 0.93;
    parts.push(circlePart('tab', 'tab', tabR, [[0, T, true], [0, T + 0.06, true]]));
    const tw = Math.max(R * 0.55, 0.9);
    const tl = R * 0.75;
    parts.push(part('tab-pull', 'tab', { a: tl / 2, b: tw / 2, r: Math.min(tw / 2, tl / 2) * 0.9, profile: [[0, T, true], [0, T + 0.06, true]], at: [tabR + tl / 2 - 0.4, 0, 0] }));
  }

  const decal = { part: 'face', mesh: face({ a: R * 0.86, b: R * 0.86, r: R * 0.86, y: T + (zincAir ? 0.07 : 0.004) }), radius: R * 0.86 };
  return {
    parts,
    decal,
    terminals: { positive: [0, T, 0], negative: [0, 0, 0] },
  };
}

// --------------------------------------------------------------- prismatic
function box(b, assumed, { cornerR, topH, onTop }) {
  const { W, P, H } = dimsOf(b);
  const parts = [];
  const Hb = H - topH;
  const r = clamp(cornerR, 0.2, Math.min(W, P) / 2 - 0.01);
  const roll = Math.min(1.0, r * 0.6 + 0.3);
  const rr = Math.min(0.6, r * 0.5);
  const wrap = part('wrap', 'wrap', {
    a: W / 2, b: P / 2, r,
    profile: fillet([[-roll, 0.12], [0, 0.12, rr], [0, Hb - 0.1, rr], [-roll, Hb - 0.1]], 5),
  });
  parts.push(wrap);
  parts.push(part('bottom', 'steel', { a: W / 2 - roll - 0.05, b: P / 2 - roll - 0.05, r: Math.max(0.1, r - roll), profile: [[0, 0, true], [0, 0.25, true]] }));
  parts.push(part('top', 'cap-plastic', { a: W / 2 - roll - 0.05, b: P / 2 - roll - 0.05, r: Math.max(0.1, r - roll), profile: [[0, Hb - 0.4, true], [0, Hb + 0.05, true]] }));
  onTop(parts, Hb + 0.05);
  const per = 2 * (W + P) - (8 - 2 * Math.PI) * r;
  return {
    parts,
    label: { part: 'wrap', circumference: per, length: Hb, roll, band: bandOf(wrap.mesh), faces: { W, P, r } },
  };
}

function prismatic(b, assumed) {
  const { W, H } = dimsOf(b);
  const snapH = clamp(H * 0.07, 2.5, 4); // snap height above the top plate
  assumed.push('snap terminal proportions');
  const pitch = 12.7; // snap center spacing, ANSI C18 / IEC 6LR61
  const m = box(b, assumed, {
    cornerR: 2.2,
    topH: snapH,
    onTop(parts, top) {
      const male = b.geometry?.positive?.diameter ?? 5.8;
      const xm = -pitch / 2;
      parts.push(
        circlePart('positive', 'steel', male / 2, fillet([[0, top - 0.3, true], [0, top + snapH * 0.3], [-0.45, top + snapH * 0.45], [-0.45, top + snapH * 0.62], [0, top + snapH * 0.78], [0, top + snapH, 0.4], [-male / 2 + 0.02, top + snapH]], 3), { at: [xm, 0, 0] }),
      );
      const fa = 4.1;
      parts.push(
        part('negative', 'steel', {
          a: fa, b: fa, r: 1.4, closed: true, at: [pitch / 2, 0, 0],
          profile: [[0, top - 0.3, true], [0, top + snapH - 0.5], [-0.5, top + snapH, true], [-1.4, top + snapH, true], [-1.5, top + 0.9, true], [-fa + 0.02, top + 0.9, true], [-fa + 0.02, top - 0.3, true]],
        }),
      );
    },
  });
  void W;
  m.terminals = { positive: [-pitch / 2, H, 0], negative: [pitch / 2, H, 0] };
  return m;
}

function lantern(b, assumed) {
  const { W, H } = dimsOf(b);
  const screw = b.geometry?.positive?.style === 'screw';
  const topH = screw ? clamp(H * 0.09, 6, 14) : clamp(H * 0.14, 8, 22);
  assumed.push(screw ? 'screw post proportions' : 'spring proportions');
  const xs = W * 0.22;
  const m = box(b, assumed, {
    cornerR: W * 0.06,
    topH,
    onTop(parts, top) {
      for (const [i, x] of [[0, -xs], [1, xs]]) {
        const name = i === 0 ? 'positive' : 'negative';
        if (screw) {
          parts.push(circlePart(name + '-post', 'brass', 1.6, [[0, top - 0.2, true], [0, top + topH, 0.3], [-1.58, top + topH]], { at: [x, 0, 0] }));
          parts.push(circlePart(name, 'brass', 4.2, fillet([[-3.0, top + topH * 0.2], [0, top + topH * 0.2, 0.5], [0, top + topH * 0.55, 0.5], [-3.0, top + topH * 0.55]], 3), { at: [x, 0, 0] }));
        } else {
          parts.push(circlePart(name + '-base', 'steel', 5, [[0, top - 0.2, true], [0, top + 0.8, true]], { at: [x, 0, 0] }));
          const turns = 6;
          parts.push({ name, material: 'spring', mesh: helix({ radius: 4.2, pitch: (topH - 1.5) / turns, turns, wire: 0.55, at: [x, top + 0.8, 0], taper: 0.25 }), front: springOutline(x, top + 0.8, 4.2, topH - 0.8), side: springOutline(0, top + 0.8, 4.2, topH - 0.8) });
        }
      }
    },
  });
  m.terminals = { positive: [-xs, H, 0], negative: [xs, H, 0] };
  return m;
}

function springOutline(x, y0, R, h) {
  const pts = [];
  const n = 12;
  for (let i = 0; i <= n; i++) pts.push([x + (i % 2 ? R : -R) * (1 - 0.25 * (i / n)), y0 + (h * i) / n]);
  return pts;
}

function flatpack(b, assumed) {
  const { W, P, H } = dimsOf(b);
  const longH = clamp(H * 0.16, 6, 14);
  const shortH = longH * 0.55;
  assumed.push('contact strip proportions');
  const xs = W * 0.24;
  const m = box(b, assumed, {
    cornerR: 1.4,
    topH: longH,
    onTop(parts, top) {
      const strip = (name, x, h) =>
        part(name, 'brass', { a: 3, b: 0.22, r: 0.2, profile: [[0, top - 0.3, true], [0, top + h - 0.6, 0.4], [-0.2, top + h]], at: [x, 0, 0] });
      parts.push(strip('positive', -xs, shortH), strip('negative', xs, longH));
    },
  });
  void P;
  m.terminals = { positive: [-xs, H - longH + shortH, 0], negative: [xs, H, 0] };
  return m;
}

function twin(b, assumed) {
  const dims = [b.dimensions.width?.nominal, b.dimensions.depth?.nominal, b.dimensions.height?.nominal].filter(Boolean);
  const v = b.geometry?.variant ?? b.id;
  // Long axis is vertical. CR-V3 is listed lying flat by some datasheets, so
  // sort: length (Y) >= width (X) >= depth (Z).
  let H, W, P;
  if (v === 'cr-v3') [H, W, P] = [...dims].sort((x, y) => y - x);
  else ({ W, P, H } = dimsOf(b));
  const parts = [];
  const rc = P / 2;
  const cx = W / 2 - rc;
  const blockFrac = v === 'cr-v3' ? 0 : v === '2cr5' ? 0.3 : 0.32;
  const blockH = H * blockFrac;
  const bodyH = H - blockH;
  const roll = 0.6;
  const wrapProfile = (h) => fillet([[-roll, 0.12], [0, 0.12, 0.6], [0, h - 0.1, 0.6], [-roll, h - 0.1]], 4);
  for (const [n, x] of [['wrap', -cx], ['wrap-2', cx]]) {
    parts.push(circlePart(n, 'wrap', rc, wrapProfile(blockFrac ? bodyH + 1 : H), { at: [x, 0, 0] }));
  }
  // Web between the two cells, slightly recessed: the groove shows.
  parts.push(part('web', 'wrap', { a: cx, b: rc * 0.82, r: 0.3, profile: [[0, 0.12, true], [0, (blockFrac ? bodyH + 1 : H) - 0.1, true]] }));
  if (blockFrac) {
    parts.push(part('block', 'cap-plastic', { a: W / 2, b: P / 2, r: Math.min(2, P * 0.12), profile: fillet([[-0.8, bodyH], [0, bodyH, 0.6], [0, H, 1.2], [-1.5, H]], 4) }));
  } else {
    parts.push(part('end', 'cap-plastic', { a: W / 2 - 0.6, b: P / 2 - 0.6, r: rc - 0.6, profile: [[0, H - 0.5, true], [0, H, true]] }));
  }
  const padY = H;
  const pad = (name, x) => part(name, 'steel', { a: Math.min(3, W * 0.09), b: Math.min(2.5, P * 0.18), r: 0.6, profile: [[0, padY - 0.3, true], [0, padY + 0.08, true]], at: [x, 0, 0] });
  parts.push(pad('positive', -W * 0.25), pad('negative', W * 0.25));
  assumed.push('pack housing shape');
  return {
    parts,
    label: { part: 'wrap', circumference: Math.PI * P, length: H, roll, band: [0.1, 0.9] },
    terminals: { positive: [-W * 0.25, H, 0], negative: [W * 0.25, H, 0] },
    orientation: { W, P, H },
  };
}

const BUILDERS = { cylinder, disc, prismatic, lantern, flatpack, twin };

/**
 * Describe a battery as a parametric model.
 * @returns {{ parts, label?, decal?, terminals, bounds, assumed: string[] }}
 */
export function describe(battery) {
  const assumed = [];
  let form = battery.form;
  if (form === 'twin' && battery.dimensions.diameter && !battery.dimensions.width) form = 'cylinder';
  const build = BUILDERS[form] ?? cylinder;
  const m = build(battery, assumed);
  m.assumed = [...new Set(assumed)];
  m.bounds = boundsOf(m.parts);
  return m;
}

function boundsOf(parts) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const p of parts) {
    const a = p.mesh.positions;
    for (let i = 0; i < a.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        if (a[i + k] < min[k]) min[k] = a[i + k];
        if (a[i + k] > max[k]) max[k] = a[i + k];
      }
    }
  }
  return { min, max, size: max.map((v, i) => v - min[i]) };
}

/** All parts of one material merged, for exporters. */
export function byMaterial(model) {
  const groups = new Map();
  for (const p of model.parts) {
    if (!groups.has(p.material)) groups.set(p.material, []);
    groups.get(p.material).push(p.mesh);
  }
  return [...groups].map(([material, meshes]) => ({ material, mesh: merge(meshes) }));
}

/** Base materials (PBR). `wrap` is overridden by chemistry color. */
export const MATERIALS = {
  wrap: { color: '#516791', metalness: 0.0, roughness: 0.6 },
  steel: { color: '#c9ccd1', metalness: 1.0, roughness: 0.22 },
  can: { color: '#d4d6da', metalness: 1.0, roughness: 0.18 },
  insulator: { color: '#1b1d21', metalness: 0.0, roughness: 0.6 },
  ring: { color: '#e9e4da', metalness: 0.0, roughness: 0.7 },
  gasket: { color: '#202226', metalness: 0.0, roughness: 0.55 },
  'cap-plastic': { color: '#25272b', metalness: 0.0, roughness: 0.5 },
  brass: { color: '#c8a04a', metalness: 1.0, roughness: 0.3 },
  spring: { color: '#b9bcc2', metalness: 1.0, roughness: 0.3 },
  tab: { color: '#FFD100', metalness: 0.0, roughness: 0.6 },
};
