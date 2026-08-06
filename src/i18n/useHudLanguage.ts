import { useTranslation } from 'react-i18next';
import { useHudConfigOptional } from '../context/HudProvider';
import { RTL_LANGUAGES, type SupportedLanguage } from './index';

/** Ключ, под которым i18next-browser-languagedetector кэширует язык по
 *  умолчанию. Игра со своим ключом передаёт его в `HudConfig.languageStorageKey`. */
export const DEFAULT_LANGUAGE_STORAGE_KEY = 'i18nextLng';

/** Базовый код: i18next хранит и региональные варианты вроде `en-US`. */
function baseCode(lang: string): string {
  return lang.split('-')[0].toLowerCase();
}

/**
 * Текущий язык и его переключение — одна логика на два места выбора языка:
 * экран в кабинете (`LanguageScreen`) и переключатель в меню настроек
 * (`LanguagePicker`).
 *
 * Здесь же два побочных эффекта, без которых выбор языка неполон:
 *
 * 1. lang/dir на <html>. Игра выставляет их из своего слушателя
 *    `i18n.on('languageChanged', applyDirection)` в бутстрапе i18n, но
 *    библиотека не владеет инстансом i18next (см. HudProvider) и не может
 *    полагаться на то, что каждая из пяти игр этот слушатель у себя завела —
 *    иначе смена языка поменяла бы тексты, а атрибуты документа (важные для
 *    письма справа налево, урду) остались бы от прежнего языка.
 * 2. Запись выбора в localStorage. У игр с i18next-детектором он кэширует
 *    язык сам, но molot собирает язык руками, без плагина, и там выбор без
 *    этой записи не пережил бы перезапуск.
 */
export function useHudLanguage(): {
  /** Базовый код текущего языка: `en`, `ru`, … */
  language: string;
  selectLanguage: (code: SupportedLanguage) => void;
} {
  const { i18n } = useTranslation();
  const storageKey = useHudConfigOptional()?.languageStorageKey ?? DEFAULT_LANGUAGE_STORAGE_KEY;

  function selectLanguage(code: SupportedLanguage) {
    void i18n.changeLanguage(code);
    document.documentElement.lang = code;
    document.documentElement.dir = RTL_LANGUAGES.has(code) ? 'rtl' : 'ltr';
    try {
      window.localStorage.setItem(storageKey, code);
    } catch {
      // Приватный режим или переполненная квота: на этот сеанс язык уже
      // переключён, просто не переживёт перезапуск. Ронять игру не за что.
    }
  }

  return { language: baseCode(i18n.language ?? ''), selectLanguage };
}
