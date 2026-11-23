#!/usr/bin/env node
// Copy IBM Plex Mono into public/fonts from IBM's pinned release.
//
//   node scripts/fonts.mjs
//
// The woff2 files are IBM's own split builds, byte for byte. "Plex" is a
// Reserved Font Name, and under OFL section 3 a subset is a Modified Version
// that may not carry it, so nothing here subsets or rewrites the fonts.
// Latin1 covers the site's text; Pi covers the symbols the data uses (Ω,
// subscript digits, arrows, ≈, ≤). The unicode-range values in
// src/styles/global.css are copied from IBMPlexMono-*.css in the same zip.
//
// Every download and every extracted file is checked against a pinned SHA-256,
// so a re-run fetches the same bytes or stops. Outputs are committed; re-run
// only to change weights or bump the release.
// Needs `unzip` (macOS and most Linux images ship it).
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cacheDir = path.join(root, 'node_modules', '.cache', 'batteries-fonts');
const outDir = path.join(root, 'public', 'fonts');

// IBM/plex release @ibm/plex-mono@2.5.0 (published 2026-06-11).
const ZIP = {
  url: 'https://github.com/IBM/plex/releases/download/%40ibm/plex-mono%402.5.0/ibm-plex-mono.zip',
  sha256: '6d23f01257663d8cc49a0d64c22ced630b79e0e2a0ac08a0da86e9a38bbc481c',
};

const MEMBERS = [
  ['fonts/split/woff2/IBMPlexMono-Regular-Latin1.woff2', 'ibm-plex-mono-400.woff2', 'e8993d946649b9d01abb1ed06d574b19d8ea3e66b5c3948602db335c44c18e56'],
  ['fonts/split/woff2/IBMPlexMono-Medium-Latin1.woff2', 'ibm-plex-mono-500.woff2', '41201b658a328b9d00368215c2f1102770f80b15952ab82631e4006255e6365d'],
  ['fonts/split/woff2/IBMPlexMono-SemiBold-Latin1.woff2', 'ibm-plex-mono-600.woff2', 'b7acd05041ab65f3b7039e218ddd893065e11a07e85ea85019473152a51b6b7d'],
  ['fonts/split/woff2/IBMPlexMono-Regular-Pi.woff2', 'ibm-plex-mono-400-pi.woff2', 'b8002770aa636f544ba43e124da6a227301769754f295eae26e16475b469c767'],
  ['fonts/split/woff2/IBMPlexMono-SemiBold-Pi.woff2', 'ibm-plex-mono-600-pi.woff2', '1637166246d386507b1351d59ddda93b732f781d06c0a6574e486104a00897b1'],
  ['LICENSE.txt', 'OFL-IBMPlexMono.txt', '7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da'],
];

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

fs.mkdirSync(cacheDir, { recursive: true });
const zipPath = path.join(cacheDir, 'ibm-plex-mono.zip');
if (!fs.existsSync(zipPath) || sha(fs.readFileSync(zipPath)) !== ZIP.sha256) {
  console.log(`downloading ${ZIP.url}`);
  const res = await fetch(ZIP.url);
  if (!res.ok) throw new Error(`download failed: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (sha(buf) !== ZIP.sha256) throw new Error(`zip SHA-256 mismatch: got ${sha(buf)}`);
  fs.writeFileSync(zipPath, buf);
}

fs.mkdirSync(outDir, { recursive: true });
for (const [member, out, want] of MEMBERS) {
  const buf = execFileSync('unzip', ['-p', zipPath, `ibm-plex-mono/${member}`], { maxBuffer: 1 << 24 });
  if (sha(buf) !== want) throw new Error(`${member}: SHA-256 mismatch, got ${sha(buf)}`);
  if (out.endsWith('.woff2') && buf.subarray(0, 4).toString('latin1') !== 'wOF2') throw new Error(`${member} is not woff2`);
  fs.writeFileSync(path.join(outDir, out), buf);
  console.log(`${out.padEnd(28)} ${String(buf.length).padStart(6)} bytes`);
}
