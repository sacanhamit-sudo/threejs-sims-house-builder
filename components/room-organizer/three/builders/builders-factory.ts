/**
 * Factory equipment: machine tools, conveyors, racking, vehicles and plant.
 *
 * Every model is built from boxes and cylinders scaled to the item's own
 * width (x), height (y) and depth (z), centred on the item with its base at
 * y = 0 and its working face towards +z, like the rest of the catalog. They
 * stay inside the catalog box, so collisions and the 2D plan match the model.
 */
import { type BuilderContext, EDGE, material, mesh, softBox } from '../builder-utils';
import { surfaceMaterial } from '../furniture-materials';
import type * as ThreeNS from 'three';

const SAFETY_YELLOW = 0xf5c518;
const SAFETY_BLACK = 0x1e1e1e;
const MACHINE_DARK = 0x2f3437;
const STEEL = 0x9aa4ab;
const RUBBER = 0x1b1b1b;
const CARDBOARD = 0xc49a6c;
const PALLET_WOOD = 0xb08a5a;
const RACK_BEAM = 0xe8711c;

type Mat = ThreeNS.Material;

/** A box of w × h × d with its centre at (x, y, z). */
function box(ctx: BuilderContext, group: ThreeNS.Group, w: number, h: number, d: number, mat: Mat, x: number, y: number, z: number): ThreeNS.Mesh {
  const part = mesh(ctx.THREE, softBox(ctx.THREE, w, h, d, EDGE.wood), mat);
  part.position.set(x, y, z);
  group.add(part);
  return part;
}

type Axis = 'x' | 'y' | 'z';

/** A cylinder along `axis`, centred at (x, y, z). */
function cylinder(
  ctx: BuilderContext,
  group: ThreeNS.Group,
  radius: number,
  length: number,
  mat: Mat,
  x: number,
  y: number,
  z: number,
  axis: Axis = 'y',
  segments = 16,
  radiusBottom = radius
): ThreeNS.Mesh {
  const part = mesh(ctx.THREE, new ctx.THREE.CylinderGeometry(radius, radiusBottom, length, segments), mat);
  if (axis === 'x') part.rotation.z = Math.PI / 2;
  if (axis === 'z') part.rotation.x = Math.PI / 2;
  part.position.set(x, y, z);
  group.add(part);
  return part;
}

function glow(ctx: BuilderContext, color: number, intensity = 0.8): ThreeNS.MeshStandardMaterial {
  return material(ctx.THREE, color, ctx.hasCollision, ctx.opacity, { emissive: color, emissiveIntensity: intensity, roughness: 0.3 });
}

function glass(ctx: BuilderContext): ThreeNS.MeshStandardMaterial {
  return new ctx.THREE.MeshStandardMaterial({
    color: 0x9ec9e0,
    roughness: 0.1,
    metalness: 0,
    transparent: true,
    opacity: ctx.hasCollision ? 0.7 : 0.35,
  });
}

/** A pane that lets light through: glass casts no shadow (#551). */
function pane(ctx: BuilderContext, group: ThreeNS.Group, w: number, h: number, d: number, x: number, y: number, z: number): void {
  const part = box(ctx, group, w, h, d, glass(ctx), x, y, z);
  part.castShadow = false;
}

/** Green, amber and red lamps on a pole: the stack light on top of a machine. */
function stackLight(ctx: BuilderContext, group: ThreeNS.Group, x: number, baseY: number, z: number, height: number): void {
  const pole = surfaceMaterial(ctx, STEEL, 'brushedMetal');
  const r = Math.min(0.035, height * 0.12);
  const poleH = height * 0.35;
  cylinder(ctx, group, r * 0.4, poleH, pole, x, baseY + poleH / 2, z);
  const segment = (height - poleH) / 3;
  [0x2ecc71, 0xf39c12, 0xe74c3c].forEach((color, i) => {
    cylinder(ctx, group, r, segment * 0.92, glow(ctx, color, i === 0 ? 0.9 : 0.25), x, baseY + poleH + segment * (i + 0.5), z);
  });
}

// ---------------------------------------------------------------------------
// Machine tools

