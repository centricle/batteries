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
  const H = d.height.nominal;

  // Layout spans to size text and strokes consistently across 9mm and 115mm batteries.
  const isDisc = b.form === 'disc';
  const isCyl = b.form === 'cylinder' || (b.form === 'twin' && !!d.diameter && !d.width);
  const D = d.diameter?.nominal ?? 0;
  const W = d.width?.nominal ?? D;
  const P = d.depth?.nominal ?? D;

  const span = isDisc ? D * 1.6 : Math.max(H, W + P);
  const sw = span * 0.0035; // outline stroke
  const dw = sw * 0.6; // dimension stroke

  // Text must read at the site's floor (text-xs, 16.8 px) on a phone. At 390 px
  // wide the drawing is about 304 px across, so text needs at least MIN_TEXT
  // (16.8 / 304, rounded up) of the viewBox width. The
  // gaps and margins are in text units, so a larger text size also widens the
  // viewBox; step toward the size that satisfies both (it converges, since
  // the width grows by well under 1/MIN_TEXT per unit of text).
  const MIN_TEXT = 0.0555;
  let ts = Math.max(span * 0.042, 0.55);
  let out = layout(ts);
  for (let i = 0; i < 60 && ts < MIN_TEXT * out.vbw * 0.9995; i++) {
    ts = MIN_TEXT * out.vbw;
    out = layout(ts);
  }
  const { vbx, vby, vbw, vbh } = out;

  function layout(ts: number) {
    const els: string[] = [];
    const ah = ts * 0.55; // arrowhead
    const gap = ts * 1.8;

    const path = (pts: Pt[], cls = 'o', close = true) =>
      `<path class="${cls}" d="M${pts.map(([x, y]) => `${x.toFixed(3)} ${y.toFixed(3)}`).join('L')}${close ? 'Z' : ''}"/>`;
    const line = (x1: number, y1: number, x2: number, y2: number, cls = 'dl') => `<line class="${cls}" x1="${x1.toFixed(3)}" y1="${y1.toFixed(3)}" x2="${x2.toFixed(3)}" y2="${y2.toFixed(3)}"/>`;
    // Where the text went, so the viewBox can grow to hold every label: a
    // label too long to sit between its arrows is drawn outside them.
    const ink = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
    const reach = (x0: number, x1: number, y0: number, y1: number) => {
      ink.x0 = Math.min(ink.x0, x0); ink.x1 = Math.max(ink.x1, x1);
      ink.y0 = Math.min(ink.y0, y0); ink.y1 = Math.max(ink.y1, y1);
    };
    // A figure's width: IBM Plex Mono advances 0.6 em, plus a little room.
    const tw = (s: string) => s.length * ts * 0.62;
    // Figures sit on an alphabetic baseline at (x, y). Digits and Ø rise
    // about 0.7 em, so CAP is where the top of a figure lands.
    const CAP = 0.7;
    const text = (x: number, y: number, s: string, anchor = 'middle', rot = 0) => {
      const w = tw(s);
      const a0 = anchor === 'start' ? 0 : anchor === 'end' ? -w : -w / 2;
      if (rot) reach(x - ts * (CAP + 0.1), x + ts * 0.1, y - a0 - w, y - a0);
      else reach(x + a0, x + a0 + w, y - ts * (CAP + 0.1), y + ts * 0.1);
      return `<text class="fig" x="${x.toFixed(3)}" y="${y.toFixed(3)}" font-size="${ts.toFixed(3)}" text-anchor="${anchor}"${rot ? ` transform="rotate(${rot} ${x.toFixed(3)} ${y.toFixed(3)})"` : ''}>${s}</text>`;
    };
    const arrow = (x: number, y: number, dx: number, dy: number) => {
      const l = Math.hypot(dx, dy);
      const ux = dx / l, uy = dy / l;
      const px = -uy, py = ux;
      return `<path class="ah" d="M${x} ${y}L${x - ux * ah + px * ah * 0.32} ${y - uy * ah + py * ah * 0.32}L${x - ux * ah - px * ah * 0.32} ${y - uy * ah - py * ah * 0.32}Z"/>`;
    };
    /** Horizontal dimension between x1 and x2 at height y (SVG coords). */
    // The figure sits beside an unbroken dimension line, on the side away
    // from the part, centered on the span whether or not it fits between
    // the extension lines; a span too short for its arrows gets them outside.
    const hdim = (x1: number, x2: number, y: number, yFrom: number, label: string) => {
      const out = Math.sign(y - yFrom) || -1;
      els.push(line(x1, yFrom, x1, y + out * ts * 0.4, 'el'), line(x2, yFrom, x2, y + out * ts * 0.4, 'el'));
      if (Math.abs(x2 - x1) > ah * 2.6) els.push(line(x1, y, x2, y), arrow(x1, y, x1 - x2, 0), arrow(x2, y, x2 - x1, 0));
      else els.push(line(x1 - ah * 2.5, y, x2 + ah * 2.5, y), arrow(x1, y, x2 - x1, 0), arrow(x2, y, x1 - x2, 0));
      els.push(text((x1 + x2) / 2, out > 0 ? y + ts * (CAP + 0.55) : y - ts * 0.45, label));
    };
    /** Vertical dimension between y1 and y2 at x. */
    // Vertical: the figure reads from below (turned a quarter left) beside
    // the line, away from the part. On a span shorter than the figure it
    // stays level, beside the line at mid-height.
    const vdim = (y1: number, y2: number, x: number, xFrom: number, label: string) => {
      const out = Math.sign(x - xFrom) || -1;
      const span = Math.abs(y2 - y1), mid = (y1 + y2) / 2;
      els.push(line(xFrom, y1, x + out * ts * 0.4, y1, 'el'), line(xFrom, y2, x + out * ts * 0.4, y2, 'el'));
      if (span > ah * 2.6) els.push(line(x, y1, x, y2), arrow(x, y1, 0, y1 - y2), arrow(x, y2, 0, y2 - y1));
      else els.push(line(x, y1 - ah * 2.5, x, y2 + ah * 2.5), arrow(x, y1, 0, y2 - y1), arrow(x, y2, 0, y1 - y2));
      if (span > tw(label) + ts) els.push(text(out < 0 ? x - ts * 0.45 : x + ts * (CAP + 0.45), mid, label, 'middle', -90));
      else els.push(text(x + out * ts * 0.5, mid + ts * CAP / 2, label, out > 0 ? 'start' : 'end'));
    };
    // Captions are as large as the figures (they are read on a phone too),
    // set apart by typeface and color instead.
    const caption = (x: number, y: number, s: string) => {
      reach(x - s.length * ts * 0.3, x + s.length * ts * 0.3, y - ts * 0.85, y + ts * 0.3);
      return `<text class="cap" x="${x.toFixed(3)}" y="${y.toFixed(3)}" font-size="${ts.toFixed(3)}" text-anchor="middle">${s}</text>`;
    };

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
      els.push(caption(0, gap + ts * 3.2, 'Front'), caption(sx, gap + ts * 3.2, 'Side'));
      vbx = -hw - gap * 1.8;
      vby = -H - gap * 1.1;
      vbw = sx + P / 2 + gap * 1.2 - vbx;
      vbh = H + gap * 3.4;
    }
    const pad = ts * 0.4;
    const x0 = Math.min(vbx, ink.x0 - pad), y0 = Math.min(vby, ink.y0 - pad);
    const x1 = Math.max(vbx + vbw, ink.x1 + pad), y1 = Math.max(vby + vbh, ink.y1 + pad);
    return { els, vbx: x0, vby: y0, vbw: x1 - x0, vbh: y1 - y0 };
  }

  const style = `<style>
    .o{fill:none;stroke:currentColor;stroke-width:${sw.toFixed(4)};stroke-linejoin:round}
    .fw{fill:var(--draw-fill, rgba(127,140,160,0.08))}
    .dl{stroke:var(--draw-dim,currentColor);stroke-width:${dw.toFixed(4)}}
    .el{stroke:var(--draw-dim,currentColor);stroke-width:${(dw * 0.7).toFixed(4)};opacity:0.6}
    .cl{stroke:var(--draw-dim,currentColor);stroke-width:${(dw * 0.6).toFixed(4)};stroke-dasharray:${(ts * 1.2).toFixed(3)} ${(ts * 0.35).toFixed(3)} ${(ts * 0.2).toFixed(3)} ${(ts * 0.35).toFixed(3)};opacity:0.55}
    .ah{fill:var(--draw-dim,currentColor)}
    .fig{fill:var(--draw-text,currentColor);font-family:var(--font-mono,ui-monospace,SFMono-Regular,Menlo,monospace);font-weight:500}
    .cap{fill:currentColor;font-family:var(--font-sans,system-ui,sans-serif)}
  </style>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbx.toFixed(2)} ${vby.toFixed(2)} ${vbw.toFixed(2)} ${vbh.toFixed(2)}" role="img" aria-label="Dimensioned drawing of the ${b.name}, in millimeters">${style}${out.els.join('')}</svg>`;
}
