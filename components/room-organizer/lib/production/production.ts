/**
 * Production tracking prototype (factory fork).
 *
 * Every machine in the house gets a queue of work orders for its kind of
 * machine (a biscuit line makes biscuits, a conche makes chocolate), and a
 * simulated clock runs them: set-up, then production at a rate a little below
 * the ideal one, with scrap and the odd breakdown. Everything is a pure
 * function of the machine and the simulated time, so the 3D colours, the
 * panel and the tests all read the same numbers.
 *
 * The sample data stands in for what an MES or ERP would send; replacing
 * `machinePlan` with a feed from one is the step after the prototype.
 */
import type { FurnitureItem } from '../types';

export type MachineStatus = 'running' | 'setup' | 'down' | 'idle';

/** Status colours: shared by the 3D tint, the panel and the legend. */
export const STATUS_COLORS: Readonly<Record<MachineStatus, string>> = {
  running: '#22c55e',
  setup: '#f59e0b',
  down: '#ef4444',
  idle: '#94a3b8',
};

export const STATUS_LABELS: Readonly<Record<MachineStatus, string>> = {
  running: 'Running',
  setup: 'Set-up',
  down: 'Breakdown',
  idle: 'Idle',
};

export type Unit = 'pcs' | 'kg' | 'packs' | 'cases' | 'parts';

export interface Product {
  name: string;
  unit: Unit;
  /** Ideal output per hour on this kind of machine. */
  rate: number;
  /** Share of output scrapped, 0 to 1. */
  scrap: number;
}

export interface WorkOrder {
  id: string;
  product: Product;
  quantity: number;
}

export interface MachinePlan {
  itemId: string;
  orders: readonly WorkOrder[];
  /** Hours of set-up before each order. */
  setupHours: number;
  /** Actual speed as a share of the ideal rate (performance). */
  speed: number;
  /** Where in its queue the machine was when the shift began, in hours. */
  offsetHours: number;
  /** Breakdowns: start hour (into the plan's own timeline) and length in hours. */
  stops: ReadonlyArray<readonly [number, number]>;
}

export interface MachineSnapshot {
  itemId: string;
  status: MachineStatus;
  order: WorkOrder | null;
  /** Good plus scrap made on the current order. */
  produced: number;
  scrapped: number;
  /** 0 to 1, of the current order's quantity. */
  progress: number;
  /** Minutes until the current order is done, or null when idle. */
  remainingMinutes: number | null;
  /** Orders still to come after the current one. */
  next: readonly WorkOrder[];
  oee: { availability: number; performance: number; quality: number; oee: number };
  /** Totals since the shift began. */
  shiftGood: number;
  shiftScrap: number;
  /** The shift's output by product name. */
  shiftByProduct: Readonly<Record<string, { product: Product; good: number; scrap: number }>>;
}

// ---------------------------------------------------------------------------
// Sample products, by the kind of machine that makes them

const P = (name: string, unit: Unit, rate: number, scrap: number): Product => ({ name, unit, rate, scrap });

const PRODUCTS_BY_TYPE: Readonly<Record<string, readonly Product[]>> = {
  'dough-mixer': [P('Biscuit Dough', 'kg', 900, 0.008), P('Cookie Dough', 'kg', 750, 0.01)],
  'rotary-moulder': [P('Cocoa Biscuit', 'pcs', 42000, 0.025), P('Butter Biscuit', 'pcs', 45000, 0.02), P('Hazelnut Cookie', 'pcs', 30000, 0.03)],
  'tunnel-oven': [P('Cocoa Biscuit', 'pcs', 40000, 0.018), P('Butter Biscuit', 'pcs', 43000, 0.015), P('Hazelnut Cookie', 'pcs', 29000, 0.022)],
  'cooling-tunnel': [P('Chocolate-Coated Biscuit', 'pcs', 24000, 0.012), P('Cocoa Biscuit', 'pcs', 38000, 0.008)],
  conche: [P('Milk Chocolate', 'kg', 400, 0.004), P('Dark Chocolate', 'kg', 380, 0.004)],
  'tempering-machine': [P('Milk Chocolate', 'kg', 300, 0.006), P('Dark Chocolate', 'kg', 280, 0.006)],
  enrober: [P('Chocolate-Coated Biscuit', 'pcs', 25000, 0.03), P('Chocolate Wafer', 'pcs', 20000, 0.035)],
  'flow-wrapper': [P('Biscuit 12-Pack', 'packs', 3600, 0.015), P('Chocolate Wafer 6-Pack', 'packs', 3000, 0.02)],
  'robot-arm': [P('Case Palletising', 'cases', 600, 0.002)],
  'cnc-machine': [P('Shaft Ø40', 'parts', 18, 0.02), P('Flange DN100', 'parts', 12, 0.025)],
  lathe: [P('Bushing Ø30', 'parts', 40, 0.015)],
  'hydraulic-press': [P('Bracket 2 mm', 'parts', 600, 0.01)],
  'injection-molder': [P('Biscuit Tray', 'pcs', 1400, 0.02), P('Bottle Cap', 'pcs', 5000, 0.012)],
};

