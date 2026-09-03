import type { ComponentType, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useHudAdapter } from '../context/HudProvider';
import { useHudStore, type HudScreen } from '../store/hudStore';
import { useHudResource } from '../context/useHudResource';
import { useHudWallet } from '../wallet/useHudWallet';
import { fmtAmount } from '../format/money';
import {
  IconBell,
  IconChart,
  IconChevron,
  IconGlobe,
  IconHelp,
  IconHistory,
  IconTrophy,
  IconUsers,
  IconWallet,
} from '../primitives/icons';

interface RowDef {
  id: HudScreen;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  hint?: string;
  accent?: boolean;
}

export function ProfileHub() {
  const { t } = useTranslation();
  const adapter = useHudAdapter();
  const setScreen = useHudStore((s) => s.setScreen);
  const { data: me } = useHudResource('me', (a) => a.getMe());
  // Кошелёк подключается на клиенте через TonConnect (или мост игры) и на
  // бэке не хранится (me.walletAddress всегда пуст) — читаем живой адрес,
  // как это делает WalletScreen.
  const walletAddress = useHudWallet().address;
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const photo = tgUser?.photo_url;
  const name = me?.displayName || tgUser?.first_name || '?';
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Пункт «История» рендерится, только если бэк реализует хотя бы один из двух
  // методов истории — у matreshka нет getTransactions, у гроссбучных игр нет
  // getGameHistory, а если нет обоих, самому экрану неоткуда взять данные.
  const hasHistory =
    typeof adapter.getTransactions === 'function' || typeof adapter.getGameHistory === 'function';

  const rows: RowDef[] = [
    {
      id: 'wallet',
      Icon: IconWallet,
      label: t('profile.menu_wallet'),
      hint: walletAddress ? t('profile.wallet_connected') : t('profile.wallet_not_connected'),
    },
    ...(hasHistory
      ? [{ id: 'history' as const, Icon: IconHistory, label: t('profile.menu_history') }]
      : []),
    {
      id: 'referrals',
      Icon: IconUsers,
      label: t('profile.menu_referrals'),
      hint: t('profile.menu_referrals_hint'),
      accent: true,
    },
    { id: 'stats', Icon: IconChart, label: t('profile.menu_stats') },
    { id: 'leaderboard', Icon: IconTrophy, label: t('profile.menu_leaderboard') },
    { id: 'notifications', Icon: IconBell, label: t('profile.menu_notifications') },
    { id: 'language', Icon: IconGlobe, label: t('profile.menu_language') },
    { id: 'help', Icon: IconHelp, label: t('profile.menu_help') },
  ];

  return (
    <>
      <div className="hud-profile-hub__head">
        <div
          className="hud-profile-hub__avatar"
          style={photo ? { backgroundImage: `url(${photo})` } : undefined}
        >
          {!photo && initials}
        </div>
        <div>
          <div className="hud-profile-hub__name">
            {me?.displayName ?? tgUser?.first_name ?? '...'}
          </div>
          <div className="hud-profile-hub__sub">
            {me?.handle ? `@${me.handle} · ` : ''}ID {me?.displayId ?? '—'}
          </div>
        </div>
      </div>
      <div className="hud-profile-hub__balances">
        <div
          className="hud-profile-hub__bal-clickable"
          role="button"
          tabIndex={0}
          data-track="profile_balance"
          onClick={() => setScreen('wallet')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setScreen('wallet');
          }}
        >
          <div className="hud-profile-hub__bal-label">{t('profile.balance_main')}</div>
          <div className="hud-profile-hub__bal-value hud-profile-hub__bal-main">
            {fmtAmount(me?.balance)}
          </div>
        </div>
        <div>
          <div className="hud-profile-hub__bal-label">{t('profile.balance_bonus')}</div>
          <div className="hud-profile-hub__bal-value">{fmtAmount(me?.bonusBalance)}</div>
        </div>
        <div>
          <div className="hud-profile-hub__bal-label">{t('profile.balance_ref')}</div>
          <div className="hud-profile-hub__bal-value hud-profile-hub__bal-ref">
            {fmtAmount(me?.refBalance)}
          </div>
        </div>
      </div>
      <div className="hud-profile-hub__quick-actions">
        <button
          type="button"
          className="hud-profile-btn hud-profile-btn--primary"
          data-track="quick_deposit"
          onClick={() => useHudStore.getState().openWalletWithFocus('deposit')}
        >
          {t('profile.quick_deposit')}
        </button>
        <button
          type="button"
          className="hud-profile-btn hud-profile-btn--primary"
          data-track="quick_withdraw"
          onClick={() => useHudStore.getState().openWalletWithFocus('withdraw')}
        >
          {t('profile.quick_withdraw')}
        </button>
      </div>
      <div className="hud-profile-list">
        {rows.map(({ id, Icon, label, hint, accent }) => (
          <button
            key={id}
            type="button"
            className={`hud-profile-list__row${accent ? ' hud-profile-list__row--accent' : ''}`}
            onClick={() => setScreen(id)}
            data-track={`menu_${id}`}
          >
            <span
              className={`hud-profile-list__icon${accent ? ' hud-profile-list__icon--accent' : ''}`}
            >
              <Icon />
            </span>
            <span
              className={`hud-profile-list__label${accent ? ' hud-profile-list__label--accent' : ''}`}
            >
              {label}
            </span>
            {hint && <span className="hud-profile-list__hint">{hint}</span>}
            <span className="hud-profile-list__chev">
              <IconChevron />
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
