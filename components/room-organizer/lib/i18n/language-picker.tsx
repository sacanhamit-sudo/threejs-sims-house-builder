'use client';

import { useEffect, useState } from 'react';
import { getLang, LANG_NAMES, LANGS, onLangChange, setLang, type Lang } from './i18n';

/** The current language, re-rendering when it changes. */
export function useLang(): Lang {
  const [lang, setLangState] = useState<Lang>('en');
  useEffect(() => {
    setLangState(getLang());
    return onLangChange(setLangState);
  }, []);
  return lang;
}

/**
 * TR / EN switch. Its own labels are never translated (`data-no-translate`),
 * so each language is always named in itself.
 */
export function LanguagePicker({ className, style }: { className?: string; style?: React.CSSProperties }): JSX.Element {
  const lang = useLang();
  return (
    <div
      role="radiogroup"
      aria-label={lang === 'tr' ? 'Dil' : 'Language'}
      data-no-translate=""
      className={className}
      style={{ display: 'flex', gap: 4, ...style }}
    >
      {LANGS.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={option === lang}
          aria-label={LANG_NAMES[option]}
          title={LANG_NAMES[option]}
          onClick={() => setLang(option)}
          className={`pc-tile pc-photo-entry${option === lang ? ' pc-tile--active' : ''}`}
          style={{ minWidth: 36 }}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