export function buildCncMachine(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item, baseColor } = ctx;
  const group = new THREE.Group();
  const { width: w, depth: d } = item;
  const lightH = Math.min(0.35, item.height * 0.15);
  const h = item.height - lightH;
  const body = surfaceMaterial(ctx, baseColor, 'painted');
  const dark = surfaceMaterial(ctx, MACHINE_DARK, 'painted');
  const steel = surfaceMaterial(ctx, STEEL, 'brushedMetal');

  const plinthH = h * 0.08;
  box(ctx, group, w, plinthH, d, dark, 0, plinthH / 2, 0);
  // The enclosure, a little narrower than the footprint to leave room for the control pendant.
  const bodyW = w * 0.82;
  const bodyX = -w * 0.09;
  box(ctx, group, bodyW, h - plinthH, d * 0.9, body, bodyX, plinthH + (h - plinthH) / 2, -d * 0.05);
  // Sliding front doors with their windows.
  const doorH = (h - plinthH) * 0.58;
  const doorY = plinthH + (h - plinthH) * 0.42;
  for (const side of [-1, 1]) {
    const doorX = bodyX + side * bodyW * 0.22;
    box(ctx, group, bodyW * 0.42, doorH, d * 0.04, body, doorX, doorY, d * 0.42);
    pane(ctx, group, bodyW * 0.3, doorH * 0.55, d * 0.02, doorX, doorY + doorH * 0.08, d * 0.45);
    box(ctx, group, 0.03, doorH * 0.4, 0.04, steel, doorX - side * bodyW * 0.17, doorY, d * 0.46);
  }
  // Chip tray along the bottom of the front.
  box(ctx, group, bodyW * 0.9, plinthH * 0.8, d * 0.06, dark, bodyX, plinthH * 1.2, d * 0.43);
  // Control pendant on the right.
  const panelW = w * 0.15;
  const panelX = w / 2 - panelW / 2;
  box(ctx, group, panelW, h * 0.32, d * 0.12, dark, panelX, h * 0.62, d * 0.3);
  box(ctx, group, panelW * 0.8, h * 0.13, d * 0.02, glow(ctx, 0x1e88e5, 0.5), panelX, h * 0.69, d * 0.365);
  for (let i = 0; i < 3; i++) {
    box(ctx, group, panelW * 0.16, panelW * 0.16, d * 0.02, glow(ctx, [0x2ecc71, 0xf1c40f, 0xe74c3c][i] ?? 0xffffff, 0.4), panelX - panelW * 0.25 + i * panelW * 0.25, h * 0.53, d * 0.365);
  }
  box(ctx, group, 0.06, h * 0.25, 0.06, steel, panelX, h * 0.33, d * 0.3);
  // Stack light on the roof.
  stackLight(ctx, group, bodyX + bodyW * 0.4, h, -d * 0.3, lightH);
  return group;
}

export function buildLathe(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item, baseColor } = ctx;
  const group = new THREE.Group();
  const { width: w, depth: d, height: h } = item;
  const body = surfaceMaterial(ctx, baseColor, 'painted');
  const dark = surfaceMaterial(ctx, MACHINE_DARK, 'painted');
  const steel = surfaceMaterial(ctx, STEEL, 'brushedMetal');

  const legH = h * 0.5;
  // Two cabinet legs and the chip pan between them.
  for (const side of [-1, 1]) {
    box(ctx, group, w * 0.22, legH, d * 0.7, body, side * w * 0.36, legH / 2, 0);
  }
  box(ctx, group, w * 0.5, 0.04, d * 0.75, dark, 0, legH * 0.55, 0);
  // The bed and its ways.
  const bedY = legH + h * 0.06;
  box(ctx, group, w * 0.96, h * 0.12, d * 0.45, body, 0, bedY, -d * 0.05);
  for (const dz of [-0.15, 0.05]) box(ctx, group, w * 0.94, 0.03, 0.04, steel, 0, bedY + h * 0.07, dz * d);
  // Headstock on the left with its chuck.
  const headW = w * 0.25;
  const headX = -w / 2 + headW / 2;
  box(ctx, group, headW, h * 0.32, d * 0.55, body, headX, bedY + h * 0.22, -d * 0.1);
  const spindleY = bedY + h * 0.24;
  cylinder(ctx, group, Math.min(0.12, h * 0.08), w * 0.08, steel, headX + headW / 2 + w * 0.04, spindleY, d * 0.0, 'x', 20);
  // Tailstock on the right.
  box(ctx, group, w * 0.12, h * 0.2, d * 0.3, body, w * 0.36, bedY + h * 0.16, -d * 0.05);
  cylinder(ctx, group, 0.025, w * 0.08, steel, w * 0.27, spindleY, 0, 'x');
  // Carriage, cross slide and tool post.
  box(ctx, group, w * 0.14, h * 0.1, d * 0.6, dark, w * 0.05, bedY + h * 0.12, 0.02 * d);
  box(ctx, group, w * 0.06, h * 0.06, w * 0.06, steel, w * 0.05, bedY + h * 0.2, 0.02 * d);
  // Apron handwheel facing the operator.
  cylinder(ctx, group, Math.min(0.09, h * 0.06), 0.03, steel, w * 0.05, bedY - h * 0.02, d * 0.33, 'z', 16);
  // Splash guard along the back.
  box(ctx, group, w * 0.7, h * 0.3, 0.03, body, w * 0.08, bedY + h * 0.22, -d * 0.45);
  // Control box on the headstock.
  box(ctx, group, headW * 0.6, h * 0.08, 0.02, glow(ctx, 0x1e88e5, 0.4), headX, bedY + h * 0.3, d * 0.18);
  return group;
}

