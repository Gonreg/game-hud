import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_META, SUPPORTED_LANGUAGES, languageMeta } from '../i18n';
import { useHudLanguage } from '../i18n/useHudLanguage';
import { IconGlobe } from '../primitives/icons';

/**
 * Выбор языка внизу меню настроек — общий пункт для всех игр. Разметка та же,
 * что у остальных пунктов меню (`hud-fm-smitem`), а раскрывающийся список
 * повторяет подборщик треков: десять языков всегда открытыми съели бы меню
 * целиком, поэтому в свёрнутом виде видно только текущий язык.
 *
 * Выбор меню не закрывает: игрок должен увидеть, что подписи переключились,
 * и при промахе поправить выбор, не открывая шестерёнку заново.
 */
export function LanguagePicker() {
  const { t } = useTranslation();
  const { language, selectLanguage } = useHudLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="hud-fm-smitem"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="hud-fm-smi">
          <IconGlobe />
        </span>
        <span className="hud-fm-sml">{t('language.title')}</span>
        <span className="hud-fm-smcur">{languageMeta(language).label}</span>
      </button>
      {open && (
        <div className="hud-fm-smlangs">
          {SUPPORTED_LANGUAGES.map((code) => (
            <button
              key={code}
              type="button"
              className={'hud-fm-smlang' + (code === language ? ' hud-on' : '')}
              aria-pressed={code === language}
              onClick={() => selectLanguage(code)}
            >
              <span aria-hidden="true">{LANGUAGE_META[code].flag}</span>
              {LANGUAGE_META[code].label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
