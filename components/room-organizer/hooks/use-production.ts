'use client';

import { useEffect, useMemo, useState, type RefObject } from 'react';
import {
  STATUS_COLORS,
  isTrackedMachine,
  machinePlan,
  machineSnapshot,
  type MachinePlan,
  type MachineSnapshot,
} from '../lib/production/production';
import { applyProductionTint } from '../three/production-tint';
import type { FurnitureItem, RoomLayout } from '../lib/types';
import type { ThreeModule } from '../three/builder-utils';
import type * as ThreeNS from 'three';

export interface ProductionRow {
  item: FurnitureItem;
  floorIndex: number;
  floorName: string;
  /** The zone the machine stands in, or the floor's name. */
  area: string;
  snapshot: MachineSnapshot;
}

/** Simulated seconds per real second the panel offers. */
export const PRODUCTION_SPEEDS = [1, 60, 600] as const;
export type ProductionSpeed = (typeof PRODUCTION_SPEEDS)[number];

/** The shift the prototype shows is eight hours long, and opens mid-morning. */
const SHIFT_HOURS = 8;
const OPENING_HOURS = 3.5;
const TICK_MS = 1000;

interface Machine {
  item: FurnitureItem;
  floorIndex: number;
  floorName: string;
  area: string;
  plan: MachinePlan;
}

function areaOf(floor: RoomLayout['floors'][number], item: FurnitureItem): string {
  const p = item.position;
  const zone = p ? floor.zones?.find((z) => p.x >= z.x && p.x <= z.x + z.w && p.z >= z.z && p.z <= z.z + z.d) : undefined;
  return zone?.name ?? floor.name;
}

/**
 * The production prototype (factory fork): while `enabled`, a simulated
 * shift clock runs, every machine in the house is tinted by its status and
 * the rows for the panel are kept current.
 */
export function useProduction(options: {
  enabled: boolean;
  layout: RoomLayout;
  sceneRef: RefObject<ThreeNS.Scene | null>;
  threeModuleRef: RefObject<ThreeModule | null>;
  invalidate(): void;
}): {
  rows: readonly ProductionRow[];
  shiftHours: number;
  speed: ProductionSpeed;
  setSpeed(speed: ProductionSpeed): void;
} {
  const { enabled, layout, sceneRef, threeModuleRef, invalidate } = options;
  const [shiftHours, setShiftHours] = useState(OPENING_HOURS);
  const [speed, setSpeed] = useState<ProductionSpeed>(60);

  const machines = useMemo<Machine[]>(() => {
    const list: Machine[] = [];
    layout.floors.forEach((floor, floorIndex) => {
      for (const item of floor.items) {
        if (!isTrackedMachine(item)) continue;
        const plan = machinePlan(item);
        if (plan) list.push({ item, floorIndex, floorName: floor.name, area: areaOf(floor, item), plan });
      }
    });
    return list;
  }, [layout.floors]);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = window.setInterval(() => {
      setShiftHours((h) => (h + (speed * TICK_MS) / 1000 / 3600) % SHIFT_HOURS);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [enabled, speed]);

  const rows = useMemo<ProductionRow[]>(
    () =>
      enabled
        ? machines.map(({ item, floorIndex, floorName, area, plan }) => ({
            item,
            floorIndex,
            floorName,
            area,
            snapshot: machineSnapshot(plan, shiftHours),
          }))
        : [],
    [enabled, machines, shiftHours]
  );

  // Colour the machines; clear them when the view is switched off.
  useEffect(() => {
    const scene = sceneRef.current;
    const THREE = threeModuleRef.current;
    if (!scene || !THREE) return;
    const colors = enabled ? new Map(rows.map((row) => [row.item.id, STATUS_COLORS[row.snapshot.status]])) : null;
    const sizes = new Map(machines.map(({ item }) => [item.id, { width: item.width, depth: item.depth }]));
    if (applyProductionTint(THREE, scene, colors, sizes)) invalidate();
  }, [enabled, rows, machines, sceneRef, threeModuleRef, invalidate]);

  return { rows, shiftHours, speed, setSpeed };
}
