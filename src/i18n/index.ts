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
 * Словари библиотеки. Игра сливает их со своими при инициализации i18next
 * через mergeHudLocales, который кладёт игровые значения поверх библиотечных:
 *
 *   resources: { en: { translation: mergeHudLocales(hudLocales.en, gameEn) } }
 */
export const hudLocales = { en, ru, es, de, fr, hi, ur, bn, si, ne } as const;

type Dict = { [key: string]: string | Dict };

/**
 * Рекурсивно сливает словарь игры поверх библиотечного.
 *
 * Обычный спред здесь не годится: он поверхностный и затирает целый неймспейс.
 * Если у игры есть свой `wallet` без ключа `title`, спред выбросит библиотечный
 * `wallet.title`, и на экране появится сырой ключ. На двух играх так потерялось
 * 36 и 2 ключа соответственно, прежде чем это заметили.
 *
 * Приоритет у игры: при совпадении ключа побеждает её значение.
 */
export function mergeHudLocales(hud: Dict, game: Dict): Dict {
  const out: Dict = { ...hud };
  for (const [key, gameValue] of Object.entries(game)) {
    const hudValue = out[key];
    out[key] =
      isPlainDict(hudValue) && isPlainDict(gameValue)
        ? mergeHudLocales(hudValue, gameValue)
        : gameValue;
  }
  return out;
}

function isPlainDict(v: unknown): v is Dict {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
