// three.js viewer. Builds each battery from the same parametric description
// the GLB/STL export uses (geometry/model.js), so the on-screen model, the
// download and the spec table share one set of numbers. Units are mm.
import {
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
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
  /** Drag to turn and nothing else: no zoom by wheel, pinch or button, no pan. */
  turnOnly?: boolean;
  /** Called when a drag, pinch or zoom stops the automatic spin, so a Spin button can show it. */
  onSpinStop?: () => void;
  onLabels?: (labels: { id: string; name: string; x: number; y: number; visible: boolean }[]) => void;
}

const isDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};

// Colors arrive from the data as hex or as oklch(L C h). The canvas would
// take either, but three's Color parser knows no oklch, so everything is
// turned into sRGB hex first, and the label ink is chosen on OKLCH lightness.
const srgbEncode = (x: number) => Math.min(1, Math.max(0, x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055));
const srgbDecode = (x: number) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
const OKLCH = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)(%?)\s+([\d.]+)(?:deg)?/i;

/** A CSS color as #rrggbb (hex passes through; oklch is converted, clipped to sRGB). */
function cssHex(css: string) {
  const m = String(css).trim().match(OKLCH);
  if (!m) return css;
  const L = parseFloat(m[1]) / (m[2] ? 100 : 1);
  const C = parseFloat(m[3]) * (m[4] ? 0.004 : 1);
  const h = (parseFloat(m[5]) * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
  ];
  return '#' + rgb.map((v) => Math.round(srgbEncode(v) * 255).toString(16).padStart(2, '0')).join('');
}

/** OKLCH lightness (0 to 1) of a hex or oklch() color. */
function lightness(css: string) {
  const m = String(css).trim().match(OKLCH);
  if (m) return parseFloat(m[1]) / (m[2] ? 100 : 1);
  const n = parseInt(cssHex(css).slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => srgbDecode(v / 255));
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const mm = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  return 0.2104542553 * Math.cbrt(l) + 0.793617785 * Math.cbrt(mm) - 0.0040720468 * Math.cbrt(s);
}

function toGeometry(m: { positions: number[]; normals: number[]; uvs: number[]; indices: number[] }) {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(m.positions), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(m.normals), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(m.uvs), 2));
  g.setIndex(m.indices);
  return g;
}