export function buildPress(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item, baseColor } = ctx;
  const group = new THREE.Group();
  const { width: w, depth: d, height: h } = item;
  const body = surfaceMaterial(ctx, baseColor, 'painted');
  const dark = surfaceMaterial(ctx, MACHINE_DARK, 'painted');
  const steel = surfaceMaterial(ctx, STEEL, 'brushedMetal');

  // Bed.
  box(ctx, group, w * 0.78, h * 0.3, d * 0.8, body, -w * 0.1, h * 0.15, 0);
  box(ctx, group, w * 0.6, h * 0.03, d * 0.6, steel, -w * 0.1, h * 0.315, 0);
  // Two side columns.
  for (const side of [-1, 1]) box(ctx, group, w * 0.12, h * 0.62, d * 0.6, body, -w * 0.1 + side * w * 0.33, h * 0.61, 0);
  // Crown with the hydraulic cylinder.
  box(ctx, group, w * 0.78, h * 0.18, d * 0.8, body, -w * 0.1, h * 0.91, 0);
  cylinder(ctx, group, Math.min(w, d) * 0.14, h * 0.18, steel, -w * 0.1, h * 0.7, 0, 'y', 20);
  // The ram, a little above the bed.
  box(ctx, group, w * 0.52, h * 0.06, d * 0.55, dark, -w * 0.1, h * 0.58, 0);
  // Hydraulic power unit on the right.
  box(ctx, group, w * 0.2, h * 0.45, d * 0.6, dark, w * 0.4, h * 0.225, -d * 0.1);
  cylinder(ctx, group, 0.03, h * 0.5, steel, w * 0.4, h * 0.7, -d * 0.2);
  // Light curtain posts in safety yellow on the front corners.
  const yellow = surfaceMaterial(ctx, SAFETY_YELLOW, 'painted');
  for (const side of [-1, 1]) box(ctx, group, 0.05, h * 0.3, 0.05, yellow, -w * 0.1 + side * w * 0.3, h * 0.47, d * 0.42);
  // Two-hand control station.
  box(ctx, group, w * 0.18, h * 0.06, d * 0.08, dark, -w * 0.1, h * 0.35, d * 0.45);
  for (const side of [-1, 1]) cylinder(ctx, group, 0.025, 0.02, glow(ctx, 0x2ecc71, 0.6), -w * 0.1 + side * w * 0.05, h * 0.39, d * 0.46);
  return group;
}

export function buildInjectionMolder(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item, baseColor } = ctx;
  const group = new THREE.Group();
  const { width: w, depth: d, height: h } = item;
  const body = surfaceMaterial(ctx, baseColor, 'painted');
  const dark = surfaceMaterial(ctx, MACHINE_DARK, 'painted');
  const steel = surfaceMaterial(ctx, STEEL, 'brushedMetal');

  const baseH = h * 0.45;
  box(ctx, group, w, baseH, d * 0.8, body, 0, baseH / 2, 0);
  // Clamp unit with its guard on the left half.
  box(ctx, group, w * 0.45, h * 0.35, d * 0.75, body, -w * 0.25, baseH + h * 0.175, 0);
  pane(ctx, group, w * 0.3, h * 0.25, 0.02, -w * 0.25, baseH + h * 0.18, d * 0.385);
  for (const dz of [-0.2, 0.2]) {
    for (const dy of [0.1, 0.27]) cylinder(ctx, group, 0.04, w * 0.42, steel, -w * 0.25, baseH + h * dy, dz * d, 'x');
  }
  // Injection barrel and the hopper on top.
  cylinder(ctx, group, h * 0.07, w * 0.4, steel, w * 0.22, baseH + h * 0.15, 0, 'x', 20);
  box(ctx, group, w * 0.08, h * 0.2, d * 0.4, dark, w * 0.45, baseH + h * 0.1, 0);
  const hopperH = h * 0.32;
  cylinder(ctx, group, d * 0.16, hopperH, steel, w * 0.3, h - hopperH / 2, 0, 'y', 16, d * 0.05);
  // Control screen on the front.
  box(ctx, group, w * 0.12, h * 0.16, 0.03, dark, w * 0.05, baseH + h * 0.12, d * 0.4);
  box(ctx, group, w * 0.1, h * 0.12, 0.01, glow(ctx, 0x1e88e5, 0.5), w * 0.05, baseH + h * 0.12, d * 0.415);
  stackLight(ctx, group, -w * 0.45, baseH + h * 0.35, -d * 0.3, Math.min(0.3, h - baseH - h * 0.35));
  return group;
}

// ---------------------------------------------------------------------------
// Material handling

