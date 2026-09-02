import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguagePicker } from './LanguagePicker';
import { Switch } from '../primitives/Switch';

/**
 * Копия F/components/SoundSettings.tsx: своя плавающая шестерёнка (левее
 * аватара) с выпадающим меню Music/SFX (+ подборщик треков) и «как играть».
 * Аудио-движка у библиотеки нет — состояние и переключение приходят пропсами,
 * звуком и списком треков управляет игра. Строки Music/SFX/Sound —
 * неймспейс `sound` словаря библиотеки (панель звука переехала в библиотеку
 * на Task 19, вместе с ней и подписи); названия треков и «как играть» —
 * пропсами, чтобы не терять фичи fatman (Task 25) и matreshka. Внизу меню —
 * общий для всех игр выбор языка, как и в меню обычной шестерёнки.
 */
export function SoundSettings({
  musicOn,
  sfxOn,
  onToggleMusic,
  onToggleSfx,
  tracks,
  currentTrack,
  onSelectTrack,
  onHowToPlay,
}: {
  musicOn: boolean;
  sfxOn: boolean;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  /** Названия треков приходят от игры: они у каждой свои. Без них блок скрыт. */
  tracks?: Array<{ id: string; label: string }>;
  currentTrack?: string;
  onSelectTrack?: (id: string) => void;
  onHowToPlay?: () => void;
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [menuOpen]);

  return (
    <div className="hud-fm-setwrap" ref={wrapRef}>
      <button
        type="button"
        className="hud-fm-gear"
        aria-label={t('sound.title')}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      {menuOpen && (
        <div
          className="hud-fm-setmenu"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="hud-fm-smitem"
            role="switch"
            aria-checked={musicOn}
            onClick={onToggleMusic}
          >
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
            <Switch checked={musicOn} />
          </button>
          {tracks && tracks.length > 0 && (
            <div className={'hud-fm-smtracks' + (musicOn ? '' : ' hud-off')}>
              {tracks.map((tk) => (
                <button
                  key={tk.id}
                  type="button"
                  className={'hud-fm-smtrack' + (tk.id === currentTrack && musicOn ? ' hud-on' : '')}
                  onClick={() => onSelectTrack?.(tk.id)}
                >
                  {tk.label}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="hud-fm-smitem"
            role="switch"
            aria-checked={sfxOn}
            onClick={onToggleSfx}
          >
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
            <Switch checked={sfxOn} />
          </button>
          {onHowToPlay && (
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
          )}
          <LanguagePicker />
        </div>
      )}
    </div>
  );
}
