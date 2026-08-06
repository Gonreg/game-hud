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

export interface LanguageMeta {
  /** Название языка на нём самом: его читает игрок, которому текущий язык
   *  непонятен, — иначе из списка не выбраться. */
  label: string;
  flag: string;
}

/** Подписи языков — общие для экрана языка в кабинете и переключателя в меню
 *  настроек, чтобы список не разъехался между двумя точками входа. */
export const LANGUAGE_META: Record<SupportedLanguage, LanguageMeta> = {
  ru: { label: 'Русский', flag: '🇷🇺' },
  en: { label: 'English', flag: '🇬🇧' },
  es: { label: 'Español', flag: '🇪🇸' },
  de: { label: 'Deutsch', flag: '🇩🇪' },
  fr: { label: 'Français', flag: '🇫🇷' },
  hi: { label: 'हिन्दी', flag: '🇮🇳' },
  ur: { label: 'اردو', flag: '🇵🇰' },
  bn: { label: 'বাংলা', flag: '🇧🇩' },
  si: { label: 'සිංහල', flag: '🇱🇰' },
  ne: { label: 'नेपाली', flag: '🇳🇵' },
};

/**
 * Подпись языка по коду. Игра вправе держать в i18next язык сверх наших
 * десяти (standalone-бандл прямо это разрешает, MountOptions.locales) —
 * такой код показываем как есть, а не падаем на `undefined.label`.
 */
export function languageMeta(code: string): LanguageMeta {
  return LANGUAGE_META[code as SupportedLanguage] ?? { label: code, flag: '🌐' };
}

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
