import { describe, expect, it } from 'vitest';
import { formatDuration, isTrackedMachine, machinePlan, machineSnapshot, shiftClock } from './production';

describe('production prototype', () => {
  it('tracks machines, not furniture', () => {
    expect(isTrackedMachine({ type: 'tunnel-oven' })).toBe(true);
    expect(isTrackedMachine({ type: 'sofa' })).toBe(false);
    expect(machinePlan({ id: 'x', type: 'sofa' })).toBeNull();
  });

  it('gives a machine the same plan on every load', () => {
    expect(machinePlan({ id: 'ff-oven', type: 'tunnel-oven' })).toEqual(machinePlan({ id: 'ff-oven', type: 'tunnel-oven' }));
  });

  it('makes progress over the shift and keeps the numbers consistent', () => {
    const plan = machinePlan({ id: 'ff-oven', type: 'tunnel-oven' })!;
    let lastGood = -1;
    for (let h = 0; h <= 8; h += 0.25) {
      const snap = machineSnapshot(plan, h);
      expect(['running', 'setup', 'down', 'idle']).toContain(snap.status);
      expect(snap.progress).toBeGreaterThanOrEqual(0);
      expect(snap.progress).toBeLessThanOrEqual(1);
      expect(snap.scrapped).toBeLessThanOrEqual(snap.produced);
      expect(snap.oee.oee).toBeGreaterThan(0);
      expect(snap.oee.oee).toBeLessThanOrEqual(1);
      expect(snap.shiftGood).toBeGreaterThanOrEqual(lastGood);
      lastGood = snap.shiftGood;
      if (snap.order) expect(snap.remainingMinutes).toBeGreaterThan(0);
    }
    expect(lastGood).toBeGreaterThan(0);
  });

  it('stops during a breakdown and loses availability for it', () => {
    const plan = machinePlan({ id: 'ff-mixer-1', type: 'dough-mixer' })!;
    const [start, length] = plan.stops[0]!;
    const during = start + length / 2 - plan.offsetHours;
    if (during > 0) {
      const snap = machineSnapshot(plan, during);
      expect(snap.status).toBe('down');
      const later = machineSnapshot(plan, during + length);
      expect(later.oee.availability).toBeLessThan(1);
    }
  });

  it('formats the clock and durations', () => {
    expect(shiftClock(0)).toBe('06:00');
    expect(shiftClock(3.7)).toBe('09:42');
    expect(formatDuration(85)).toBe('1 h 25 min');
    expect(formatDuration(12)).toBe('12 min');
    expect(formatDuration(0.5)).toBe('< 1 min');
  });
});
