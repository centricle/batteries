// Mesh primitives in raw arrays (no three.js), so the same code runs in the
// browser viewer and in the Node build that writes GLB and STL files.
//
// Every solid here is a *sweep*: a 2D profile of (offset, y) points swept
// around a rounded rectangle with half-extents a, b and corner radius r. A
// circle is the special case a = b = r, so one primitive covers lathed
// cylinders and coins, boxed 9V and lantern cells, and stadium-shaped twin
// packs. `offset` moves the surface outward (positive) or inward (negative)
// from the base shape, which is how fillets, crimps and shoulders are drawn.
// Units are millimeters, Y is up.

const TAU = Math.PI * 2;

/** Points on a rounded-rect perimeter, counterclockwise seen from +Y. */
function perimeter(a, b, r, k) {
  const pts = [];
  // Corner centers in order: (+,+), (-,+), (-,-), (+,-); arc angles 0..90, 90..180, ...
  const cs = [
    [a - r, b - r],
    [-(a - r), b - r],
    [-(a - r), -(b - r)],
    [a - r, -(b - r)],
  ];
  for (let c = 0; c < 4; c++) {
    for (let s = 0; s <= k; s++) {
      const t = (c * Math.PI) / 2 + ((s / k) * Math.PI) / 2;
      pts.push({ cx: cs[c][0], cz: cs[c][1], nx: Math.cos(t), nz: Math.sin(t) });
    }
  }
  return pts;
}

/**
 * Sweep a profile around a rounded rectangle.
 * @param {object} o
 * @param {number} o.a half-extent along x
 * @param {number} o.b half-extent along z
 * @param {number} o.r corner radius (a = b = r is a circle)
 * @param {Array<[number, number, boolean?]>} o.profile [offset, y, sharp]
 *   traversed bottom to top along the outside.
 * @param {boolean} [o.capBottom=true] @param {boolean} [o.capTop=true]
 * @param {boolean} [o.closed=false] profile is a closed loop (ring); no caps
 * @param {number} [o.k] arc steps per corner
 * @param {number[]} [o.at] translation [x, y, z]
 */
