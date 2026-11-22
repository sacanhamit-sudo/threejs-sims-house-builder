import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { applyProductionTint } from './production-tint';
import { ROOM_OBJECT_TAGS } from './room-builder';

function machine(id: string, emissive = 0x000000): { scene: THREE.Scene; group: THREE.Group; part: THREE.MeshStandardMaterial } {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  group.userData = { type: ROOM_OBJECT_TAGS.Furniture, id };
  const part = new THREE.MeshStandardMaterial({ color: 0x888888, emissive });
  group.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), part));
  scene.add(group);
  return { scene, group, part };
}

const sizes = new Map([['m1', { width: 2, depth: 1 }]]);
const THREE_MODULE = THREE as unknown as typeof import('./three-runtime');

describe('production status in 3D', () => {
  it('tints a machine in its status colour and lays a pad under it', () => {
    const { scene, group, part } = machine('m1');
    expect(applyProductionTint(THREE_MODULE, scene, new Map([['m1', '#22c55e']]), sizes)).toBe(true);
    expect(part.emissive.getHexString()).toBe('22c55e');
    expect(group.children.some((c) => c.userData.type === 'production-pad')).toBe(true);
    // Nothing to do on a second pass with the same colour.
    expect(applyProductionTint(THREE_MODULE, scene, new Map([['m1', '#22c55e']]), sizes)).toBe(false);
  });

  it('puts the original look back when switched off', () => {
    const { scene, group, part } = machine('m1');
    applyProductionTint(THREE_MODULE, scene, new Map([['m1', '#ef4444']]), sizes);
    applyProductionTint(THREE_MODULE, scene, null, sizes);
    expect(part.emissive.getHex()).toBe(0x000000);
    expect(group.children.some((c) => c.userData.type === 'production-pad')).toBe(false);
  });

  it('leaves a part that glows on its own alone', () => {
    const { scene, part } = machine('m1', 0x1e88e5);
    applyProductionTint(THREE_MODULE, scene, new Map([['m1', '#22c55e']]), sizes);
    expect(part.emissive.getHex()).toBe(0x1e88e5);
  });

  it('does not touch an item that is not a tracked machine', () => {
    const { scene, part } = machine('sofa');
    applyProductionTint(THREE_MODULE, scene, new Map([['m1', '#22c55e']]), sizes);
    expect(part.emissive.getHex()).toBe(0x000000);
  });
});
