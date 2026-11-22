// three.js viewer. Builds each battery from the same parametric description
// the GLB/STL export uses (geometry/model.js), so the on-screen model, the
// download and the spec table share one set of numbers. Units are mm.
import {
  ACESFilmicToneMapping,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Material,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { describe, MATERIALS } from './geometry/model.js';

export interface ModelSpec {
  id: string;
  name: string;
  form: string;
  category: string;
  dimensions: any;
  geometry: any;
  color: string;
  voltage: number;
  chemistry: string;
  chemistries: { id: string; short: string; color: string; voltage: number }[];
}

export interface ViewerOptions {
  mode?: 'single' | 'lineup';
  autoRotate?: boolean;
  onLabels?: (labels: { id: string; name: string; x: number; y: number; visible: boolean }[]) => void;
}

const isDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};

function toGeometry(m: { positions: number[]; normals: number[]; uvs: number[]; indices: number[] }) {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(m.positions), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(m.normals), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(m.uvs), 2));
  g.setIndex(m.indices);
  return g;
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Shrink-wrap label: chemistry color, size name along the axis, voltage, polarity band. */
function wrapTexture(spec: ModelSpec, chemIdx: number, label: any) {
  const c = spec.chemistries[chemIdx] ?? spec.chemistries[0];
  const color = c?.color ?? spec.color;
  const pxmm = Math.min(28, 2048 / Math.max(label.circumference, label.length));
  const W = Math.max(64, Math.round(label.circumference * pxmm));
  const H = Math.max(64, Math.round(label.length * pxmm));
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const x = cv.getContext('2d')!;
  x.fillStyle = color;
  x.fillRect(0, 0, W, H);
  const light = luminance(color) > 0.5;
  const ink = light ? 'rgba(15,20,28,0.88)' : 'rgba(255,255,255,0.94)';
  const faint = light ? 'rgba(15,20,28,0.16)' : 'rgba(255,255,255,0.16)';
  // v band (texture v is bottom-up; canvas y is top-down).
  const [v0, v1] = label.band ?? [0.05, 0.95];
  const yTop = (1 - v1) * H;
  const yBot = (1 - v0) * H;
  const bandH = yBot - yTop;
  // Polarity band near the positive end.
  x.fillStyle = faint;
  x.fillRect(0, yTop, W, Math.max(2, bandH * 0.12));
  const volts = `${Number(c?.voltage ?? spec.voltage).toFixed(c?.voltage % 1 ? 1 : 0)}V`;
  const name = spec.name;
  const isBox = !!label.faces;
  // "9V Alkaline" under a "9V" name repeats itself; drop the voltage there.
  const sub = (name.replace(/\s/g, '').toUpperCase() === volts.toUpperCase() ? (c?.short ?? '') : `${volts}  ${c?.short ?? ''}`).trim();
  const centers = isBox ? boxFaceCenters(label.faces) : [0.25, 0.75];
  x.fillStyle = ink;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  for (const u of centers) {
    const cx = u * W;
    if (isBox || bandH < W * 0.5) {
      // Horizontal text (boxes, and short fat cells like D or 26650).
      const fs = Math.min(bandH * 0.22, W * 0.09);
      x.font = `700 ${Math.round(fs)}px system-ui, sans-serif`;
      x.fillText(name, cx, yTop + bandH * 0.42);
      x.font = `500 ${Math.round(fs * 0.55)}px system-ui, sans-serif`;
      x.fillText(sub, cx, yTop + bandH * 0.42 + fs * 0.95);
    } else {
      // Along the axis, reading bottom to top, as printed on real cells.
      x.save();
      x.translate(cx, yTop + bandH / 2);
      x.rotate(-Math.PI / 2);
      const fs = Math.min(W * 0.11, bandH * 0.16);
      x.font = `700 ${Math.round(fs)}px system-ui, sans-serif`;
      x.fillText(name, 0, -fs * 0.35);
      x.font = `500 ${Math.round(fs * 0.5)}px system-ui, sans-serif`;
      x.fillText(sub, 0, fs * 0.55);
      x.restore();
      // Polarity arrow toward the positive end.
      x.font = `700 ${Math.round(fs * 0.6)}px system-ui, sans-serif`;
      x.fillText('+', cx, yTop + bandH * 0.06 + fs * 0.25);
    }
  }
  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  // Perimeter runs clockwise seen from the viewer; mirror u so text reads.
  t.wrapS = RepeatWrapping;
  t.repeat.x = -1;
  t.offset.x = 1;
  return t;
}

