import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHudStore, type HudScreen } from '../store/hudStore';
import { ProfileHub } from './ProfileHub';
import { LegalFooter } from './LegalFooter';
import { IconArrowLeft, IconClose } from '../primitives/icons';

const TITLE_KEYS: Record<HudScreen, string> = {
  hub: 'profile.title',
  wallet: 'wallet.title',
  history: 'history.title',
  referrals: 'referrals.title',
  stats: 'stats.title',
  leaderboard: 'leaderboard.title',
  notifications: 'notifications.title',
  language: 'language.title',
  help: 'support.title',
  terms: 'support.terms',
  privacy: 'support.privacy',
  offer: 'support.offer',
};

const LEGAL_SCREENS = new Set<HudScreen>(['terms', 'privacy', 'offer']);

export function ProfileShell() {
  const { t } = useTranslation();
  const { open, screen, close, setScreen } = useHudStore();

  useEffect(() => {
    const bb = window.Telegram?.WebApp?.BackButton;
    if (!bb || !open) return undefined;
    bb.show();
    const handler = () => (screen === 'hub' ? close() : setScreen('hub'));
    bb.onClick(handler);
    return () => {
      bb.offClick(handler);
      bb.hide();
    };
  }, [open, screen, close, setScreen]);

  if (!open) return null;

  return (
    <div className="hud-profile-overlay">
      <header className="hud-profile-header">
        {screen === 'hub' ? (
          <button
            type="button"
            className="hud-profile-header__back"
            onClick={close}
            aria-label={t('common.close')}
          >
            <IconClose />
          </button>
        ) : (
          <button
            type="button"
            className="hud-profile-header__back"
            onClick={() => setScreen('hub')}
            aria-label={t('common.back')}
          >
            <IconArrowLeft />
          </button>
        )}
        <div className="hud-profile-header__title">{t(TITLE_KEYS[screen])}</div>
        <div className="hud-profile-header__spacer" />
      </header>
      <div className="hud-profile-body">
        <div className="hud-profile-screen" key={screen}>
          {screen === 'hub' && <ProfileHub />}
          {screen === 'wallet' && null /* TODO: Task 12 */}
          {screen === 'history' && null /* TODO: Task 13 */}
          {screen === 'referrals' && null /* TODO: Task 14 */}
          {screen === 'stats' && null /* TODO: Task 15 */}
          {screen === 'leaderboard' && null /* TODO: Task 16 */}
          {screen === 'notifications' && null /* TODO: Task 17 */}
          {screen === 'language' && null /* TODO: Task 18 */}
          {screen === 'help' && null /* TODO: Task 18 */}
          {screen === 'terms' && null /* TODO: Task 18 */}
          {screen === 'privacy' && null /* TODO: Task 18 */}
          {screen === 'offer' && null /* TODO: Task 18 */}
          {!LEGAL_SCREENS.has(screen) && <LegalFooter />}
        </div>
      </div>
    </div>
  );
}