export function buildConveyor(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item, baseColor } = ctx;
  const group = new THREE.Group();
  const { width: w, depth: d, height: h } = item;
  const frame = surfaceMaterial(ctx, baseColor, 'painted');
  const belt = surfaceMaterial(ctx, RUBBER, 'plastic');
  const steel = surfaceMaterial(ctx, STEEL, 'brushedMetal');
  const carton = surfaceMaterial(ctx, CARDBOARD, 'painted');

  const beltY = h * 0.72;
  const rollerR = Math.min(0.06, h * 0.07);
  // Side rails.
  for (const side of [-1, 1]) box(ctx, group, w, h * 0.12, d * 0.08, frame, 0, beltY, side * d * 0.46);
  // The belt and its end rollers.
  box(ctx, group, w - rollerR * 2, 0.02, d * 0.84, belt, 0, beltY + h * 0.03, 0);
  for (const side of [-1, 1]) cylinder(ctx, group, rollerR, d * 0.84, steel, side * (w / 2 - rollerR), beltY + h * 0.03 - rollerR + 0.01, 0, 'z');
  // Legs every metre or so, with cross braces.
  const legCount = Math.max(2, Math.round(w / 1.2) + 1);
  for (let i = 0; i < legCount; i++) {
    const x = -w / 2 + 0.05 + (i * (w - 0.1)) / (legCount - 1);
    for (const side of [-1, 1]) box(ctx, group, 0.05, beltY, 0.05, frame, x, beltY / 2, side * d * 0.4);
    box(ctx, group, 0.04, 0.04, d * 0.8, frame, x, beltY * 0.3, 0);
  }
  // Two cartons riding the belt.
  const cartonS = Math.min(d * 0.55, 0.45, h - beltY - 0.05);
  if (cartonS > 0.08) {
    for (const x of [-w * 0.25, w * 0.2]) box(ctx, group, cartonS, cartonS * 0.8, cartonS, carton, x, beltY + h * 0.04 + cartonS * 0.4, 0);
  }
  // Emergency stop at one end.
  box(ctx, group, 0.1, 0.12, 0.06, surfaceMaterial(ctx, SAFETY_YELLOW, 'painted'), w / 2 - 0.15, beltY + 0.02, d / 2 - 0.03);
  cylinder(ctx, group, 0.03, 0.03, glow(ctx, 0xe53935, 0.5), w / 2 - 0.15, beltY + 0.06, d / 2 - 0.01, 'z');
  return group;
}

/** A wooden pallet with its slats, `w` × `d`, `h` tall, on the floor at y = `y0`. */
function pallet(ctx: BuilderContext, group: ThreeNS.Group, w: number, d: number, h: number, x: number, y0: number, z: number): void {
  const wood = surfaceMaterial(ctx, PALLET_WOOD, 'woodOiled', { detailed: true });
  const deck = h * 0.25;
  for (const dz of [-0.4, 0, 0.4]) box(ctx, group, w, h - deck * 2, d * 0.12, wood, x, y0 + h / 2, z + dz * d);
  for (let i = 0; i < 5; i++) box(ctx, group, w * 0.16, deck, d, wood, x - w * 0.42 + i * w * 0.21, y0 + h - deck / 2, z);
  for (const dx of [-0.42, 0, 0.42]) box(ctx, group, w * 0.16, deck, d, wood, x + dx * w, y0 + deck / 2, z);
}

/** Cartons stacked on a pallet, up to `h` tall. */
function palletLoad(ctx: BuilderContext, group: ThreeNS.Group, w: number, d: number, h: number, x: number, y0: number, z: number, seed: number): void {
  const carton = surfaceMaterial(ctx, CARDBOARD, 'painted');
  const tape = surfaceMaterial(ctx, 0xa57c52, 'painted');
  const rows = Math.max(1, Math.round(h / 0.35));
  const rowH = h / rows;
  for (let r = 0; r < rows; r++) {
    // Leave the odd carton out of the top row so a load doesn't read as one block.
    const gap = r === rows - 1 && (seed + r) % 2 === 0;
    for (const [cx, cz] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]] as const) {
      if (gap && cx > 0 && cz > 0) continue;
      const bx = x + cx * w * 0.98;
      const bz = z + cz * d * 0.98;
      box(ctx, group, w * 0.48, rowH * 0.96, d * 0.48, carton, bx, y0 + rowH * (r + 0.5), bz);
      box(ctx, group, w * 0.08, 0.005, d * 0.49, tape, bx, y0 + rowH * (r + 1) - rowH * 0.02 + 0.003, bz);
    }
  }
}

export function buildPallet(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item } = ctx;
  const group = new THREE.Group();
  const palletH = Math.min(0.15, item.height * 0.5);
  pallet(ctx, group, item.width, item.depth, palletH, 0, 0, 0);
  const loadH = item.height - palletH;
  if (loadH > 0.1) palletLoad(ctx, group, item.width * 0.96, item.depth * 0.96, loadH, 0, palletH, 0, 1);
  return group;
}

