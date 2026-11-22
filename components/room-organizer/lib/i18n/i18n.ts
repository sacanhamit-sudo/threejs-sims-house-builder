/**
 * Interface language (Turkish / English).
 *
 * The editor's text is written in English throughout the components. Rather
 * than thread a `t()` call through every one of them, the English text is
 * the key: `translate()` looks a string up in the Turkish dictionary, either
 * exactly or through a pattern for text built from a template (`Floor {}`).
 * `dom-translator.ts` applies it to whatever React renders, so new upstream
 * components keep working and simply show English until their text is added
 * to `tr-dict.json`.
 */
import TR_DICT from './tr-dict.json';

export type Lang = 'en' | 'tr';
export const LANGS: readonly Lang[] = ['tr', 'en'];
export const LANG_NAMES: Readonly<Record<Lang, string>> = { tr: 'Türkçe', en: 'English' };

const STORAGE_KEY = 'pc-lang';
const CHANGE_EVENT = 'pc-langchange';

const dict: Readonly<Record<string, string>> = TR_DICT;

function readStoredLang(): Lang | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'tr' || value === 'en' ? value : null;
  } catch {
    return null;
  }
}

function browserLang(): Lang {
  if (typeof navigator === 'undefined') return 'en';
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages.some((l) => typeof l === 'string' && l.toLowerCase().startsWith('tr')) ? 'tr' : 'en';
}

let current: Lang | null = null;

/** The chosen language: remembered on this browser, else the browser's own. */
export function getLang(): Lang {
  if (current) return current;
  if (typeof window === 'undefined') return 'en';
  current = readStoredLang() ?? browserLang();
  return current;
}

export function setLang(lang: Lang): void {
  if (lang === getLang()) return;
  current = lang;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Private mode: the choice lasts for this visit.
  }
  window.dispatchEvent(new CustomEvent<Lang>(CHANGE_EVENT, { detail: lang }));
}

export function onLangChange(listener: (lang: Lang) => void): () => void {
  const handler = (event: Event): void => listener((event as CustomEvent<Lang>).detail);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

// ---------------------------------------------------------------------------
// Lookup

interface Pattern {
  re: RegExp;
  out: string;
}

/** Templates need some words of their own, or `{} ({})` would match anything. */
const MIN_PATTERN_LETTERS = 4;

function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let patterns: Pattern[] | null = null;

function getPatterns(): Pattern[] {
  if (patterns) return patterns;
  patterns = [];
  for (const [key, out] of Object.entries(dict)) {
    if (!key.includes('{}')) continue;
    const literal = key.replace(/\{\}/g, '');
    if ((literal.match(/\p{L}/gu) ?? []).length < MIN_PATTERN_LETTERS) continue;
    const re = new RegExp(`^${key.split('{}').map(escapeRe).join('(.*?)')}$`, 's');
    patterns.push({ re, out });
  }
  // Longest literal first: the most specific template wins.
  patterns.sort((a, b) => b.re.source.length - a.re.source.length);
  return patterns;
}

/** Fill `{}` in order, or `{0}`, `{1}` where Turkish word order differs. */
function fill(out: string, values: readonly string[]): string {
  let next = 0;
  return out.replace(/\{(\d?)\}/g, (_, index: string) => {
    const value = index === '' ? values[next++] : values[Number(index)];
    return value === undefined ? '' : translateCore(value) ?? value;
  });
}

const cache = new Map<string, string | null>();
const MAX_CACHE = 5000;

/** A dictionary entry for `text`, allowing a leading emoji or trailing punctuation. */
function lookupExact(text: string): string | null {
  const exact = dict[text];
  if (exact !== undefined) return exact;
  const framed = /^([^\p{L}\p{N}"“(]*)(.*?)([\s.:…!?]*)$/su.exec(text);
  if (framed && (framed[1] || framed[3])) {
    const [, lead = '', core = '', tail = ''] = framed;
    const inner = core && core !== text ? dict[core] : undefined;
    if (inner !== undefined) return lead + inner + tail;
  }
  return null;
}

/**
 * `text` split at the first separator it holds, each part translated. With
 * `strict`, every part with letters in it must be in the dictionary as it is
 * (no templates, which could swallow a separator of their own).
 */
function joinParts(text: string, separators: readonly string[], strict: boolean): string | null {
  for (const separator of separators) {
    if (!text.includes(separator)) continue;
    const parts = text.split(separator);
    const lookup = strict ? lookupExact : translateCore;
    const translated = parts.map((part) => (/\p{L}/u.test(part) ? lookup(part) : null));
    const worded = parts.filter((part) => /\p{L}/u.test(part)).length;
    const known = translated.filter((part) => part !== null).length;
    if (known > 0 && (!strict || known === worded)) {
      return parts.map((part, i) => translated[i] ?? part).join(separator);
    }
  }
  return null;
}

/** Turkish for a trimmed English string, or null when there is none. */
function translateCore(text: string): string | null {
  const cached = cache.get(text);
  if (cached !== undefined) return cached;

  let result: string | null = lookupExact(text);
  // A keyboard shortcut after the label: "Show the 2D plan (2)".
  if (result === null) {
    const shortcut = /^(.+?)( \([^()]{1,14}\))$/s.exec(text);
    const inner = shortcut?.[1] ? translateCore(shortcut[1]) : null;
    if (shortcut && inner !== null) result = inner + shortcut[2];
  }
  // Labels joined by a separator, every worded part known: "1: Ground Floor",
  // "Armchair, Tan, $280".
  if (result === null) result = joinParts(text, [' · ', ' — ', ': ', ', '], true);
  if (result === null && /\p{L}/u.test(text)) {
    for (const { re, out } of getPatterns()) {
      const match = re.exec(text);
      if (match) {
        result = fill(out, match.slice(1));
        break;
      }
    }
  }
  // Failing that, whichever parts are known.
  if (result === null) result = joinParts(text, [' · ', ' — ', ': '], false);
  if (cache.size > MAX_CACHE) cache.clear();
  cache.set(text, result);
  return result;
}

/**
 * The text in the chosen language. Surrounding whitespace is kept, since a
 * text node's spaces separate it from the JSX around it.
 */
export function translate(text: string, lang: Lang = getLang()): string {
  if (lang === 'en' || !text) return text;
  const lead = /^\s*/.exec(text)?.[0] ?? '';
  const tail = /\s*$/.exec(text)?.[0] ?? '';
  const core = text.slice(lead.length, text.length - tail.length);
  if (!core || !/\p{L}/u.test(core)) return text;
  const normalised = core.replace(/\s+/g, ' ');
  const out = translateCore(normalised);
  return out === null ? text : lead + out + tail;
}

/** Shorthand for code that draws its own text (canvas labels, the plan). */
export const t = (text: string): string => translate(text);
