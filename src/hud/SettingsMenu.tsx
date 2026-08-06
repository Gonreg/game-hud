import { useTranslation } from 'react-i18next';
import { LanguagePicker } from './LanguagePicker';

/**
 * Содержимое выпадающего меню шестерёнки (M/game/SettingsSheet.tsx), без
 * подборщика треков — список треков знает только звуковой движок игры, а его
 * у библиотеки нет. Строки Music/SFX/How to play — неймспейс `sound` словаря
 * библиотеки (панель звука переехала в библиотеку на Task 19, вместе с ней и
 * подписи). Внизу — общий для всех игр выбор языка.
 */
export function SettingsMenu({
  onHowToPlay,
  musicOn,
  sfxOn,
  onToggleMusic,
  onToggleSfx,
}: {
  onHowToPlay: () => void;
  musicOn?: boolean;
  sfxOn?: boolean;
  onToggleMusic?: () => void;
  onToggleSfx?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="hud-fm-setmenu"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {onToggleMusic && (
        <button type="button" className="hud-fm-smitem" onClick={onToggleMusic}>
          <span className="hud-fm-smi">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </span>
          <span className="hud-fm-sml">{t('sound.music')}</span>
          <span className={'hud-fm-sms' + (musicOn ? '' : ' hud-off')}>
            {musicOn ? t('sound.on') : t('sound.off')}
          </span>
        </button>
      )}
      {onToggleSfx && (
        <button type="button" className="hud-fm-smitem" onClick={onToggleSfx}>
          <span className="hud-fm-smi">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </span>
          <span className="hud-fm-sml">{t('sound.sfx')}</span>
          <span className={'hud-fm-sms' + (sfxOn ? '' : ' hud-off')}>
            {sfxOn ? t('sound.on') : t('sound.off')}
          </span>
        </button>
      )}
      <button type="button" className="hud-fm-smitem" onClick={onHowToPlay}>
        <span className="hud-fm-smi">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
        <span className="hud-fm-sml">{t('sound.how')}</span>
      </button>
      <LanguagePicker />
    </div>
  );
}
