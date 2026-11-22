import { describe, expect, it } from 'vitest';
import { FURNITURE_CATALOG, CATEGORIES } from '../constants';
import { translate } from './i18n';

describe('translate (Turkish)', () => {
  it('leaves English alone', () => {
    expect(translate('Undo', 'en')).toBe('Undo');
  });

  it('translates exact text and keeps the surrounding spaces', () => {
    expect(translate('Undo', 'tr')).toBe('Geri Al');
    expect(translate('  Undo ', 'tr')).toBe('  Geri Al ');
  });

  it('translates through a leading emoji', () => {
    expect(translate('🔍 Fit to room', 'tr')).toBe('🔍 Odaya sığdır');
    expect(translate('🏭 Biscuit & Chocolate Factory', 'tr')).toBe('🏭 Bisküvi ve Çikolata Fabrikası');
  });

  it('fills templates, translating what goes in them', () => {
    expect(translate('Floor 2', 'tr')).toBe('2. Kat');
    expect(translate('Removed Lathe', 'tr')).toBe('Torna Tezgâhı kaldırıldı');
  });

  it('leaves text it does not know, numbers and user names unchanged', () => {
    expect(translate('Zyxw qwerty', 'tr')).toBe('Zyxw qwerty');
    expect(translate('42', 'tr')).toBe('42');
  });

  it('names every category and catalog item in Turkish', () => {
    for (const { label } of CATEGORIES) expect(translate(label, 'tr'), label).not.toBe(label);
    const same = new Set(['Modern', 'Panel', 'Forklift']);
    for (const { name } of FURNITURE_CATALOG) {
      if (!same.has(name)) expect(translate(name, 'tr'), name).not.toBe(name);
    }
  });
});

describe('translate: composed labels', () => {
  it('keeps a shortcut hint', () => {
    expect(translate('Show the 2D plan (2)', 'tr')).toBe('2D planı göster (2)');
  });
  it('translates each side of a separator', () => {
    expect(translate('Build Tools: Openings', 'tr')).toBe('Yapı Araçları: Açıklıklar');
    expect(translate('Production Hall · 22 items', 'tr')).toBe('Üretim Holü · 22 öğe');
  });
  it('decodes entities the JSX source wrote', () => {
    expect(translate('🎨 Walls & Floor', 'tr')).toBe('🎨 Duvarlar ve Zemin');
  });
});

describe('translate: lists and goals', () => {
  it('prefers known parts over a loose template', () => {
    expect(translate('1: Ground Floor', 'tr')).toBe('1: Zemin Kat');
    expect(translate('Armchair, Tan, $280', 'tr')).toBe('Berjer, Taba, $280');
  });
  it('builds a goal from its parts', () => {
    expect(translate('2 bedrooms at 3★ or more', 'tr')).toBe('3★ veya üzeri 2 yatak odası');
    expect(translate('Saved 16 s ago', 'tr')).toBe('Kaydedildi: 16 sn önce');
  });
});

describe('translate: a template wins over splitting its own separator', () => {
  it('reads the plan label as one sentence', () => {
    expect(translate('Floor plan of My Home, Ground Floor', 'tr')).toBe('Fabrikam kat planı, Zemin Kat');
  });
});
