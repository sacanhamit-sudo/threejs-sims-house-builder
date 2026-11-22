/**
 * Applies `translate()` to the page: text nodes and the attributes people
 * read (title, aria-label, placeholder, alt). The English React rendered is
 * remembered per node, so switching back to English restores it, and a node
 * React later rewrites is translated afresh.
 *
 * React compares against its own last props, never the DOM, so a translated
 * text node stays translated until React gives it new text.
 */
import { getLang, onLangChange, translate, type Lang } from './i18n';

const ATTRIBUTES = ['title', 'aria-label', 'placeholder', 'alt', 'aria-description', 'aria-roledescription'] as const;

/** Elements whose text is code, user input or otherwise not interface copy. */
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'svg']);

interface Tracked {
  /** The English React wrote. */
  source: string;
  /** What this module last wrote over it. */
  shown: string;
}

const textRecords = new WeakMap<Text, Tracked>();
const attrRecords = new WeakMap<Element, Map<string, Tracked>>();

function skipped(element: Element | null): boolean {
  for (let el = element; el; el = el.parentElement) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.hasAttribute('data-no-translate')) return true;
    if ((el as HTMLElement).isContentEditable) return true;
  }
  return false;
}

function applyText(node: Text, lang: Lang): void {
  const value = node.nodeValue ?? '';
  let record = textRecords.get(node);
  if (!record || value !== record.shown) {
    // New text from React (or a node we have not met yet).
    record = { source: value, shown: value };
    textRecords.set(node, record);
  }
  const next = translate(record.source, lang);
  if (next !== value) {
    record.shown = next;
    node.nodeValue = next;
  }
}

function applyAttribute(element: Element, name: string, lang: Lang): void {
  const value = element.getAttribute(name);
  if (value === null) return;
  let records = attrRecords.get(element);
  if (!records) {
    records = new Map();
    attrRecords.set(element, records);
  }
  let record = records.get(name);
  if (!record || value !== record.shown) {
    record = { source: value, shown: value };
    records.set(name, record);
  }
  const next = translate(record.source, lang);
  if (next !== value) {
    record.shown = next;
    element.setAttribute(name, next);
  }
}

function applyElement(element: Element, lang: Lang): void {
  for (const name of ATTRIBUTES) if (element.hasAttribute(name)) applyAttribute(element, name, lang);
}

function applyTree(root: Node, lang: Lang): void {
  if (root.nodeType === Node.TEXT_NODE) {
    if (!skipped(root.parentElement)) applyText(root as Text, lang);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) {
    if (skipped(root as Element)) return;
    applyElement(root as Element, lang);
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (SKIP_TAGS.has(el.tagName) || el.hasAttribute('data-no-translate') || (el as HTMLElement).isContentEditable) {
          return NodeFilter.FILTER_REJECT;
        }
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) applyText(node as Text, lang);
    else applyElement(node as Element, lang);
  }
}

let titleSource: string | null = null;
let titleShown: string | null = null;

function applyTitle(lang: Lang): void {
  if (titleSource === null || document.title !== titleShown) titleSource = document.title;
  titleShown = translate(titleSource, lang);
  if (document.title !== titleShown) document.title = titleShown;
}

type DialogFn = (message?: string, ...rest: string[]) => unknown;

/** Native alert/confirm/prompt messages go through the dictionary too. */
function patchDialogs(): () => void {
  const originals: Array<[keyof Window, DialogFn]> = [];
  for (const name of ['alert', 'confirm', 'prompt'] as const) {
    const original = window[name] as DialogFn;
    if (typeof original !== 'function') continue;
    originals.push([name, original]);
    const wrapped: DialogFn = (message, ...rest) =>
      original.call(window, typeof message === 'string' ? translate(message) : message, ...rest);
    (window as unknown as Record<string, DialogFn>)[name] = wrapped;
  }
  return () => {
    for (const [name, original] of originals) (window as unknown as Record<string, DialogFn>)[name as string] = original;
  };
}

/** Start translating the page; returns a function that stops it. */
export function startDomTranslation(): () => void {
  let lang = getLang();
  document.documentElement.lang = lang;

  const observer = new MutationObserver((mutations) => {
    if (lang === 'en' && mutations.length) {
      // Nothing to translate, but React may have replaced text we track.
      return;
    }
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        const node = mutation.target as Text;
        if (!skipped(node.parentElement)) applyText(node, lang);
      } else if (mutation.type === 'attributes') {
        const el = mutation.target as Element;
        if (mutation.attributeName && !skipped(el)) applyAttribute(el, mutation.attributeName, lang);
      } else {
        mutation.addedNodes.forEach((node) => applyTree(node, lang));
      }
    }
  });

  const run = (): void => {
    applyTree(document.body, lang);
    applyTitle(lang);
  };

  run();
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRIBUTES],
  });
  const titleObserver = new MutationObserver(() => applyTitle(lang));
  const head = document.querySelector('head');
  if (head) titleObserver.observe(head, { subtree: true, childList: true, characterData: true });

  const unpatch = patchDialogs();
  const stopListening = onLangChange((next) => {
    lang = next;
    document.documentElement.lang = next;
    // Our own writes are recorded, so this run doesn't mistake them for React's.
    run();
  });

  return () => {
    observer.disconnect();
    titleObserver.disconnect();
    unpatch();
    stopListening();
  };
}
