'use client';

import { useEffect, useMemo, useRef } from 'react';
import { PRODUCTION_SPEEDS, type ProductionRow, type ProductionSpeed } from '../hooks/use-production';
import { useLang } from '../lib/i18n/language-picker';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  shiftClock,
  type MachineStatus,
  type Unit,
} from '../lib/production/production';
import type { Lang } from '../lib/i18n/i18n';

const UNIT_LABELS: Readonly<Record<Lang, Record<Unit, string>>> = {
  tr: { pcs: 'adet', kg: 'kg', packs: 'paket', cases: 'koli', parts: 'parça' },
  en: { pcs: 'pcs', kg: 'kg', packs: 'packs', cases: 'cases', parts: 'parts' },
};

function duration(minutes: number, lang: Lang): string {
  const [h, m] = lang === 'tr' ? ['sa', 'dk'] : ['h', 'min'];
  if (minutes < 1) return `< 1 ${m}`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return hours > 0 ? `${hours} ${h} ${mins} ${m}` : `${mins} ${m}`;
}

function percent(value: number, lang: Lang, digits = 0): string {
  const n = (value * 100).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
  return lang === 'tr' ? `%${n}` : `${n}%`;
}

function count(value: number, lang: Lang): string {
  return Math.round(value).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US');
}

const STATUS_ORDER: readonly MachineStatus[] = ['running', 'setup', 'down', 'idle'];

export interface ProductionPanelProps {
  rows: readonly ProductionRow[];
  shiftHours: number;
  speed: ProductionSpeed;
  onSpeed(speed: ProductionSpeed): void;
  onClose(): void;
  onFocus(row: ProductionRow): void;
  selectedId: string | null;
}

/**
 * The production prototype's panel (factory fork): the shift at a glance,
 * then every machine by area with its order, progress, time left, scrap and
 * OEE. Clicking a machine takes the view to its floor and selects it.
 */
