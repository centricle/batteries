#!/usr/bin/env node
// Generate a GLB (true scale, meters, PBR materials) and a binary STL
// (millimeters) for every battery entry, into public/models/. Runs before
// `astro build`; the output is gitignored because it is derived from data/.
import fs from 'node:fs';
import path from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { BufferGeometry, BufferAttribute, Color, Group, Mesh, MeshStandardMaterial, Scene } from 'three';
import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';
import { batterySchema } from '../src/lib/schema.mjs';
import { describe, byMaterial, MATERIALS } from '../src/lib/geometry/model.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dataDir = path.join(root, 'data/batteries');
const chemDir = path.join(root, 'data/chemistries');
const outDir = path.join(root, 'public/models');
fs.mkdirSync(outDir, { recursive: true });

const chemColors = {};
if (fs.existsSync(chemDir)) {
  for (const f of fs.readdirSync(chemDir).filter((f) => f.endsWith('.json'))) {
    const c = JSON.parse(fs.readFileSync(path.join(chemDir, f), 'utf8'));
    chemColors[c.id] = c.color;
  }
}

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const hexToLinear = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => srgbToLinear(v / 255));
};

function writeGLB(battery, model, file, wrapColor) {
  const doc = new Document();
  doc.createBuffer();
  const scene = doc.createScene(battery.name);
  const rootNode = doc
    .createNode(battery.name)
    .setScale([0.001, 0.001, 0.001])
    .setExtras({
      id: battery.id,
      name: battery.name,
      units: 'Geometry in millimeters, scaled to meters by this node.',
      source: `https://batteries.fyi/${battery.id}`,
      license: 'MIT',
    });
  scene.addChild(rootNode);
  const mats = {};
  for (const { material, mesh } of byMaterial(model)) {
    const spec = { ...MATERIALS[material] };
    if (material === 'wrap') spec.color = wrapColor;
    if (material === 'tab' && battery.geometry?.tab_color) spec.color = battery.geometry.tab_color;
    mats[material] ??= doc
      .createMaterial(material)
      .setBaseColorFactor([...hexToLinear(spec.color), 1])
      .setMetallicFactor(spec.metalness)
      .setRoughnessFactor(spec.roughness);
    const vcount = mesh.positions.length / 3;
    const prim = doc
      .createPrimitive()
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(mesh.positions)))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(mesh.normals)))
      .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(mesh.uvs)))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(vcount > 65535 ? new Uint32Array(mesh.indices) : new Uint16Array(mesh.indices)))
      .setMaterial(mats[material]);
    const m = doc.createMesh(material).addPrimitive(prim);
    rootNode.addChild(doc.createNode(material).setMesh(m));
  }
  return new NodeIO().writeBinary(doc).then((buf) => fs.writeFileSync(file, buf));
}

// USDZ for AR Quick Look on iOS: same meshes and materials, meters, Y up.
async function writeUSDZ(battery, model, file, wrapColor) {
  const scene = new Scene();
  const g = new Group();
  g.name = battery.id;
  g.scale.setScalar(0.001);
  scene.add(g);
  const mats = {};
  for (const { material, mesh } of byMaterial(model)) {
    const spec = { ...MATERIALS[material] };
    if (material === 'wrap') spec.color = wrapColor;
    if (material === 'tab' && battery.geometry?.tab_color) spec.color = battery.geometry.tab_color;
    mats[material] ??= new MeshStandardMaterial({ name: material, color: new Color(spec.color), metalness: spec.metalness, roughness: spec.roughness });
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(new Float32Array(mesh.positions), 3));
    geo.setAttribute('normal', new BufferAttribute(new Float32Array(mesh.normals), 3));
    geo.setAttribute('uv', new BufferAttribute(new Float32Array(mesh.uvs), 2));
    geo.setIndex(Array.from(mesh.indices));
    const m = new Mesh(geo, mats[material]);
    m.name = material;
    g.add(m);
  }
  scene.updateMatrixWorld(true);
  const data = await new USDZExporter().parseAsync(scene, { quickLookCompatible: true });
  fs.writeFileSync(file, Buffer.from(data));
}

function writeSTL(battery, model, file) {
  const tris = [];
  for (const p of model.parts) {
    const { positions: P, indices: I } = p.mesh;
    for (let i = 0; i < I.length; i += 3) {
      const a = I[i] * 3, b = I[i + 1] * 3, c = I[i + 2] * 3;
      const ax = P[a], ay = P[a + 1], az = P[a + 2];
      const bx = P[b], by = P[b + 1], bz = P[b + 2];
      const cx = P[c], cy = P[c + 1], cz = P[c + 2];
      const ux = bx - ax, uy = by - ay, uz = bz - az;
      const vx = cx - ax, vy = cy - ay, vz = cz - az;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz);
      if (l < 1e-12) continue; // drop degenerate triangles
      nx /= l; ny /= l; nz /= l;
      // STL convention: Z up. Our Y up -> (x, -z, y).
      tris.push([nx, -nz, ny, ax, -az, ay, bx, -bz, by, cx, -cz, cy]);
    }
  }
  const buf = Buffer.alloc(84 + tris.length * 50);
  buf.write(`batteries.fyi ${battery.name} (mm, Z up) MIT`.slice(0, 80), 0, 'ascii');
  buf.writeUInt32LE(tris.length, 80);
  let o = 84;
  for (const t of tris) {
    for (const v of t) {
      buf.writeFloatLE(v, o);
      o += 4;
    }
    buf.writeUInt16LE(0, o);
    o += 2;
  }
  fs.writeFileSync(file, buf);
}

const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
let ok = 0;
let bytes = 0;
for (const f of files) {
  const parsed = batterySchema.safeParse(JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8')));
  if (!parsed.success) {
    console.warn(`skip ${f}: invalid (run scripts/validate.mjs)`);
    continue;
  }
  const b = parsed.data;
  const model = describe(b);
  const wrapColor = chemColors[b.variants[0].chemistry] ?? '#5b6573';
  const glb = path.join(outDir, `${b.id}.glb`);
  const stl = path.join(outDir, `${b.id}.stl`);
  const usdz = path.join(outDir, `${b.id}.usdz`);
  await writeGLB(b, model, glb, wrapColor);
  writeSTL(b, model, stl);
  await writeUSDZ(b, model, usdz, wrapColor);
  bytes += fs.statSync(glb).size + fs.statSync(stl).size + fs.statSync(usdz).size;
  ok++;
}
console.log(`models: ${ok} batteries -> public/models (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
