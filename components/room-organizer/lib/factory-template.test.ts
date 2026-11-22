import { describe, expect, it } from 'vitest';
import { ROOM_TEMPLATES } from './constants';
import { floorKeepOut } from './floor-keep-out';
import { collisionReason } from './geometry';
import { storeyHeight } from './storeys';
import type { RoomLayout } from './types';

// The factory fork's template: every machine stands clear of the others,
// the partitions and the stairwells, so the plan opens with nothing in red.
describe('the biscuit and chocolate factory template', () => {
  const layout = { ...ROOM_TEMPLATES.factory, id: 'factory' } as RoomLayout;

  it('has three storeys and four production sections', () => {
    expect(layout.floors).toHaveLength(3);
    expect(layout.floors[1]?.zones).toHaveLength(4);
    expect(layout.width * layout.height).toBe(4 * 18 * 12);
  });

  it.each(layout.floors.map((floor, index) => [floor.name, index] as const))('%s: no item collides', (_name, index) => {
    const floor = layout.floors[index]!;
    const context = { keepOut: floorKeepOut(layout, index), interiorWalls: floor.interiorWalls, storeyHeight: storeyHeight(floor) };
    const clashes = floor.items
      .map((item) => [item.id, collisionReason(item, floor.items, layout.width, layout.height, context)] as const)
      .filter(([, reason]) => reason !== null);
    expect(clashes).toEqual([]);
  });
});