function boxFaceCenters({ W, P, r }: { W: number; P: number; r: number }) {
  const arc = (Math.PI / 2) * r;
  const broad = W - 2 * r;
  const narrow = P - 2 * r;
  const total = 4 * arc + 2 * broad + 2 * narrow;
  const c1 = (arc + broad / 2) / total;
  const c2 = (3 * arc + broad + narrow + broad / 2) / total;
  // The wrap texture is mirrored (repeat.x = -1), so canvas x maps to 1 - u.
  return [1 - c1, 1 - c2];
}

/** Engraved-look marking on the positive face of coin and button cells. */
function faceTexture(spec: ModelSpec, chemIdx: number) {
  const c = spec.chemistries[chemIdx] ?? spec.chemistries[0];
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const x = cv.getContext('2d')!;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  const zincAir = spec.category === 'hearing-aid';
  const draw = (fill: string, dx: number, dy: number) => {
    x.fillStyle = fill;
    if (zincAir) {
      x.font = `800 ${Math.round(S * 0.3)}px system-ui, sans-serif`;
      x.fillText(spec.name, S / 2 + dx, S / 2 + dy);
      return;
    }
    x.font = `300 ${Math.round(S * 0.2)}px system-ui, sans-serif`;
    x.fillText('+', S / 2 + dx, S * 0.25 + dy);
    x.font = `700 ${Math.round(S * (spec.name.length > 6 ? 0.13 : 0.16))}px system-ui, sans-serif`;
    x.fillText(spec.name, S / 2 + dx, S * 0.5 + dy);
    x.font = `600 ${Math.round(S * 0.085)}px system-ui, sans-serif`;
    x.fillText(`${c?.voltage ?? spec.voltage}V  ${c?.short ?? ''}`, S / 2 + dx, S * 0.66 + dy);
  };
  if (zincAir) {
    draw('rgba(0,0,0,0.55)', 0, 0);
  } else {
    draw('rgba(255,255,255,0.55)', 1.5, 1.5);
    draw('rgba(40,44,52,0.62)', 0, 0);
  }
  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function shadowTexture() {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const x = cv.getContext('2d')!;
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  return new CanvasTexture(cv);
}

/** Ground plane with an anti-aliased 1 mm / 10 mm grid that fades out. */
function groundMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uColor: { value: new Color('#6b7a8c') }, uFade: { value: 120 }, uOpacity: { value: 0.5 } },
    vertexShader: `varying vec3 vPos; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vPos = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      varying vec3 vPos; uniform vec3 uColor; uniform float uFade; uniform float uOpacity;
      float grid(vec2 p, float s){ vec2 q = p / s; vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q); return 1.0 - min(min(g.x, g.y), 1.0); }
      void main(){
        float fw = max(fwidth(vPos.x), fwidth(vPos.z));
        float minor = grid(vPos.xz, 1.0) * 0.35 * clamp(1.0 - fw * 2.5, 0.0, 1.0);
        float major = grid(vPos.xz, 10.0) * 0.9 * clamp(1.0 - fw * 0.25, 0.0, 1.0);
        float d = length(vPos.xz) / uFade;
        float a = max(minor, major) * (1.0 - smoothstep(0.35, 1.0, d));
        if (a < 0.003) discard;
        gl_FragColor = vec4(uColor, a * uOpacity);
      }`,
  });
}

const EXPLODE: Record<string, number> = {
  negative: -1, gasket: -0.5, positive: 1.2, top: 0.6, washer: 0.9, ring: 0.9, tab: 1.6, 'tab-pull': 1.6,
  'positive-base': 0.5, 'negative-base': 0.5, 'positive-post': 0.6, 'negative-post': 0.6, block: 0.8, end: 0.6, bottom: -0.8, can: 1.2,
};