/** Shrink-wrap label: chemistry color, size name along the axis, voltage, polarity band. */
function wrapTexture(spec: ModelSpec, chemIdx: number, label: any) {
  const c = spec.chemistries[chemIdx] ?? spec.chemistries[0];
  const color = cssHex(c?.color ?? spec.color);
  const pxmm = Math.min(28, 2048 / Math.max(label.circumference, label.length));
  const W = Math.max(64, Math.round(label.circumference * pxmm));
  const H = Math.max(64, Math.round(label.length * pxmm));
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const x = cv.getContext('2d')!;
  x.fillStyle = color;
  x.fillRect(0, 0, W, H);
  // Dark ink on any wrap lighter than OKLCH L 0.55, white on darker ones.
  // The washes all sit between L 0.60 and 0.74, so in practice dark ink.
  const light = lightness(color) > 0.55;
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
      // Horizontal text (boxes, and short fat batteries like D or 26650).
      const fs = Math.min(bandH * 0.22, W * 0.09);
      x.font = `700 ${Math.round(fs)}px system-ui, sans-serif`;
      x.fillText(name, cx, yTop + bandH * 0.42);
      x.font = `500 ${Math.round(fs * 0.55)}px system-ui, sans-serif`;
      x.fillText(sub, cx, yTop + bandH * 0.42 + fs * 0.95);
    } else {
      // Along the axis, reading bottom to top, as printed on real batteries.
      x.save();
      x.translate(cx, yTop + bandH / 2);
      x.rotate(-Math.PI / 2);
      const fs = Math.min(W * 0.11, bandH * 0.16);
      x.font = `700 ${Math.round(fs)}px system-ui, sans-serif`;
      x.fillText(name, 0, -fs * 0.35);
      x.font = `500 ${Math.round(fs * 0.5)}px system-ui, sans-serif`;
      x.fillText(sub, 0, fs * 0.55);
      x.restore();
      // Plus sign at the positive end.
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

/** Engraved-look marking on the positive face of coin and button batteries. */
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

/**
 * The light the batteries are seen in: a plain gray room with one tall softbox
 * front-left, a narrow strip behind on the right and a dim panel overhead.
 * The strips run floor to ceiling, so a cylinder shades across its width and
 * not down its length. three's RoomEnvironment hangs its lights near the
 * ceiling, which gave every battery a top-to-bottom fade that reads as rendered
 * rather than seen.
 */
function studioScene() {
  const s = new Scene();
  const box = new BoxGeometry();
  const room = new Mesh(box, new MeshBasicMaterial({ color: new Color().setScalar(0.7), side: BackSide }));
  room.scale.setScalar(40);
  s.add(room);
  const panel = (intensity: number, pos: [number, number, number], scale: [number, number, number]) => {
    const m = new Mesh(box, new MeshBasicMaterial({ color: new Color().setScalar(intensity) }));
    m.position.set(...pos);
    m.scale.set(...scale);
    s.add(m);
  };
  panel(4.5, [-14, 0, 9], [0.2, 32, 7]);
  panel(1.6, [14, 0, -5], [0.2, 32, 2.5]);
  panel(1.4, [0, 18, 0], [9, 0.2, 9]);
  return s;
}

function shadowTexture() {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const x = cv.getContext('2d')!;
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.6)');
  g.addColorStop(0.5, 'rgba(0,0,0,0.32)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  return new CanvasTexture(cv);
}

/** Ground plane with an anti-aliased 1mm / 10mm grid that fades out. */
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
  // Neutral keeps a label's base color what the data file says; ACES
  // shifted hues and pushed saturation.
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  el.appendChild(renderer.domElement);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studioScene(), 0.035).texture;
  scene.environmentIntensity = 1.0;

  const turnOnly = !!opts.turnOnly;
  const camera = new PerspectiveCamera(28, 1, 0.5, 5000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = (opts.autoRotate ?? mode === 'single') && !reduced;
  controls.autoRotateSpeed = 1.2;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.enablePan = mode === 'lineup' && !turnOnly;
  controls.enableZoom = !turnOnly;

  // The viewer never traps the page. Read against three r187's
  // OrbitControls: connect() (run by the constructor) puts pointerdown,
  // pointercancel and a non-passive wheel listener on the canvas, and sets
  // the canvas to touch-action: none. Its wheel handler calls
  // preventDefault, so once it runs the page cannot scroll.
  //
  // Wheel: a capture listener on the host runs before the canvas listener
  // and stops the event short of it, so the browser scrolls the page as
  // usual. The wheel reaches OrbitControls only when the visitor asks to
  // zoom (Ctrl or Cmd held; a trackpad pinch arrives as Ctrl+wheel) or the
  // viewer fills the screen.
  //
  // Touch: pan-y hands a vertical swipe to the browser, which scrolls and
  // sends pointercancel; OrbitControls routes pointercancel to its pointerup
  // handler, which drops the pointer, fires 'end' and returns to idle, so the
  // model is not left mid-turn. A sideways drag turns it and a two-finger
  // pinch zooms it. A turn-only viewer lets the browser have the pinch, so
  // the page can still be zoomed over it. Full screen takes every gesture.
  const fullscreenEl = () => document.fullscreenElement ?? (document as any).webkitFullscreenElement ?? null;
  const isFull = () => !!fullscreenEl()?.contains(el);
  const setTouch = () => {
    renderer.domElement.style.touchAction = isFull() ? 'none' : turnOnly ? 'pan-y pinch-zoom' : 'pan-y';
  };
  setTouch();
  const onWheel = (e: WheelEvent) => {
    if (!turnOnly && (e.ctrlKey || e.metaKey || isFull())) return;
    e.stopPropagation();
  };
  el.addEventListener('wheel', onWheel, { capture: true, passive: true });
  const onFullscreen = () => {
    setTouch();
    needs = true;
  };
  document.addEventListener('fullscreenchange', onFullscreen);
  document.addEventListener('webkitfullscreenchange', onFullscreen);

  // Touch, outside full screen: hold a finger's moves back until its
  // direction is clear. A mostly vertical move belongs to the browser, which
  // scrolls and then cancels the pointer; without this, the few moves sent
  // before it does would tip the model as the page starts to move. A
  // sideways move goes through and turns the model; a second finger (a
  // pinch) goes straight through. OrbitControls hears pointermove on the
  // document, after the canvas has captured the pointer, so these capture
  // listeners on the host run first.
  const touches = new Map<number, { x: number; y: number; turn: boolean | null }>();
  const onTouchDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    if (e.isPrimary) touches.clear();
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY, turn: null });
  };
  const onTouchMove = (e: PointerEvent) => {
    if (e.pointerType !== 'touch' || isFull() || touches.size !== 1) return;
    const t = touches.get(e.pointerId);
    if (!t) return;
    if (t.turn === null) {
      const dx = Math.abs(e.clientX - t.x);
      const dy = Math.abs(e.clientY - t.y);
      if (Math.max(dx, dy) < 8) return e.stopPropagation();
      t.turn = dx > dy;
    }
    if (!t.turn) e.stopPropagation();
  };
  const onTouchEnd = (e: PointerEvent) => touches.delete(e.pointerId);
  el.addEventListener('pointerdown', onTouchDown, { capture: true });
  el.addEventListener('pointermove', onTouchMove, { capture: true });
  el.addEventListener('pointerup', onTouchEnd, { capture: true });
  el.addEventListener('pointercancel', onTouchEnd, { capture: true });

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
        mat = new MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.42, metalness: 0.0 });
        if (model.label && (p.name === 'wrap' || p.name === 'wrap-2')) {
          mat.map = wrapTexture(spec, 0, model.label);
          wrapMats.push(mat);
        } else {
          mat.color = new Color(cssHex(spec.color));
          wrapMats.push(mat);
          (mat as any).userData.plain = true;
        }
      } else {
        const color = cssHex(p.material === 'tab' && spec.geometry?.tab_color ? spec.geometry.tab_color : base.color);
        // Bare metal a touch less mirror-like than the export, so caps read as
        // brushed steel under one softbox instead of a hall of reflections.
        const roughness = base.metalness > 0.5 ? Math.max(base.roughness, 0.3) : base.roughness;
        mat = new MeshPhysicalMaterial({ color, roughness, metalness: base.metalness });
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
      // reads against the other batteries' height. Rotating +90° about X maps +Y
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
    const sx = (isDisc && mode === 'lineup' ? size[0] : size[0]) * 1.4;
    const sz = (isDisc && mode === 'lineup' ? size[1] : size[2]) * 1.4;
    shadow.scale.set(sx, Math.max(sz, 4), 1);
    const holder = new Group();
    holder.add(group, shadow);
    mats.push(shadow.material as Material);
    return { depth: isDisc && mode === 'lineup' ? size[1] : size[2], spec, group: holder as any, parts, wrapMats, faceMat, label: model.label, top: new Vector3(0, height, 0), width, height, chem: 0 };
  }

  for (const s of specs) items.push(buildItem(s));

  for (const it of items) world.add(it.group);
  const maxH = Math.max(...items.map((i) => i.height));
  const maxDepth = Math.max(...items.map((i) => i.depth));

  /** Camera distance that fits a lineup row `tw` mm wide, and the view's horizontal half-angle tangent. */
  function lineupFit(tw: number) {
    const tanV = Math.tan((camera.fov * Math.PI) / 360);
    const tanH = tanV * (camera.aspect || 1);
    // Fit the row's width and the tallest battery, leaving room for labels below.
    const dw = (tw / 2) / tanH * 1.1 + maxDepth;
    const dh = (maxH / 2) / tanV * 1.45 + maxDepth;
    return { dist: Math.max(dw, dh), tanH };
  }

  // Lineup labels are 0.9rem Plex Mono 600 (an advance of 0.6 em per
  // character), 0.5rem of padding a side and a 1px border, and at least 2rem
  // tall; see .viewer-label in Viewer.astro.
  const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 21;
  const labelW = (name: string) => (name.length * 0.54 + 1) * rem() + 2;
  const labelRow = () => 2 * rem() + 6;

  // Layout: single centered; lineup left to right. The gap between two
  // batteries starts in proportion to the tallest, then widens until their
  // labels clear each other at this width, so small batteries in a row of
  // big ones do not stack their labels. Labels are fixed in pixels and the
  // row is scaled to fit the stage, so the gaps are solved together with the
  // scale (a few passes; each only widens, up to a cap).
  let totalW = 0;
  let laidOutAt = -1;
  function layout() {
    const base = Math.max(4, maxH * 0.18);
    const sumW = items.reduce((n, i) => n + i.width, 0);
    let gaps = items.slice(1).map(() => base);
    const W = el.clientWidth;
    if (opts.onLabels && W > 0 && items.length > 1) {
      const need = items.slice(1).map((it, i) => (labelW(items[i].spec.name) + labelW(it.spec.name)) / 2 + 12);
      const cap = Math.max(base, maxH * 0.6);
      for (let pass = 0; pass < 8; pass++) {
        const { dist, tanH } = lineupFit(sumW + gaps.reduce((a, b) => a + b, 0));
        const pxPerMm = W / (2 * dist * tanH);
        gaps = need.map((px, i) => Math.min(cap, Math.max(base, px / pxPerMm - (items[i].width + items[i + 1].width) / 2)));
      }
    }
    totalW = sumW + gaps.reduce((a, b) => a + b, 0);
    let x = -totalW / 2;
    items.forEach((it, i) => {
      it.group.position.x = x + it.width / 2;
      x += it.width + (gaps[i] ?? 0);
    });
    (ground.material as ShaderMaterial).uniforms.uFade.value = Math.max(60, Math.max(totalW, maxH) * 1.6);
    laidOutAt = W;
  }

  function frame() {
    const aspect = camera.aspect || 1;
    const vfov = (camera.fov * Math.PI) / 180;
    if (mode === 'lineup') {
      const { dist } = lineupFit(totalW);
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
    if (!el.clientWidth) return;
    if (mode === 'lineup' && el.clientWidth !== laidOutAt) {
      // A new width moves the label spacing, so lay out and frame again.
      layout();
      frame();
      camera.userData.framed = true;
    } else if (first) {
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
  const stopSpin = () => {
    if (controls.autoRotate) opts.onSpinStop?.();
    controls.autoRotate = false;
  };
  controls.addEventListener('start', () => { interacting = true; stopSpin(); });
  controls.addEventListener('end', () => (interacting = false));
  // Runs after OrbitControls' own pointercancel handler (registered first,
  // in its constructor). Clears this file's flag even if that handler threw.
  const onCancel = () => {
    interacting = false;
    needs = true;
  };
  renderer.domElement.addEventListener('pointercancel', onCancel);

  // Zoom buttons ease the camera along its line of sight, clamped to the
  // same min and max distance OrbitControls enforces for wheel and pinch.
  let zoomLeft = 0; // natural log of the distance factor still to apply
  const off = new Vector3();
  function stepZoom() {
    const step = Math.abs(zoomLeft) < 0.002 ? zoomLeft : zoomLeft * 0.25;
    zoomLeft -= step;
    off.copy(camera.position).sub(controls.target);
    const d = off.length() * Math.exp(step);
    const clamped = Math.min(controls.maxDistance, Math.max(controls.minDistance, d));
    if (clamped !== d) zoomLeft = 0;
    camera.position.copy(controls.target).add(off.setLength(clamped));
    needs = true;
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    if (zoomLeft) stepZoom();
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
      // Labels sit on the ground in front of each battery. layout() spaces
      // the row so they clear each other; if the stage is too narrow for
      // that (or the row is turned edge-on), the later one drops a row.
      const rows: number[] = [];
      const step = labelRow();
      const placed = items
        .map((it) => {
          tmp.set(it.group.position.x, 0, it.depth / 2 + 1).project(camera);
          return { it, x: ((tmp.x + 1) / 2) * rect.width, y: ((1 - tmp.y) / 2) * rect.height, visible: tmp.z < 1 };
        })
        .sort((a, b) => a.x - b.x)
        .map((p) => {
          const w = labelW(p.it.spec.name);
          let row = 0;
          while (rows[row] !== undefined && p.x - w / 2 < rows[row] + 4) row++;
          rows[row] = p.x + w / 2;
          return { id: p.it.spec.id, name: p.it.spec.name, x: p.x, y: p.y + 8 + row * step, visible: p.visible };
        });
      opts.onLabels(placed);
    }
  }
  resize();
  layout(); // after resize(): the label spacing depends on the stage's aspect
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
        if ((m as any).userData.plain) m.color = new Color(cssHex(it.spec.chemistries[chemIdx]?.color ?? it.spec.color));
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
    /** One press of a zoom button: +1 moves in, -1 moves out. */
    zoom(dir: 1 | -1) {
      if (turnOnly) return;
      stopSpin();
      zoomLeft += dir * Math.log(0.8);
    },
    reset() {
      zoomLeft = 0;
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
      el.removeEventListener('wheel', onWheel, { capture: true });
      el.removeEventListener('pointerdown', onTouchDown, { capture: true });
      el.removeEventListener('pointermove', onTouchMove, { capture: true });
      el.removeEventListener('pointerup', onTouchEnd, { capture: true });
      el.removeEventListener('pointercancel', onTouchEnd, { capture: true });
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('webkitfullscreenchange', onFullscreen);
      renderer.domElement.removeEventListener('pointercancel', onCancel);
      controls.dispose();
      mats.forEach((m) => m.dispose());
      scene.traverse((o) => (o as Mesh).geometry?.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
