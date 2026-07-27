import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, RTL_LANGUAGES, type SupportedLanguage } from '../i18n';

const LANG_META: Record<SupportedLanguage, { label: string; flag: string }> = {
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

export function LanguageScreen() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  // fatman выставляет lang/dir на <html> не из самого экрана выбора языка, а
  // из отдельного слушателя `i18n.on('languageChanged', applyDirection)` в
  // бутстрапе i18n игры (fatman/frontend/src/i18n/index.ts). Библиотека не
  // владеет инстансом i18next (см. HudProvider) и не может полагаться на то,
  // что каждая из шести игр повторит у себя такой слушатель, поэтому экран
  // ставит lang/dir сам — иначе выбор языка не более чем сменил бы тексты,
  // а атрибуты документа (важные для RTL-скриптов вроде урду) остались бы
  // от предыдущего языка.
  function select(code: SupportedLanguage) {
    void i18n.changeLanguage(code);
    document.documentElement.lang = code;
    document.documentElement.dir = RTL_LANGUAGES.has(code) ? 'rtl' : 'ltr';
  }

  return (
    <div className="hud-profile-list">
      {SUPPORTED_LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          className="hud-profile-list__row"
          onClick={() => select(code)}
        >
          <span className="hud-profile-list__icon">{LANG_META[code].flag}</span>
          <span className="hud-profile-list__label">{LANG_META[code].label}</span>
          {current.startsWith(code) && <span className="hud-profile-list__hint">✓</span>}
        </button>
      ))}
    </div>
  );
}
