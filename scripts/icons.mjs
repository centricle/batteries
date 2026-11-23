#!/usr/bin/env node
// Render the PNG icons from public/favicon.svg.
//
//   node scripts/icons.mjs
//
// The SVG is the source; src/components/Mark.astro draws the same thing
// inline. Outputs are committed, so re-run only when the mark changes. sharp
// arrives with Astro's image service, so this adds no dependency. iOS rounds
// the corners of apple-touch-icon itself; the file stays square.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = fs.readFileSync(path.join(root, 'public/favicon.svg'));

const outputs = [
  { file: 'public/apple-touch-icon.png', size: 180 },
];

for (const { file, size } of outputs) {
  // Rasterize at the target size directly (density scales the 32-unit
  // viewBox), so the edges stay sharp instead of being resampled.
  await sharp(svg, { density: (72 * size) / 32 }).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(root, file));
  console.log(`${file}  ${size}x${size}`);
}
