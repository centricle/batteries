#!/usr/bin/env node
// Render the PNG icons from public/favicon.svg.
//
//   node scripts/icons.mjs
//
// The SVG is the source; src/components/Mark.astro draws the same thing
// inline. Outputs are committed, so re-run only when the mark changes. sharp
// arrives with Astro's image service, so this adds no dependency.
//
// The favicon is transparent, but iOS fills a transparent touch icon with
// black, so apple-touch-icon.png puts the mark on the paper color (the light
// --bg in src/styles/global.css), centered at about 70% of the square. iOS
// rounds the corners itself; the file stays square.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = fs.readFileSync(path.join(root, 'public/favicon.svg'));
const PAPER = '#f8f5f0'; // oklch(0.972 0.008 85)

const outputs = [
  { file: 'public/apple-touch-icon.png', size: 180, scale: 0.7 },
];

for (const { file, size, scale } of outputs) {
  const mark = Math.round(size * scale);
  const inset = Math.round((size - mark) / 2);
  // Rasterize the mark at its final size directly (density scales the
  // 32-unit viewBox), so the edges stay sharp instead of being resampled.
  const art = await sharp(svg, { density: (72 * mark) / 32 }).resize(mark, mark).png().toBuffer();
  const flat = await sharp({ create: { width: size, height: size, channels: 3, background: PAPER } })
    .composite([{ input: art, left: inset, top: inset }])
    .png()
    .toBuffer();
  // sharp composites after every other step, so drop the alpha channel in a
  // second pass: the file has to be opaque.
  await sharp(flat).removeAlpha().png({ compressionLevel: 9 }).toFile(path.join(root, file));
  console.log(`${file}  ${size}x${size}, mark ${mark}px on ${PAPER}`);
}
