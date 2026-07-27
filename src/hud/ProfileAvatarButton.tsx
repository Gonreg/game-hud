import { useHudStore } from '../store/hudStore';

/**
 * Аватар из Telegram initData; при отсутствии фото — силуэт-заглушка
 * (M/game/TopBar.tsx:55-58), а не текстовые инициалы, как у fatman.
 */
export function ProfileAvatarButton() {
  const openProfile = useHudStore((s) => s.openProfile);
  const photo = window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url;
  return (
    <button
      type="button"
      className="hud-profile-avatar-chip"
      onClick={openProfile}
      aria-label="Profile"
      style={photo ? { backgroundImage: `url(${photo})` } : undefined}
    >
      {!photo && (
        <svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20a8 8 0 0 1 16 0" />
        </svg>
      )}
    </button>
  );
}