export function ProductionPanel({ rows, shiftHours, speed, onSpeed, onClose, onFocus, selectedId }: ProductionPanelProps): JSX.Element {
  const lang = useLang();
  const listRef = useRef<HTMLDivElement>(null);

  const totals = useMemo(() => {
    const running = rows.filter((r) => r.snapshot.status === 'running').length;
    const down = rows.filter((r) => r.snapshot.status === 'down').length;
    const good = rows.reduce((s, r) => s + r.snapshot.shiftGood, 0);
    const scrap = rows.reduce((s, r) => s + r.snapshot.shiftScrap, 0);
    const oee = rows.length ? rows.reduce((s, r) => s + r.snapshot.oee.oee, 0) / rows.length : 0;
    return { running, down, scrapShare: good + scrap > 0 ? scrap / (good + scrap) : 0, oee };
  }, [rows]);

  const groups = useMemo(() => {
    const map = new Map<string, ProductionRow[]>();
    for (const row of rows) {
      const key = `${row.floorIndex}|${row.area}`;
      map.set(key, [...(map.get(key) ?? []), row]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, list]) => ({ key, area: list[0]!.area, list }));
  }, [rows]);

  // Bring the selected machine's card into view.
  useEffect(() => {
    if (!selectedId) return;
    listRef.current?.querySelector(`[data-machine="${CSS.escape(selectedId)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  const units = UNIT_LABELS[lang];
  const shiftEnd = shiftClock(8);

  return (
    <aside
      className="pc-glass pc-glass--dark"
      aria-label="Production"
      style={{
        position: 'absolute',
        top: 72,
        right: 16,
        bottom: 16,
        width: 'min(420px, calc(100vw - 32px))',
        zIndex: 45,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        color: 'var(--pc-paper)',
        fontFamily: 'var(--pc-font-body)',
        overflow: 'hidden',
      }}
    >
      <header style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--pc-font-display)', fontWeight: 800, fontSize: 17 }}>🏭 <span>Production Tracking</span></div>
            <div style={{ fontSize: 12, color: 'var(--pc-paper-soft)', marginTop: 2 }}>
              <span>Shift</span> {shiftClock(0)}–{shiftEnd} · <span>Now</span> <strong data-no-translate="">{shiftClock(shiftHours)}</strong>
            </div>
          </div>
          <div role="radiogroup" aria-label="Simulation speed" title="Simulation speed" style={{ display: 'flex', gap: 4 }}>
            {PRODUCTION_SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={s === speed}
                onClick={() => onSpeed(s)}
                className={`pc-tile pc-photo-entry${s === speed ? ' pc-tile--active' : ''}`}
                style={{ minWidth: 40 }}
                data-no-translate=""
              >
                {s}×
              </button>
            ))}
          </div>
          <button type="button" className="pc-tile pc-photo-entry" aria-label="Close" title="Close" onClick={onClose} style={{ minWidth: 32 }}>
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 12 }}>
          <Kpi label="Running" value={`${totals.running}/${rows.length}`} color={STATUS_COLORS.running} />
          <Kpi label="Avg. OEE" value={percent(totals.oee, lang)} />
          <Kpi label="Scrap" value={percent(totals.scrapShare, lang, 1)} color={totals.scrapShare > 0.025 ? STATUS_COLORS.setup : undefined} />
          <Kpi label="Breakdowns" value={String(totals.down)} color={totals.down > 0 ? STATUS_COLORS.down : undefined} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10, fontSize: 11, color: 'var(--pc-paper-soft)' }}>
          {STATUS_ORDER.map((status) => (
            <span key={status} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Dot color={STATUS_COLORS[status]} />
              <span>{STATUS_LABELS[status]}</span>
            </span>
          ))}
        </div>
      </header>

      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 12px' }}>
        {rows.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--pc-paper-soft)', padding: 8 }}>
            No machines in this building yet. Load the Biscuit & Chocolate Factory template, or add machines from the Factory category.
          </p>
        )}
        {groups.map(({ key, area, list }) => (
          <section key={key} style={{ marginTop: 8 }}>
            <h3 style={{ margin: '6px 4px', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--pc-paper-soft)', fontFamily: 'var(--pc-font-display)' }}>
              {area}
            </h3>
            {list.map((row) => (
              <MachineCard
                key={row.item.id}
                row={row}
                lang={lang}
                unit={row.snapshot.order ? units[row.snapshot.order.product.unit] : ''}
                selected={row.item.id === selectedId}
                onFocus={() => onFocus(row)}
              />
            ))}
          </section>
        ))}
      </div>

      <footer style={{ padding: '8px 14px', fontSize: 11, color: 'var(--pc-paper-soft)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        Sample data for the prototype. Connected to an MES or ERP, these would be the live figures.
      </footer>
    </aside>
  );
}

function MachineCard({ row, lang, unit, selected, onFocus }: { row: ProductionRow; lang: Lang; unit: string; selected: boolean; onFocus(): void }): JSX.Element {
  const { snapshot, item } = row;
  const color = STATUS_COLORS[snapshot.status];
  const order = snapshot.order;
  const good = snapshot.produced - snapshot.scrapped;
  const scrapShare = snapshot.produced > 0 ? snapshot.scrapped / snapshot.produced : 0;
  const next = snapshot.next[0];
  const edge = selected ? 'var(--pc-cyan-glow)' : 'rgba(255,255,255,0.08)';
  return (
    <button
      type="button"
      data-machine={item.id}
      onClick={onFocus}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        margin: '0 0 6px',
        padding: '9px 10px 9px 12px',
        borderRadius: 10,
        // Longhand only: React warns when a shorthand and a longhand of it change together.
        borderTop: `1px solid ${edge}`,
        borderRight: `1px solid ${edge}`,
        borderBottom: `1px solid ${edge}`,
        borderLeft: `4px solid ${color}`,
        background: selected ? 'rgba(127,243,255,0.10)' : 'rgba(255,255,255,0.04)',
        color: 'inherit',
        cursor: 'pointer',
        font: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{item.name}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color }}>
          <Dot color={color} pulse={snapshot.status === 'running'} />
          <span>{STATUS_LABELS[snapshot.status]}</span>
        </span>
      </div>
      {order ? (
        <>
          <div style={{ fontSize: 12, color: 'var(--pc-paper-soft)', marginTop: 2 }}>
            <span>{order.product.name}</span> · <span data-no-translate="">#{order.id}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', marginTop: 7, overflow: 'hidden' }}>
            <div style={{ width: `${snapshot.progress * 100}%`, height: '100%', background: color, transition: 'width 0.8s linear' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4, color: 'var(--pc-paper-soft)' }} data-no-translate="">
            <span>
              {count(good, lang)} / {count(order.quantity, lang)} {unit}
            </span>
            <span>{percent(snapshot.progress, lang)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginTop: 6, fontSize: 11 }}>
            <Stat label="Remaining" value={snapshot.remainingMinutes !== null ? duration(snapshot.remainingMinutes, lang) : '—'} />
            <Stat label="Scrap" value={percent(scrapShare, lang, 1)} warn={scrapShare > 0.025} />
            <Stat label="OEE" value={percent(snapshot.oee.oee, lang)} warn={snapshot.oee.oee < 0.65} />
          </div>
          {next && (
            <div style={{ fontSize: 11, color: 'var(--pc-paper-soft)', marginTop: 5 }}>
              <span>Next</span>: <span>{next.product.name}</span> <span data-no-translate="">({count(next.quantity, lang)} {UNIT_LABELS[lang][next.product.unit]})</span>
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--pc-paper-soft)', marginTop: 2 }}>No order waiting</div>
      )}
    </button>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color?: string | undefined }): JSX.Element {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '7px 8px', textAlign: 'center' }}>
      <div data-no-translate="" style={{ fontFamily: 'var(--pc-font-display)', fontWeight: 800, fontSize: 17, color: color ?? 'var(--pc-paper)' }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: 'var(--pc-paper-soft)', marginTop: 1 }}>{label}</div>
    </div>
  );
}

function Stat({ label, value, warn = false }: { label: string; value: string; warn?: boolean }): JSX.Element {
  return (
    <div>
      <div style={{ color: 'var(--pc-paper-soft)', fontSize: 10 }}>{label}</div>
      <div data-no-translate="" style={{ fontWeight: 700, color: warn ? STATUS_COLORS.setup : 'var(--pc-paper)' }}>
        {value}
      </div>
    </div>
  );
}

function Dot({ color, pulse = false }: { color: string; pulse?: boolean }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        boxShadow: pulse ? `0 0 0 3px ${color}33, 0 0 8px ${color}` : 'none',
        display: 'inline-block',
      }}
    />
  );
}

/** The button that switches the production view on and off. */
export function ProductionToggle({ open, running, total, onToggle }: { open: boolean; running: number; total: number; onToggle(): void }): JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={open}
      onClick={onToggle}
      title="Production tracking: machine status, orders, time left, scrap and OEE"
      className={`pc-glass pc-glass--dark pc-tile${open ? ' pc-tile--active' : ''}`}
      style={{
        position: 'absolute',
        top: 72,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 31,
        padding: '6px 14px',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'var(--pc-font-display)',
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: 'var(--pc-paper)',
      }}
    >
      <span aria-hidden="true">🏭</span>
      <span>Production</span>
      {open && total > 0 && (
        <span data-no-translate="" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: STATUS_COLORS.running }}>
          <Dot color={STATUS_COLORS.running} pulse />
          {running}/{total}
        </span>
      )}
    </button>
  );
}
