'use client';

import { useEffect } from 'react';
import { startDomTranslation } from './dom-translator';

/** Mounted once in the root layout: translates the whole page, error screens included. */
export function I18nRoot(): null {
  useEffect(() => startDomTranslation(), []);
  return null;
}