export function buildPalletRack(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item, baseColor } = ctx;
  const group = new THREE.Group();
  const { width: w, depth: d, height: h } = item;
  const upright = surfaceMaterial(ctx, baseColor, 'painted');
  const beam = surfaceMaterial(ctx, RACK_BEAM, 'painted');
  const post = 0.08;

  // Two upright frames with their bracing.
  for (const side of [-1, 1]) {
    const x = side * (w / 2 - post / 2);
    for (const dz of [-1, 1]) box(ctx, group, post, h, post, upright, x, h / 2, dz * (d / 2 - post / 2));
    const braces = Math.max(2, Math.round(h / 0.9));
    for (let i = 0; i <= braces; i++) box(ctx, group, post * 0.4, 0.03, d - post, upright, x, (h * i) / braces * 0.97 + 0.03, 0);
  }
  // Beam levels with a loaded pallet on each.
  const levels = Math.max(2, Math.min(5, Math.round(h / 1.0)));
  const levelH = h / levels;
  const bayW = w - post * 2;
  const palletsPerLevel = bayW > 2.2 ? 2 : 1;
  const pw = Math.min(1.2, (bayW / palletsPerLevel) * 0.88);
  const pd = d * 0.9;
  for (let i = 0; i < levels; i++) {
    const y = i === 0 ? 0.12 : levelH * i;
    for (const dz of [-1, 1]) box(ctx, group, bayW, 0.1, 0.05, beam, 0, y, dz * (d / 2 - post / 2));
    const loadTop = Math.min(levelH * (i + 1) - 0.15, h - 0.05);
    const palletH = 0.14;
    const loadH = loadTop - (y + 0.05) - palletH;
    if (loadH < 0.15) continue;
    for (let p = 0; p < palletsPerLevel; p++) {
      const x = palletsPerLevel === 1 ? 0 : (p === 0 ? -1 : 1) * bayW * 0.25;
      pallet(ctx, group, pw, pd, palletH, x, y + 0.05, 0);
      palletLoad(ctx, group, pw * 0.96, pd * 0.96, loadH * 0.85, x, y + 0.05 + palletH, 0, i + p);
    }
  }
  return group;
}

export function buildIndustrialShelf(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item, baseColor } = ctx;
  const group = new THREE.Group();
  const { width: w, depth: d, height: h } = item;
  const metal = surfaceMaterial(ctx, baseColor, 'painted');
  const binColors = [0x1e88e5, 0xfb8c00, 0x43a047, 0xe53935];
  const post = 0.04;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(ctx, group, post, h, post, metal, sx * (w / 2 - post / 2), h / 2, sz * (d / 2 - post / 2));
  const shelves = Math.max(3, Math.round(h / 0.45));
  for (let i = 0; i < shelves; i++) {
    const y = 0.1 + ((h - 0.15) * i) / (shelves - 1);
    box(ctx, group, w - post, 0.03, d - post, metal, 0, y, 0);
    if (i === shelves - 1) continue;
    // Plastic bins along each shelf.
    const binH = Math.min(0.25, ((h - 0.15) / (shelves - 1)) * 0.6);
    const bins = Math.max(1, Math.floor((w - 0.1) / 0.45));
    for (let b = 0; b < bins; b++) {
      const bw = ((w - 0.1) / bins) * 0.85;
      const x = -w / 2 + 0.05 + ((w - 0.1) / bins) * (b + 0.5);
      const color = binColors[(i + b) % binColors.length] ?? 0x1e88e5;
      box(ctx, group, bw, binH, d * 0.75, surfaceMaterial(ctx, color, 'plastic'), x, y + 0.015 + binH / 2, 0);
    }
  }
  return group;
}

export function buildForklift(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item, baseColor } = ctx;
  const group = new THREE.Group();
  // The forks point to +x: the truck's length runs along its width.
  const { width: L, depth: W, height: h } = item;
  const body = surfaceMaterial(ctx, baseColor, 'painted');
  const dark = surfaceMaterial(ctx, MACHINE_DARK, 'painted');
  const steel = surfaceMaterial(ctx, STEEL, 'brushedMetal');
  const tyre = surfaceMaterial(ctx, RUBBER, 'plastic');

  const wheelR = Math.min(0.28, h * 0.13);
  const bodyL = L * 0.62;
  const bodyX = -L / 2 + bodyL / 2;
  // Chassis and counterweight.
  box(ctx, group, bodyL, h * 0.25, W * 0.86, body, bodyX, wheelR + h * 0.08, 0);
  box(ctx, group, L * 0.14, h * 0.28, W * 0.86, dark, -L / 2 + L * 0.07, wheelR + h * 0.15, 0);
  // Wheels.
  for (const x of [bodyX - bodyL * 0.32, bodyX + bodyL * 0.36]) {
    for (const side of [-1, 1]) cylinder(ctx, group, wheelR, W * 0.14, tyre, x, wheelR, side * W * 0.43, 'z', 18);
  }
  // Seat and steering wheel.
  const deckY = wheelR + h * 0.2;
  box(ctx, group, L * 0.14, h * 0.12, W * 0.4, dark, bodyX - bodyL * 0.12, deckY + h * 0.06, 0);
  box(ctx, group, L * 0.03, h * 0.16, W * 0.4, dark, bodyX - bodyL * 0.2, deckY + h * 0.14, 0);
  cylinder(ctx, group, 0.015, h * 0.14, steel, bodyX + bodyL * 0.15, deckY + h * 0.07, 0);
  const wheel = cylinder(ctx, group, 0.12, 0.025, dark, bodyX + bodyL * 0.13, deckY + h * 0.15, 0, 'y', 16);
  wheel.rotation.z = -0.5;
  // Overhead guard.
  const guardTop = h * 0.97;
  for (const x of [bodyX - bodyL * 0.3, bodyX + bodyL * 0.3]) {
    for (const side of [-1, 1]) box(ctx, group, 0.05, guardTop - deckY, 0.05, dark, x, (guardTop + deckY) / 2, side * W * 0.38);
  }
  box(ctx, group, bodyL * 0.66, 0.05, W * 0.8, dark, bodyX, guardTop, 0);
  // Mast, carriage and forks at the front.
  const mastX = -L / 2 + bodyL + L * 0.03;
  for (const side of [-1, 1]) box(ctx, group, 0.08, h, 0.08, steel, mastX, h / 2, side * W * 0.28);
  box(ctx, group, 0.06, h * 0.3, W * 0.7, dark, mastX + 0.06, wheelR + h * 0.1, 0);
  const forkL = L / 2 - (mastX + 0.09);
  for (const side of [-1, 1]) {
    box(ctx, group, forkL, 0.04, 0.1, steel, mastX + 0.09 + forkL / 2, 0.06, side * W * 0.2);
  }
  // Beacon on the guard.
  cylinder(ctx, group, 0.05, 0.06, glow(ctx, 0xffa000, 1), bodyX, guardTop + 0.025, 0);
  return group;
}

