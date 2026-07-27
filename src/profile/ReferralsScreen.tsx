import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useHudConfig } from '../context/HudProvider';
import { useHudResource } from '../context/useHudResource';
import { useHudStore } from '../store/hudStore';
import { fmtAmount } from '../format/money';
import { Skeleton } from '../primitives/Skeleton';

export function ReferralsScreen() {
  const { t, i18n } = useTranslation();
  const currency = useHudConfig().currency;
  const openHelpWithTheme = useHudStore((s) => s.openHelpWithTheme);
  const { data, loading, error } = useHudResource('referrals', (a) => a.getReferrals());
  const [msg, setMsg] = useState<string | null>(null);
  const link = data?.refLink;

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setMsg(t('common.copied'));
      setTimeout(() => setMsg(null), 1500);
    } catch {
      setMsg(t('common.copy_failed'));
    }
  }

  function shareViaTg() {
    if (!link) return;
    const tg = window.Telegram?.WebApp;
    const text = encodeURIComponent(t('referrals.share_text'));
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`;
    if (tg?.openTelegramLink) tg.openTelegramLink(url);
    else window.open(url, '_blank');
  }

  if (loading) return <Skeleton rows={4} />;
  if (error) return <div className="hud-profile-error">{error}</div>;

  const ratePercent = data?.ratePercent ?? 10;

  return (
    <div className="hud-profile-section">
      <div className="hud-profile-card">
        <div className="hud-profile-card__label">{t('referrals.your_link')}</div>
        <div className="hud-profile-card__value">{link ?? '...'}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            type="button"
            className="hud-profile-btn hud-profile-btn--primary"
            style={{ flex: 1, marginBottom: 0 }}
            data-track="ref_copy"
            onClick={() => void copyLink()}
          >
            {t('common.copy')}
          </button>
          <button
            type="button"
            className="hud-profile-btn"
            style={{ flex: 1, marginBottom: 0 }}
            data-track="ref_share"
            onClick={shareViaTg}
          >
            {t('common.share')}
          </button>
        </div>
        {msg && (
          <div className="hud-profile-hub__sub" style={{ marginTop: 6 }}>
            {msg}
          </div>
        )}
        <div className="hud-profile-hub__sub" style={{ marginTop: 12, lineHeight: 1.45 }}>
          {t('referrals.how_it_works', { percent: ratePercent })}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        <StatTile
          label={t('referrals.invited')}
          value={String(data?.invitedCount ?? 0)}
          color="0, 168, 232"
        />
        <StatTile
          label={t('referrals.ref_balance')}
          value={`${fmtAmount(data?.refBalance)} ${currency}`}
          color="255, 211, 90"
        />
        <StatTile
          label={t('referrals.earned')}
          value={
            <>
              {fmtAmount(data?.totalEarned)} <span>{currency}</span>
            </>
          }
          color="45, 212, 191"
        />
        <StatTile
          label={t('referrals.rate_label')}
          value={t('referrals.rate_value', { percent: ratePercent })}
          color="200, 255, 90"
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="hud-profile-card__label" style={{ marginBottom: 12 }}>
          {t('referrals.invitees_title')}
        </div>
        {data?.invitees.length ? (
          <div className="hud-profile-list">
            {data.invitees.map((r) => (
              <div key={r.id} className="hud-profile-list__row" style={{ cursor: 'default' }}>
                <span className="hud-profile-list__icon">👤</span>
                <div className="hud-profile-list__label">
                  <div>
                    <span>{r.firstName ?? t('common.no_name')}</span>
                    {r.username && <span> · @{r.username}</span>}
                  </div>
                  <div className="hud-profile-hub__sub">
                    {new Date(r.joinedAt).toLocaleDateString(i18n.language || 'en')}
                  </div>
                </div>
                <span
                  className="hud-profile-list__hint"
                  style={{ color: r.earnedFromThem > 0 ? '#2dd4bf' : undefined }}
                >
                  +{fmtAmount(r.earnedFromThem)} {currency}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="hud-profile-empty" style={{ padding: '12px 4px', textAlign: 'left' }}>
            {t('referrals.invitees_empty')}
          </div>
        )}
      </div>

      <div className="hud-profile-card" style={{ marginTop: 10 }}>
        <div className="hud-profile-hub__sub" style={{ lineHeight: 1.45, marginBottom: 12 }}>
          {t('referrals.agency_cta_text')}
        </div>
        <button
          type="button"
          className="hud-profile-btn hud-profile-btn--primary"
          style={{ marginBottom: 0 }}
          data-track="ref_agency_request"
          onClick={() => openHelpWithTheme('partner')}
        >
          {t('referrals.agency_cta_btn')}
        </button>
      </div>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: ReactNode; color: string }) {
  return (
    <div
      style={{
        background: `rgba(${color}, 0.08)`,
        borderRadius: 14,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: '#9aa3c4',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: `rgb(${color})` }}>{value}</div>
    </div>
  );
}
