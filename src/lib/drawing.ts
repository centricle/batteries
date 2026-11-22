// Dimensioned technical drawing (SVG string) from the parametric model.
// Two orthographic views per battery, true proportions, nominal dimensions
// labeled in mm. Colors come from CSS (currentColor + classes) so it themes.
import { describe } from './geometry/model.js';
import type { Battery } from './data';
import { fmt } from './data';

type Pt = [number, number];

export function drawingSVG(b: Battery) {
  const m = describe(b as any);
  const d = b.dimensions;
  const els: string[] = [];
  const H = d.height.nominal;

  // Layout spans to size text and strokes consistently across 9 mm and 115 mm cells.
  const isDisc = b.form === 'disc';
  const isCyl = b.form === 'cylinder' || (b.form === 'twin' && !!d.diameter && !d.width);
  const D = d.diameter?.nominal ?? 0;
  const W = d.width?.nominal ?? D;
  const P = d.depth?.nominal ?? D;

  const span = isDisc ? D * 1.6 : Math.max(H, W + P);
  const ts = Math.max(span * 0.042, 0.55); // text size
  const sw = span * 0.0035; // outline stroke
  const dw = sw * 0.6; // dimension stroke
  const ah = ts * 0.55; // arrowhead
  const gap = ts * 2.2;

  const path = (pts: Pt[], cls = 'o', close = true) =>
    `<path class="${cls}" d="M${pts.map(([x, y]) => `${x.toFixed(3)} ${y.toFixed(3)}`).join('L')}${close ? 'Z' : ''}"/>`;
  const line = (x1: number, y1: number, x2: number, y2: number, cls = 'dl') => `<line class="${cls}" x1="${x1.toFixed(3)}" y1="${y1.toFixed(3)}" x2="${x2.toFixed(3)}" y2="${y2.toFixed(3)}"/>`;
  const text = (x: number, y: number, s: string, anchor = 'middle', rot = 0) =>
    `<text x="${x.toFixed(3)}" y="${y.toFixed(3)}" font-size="${ts.toFixed(3)}" text-anchor="${anchor}" dominant-baseline="middle"${rot ? ` transform="rotate(${rot} ${x.toFixed(3)} ${y.toFixed(3)})"` : ''}>${s}</text>`;
  const arrow = (x: number, y: number, dx: number, dy: number) => {
    const l = Math.hypot(dx, dy);
    const ux = dx / l, uy = dy / l;
    const px = -uy, py = ux;
    return `<path class="ah" d="M${x} ${y}L${x - ux * ah + px * ah * 0.32} ${y - uy * ah + py * ah * 0.32}L${x - ux * ah - px * ah * 0.32} ${y - uy * ah - py * ah * 0.32}Z"/>`;
  };
  /** Horizontal dimension between x1 and x2 at height y (SVG coords). */
  const hdim = (x1: number, x2: number, y: number, yFrom: number, label: string) => {
    els.push(line(x1, yFrom, x1, y + Math.sign(y - yFrom) * ts * 0.4, 'el'), line(x2, yFrom, x2, y + Math.sign(y - yFrom) * ts * 0.4, 'el'));
    const inside = Math.abs(x2 - x1) > ah * 2.6 + label.length * ts * 0.55;
    if (inside) {
      els.push(line(x1, y, x2, y), arrow(x1, y, x1 - x2, 0), arrow(x2, y, x2 - x1, 0));
      els.push(`<rect class="tb" x="${((x1 + x2) / 2 - label.length * ts * 0.32).toFixed(3)}" y="${(y - ts * 0.6).toFixed(3)}" width="${(label.length * ts * 0.64).toFixed(3)}" height="${(ts * 1.2).toFixed(3)}"/>`);
      els.push(text((x1 + x2) / 2, y, label));
    } else {
      els.push(line(x1 - ah * 2.5, y, x2 + ah * 2.5, y), arrow(x1, y, x2 - x1, 0), arrow(x2, y, x1 - x2, 0));
      els.push(text(x2 + ah * 3, y, label, 'start'));
    }
  };
  /** Vertical dimension between y1 and y2 at x. */
  const vdim = (y1: number, y2: number, x: number, xFrom: number, label: string) => {
    els.push(line(xFrom, y1, x + Math.sign(x - xFrom) * ts * 0.4, y1, 'el'), line(xFrom, y2, x + Math.sign(x - xFrom) * ts * 0.4, y2, 'el'));
    const inside = Math.abs(y2 - y1) > ah * 2.6 + label.length * ts * 0.55;
    if (inside) {
      els.push(line(x, y1, x, y2), arrow(x, y1, 0, y1 - y2), arrow(x, y2, 0, y2 - y1));
      els.push(`<rect class="tb" x="${(x - ts * 0.6).toFixed(3)}" y="${((y1 + y2) / 2 - label.length * ts * 0.32).toFixed(3)}" width="${(ts * 1.2).toFixed(3)}" height="${(label.length * ts * 0.64).toFixed(3)}"/>`);
      els.push(text(x, (y1 + y2) / 2, label, 'middle', -90));
    } else {
      els.push(line(x, y1 - ah * 2.5, x, y2 + ah * 2.5), arrow(x, y1, 0, y2 - y1), arrow(x, y2, 0, y1 - y2));
      els.push(text(x + ts * 0.9, Math.min(y1, y2) - ah * 3.2, label, 'start'));
    }
  };
  const caption = (x: number, y: number, s: string) => `<text class="cap" x="${x.toFixed(3)}" y="${y.toFixed(3)}" font-size="${(ts * 0.8).toFixed(3)}" text-anchor="middle">${s}</text>`;

  const front = (dx: number, dy: number, which: 'front' | 'side' = 'front') => {
    // Outline every part (SVG y down: flip).
    for (const p of m.parts as any[]) {
      const pts: Pt[] = (which === 'front' ? p.front : p.side).map(([x, y]: Pt) => [x + dx, -y + dy]);
      els.push(path(pts, p.material === 'wrap' ? 'o fw' : 'o'));
    }
  };

  let vbx = 0, vby = 0, vbw = 0, vbh = 0;
  if (isDisc) {
    const R = D / 2;
    // Face view at origin, edge view below.
    els.push(`<circle class="o fw" cx="0" cy="0" r="${R}"/>`);
    els.push(`<circle class="o" cx="0" cy="0" r="${(R * 0.9).toFixed(3)}"/>`);
    els.push(line(-R - ts, 0, R + ts, 0, 'cl'), line(0, -R - ts, 0, R + ts, 'cl'));
    hdim(-R, R, -R - gap, -R * 0.2, `Ø${fmt(D)}`);
    const ey = R + gap * 1.2 + H;
    front(0, ey, 'front');
    vdim(ey - H, ey, R + gap, R, fmt(H));
    els.push(caption(0, ey + ts * 2.2, 'Edge view'));
    vbx = -R - gap * 1.4;
    vby = -R - gap * 1.8;
    vbw = 2 * R + gap * 4.2 + ts * 3;
    vbh = ey + ts * 3.2 - vby;
  } else if (isCyl) {
    const R = D / 2;
    front(0, 0);
    els.push(line(0, ts * 0.8, 0, -H - ts * 0.8, 'cl'));
    vdim(-H, 0, -R - gap, -R, fmt(H));
    hdim(-R, R, gap, 0, `Ø${fmt(D)}`);
    const pos = b.geometry?.positive;
    const top = m.parts.find((p: any) => p.name === 'positive') as any;
    if (top && pos?.style === 'button') {
      const xs = top.front.map((q: Pt) => q[0]);
      const pr = Math.max(...xs);
      const ys = top.front.map((q: Pt) => q[1]);
      const pbase = Math.min(...ys);
      if (pos.diameter) hdim(-pr, pr, -H - gap * 0.9, -H, `Ø${fmt(pos.diameter)}`);
      if (pos.height) vdim(-H, -pbase, R + gap * 0.9, pr, fmt(pos.height));
    }
    // End view to the right.
    const ex = R * 2 + gap * 2.2 + R;
    const ey = -H / 2;
    els.push(`<circle class="o fw" cx="${ex}" cy="${ey}" r="${R}"/>`);
    const inner = m.parts.find((p: any) => p.name === 'top') as any;
    if (inner) els.push(`<circle class="o" cx="${ex}" cy="${ey}" r="${Math.max(...inner.front.map((q: Pt) => q[0])).toFixed(3)}"/>`);
    if (top) els.push(`<circle class="o" cx="${ex}" cy="${ey}" r="${Math.max(...top.front.map((q: Pt) => q[0])).toFixed(3)}"/>`);
    els.push(line(ex - R - ts, ey, ex + R + ts, ey, 'cl'), line(ex, ey - R - ts, ex, ey + R + ts, 'cl'));
    els.push(caption(ex, ey + R + ts * 2, 'Positive end'));
    vbx = -R - gap * 1.8;
    vby = -H - gap * 1.7;
    vbw = ex + R + gap * 1.5 - vbx;
    vbh = H + gap * 3 + ts;
  } else {
    // Front (W x H) and side (P x H).
    const hw = W / 2;
    front(0, 0, 'front');
    vdim(-H, 0, -hw - gap, -hw, fmt(H));
    hdim(-hw, hw, gap, 0, fmt(W));
    const sx = hw + gap * 2.2 + P / 2;
    front(sx, 0, 'side');
    hdim(sx - P / 2, sx + P / 2, gap, 0, fmt(P));
    els.push(caption(0, gap * 2, 'Front'), caption(sx, gap * 2, 'Side'));
    vbx = -hw - gap * 1.8;
    vby = -H - gap * 1.1;
    vbw = sx + P / 2 + gap * 1.2 - vbx;
    vbh = H + gap * 3.4;
  }

  const style = `<style>
    .o{fill:none;stroke:currentColor;stroke-width:${sw.toFixed(4)};stroke-linejoin:round}
    .fw{fill:var(--draw-fill, rgba(127,140,160,0.08))}
    .dl{stroke:var(--draw-dim,currentColor);stroke-width:${dw.toFixed(4)}}
    .el{stroke:var(--draw-dim,currentColor);stroke-width:${(dw * 0.7).toFixed(4)};opacity:0.6}
    .cl{stroke:var(--draw-dim,currentColor);stroke-width:${(dw * 0.6).toFixed(4)};stroke-dasharray:${(ts * 1.2).toFixed(3)} ${(ts * 0.35).toFixed(3)} ${(ts * 0.2).toFixed(3)} ${(ts * 0.35).toFixed(3)};opacity:0.55}
    .ah{fill:var(--draw-dim,currentColor)}
    .tb{fill:var(--draw-bg,var(--surface,#fff))}
    text{fill:currentColor;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    .cap{fill:var(--draw-cap,currentColor);opacity:0.6;font-family:system-ui,sans-serif}
  </style>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbx.toFixed(2)} ${vby.toFixed(2)} ${vbw.toFixed(2)} ${vbh.toFixed(2)}" role="img" aria-label="Dimensioned drawing of the ${b.name}, in millimeters">${style}${els.join('')}</svg>`;
}