// ---------------------------------------------------------------------------
// Workstations and plant

export function buildWorkbench(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item, baseColor } = ctx;
  const group = new THREE.Group();
  const { width: w, depth: d, height: h } = item;
  const frame = surfaceMaterial(ctx, baseColor, 'painted');
  const top = surfaceMaterial(ctx, 0xb5895a, 'woodOiled', { detailed: true });
  const steel = surfaceMaterial(ctx, STEEL, 'brushedMetal');
  const benchH = Math.min(0.92, h * 0.55);
  // Legs and lower shelf.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(ctx, group, 0.05, benchH, 0.05, frame, sx * (w / 2 - 0.05), benchH / 2, sz * (d / 2 - 0.05));
  box(ctx, group, w - 0.05, 0.03, d - 0.05, frame, 0, benchH * 0.2, 0);
  // Worktop.
  box(ctx, group, w, 0.05, d, top, 0, benchH - 0.025, 0);
  // Drawer unit under the right end.
  box(ctx, group, w * 0.3, benchH * 0.45, d * 0.85, frame, w * 0.3, benchH * 0.7, 0);
  for (let i = 0; i < 3; i++) box(ctx, group, w * 0.08, 0.02, 0.02, steel, w * 0.3, benchH * (0.55 + i * 0.13), d * 0.44);
  // Pegboard with tools along the back.
  const boardH = h - benchH - 0.02;
  if (boardH > 0.2) {
    box(ctx, group, w, boardH, 0.03, surfaceMaterial(ctx, 0x8d9ba3, 'painted'), 0, benchH + boardH / 2, -d / 2 + 0.015);
    const toolColors = [0xe53935, 0x1e88e5, 0x424242, 0xfdd835];
    for (let i = 0; i < 6; i++) {
      const color = toolColors[i % toolColors.length] ?? 0x424242;
      box(ctx, group, 0.04, boardH * 0.3, 0.03, surfaceMaterial(ctx, color, 'plastic'), -w * 0.4 + i * w * 0.16, benchH + boardH * 0.55, -d / 2 + 0.045);
    }
  }
  // A vice on the left end.
  box(ctx, group, 0.14, 0.1, 0.18, surfaceMaterial(ctx, 0x1565c0, 'painted'), -w * 0.38, benchH + 0.05, d * 0.3);
  return group;
}

