import { LANGUAGE_META, SUPPORTED_LANGUAGES } from '../i18n';
import { useHudLanguage } from '../i18n/useHudLanguage';

export function LanguageScreen() {
  // Само переключение (смена языка, lang/dir на <html>, запоминание выбора)
  // живёт в useHudLanguage: тот же выбор языка есть теперь и в меню настроек
  // (LanguagePicker), и расходиться этим двум местам нельзя.
  const { language, selectLanguage } = useHudLanguage();

  return (
    <div className="hud-profile-list">
      {SUPPORTED_LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          className="hud-profile-list__row"
          onClick={() => selectLanguage(code)}
        >
          <span className="hud-profile-list__icon">{LANGUAGE_META[code].flag}</span>
          <span className="hud-profile-list__label">{LANGUAGE_META[code].label}</span>
          {code === language && <span className="hud-profile-list__hint">✓</span>}
        </button>
      ))}
    </div>
  );
}
