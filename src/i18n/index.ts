import en from './locales/en.json';
import ru from './locales/ru.json';
import es from './locales/es.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import hi from './locales/hi.json';
import ur from './locales/ur.json';
import bn from './locales/bn.json';
import si from './locales/si.json';
import ne from './locales/ne.json';

export const SUPPORTED_LANGUAGES = [
  'en',
  'ru',
  'es',
  'de',
  'fr',
  'hi',
  'ur',
  'bn',
  'si',
  'ne',
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Языки с письмом справа налево — игра выставляет по ним dir на <html>. */
export const RTL_LANGUAGES: ReadonlySet<string> = new Set(['ur', 'ar', 'fa', 'he']);

/**
 * Словари библиотеки. Игра сливает их со своими при инициализации i18next,
 * причём свои кладёт вторыми, чтобы перекрывать при совпадении ключа:
 *
 *   resources: { en: { translation: { ...hudLocales.en, ...gameEn } } }
 */
export const hudLocales = { en, ru, es, de, fr, hi, ur, bn, si, ne } as const;