export function buildRobotArm(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item, baseColor } = ctx;
  const group = new THREE.Group();
  const { width: w, depth: d, height: h } = item;
  const body = surfaceMaterial(ctx, baseColor, 'painted');
  const dark = surfaceMaterial(ctx, MACHINE_DARK, 'painted');
  const r = Math.min(w, d) * 0.3;
  // Pedestal and turntable.
  box(ctx, group, Math.min(w, d) * 0.8, h * 0.06, Math.min(w, d) * 0.8, dark, 0, h * 0.03, 0);
  cylinder(ctx, group, r, h * 0.14, body, 0, h * 0.13, 0, 'y', 24);
  // Shoulder.
  const shoulderY = h * 0.27;
  box(ctx, group, r * 1.2, h * 0.12, r * 1.1, body, 0, shoulderY, 0);
  cylinder(ctx, group, r * 0.5, r * 1.3, dark, 0, shoulderY, 0, 'z', 16);
  // Lower arm, leaning back a little.
  const lowerL = h * 0.42;
  const lower = new THREE.Group();
  lower.position.set(0, shoulderY, 0);
  lower.rotation.z = 0.25;
  group.add(lower);
  const lowerArm = mesh(THREE, softBox(THREE, r * 0.6, lowerL, r * 0.7, EDGE.wood), body);
  lowerArm.position.y = lowerL / 2;
  lower.add(lowerArm);
  // Elbow and upper arm reaching forward and down.
  const elbow = new THREE.Group();
  elbow.position.y = lowerL;
  elbow.rotation.z = -1.85;
  lower.add(elbow);
  const elbowJoint = mesh(THREE, new THREE.CylinderGeometry(r * 0.42, r * 0.42, r * 0.95, 16), dark);
  elbowJoint.rotation.x = Math.PI / 2;
  elbow.add(elbowJoint);
  const upperL = Math.min(w, h) * 0.42;
  const upperArm = mesh(THREE, softBox(THREE, r * 0.5, upperL, r * 0.5, EDGE.wood), body);
  upperArm.position.y = upperL / 2;
  elbow.add(upperArm);
  // Wrist and a two-finger gripper.
  const wrist = mesh(THREE, new THREE.CylinderGeometry(r * 0.22, r * 0.22, r * 0.4, 12), dark);
  wrist.position.y = upperL + r * 0.2;
  elbow.add(wrist);
  for (const side of [-1, 1]) {
    const finger = mesh(THREE, softBox(THREE, r * 0.08, r * 0.35, r * 0.15, EDGE.wood), dark);
    finger.position.set(side * r * 0.12, upperL + r * 0.55, 0);
    elbow.add(finger);
  }
  // Hazard ring painted on the floor around the base.
  const ring = mesh(THREE, new THREE.RingGeometry(Math.min(w, d) * 0.43, Math.min(w, d) * 0.48, 32), material(THREE, SAFETY_YELLOW, ctx.hasCollision, ctx.opacity, { roughness: 0.6 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.005;
  ring.castShadow = false;
  group.add(ring);
  return group;
}

export function buildControlCabinet(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item, baseColor } = ctx;
  const group = new THREE.Group();
  const { width: w, depth: d, height: h } = item;
  const body = surfaceMaterial(ctx, baseColor, 'painted');
  const dark = surfaceMaterial(ctx, MACHINE_DARK, 'painted');
  const steel = surfaceMaterial(ctx, STEEL, 'brushedMetal');
  box(ctx, group, w, h * 0.05, d, dark, 0, h * 0.025, 0);
  box(ctx, group, w, h * 0.95, d * 0.95, body, 0, h * 0.525, -d * 0.025);
  const doors = w > 0.9 ? 2 : 1;
  for (let i = 0; i < doors; i++) {
    const dw = w / doors;
    const x = -w / 2 + dw * (i + 0.5);
    box(ctx, group, dw * 0.94, h * 0.88, 0.02, body, x, h * 0.52, d * 0.465);
    box(ctx, group, 0.03, h * 0.1, 0.03, steel, x + (i === 0 && doors === 2 ? dw * 0.38 : -dw * 0.38), h * 0.52, d * 0.485);
    // Indicator lamps and buttons.
    [0x2ecc71, 0xf1c40f, 0xe74c3c].forEach((color, j) => {
      cylinder(ctx, group, 0.025, 0.02, glow(ctx, color, j === 0 ? 0.9 : 0.3), x - dw * 0.2 + j * dw * 0.2, h * 0.82, d * 0.485, 'z', 12);
    });
    box(ctx, group, dw * 0.5, h * 0.1, 0.01, glow(ctx, 0x90caf9, 0.3), x, h * 0.68, d * 0.48);
  }
  // Hazard sign.
  box(ctx, group, w * 0.18, w * 0.18, 0.01, surfaceMaterial(ctx, SAFETY_YELLOW, 'painted'), -w * 0.25, h * 0.35, d * 0.48);
  return group;
}

export function buildStorageTank(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item, baseColor } = ctx;
  const group = new THREE.Group();
  const { width: w, depth: d, height: h } = item;
  const shell = surfaceMaterial(ctx, baseColor, 'brushedMetal');
  const dark = surfaceMaterial(ctx, MACHINE_DARK, 'painted');
  const r = Math.min(w, d) * 0.45;
  const legH = h * 0.12;
  const domeH = r * 0.35;
  const bodyH = h - legH - domeH;
  // Legs.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    box(ctx, group, 0.08, legH + 0.05, 0.08, dark, Math.cos(a) * r * 0.8, (legH + 0.05) / 2, Math.sin(a) * r * 0.8);
  }
  // Shell, a cone under it and a dome on top.
  cylinder(ctx, group, r, bodyH, shell, 0, legH + bodyH / 2, 0, 'y', 32);
  const dome = mesh(THREE, new THREE.SphereGeometry(r, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), shell);
  dome.scale.y = domeH / r;
  dome.position.y = legH + bodyH;
  group.add(dome);
  // Bands round the shell.
  for (const f of [0.25, 0.75]) cylinder(ctx, group, r * 1.01, 0.05, dark, 0, legH + bodyH * f, 0, 'y', 32);
  // Outlet pipe and valve at the front.
  const pipeL = Math.max(0.05, d / 2 - 0.02 - r * 0.85);
  cylinder(ctx, group, 0.05, pipeL, dark, 0, legH + 0.15, r * 0.85 + pipeL / 2, 'z');
  cylinder(ctx, group, 0.08, 0.03, surfaceMaterial(ctx, 0xe53935, 'painted'), 0, legH + 0.25, r * 0.95, 'y');
  // Level gauge.
  box(ctx, group, 0.04, bodyH * 0.7, 0.04, glass(ctx), r * 0.7, legH + bodyH * 0.5, r * 0.72);
  return group;
}

