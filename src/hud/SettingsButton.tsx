import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsMenu } from './SettingsMenu';

/**
 * Шестерёнка с выпадающим меню (M/game/TopBar.tsx:36-43, 62-76). Закрывается
 * по pointerdown вне контейнера и после выбора пункта меню.
 */
export function SettingsButton({ onHowToPlay }: { onHowToPlay: () => void }) {
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
    <div className="hud-setwrap" ref={wrapRef}>
      <button
        type="button"
        className="hud-rules"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={t('common.settings', 'Settings')}
        aria-expanded={menuOpen}
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
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 10 4.6V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      {menuOpen && (
        <SettingsMenu
          onHowToPlay={() => {
            setMenuOpen(false);
            onHowToPlay();
          }}
        />
      )}
    </div>
  );
}
