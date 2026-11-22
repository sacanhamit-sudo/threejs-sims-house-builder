/**
 * Production status in 3D (factory fork): a tracked machine glows in its
 * status colour (running green, set-up amber, breakdown red, idle grey) and
 * stands on a pad of that colour, so the state reads from above as well.
 *
 * Builders give every item its own materials, so tinting one machine touches
 * no other mesh. The original emissive is kept on the material and put back
 * when the view is switched off.
 */
import { ROOM_OBJECT_TAGS } from './room-builder';
import type { ThreeModule } from './builder-utils';
import type * as ThreeNS from 'three';

const PAD_TAG = 'production-pad';
const TINT_INTENSITY = 0.32;

interface SavedEmissive {
  color: number;
  intensity: number;
}

function forEachMaterial(group: ThreeNS.Object3D, fn: (material: ThreeNS.MeshStandardMaterial) => void): void {
  group.traverse((node) => {
    if (node.userData.type === PAD_TAG) return;
    const material = (node as ThreeNS.Mesh).material as ThreeNS.Material | ThreeNS.Material[] | undefined;
    if (!material) return;
    for (const m of Array.isArray(material) ? material : [material]) {
      if ((m as ThreeNS.MeshStandardMaterial).isMeshStandardMaterial) fn(m as ThreeNS.MeshStandardMaterial);
    }
  });
}

function tint(group: ThreeNS.Object3D, color: string | null): void {
  forEachMaterial(group, (m) => {
    const saved = m.userData.productionEmissive as SavedEmissive | undefined;
    if (color === null) {
      if (saved) {
        m.emissive.setHex(saved.color);
        m.emissiveIntensity = saved.intensity;
        delete m.userData.productionEmissive;
      }
      return;
    }
    if (!saved) m.userData.productionEmissive = { color: m.emissive.getHex(), intensity: m.emissiveIntensity } satisfies SavedEmissive;
    // A part that glows on its own (a lamp, a screen) keeps its glow.
    const own = (m.userData.productionEmissive as SavedEmissive).color;
    if (own !== 0x000000) return;
    m.emissive.set(color);
    m.emissiveIntensity = TINT_INTENSITY;
  });
}

function pad(THREE: ThreeModule, group: ThreeNS.Object3D, color: string | null, width: number, depth: number): void {
  let existing = group.children.find((child) => child.userData.type === PAD_TAG) as ThreeNS.Mesh | undefined;
  if (color === null) {
    if (existing) {
      group.remove(existing);
      existing.geometry.dispose();
      (existing.material as ThreeNS.Material).dispose();
    }
    return;
  }
  if (!existing) {
    const geometry = new THREE.PlaneGeometry(width + 0.3, depth + 0.3);
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, depthWrite: false });
    existing = new THREE.Mesh(geometry, material);
    existing.rotation.x = -Math.PI / 2;
    existing.position.y = 0.012;
    existing.renderOrder = 1;
    existing.userData.type = PAD_TAG;
    // Not part of the item: no pointer picks and no shadow.
    existing.raycast = () => undefined;
    group.add(existing);
  }
  (existing.material as ThreeNS.MeshBasicMaterial).color.set(color);
}

/**
 * Colour every tracked machine in `scene` by `colors` (item id → colour),
 * or clear them all when `colors` is null. Returns whether anything changed.
 */
export function applyProductionTint(
  THREE: ThreeModule,
  scene: ThreeNS.Scene,
  colors: ReadonlyMap<string, string> | null,
  sizes: ReadonlyMap<string, { width: number; depth: number }>
): boolean {
  let changed = false;
  for (const group of scene.children) {
    if (group.userData.type !== ROOM_OBJECT_TAGS.Furniture) continue;
    const id = group.userData.id as string | undefined;
    const color = (id !== undefined && colors?.get(id)) || null;
    const previous = (group.userData.productionColor as string | undefined) ?? null;
    // A rebuilt group has lost its pad: draw it again even if the colour is the same.
    const hasPad = group.children.some((child) => child.userData.type === PAD_TAG);
    if (color === previous && (color === null || hasPad)) continue;
    const size = id !== undefined ? sizes.get(id) : undefined;
    tint(group, color);
    if (size) pad(THREE, group, color, size.width, size.depth);
    if (color === null) delete group.userData.productionColor;
    else group.userData.productionColor = color;
    changed = true;
  }
  return changed;
}