/** Whether an item is a machine the production view tracks. */
export function isTrackedMachine(item: Pick<FurnitureItem, 'type'>): boolean {
  return Object.hasOwn(PRODUCTS_BY_TYPE, item.type);
}

/** A small, stable pseudo-random generator, so a machine's plan is the same on every load. */
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/** Orders cover this many hours of work, more than any shift the view shows. */
const PLAN_HOURS = 24;

/** The sample plan for one machine, or null for an item that isn't one. */
export function machinePlan(item: Pick<FurnitureItem, 'id' | 'type'>): MachinePlan | null {
  const products = PRODUCTS_BY_TYPE[item.type];
  if (!products || products.length === 0) return null;
  const random = seededRandom(item.id);
  const speed = 0.82 + random() * 0.14;
  const setupHours = 0.25 + random() * 0.35;
  const orders: WorkOrder[] = [];
  let hours = 0;
  let n = 0;
  while (hours < PLAN_HOURS) {
    const product = products[Math.floor(random() * products.length)] ?? products[0]!;
    // Orders of one to four hours' work, in round numbers.
    const runHours = 1 + random() * 3;
    const step = product.rate >= 1000 ? 1000 : product.rate >= 100 ? 50 : 5;
    const quantity = Math.max(step, Math.round((product.rate * runHours) / step) * step);
    orders.push({ id: `${(1000 + Math.floor(random() * 9000)).toString()}-${++n}`, product, quantity });
    hours += setupHours + quantity / (product.rate * speed * (1 - product.scrap));
  }
  // One or two breakdowns of 10 to 40 minutes somewhere in the day.
  const stops: Array<readonly [number, number]> = [];
  const breakdowns = 1 + Math.floor(random() * 2);
  for (let i = 0; i < breakdowns; i++) stops.push([0.5 + random() * (PLAN_HOURS - 2), 1 / 6 + random() * 0.5]);
  stops.sort((a, b) => a[0] - b[0]);
  return { itemId: item.id, orders, setupHours, speed, offsetHours: random() * 2, stops };
}

/** Hours of the plan's own timeline that are breakdowns, between `from` and `to`. */
function downHoursBetween(plan: MachinePlan, from: number, to: number): number {
  let total = 0;
  for (const [start, length] of plan.stops) {
    total += Math.max(0, Math.min(to, start + length) - Math.max(from, start));
  }
  return total;
}

function inStop(plan: MachinePlan, t: number): boolean {
  return plan.stops.some(([start, length]) => t >= start && t < start + length);
}

/**
 * Where the machine is `shiftHours` into the shift. Breakdowns pause the
 * work: the plan's clock runs, the order's progress doesn't.
 */
