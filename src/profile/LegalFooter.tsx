import { useTranslation } from 'react-i18next';
import { useHudStore } from '../store/hudStore';

export function LegalFooter() {
  const { t } = useTranslation();
  const setScreen = useHudStore((s) => s.setScreen);
  return (
    <nav className="hud-legal-footer" aria-label="Legal documents">
      <button type="button" onClick={() => setScreen('terms')}>
        {t('support.terms')}
      </button>
      <button type="button" onClick={() => setScreen('offer')}>
        {t('support.offer')}
      </button>
      <button type="button" onClick={() => setScreen('privacy')}>
        {t('support.privacy')}
      </button>
    </nav>
  );
}