export function buildCompressor(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item, baseColor } = ctx;
  const group = new THREE.Group();
  const { width: w, depth: d, height: h } = item;
  const tank = surfaceMaterial(ctx, baseColor, 'painted');
  const dark = surfaceMaterial(ctx, MACHINE_DARK, 'painted');
  const steel = surfaceMaterial(ctx, STEEL, 'brushedMetal');
  const r = Math.min(d * 0.4, h * 0.3);
  // Horizontal receiver on feet.
  for (const side of [-1, 1]) box(ctx, group, 0.08, r * 0.5, d * 0.6, dark, side * w * 0.3, r * 0.25, 0);
  cylinder(ctx, group, r, w * 0.95, tank, 0, r * 1.15, 0, 'x', 24);
  // Motor and pump on top.
  const topY = r * 2.15;
  box(ctx, group, w * 0.35, h - topY - 0.05, d * 0.6, dark, -w * 0.15, topY + (h - topY - 0.05) / 2, 0);
  box(ctx, group, w * 0.25, (h - topY) * 0.6, d * 0.45, steel, w * 0.2, topY + (h - topY) * 0.3, 0);
  cylinder(ctx, group, (h - topY) * 0.35, 0.04, steel, w * 0.03, topY + (h - topY) * 0.45, d * 0.25, 'z', 20);
  // Pressure gauge.
  cylinder(ctx, group, 0.05, 0.03, glow(ctx, 0xffffff, 0.2), w * 0.4, topY + 0.05, d * 0.3, 'z', 16);
  return group;
}

export function buildSafetyBarrier(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item, baseColor } = ctx;
  const group = new THREE.Group();
  const { width: w, depth: d, height: h } = item;
  const yellow = surfaceMaterial(ctx, baseColor, 'painted');
  const black = surfaceMaterial(ctx, SAFETY_BLACK, 'painted');
  const posts = Math.max(2, Math.round(w / 1.5) + 1);
  const postS = Math.min(0.12, d * 0.9);
  for (let i = 0; i < posts; i++) {
    const x = -w / 2 + postS / 2 + (i * (w - postS)) / (posts - 1);
    // Posts striped yellow and black.
    const stripes = 4;
    for (let s = 0; s < stripes; s++) {
      box(ctx, group, postS, h / stripes, postS, s % 2 === 0 ? yellow : black, x, (h / stripes) * (s + 0.5), 0);
    }
    const foot = Math.min(postS * 1.6, d);
    const footX = Math.max(-w / 2 + foot / 2, Math.min(w / 2 - foot / 2, x));
    box(ctx, group, foot, 0.02, foot, black, footX, 0.01, 0);
  }
  for (const f of [0.45, 0.85]) box(ctx, group, w - postS, h * 0.1, postS * 0.6, yellow, 0, h * f, 0);
  return group;
}

export function buildLocker(ctx: BuilderContext): ThreeNS.Group {
  const { THREE, item, baseColor } = ctx;
  const group = new THREE.Group();
  const { width: w, depth: d, height: h } = item;
  const body = surfaceMaterial(ctx, baseColor, 'painted');
  const steel = surfaceMaterial(ctx, STEEL, 'brushedMetal');
  const dark = surfaceMaterial(ctx, MACHINE_DARK, 'painted');
  box(ctx, group, w, h * 0.05, d, dark, 0, h * 0.025, 0);
  box(ctx, group, w, h * 0.95, d * 0.96, body, 0, h * 0.525, -d * 0.02);
  const doors = Math.max(1, Math.round(w / 0.4));
  const dw = w / doors;
  for (let i = 0; i < doors; i++) {
    const x = -w / 2 + dw * (i + 0.5);
    box(ctx, group, dw * 0.92, h * 0.88, 0.015, body, x, h * 0.52, d * 0.47);
    for (let v = 0; v < 4; v++) box(ctx, group, dw * 0.5, 0.012, 0.01, dark, x, h * (0.85 - v * 0.025), d * 0.48);
    box(ctx, group, 0.025, 0.08, 0.025, steel, x + dw * 0.32, h * 0.55, d * 0.485);
  }
  return group;
}