export function sweep(o) {
  const { a, b, r, profile } = o;
  const circle = Math.abs(a - r) < 1e-9 && Math.abs(b - r) < 1e-9;
  const k = o.k ?? (circle ? 18 : Math.max(4, Math.round(r * 2.5)));
  const per = perimeter(a, b, r, k);
  const [tx, ty, tz] = o.at ?? [0, 0, 0];
  const closed = !!o.closed;
  const capBottom = closed ? false : o.capBottom ?? true;
  const capTop = closed ? false : o.capTop ?? true;

  // Expand the profile into rows with 2D normals; sharp points become two rows.
  const prof = closed ? [...profile, profile[0]] : profile;
  const seg = [];
  for (let i = 0; i < prof.length - 1; i++) {
    const [o0, y0] = prof[i];
    const [o1, y1] = prof[i + 1];
    const dx = o1 - o0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1e-9;
    seg.push({ n: [dy / len, -dx / len], len });
  }
  const rows = [];
  let arc = 0;
  for (let i = 0; i < prof.length; i++) {
    const [off, y, sharp] = prof[i];
    const prev = seg[i - 1] ?? (closed ? seg[seg.length - 1] : null);
    const next = seg[i] ?? (closed ? seg[0] : null);
    if (i > 0) arc += seg[i - 1].len;
    if (sharp && prev && next) {
      rows.push({ off, y, n: prev.n, v: arc });
      rows.push({ off, y, n: next.n, v: arc });
    } else {
      const p = prev?.n ?? next.n;
      const q = next?.n ?? prev.n;
      let nx = p[0] + q[0];
      let ny = p[1] + q[1];
      const l = Math.hypot(nx, ny) || 1;
      rows.push({ off, y, n: [nx / l, ny / l], v: arc });
    }
  }
  const total = arc || 1;

  // Perimeter arc length for u (measured on the base shape).
  const cum = [0];
  for (let j = 1; j < per.length; j++) {
    const p0 = per[j - 1];
    const p1 = per[j];
    const x0 = p0.cx + p0.nx * r;
    const z0 = p0.cz + p0.nz * r;
    const x1 = p1.cx + p1.nx * r;
    const z1 = p1.cz + p1.nz * r;
    cum.push(cum[j - 1] + Math.hypot(x1 - x0, z1 - z0));
  }
  const closeLen = (() => {
    const p0 = per[per.length - 1];
    const p1 = per[0];
    return Math.hypot(p1.cx + p1.nx * r - (p0.cx + p0.nx * r), p1.cz + p1.nz * r - (p0.cz + p0.nz * r));
  })();
  const perTotal = cum[cum.length - 1] + closeLen || 1;

  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const cols = per.length + 1; // repeat first column for a clean u seam

  for (const row of rows) {
    const rr = Math.max(0, r + row.off);
    for (let j = 0; j < cols; j++) {
      const p = per[j % per.length];
      // Offsetting a rounded rect: the corner centers stay put, the radius grows.
      const x = p.cx + p.nx * rr;
      const z = p.cz + p.nz * rr;
      positions.push(x + tx, row.y + ty, z + tz);
      const nh = row.n[0];
      const nl = Math.hypot(nh * p.nx, row.n[1], nh * p.nz) || 1;
      normals.push((nh * p.nx) / nl, row.n[1] / nl, (nh * p.nz) / nl);
      uvs.push(j === per.length ? 1 : cum[j] / perTotal, row.v / total);
    }
  }
  for (let i = 0; i < rows.length - 1; i++) {
    if (rows[i].y === rows[i + 1].y && rows[i].off === rows[i + 1].off) continue; // sharp duplicate
    for (let j = 0; j < cols - 1; j++) {
      const p0 = i * cols + j;
      const p1 = p0 + 1;
      const q0 = p0 + cols;
      const q1 = q0 + 1;
      // CCW perimeter + upward profile: (p0, p1, q1), (p0, q1, q0) faces outward.
      indices.push(p0, q1, p1, p0, q0, q1);
    }
  }

  const cap = (row, up) => {
    const rr = Math.max(0, r + row.off);
    const base = positions.length / 3;
    positions.push(tx, row.y + ty, tz);
    normals.push(0, up ? 1 : -1, 0);
    uvs.push(0.5, 0.5);
    const span = Math.max(a + row.off, b + row.off, 1e-6);
    for (let j = 0; j < per.length; j++) {
      const p = per[j];
      const x = p.cx + p.nx * rr;
      const z = p.cz + p.nz * rr;
      positions.push(x + tx, row.y + ty, z + tz);
      normals.push(0, up ? 1 : -1, 0);
      uvs.push(0.5 + x / (2 * span), 0.5 - z / (2 * span));
    }
    for (let j = 0; j < per.length; j++) {
      const c0 = base + 1 + j;
      const c1 = base + 1 + ((j + 1) % per.length);
      if (up) indices.push(base, c1, c0);
      else indices.push(base, c0, c1);
    }
  };
  if (capBottom) cap(rows[0], false);
  if (capTop) cap(rows[rows.length - 1], true);

  return { positions, normals, uvs, indices };
}

/** A flat disc or rounded-rect face (for decals), facing +Y or -Y. */
export function face({ a, b, r, y = 0, up = true, at = [0, 0, 0] }) {
  const circle = Math.abs(a - r) < 1e-9 && Math.abs(b - r) < 1e-9;
  const k = circle ? 32 : Math.max(4, Math.round(r * 2.5));
  const per = perimeter(a, b, r, k);
  const [tx, ty, tz] = at;
  const positions = [tx, y + ty, tz];
  const normals = [0, up ? 1 : -1, 0];
  const uvs = [0.5, 0.5];
  const indices = [];
  for (const p of per) {
    const x = p.cx + p.nx * r;
    const z = p.cz + p.nz * r;
    positions.push(x + tx, y + ty, z + tz);
    normals.push(0, up ? 1 : -1, 0);
    uvs.push(0.5 + x / (2 * a), 0.5 - z / (2 * b));
  }
  for (let j = 0; j < per.length; j++) {
    const c0 = 1 + j;
    const c1 = 1 + ((j + 1) % per.length);
    if (up) indices.push(0, c1, c0);
    else indices.push(0, c0, c1);
  }
  return { positions, normals, uvs, indices };
}