export function mountViewer(el: HTMLElement, specs: ModelSpec[], opts: ViewerOptions = {}) {
  const mode = opts.mode ?? (specs.length > 1 ? 'lineup' : 'single');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.touchAction = 'none';
  el.appendChild(renderer.domElement);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = 1.0;

  const camera = new PerspectiveCamera(28, 1, 0.5, 5000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = (opts.autoRotate ?? mode === 'single') && !reduced;
  controls.autoRotateSpeed = 1.2;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.enablePan = mode === 'lineup';

  const world = new Group();
  scene.add(world);
  const shadowTex = shadowTexture();
  const ground = new Mesh(new PlaneGeometry(4000, 4000), groundMaterial());
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  type Item = { depth: number; spec: ModelSpec; group: Group; parts: { mesh: Mesh; name: string; baseY: number }[]; wrapMats: MeshPhysicalMaterial[]; faceMat?: MeshStandardMaterial; label?: any; top: Vector3; width: number; height: number; chem: number };
  const items: Item[] = [];
  const mats: Material[] = [];

  function buildItem(spec: ModelSpec): Item {
    const model = describe(spec as any);
    const group = new Group();
    const parts: Item['parts'] = [];
    const wrapMats: MeshPhysicalMaterial[] = [];
    let faceMat: MeshStandardMaterial | undefined;
    for (const p of model.parts) {
      const base = (MATERIALS as any)[p.material] ?? MATERIALS.steel;
      let mat: MeshPhysicalMaterial;
      if (p.material === 'wrap') {
        mat = new MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.32, metalness: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.25 });
        if (model.label && (p.name === 'wrap' || p.name === 'wrap-2')) {
          mat.map = wrapTexture(spec, 0, model.label);
          wrapMats.push(mat);
        } else {
          mat.color = new Color(spec.color);
          wrapMats.push(mat);
          (mat as any).userData.plain = true;
        }
      } else {
        const color = p.material === 'tab' && spec.geometry?.tab_color ? spec.geometry.tab_color : base.color;
        mat = new MeshPhysicalMaterial({ color, roughness: base.roughness, metalness: base.metalness, clearcoat: p.material === 'tab' ? 0.3 : 0 });
      }
      mats.push(mat);
      const mesh = new Mesh(toGeometry(p.mesh), mat);
      group.add(mesh);
      parts.push({ mesh, name: p.name, baseY: 0 });
    }
    if (model.decal) {
      faceMat = new MeshStandardMaterial({ map: faceTexture(spec, 0), transparent: true, depthWrite: false, roughness: 0.4, metalness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
      mats.push(faceMat);
      const dm = new Mesh(toGeometry(model.decal.mesh), faceMat);
      group.add(dm);
      parts.push({ mesh: dm, name: spec.category === 'hearing-aid' ? 'tab' : 'can', baseY: 0 });
    }
    const size = model.bounds.size;
    const isDisc = spec.form === 'disc';
    let width = Math.max(size[0], size[2]);
    let height = size[1];
    if (isDisc && mode === 'lineup') {
      // Stand coins on edge, positive face toward the camera, so the diameter
      // reads against the other cells' height. Rotating +90° about X maps +Y
      // to +Z; lift by the radius so the rim sits on the ground.
      const R = size[0] / 2;
      group.rotation.x = Math.PI / 2;
      group.position.y = R;
      group.position.z = -size[1] / 2;
      width = size[0];
      height = size[0];
    }
    const shadow = new Mesh(new PlaneGeometry(1, 1), new MeshStandardMaterial({ map: shadowTex, transparent: true, depthWrite: false, color: '#000', opacity: isDark() ? 0.9 : 0.55 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    const sx = (isDisc && mode === 'lineup' ? size[0] : size[0]) * 1.7;
    const sz = (isDisc && mode === 'lineup' ? size[1] : size[2]) * 1.7;
    shadow.scale.set(sx, Math.max(sz, 4), 1);
    const holder = new Group();
    holder.add(group, shadow);
    mats.push(shadow.material as Material);
    return { depth: isDisc && mode === 'lineup' ? size[1] : size[2], spec, group: holder as any, parts, wrapMats, faceMat, label: model.label, top: new Vector3(0, height, 0), width, height, chem: 0 };
  }

  for (const s of specs) items.push(buildItem(s));

  // Layout: single centered; lineup left to right with a gap scaled to size.
  const maxH = Math.max(...items.map((i) => i.height));
  const gap = Math.max(4, maxH * 0.18);
  let x = 0;
  const totalW = items.reduce((n, i) => n + i.width, 0) + gap * (items.length - 1);
  for (const it of items) {
    it.group.position.x = x - totalW / 2 + it.width / 2;
    x += it.width + gap;
    world.add(it.group);
  }

  const span = Math.max(totalW, maxH);
  (ground.material as ShaderMaterial).uniforms.uFade.value = Math.max(60, span * 1.6);

  function frame() {
    const aspect = camera.aspect || 1;
    const vfov = (camera.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    if (mode === 'lineup') {
      // Fit the row's width and the tallest cell, leaving room for labels below.
      const depth = Math.max(...items.map((i) => i.depth));
      const dw = (totalW / 2) / Math.tan(hfov / 2) * 1.1 + depth;
      const dh = (maxH / 2) / Math.tan(vfov / 2) * 1.45 + depth;
      const dist = Math.max(dw, dh);
      const elev = 0.2;
      const ty = maxH * 0.4;
      camera.position.set(0, ty + dist * Math.sin(elev), dist * Math.cos(elev));
      controls.target.set(0, ty, 0);
      controls.minDistance = maxH * 0.6;
      controls.maxDistance = dist * 4;
    } else {
      const isFlat = specs[0].form === 'disc';
      const r = Math.max(totalW, maxH) * 0.5;
      const fit = r / Math.tan(vfov / 2);
      const dist = fit * (isFlat ? 1.75 : 1.85) / Math.min(1, aspect);
      const elev = isFlat ? 0.75 : 0.32;
      const ty = isFlat ? 0 : maxH * 0.45;
      camera.position.set(dist * 0.35, ty + dist * Math.sin(elev), dist * Math.cos(elev));
      controls.target.set(0, ty, 0);
      controls.minDistance = r * 0.8;
      controls.maxDistance = dist * 4;
    }
    controls.update();
  }

  function themeColors() {
    const dark = isDark();
    const g = ground.material as ShaderMaterial;
    g.uniforms.uColor.value = new Color(dark ? '#8fa3b8' : '#5b6b7d');
    g.uniforms.uOpacity.value = dark ? 0.35 : 0.45;
    renderer.toneMappingExposure = dark ? 1.05 : 1.0;
    for (const it of items) {
      const sh = (it.group.children[1] as Mesh).material as MeshStandardMaterial;
      sh.opacity = dark ? 0.9 : 0.5;
    }
    needs = true;
  }

  let needs = true;
  let visible = true;
  let explode = 0;
  let explodeTarget = 0;
  controls.addEventListener('change', () => (needs = true));

  function resize() {
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    needs = true;
  }
  const ro = new ResizeObserver(() => {
    const first = !camera.userData.framed;
    resize();
    if (first) {
      frame();
      camera.userData.framed = true;
    }
  });
  ro.observe(el);
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(el);

  const tmp = new Vector3();
  let raf = 0;
  let interacting = false;
  controls.addEventListener('start', () => { interacting = true; controls.autoRotate = false; });
  controls.addEventListener('end', () => (interacting = false));
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    if (Math.abs(explode - explodeTarget) > 0.001) {
      explode += (explodeTarget - explode) * 0.12;
      for (const it of items) {
        const k = Math.max(it.height * 0.18, it.width * 0.14) * explode;
        // Shift so the lowest part stays on the ground instead of sinking through it.
        const floor = Math.min(0, ...it.parts.map((p) => EXPLODE[p.name] ?? 0));
        for (const p of it.parts) p.mesh.position.y = ((EXPLODE[p.name] ?? 0) - floor) * k;
      }
      needs = true;
    }
    const moving = controls.update();
    if (!needs && !moving && !controls.autoRotate && !interacting) return;
    needs = false;
    renderer.render(scene, camera);
    if (opts.onLabels) {
      const rect = el.getBoundingClientRect();
      // Labels sit on the ground in front of each cell; when two would
      // overlap, the later one drops to the next row.
      const rows: number[] = [];
      const placed = items
        .map((it) => {
          tmp.set(it.group.position.x, 0, it.depth / 2 + 1).project(camera);
          return { it, x: ((tmp.x + 1) / 2) * rect.width, y: ((1 - tmp.y) / 2) * rect.height, visible: tmp.z < 1 };
        })
        .sort((a, b) => a.x - b.x)
        .map((p) => {
          const w = p.it.spec.name.length * 7 + 14;
          let row = 0;
          while (rows[row] !== undefined && p.x - w / 2 < rows[row] + 4) row++;
          rows[row] = p.x + w / 2;
          return { id: p.it.spec.id, name: p.it.spec.name, x: p.x, y: p.y + 8 + row * 19, visible: p.visible };
        });
      opts.onLabels(placed);
    }
  }
  resize();
  frame();
  camera.userData.framed = el.clientWidth > 0;
  themeColors();
  loop();
  const onTheme = () => themeColors();
  window.addEventListener('themechange', onTheme);
  const mq = matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', onTheme);

  return {
    setChemistry(chemIdx: number, itemIdx = 0) {
      const it = items[itemIdx];
      if (!it) return;
      it.chem = chemIdx;
      for (const m of it.wrapMats) {
        if ((m as any).userData.plain) m.color = new Color(it.spec.chemistries[chemIdx]?.color ?? it.spec.color);
        else if (it.label) {
          m.map?.dispose();
          m.map = wrapTexture(it.spec, chemIdx, it.label);
          m.needsUpdate = true;
        }
      }
      if (it.faceMat) {
        it.faceMat.map?.dispose();
        it.faceMat.map = faceTexture(it.spec, chemIdx);
        it.faceMat.needsUpdate = true;
      }
      needs = true;
    },
    setExplode(on: boolean) {
      explodeTarget = on ? 1 : 0;
    },
    setAutoRotate(on: boolean) {
      controls.autoRotate = on && !reduced;
    },
    reset() {
      frame();
      needs = true;
    },
    snapshot() {
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/png');
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('themechange', onTheme);
      mq.removeEventListener('change', onTheme);
      controls.dispose();
      mats.forEach((m) => m.dispose());
      scene.traverse((o) => (o as Mesh).geometry?.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