export function machineSnapshot(plan: MachinePlan, shiftHours: number): MachineSnapshot {
  const t = plan.offsetHours + Math.max(0, shiftHours);
  // Working time so far on the plan's timeline, breakdowns taken out.
  const worked = t - downHoursBetween(plan, 0, t);
  const workedAtShiftStart = plan.offsetHours - downHoursBetween(plan, 0, plan.offsetHours);

  let cursor = 0;
  let status: MachineStatus = 'idle';
  let current: WorkOrder | null = null;
  let produced = 0;
  let remainingMinutes: number | null = null;
  let index = -1;
  let shiftGood = 0;
  let shiftScrap = 0;
  const shiftByProduct: Record<string, { product: Product; good: number; scrap: number }> = {};

  for (let i = 0; i < plan.orders.length; i++) {
    const order = plan.orders[i]!;
    const rate = order.product.rate * plan.speed;
    const runHours = order.quantity / (rate * (1 - order.product.scrap));
    const setupEnd = cursor + plan.setupHours;
    const runEnd = setupEnd + runHours;
    // What this order made inside the shift so far.
    const shiftFrom = Math.max(setupEnd, workedAtShiftStart);
    const shiftTo = Math.min(runEnd, worked);
    if (shiftTo > shiftFrom) {
      const made = (shiftTo - shiftFrom) * rate;
      shiftGood += made * (1 - order.product.scrap);
      shiftScrap += made * order.product.scrap;
      const entry = (shiftByProduct[order.product.name] ??= { product: order.product, good: 0, scrap: 0 });
      entry.good += made * (1 - order.product.scrap);
      entry.scrap += made * order.product.scrap;
    }
    if (index < 0 && worked < runEnd) {
      index = i;
      current = order;
      if (worked < setupEnd) {
        status = 'setup';
        produced = 0;
      } else {
        status = 'running';
        produced = (worked - setupEnd) * rate;
      }
      remainingMinutes = (runEnd - worked) * 60;
    }
    cursor = runEnd;
  }

  if (current && inStop(plan, t)) status = 'down';
  const scrapped = current ? produced * current.product.scrap : 0;
  const progress = current ? Math.min(1, (produced - scrapped) / current.quantity) : 0;

  const elapsed = Math.max(1e-6, Math.max(0, shiftHours));
  const downInShift = downHoursBetween(plan, plan.offsetHours, t);
  const availability = Math.max(0, Math.min(1, (elapsed - downInShift) / elapsed));
  const quality = shiftGood + shiftScrap > 0 ? shiftGood / (shiftGood + shiftScrap) : 1;
  // Performance: actual against ideal rate while running.
  const performance = plan.speed;
  return {
    itemId: plan.itemId,
    status,
    order: current,
    produced,
    scrapped,
    progress,
    remainingMinutes,
    next: index >= 0 ? plan.orders.slice(index + 1, index + 3) : [],
    oee: { availability, performance, quality, oee: availability * performance * quality },
    shiftGood,
    shiftScrap,
    shiftByProduct,
  };
}

/**
 * Where a product counts as made: the last step of the line that turns it
 * out. Cocoa biscuits pass the moulder, the oven and the cooling tunnel; the
 * product summary counts them once, as they leave the last of those.
 */
const STAGE: Readonly<Record<string, number>> = {
  'dough-mixer': 1,
  conche: 2,
  'rotary-moulder': 2,
  'tempering-machine': 3,
  'tunnel-oven': 3,
  enrober: 4,
  'cooling-tunnel': 5,
  'flow-wrapper': 6,
  'robot-arm': 7,
};

export interface ProductTotal {
  product: Product;
  good: number;
  scrap: number;
  /** Machines making it right now. */
  running: number;
}

/** The shift's output by product, each counted at the last step that makes it, most first. */
export function productTotals(machines: ReadonlyArray<{ type: string; snapshot: MachineSnapshot }>): ProductTotal[] {
  const lastStage = new Map<string, number>();
  for (const { type, snapshot } of machines) {
    for (const name of Object.keys(snapshot.shiftByProduct)) {
      lastStage.set(name, Math.max(lastStage.get(name) ?? 0, STAGE[type] ?? 1));
    }
  }
  const totals = new Map<string, ProductTotal>();
  for (const { type, snapshot } of machines) {
    for (const [name, made] of Object.entries(snapshot.shiftByProduct)) {
      if ((STAGE[type] ?? 1) !== lastStage.get(name)) continue;
      const total = totals.get(name) ?? { product: made.product, good: 0, scrap: 0, running: 0 };
      total.good += made.good;
      total.scrap += made.scrap;
      totals.set(name, total);
    }
    const current = snapshot.order?.product.name;
    if (current && snapshot.status === 'running') {
      const total = totals.get(current) ?? { product: snapshot.order!.product, good: 0, scrap: 0, running: 0 };
      total.running += 1;
      totals.set(current, total);
    }
  }
  return [...totals.values()].sort((a, b) => a.product.unit.localeCompare(b.product.unit) || b.good - a.good);
}

/** The shift the view covers: it starts at 06:00. */
export const SHIFT_START_HOUR = 6;

/** A clock reading such as 09:42 for `shiftHours` into the shift. */
export function shiftClock(shiftHours: number): string {
  const total = Math.floor((SHIFT_START_HOUR + shiftHours) * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** "1 h 25 min", "12 min", "< 1 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