/** A round wire swept along a helix (lantern-battery springs). */
export function helix({ radius, pitch, turns, wire, at = [0, 0, 0], taper = 0 }) {
  const [tx, ty, tz] = at;
  const steps = Math.max(24, Math.round(turns * 40));
  const ring = 10;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = t * turns * TAU;
    const R = radius * (1 - taper * t);
    const c = [Math.cos(ang) * R, t * turns * pitch, Math.sin(ang) * R];
    // Frame: tangent along the helix, one normal pointing at the axis.
    const T = [-Math.sin(ang) * R * turns * TAU, turns * pitch, Math.cos(ang) * R * turns * TAU];
    const tl = Math.hypot(...T);
    T[0] /= tl; T[1] /= tl; T[2] /= tl;
    const N = [Math.cos(ang), 0, Math.sin(ang)];
    const B = [T[1] * N[2] - T[2] * N[1], T[2] * N[0] - T[0] * N[2], T[0] * N[1] - T[1] * N[0]];
    for (let j = 0; j <= ring; j++) {
      const v = (j / ring) * TAU;
      const nx = N[0] * Math.cos(v) + B[0] * Math.sin(v);
      const ny = N[1] * Math.cos(v) + B[1] * Math.sin(v);
      const nz = N[2] * Math.cos(v) + B[2] * Math.sin(v);
      positions.push(c[0] + nx * wire + tx, c[1] + ny * wire + ty, c[2] + nz * wire + tz);
      normals.push(nx, ny, nz);
      uvs.push(t, j / ring);
    }
  }
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < ring; j++) {
      const a = i * (ring + 1) + j;
      const b = a + ring + 1;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  return { positions, normals, uvs, indices };
}

/** Rotate a mesh in place about the Z axis by `deg` around point [cx, cy]. */
export function rotateZ(m, deg, cx = 0, cy = 0) {
  const t = (deg * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  for (let i = 0; i < m.positions.length; i += 3) {
    const x = m.positions[i] - cx;
    const y = m.positions[i + 1] - cy;
    m.positions[i] = x * c - y * s + cx;
    m.positions[i + 1] = x * s + y * c + cy;
    const nx = m.normals[i];
    const ny = m.normals[i + 1];
    m.normals[i] = nx * c - ny * s;
    m.normals[i + 1] = nx * s + ny * c;
  }
  return m;
}

/** Merge meshes into one (same material). */
export function merge(list) {
  const out = { positions: [], normals: [], uvs: [], indices: [] };
  for (const m of list) {
    const base = out.positions.length / 3;
    out.positions.push(...m.positions);
    out.normals.push(...m.normals);
    out.uvs.push(...m.uvs);
    for (const i of m.indices) out.indices.push(i + base);
  }
  return out;
}

/** Signed volume (mm³); positive when faces wind outward. Used by tests. */
export function signedVolume(m) {
  let v = 0;
  const p = m.positions;
  for (let i = 0; i < m.indices.length; i += 3) {
    const a = m.indices[i] * 3;
    const b = m.indices[i + 1] * 3;
    const c = m.indices[i + 2] * 3;
    v +=
      (p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) -
        p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) +
        p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])) /
      6;
  }
  return v;
}

/** Replace sharp corners of a polyline with arcs. pts: [x, y, radius?]. */
export function fillet(pts, steps = 5) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const [x, y, rad] = pts[i];
    if (!rad || i === 0 || i === pts.length - 1) {
      out.push([x, y, rad === 0]);
      continue;
    }
    const [px, py] = pts[i - 1];
    const [nx, ny] = pts[i + 1];
    let ux = px - x, uy = py - y;
    let vx = nx - x, vy = ny - y;
    const lu = Math.hypot(ux, uy);
    const lv = Math.hypot(vx, vy);
    ux /= lu; uy /= lu; vx /= lv; vy /= lv;
    const cos = ux * vx + uy * vy;
    const ang = Math.acos(Math.max(-1, Math.min(1, cos)));
    if (ang < 1e-3 || Math.PI - ang < 1e-3) {
      out.push([x, y]);
      continue;
    }
    const d = Math.min(rad / Math.tan(ang / 2), lu * 0.5, lv * 0.5);
    const rr = d * Math.tan(ang / 2);
    const sx = x + ux * d, sy = y + uy * d;
    const ex = x + vx * d, ey = y + vy * d;
    // Center along the bisector.
    let bx = ux + vx, by = uy + vy;
    const lb = Math.hypot(bx, by);
    bx /= lb; by /= lb;
    const h = rr / Math.sin(ang / 2);
    const cx = x + bx * h, cy = y + by * h;
    let a0 = Math.atan2(sy - cy, sx - cx);
    let a1 = Math.atan2(ey - cy, ex - cx);
    let da = a1 - a0;
    while (da > Math.PI) da -= TAU;
    while (da < -Math.PI) da += TAU;
    for (let s = 0; s <= steps; s++) {
      const t = a0 + (da * s) / steps;
      out.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]);
    }
  }
  return out;
}
