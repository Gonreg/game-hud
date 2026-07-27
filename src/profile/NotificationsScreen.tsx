import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useHudAdapter, useHudConfig } from '../context/HudProvider';
import { useHudResource } from '../context/useHudResource';
import { Skeleton } from '../primitives/Skeleton';
import type { NotificationPrefs } from '../adapter/types';

const KEYS: Array<keyof NotificationPrefs> = [
  'deposit_credited',
  'withdraw_confirmed',
  'withdraw_failed',
  'cashback_credited',
  'bonus_expiring',
  'referral_joined',
  'referral_earned',
  'referral_big_win',
  'big_win_self',
  'comeback_7d',
  'inactive_48h',
];

/** Настоящий checkbox поверх визуального свитча из fatman: даёт нативную
 *  доступность (роль, checked, клавиатура) без изменения вида — сам свитч
 *  рисует соседний span той же разметкой/классами, что и в fatman. */
const HIDDEN_INPUT_STYLE: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export function NotificationsScreen() {
  const { t } = useTranslation();
  const adapter = useHudAdapter();
  const { botUsername } = useHudConfig();
  const { data, loading, error } = useHudResource('prefs', (a) => a.getNotificationPrefs());
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    if (data) setPrefs(data);
  }, [data]);

  async function setAll(value: boolean) {
    if (!prefs) return;
    const next = Object.fromEntries(KEYS.map((k) => [k, value])) as unknown as NotificationPrefs;
    const prev = prefs;
    setPrefs(next);
    try {
      await adapter.putNotificationPrefs(next);
    } catch {
      setPrefs(prev);
    }
  }

  async function toggle(k: keyof NotificationPrefs) {
    if (!prefs) return;
    const prev = prefs;
    const updated = { ...prefs, [k]: !prefs[k] };
    setPrefs(updated);
    try {
      await adapter.putNotificationPrefs({ [k]: updated[k] } as Partial<NotificationPrefs>);
    } catch {
      setPrefs(prev);
    }
  }

  const allOn = useMemo(() => (prefs ? KEYS.every((k) => prefs[k]) : false), [prefs]);

  const openBot = () => {
    const url = `https://t.me/${botUsername}`;
    const tg = window.Telegram?.WebApp;
    if (tg?.openTelegramLink) tg.openTelegramLink(url);
    else window.open(url, '_blank');
  };

  if (error) return <div className="hud-profile-error">{error}</div>;
  if (loading || !prefs) return <Skeleton rows={4} />;

  return (
    <div className="hud-profile-section">
      <label className="hud-profile-toggle" style={{ fontWeight: 600 }}>
        <span>{t('notifications.master')}</span>
        <input
          type="checkbox"
          checked={allOn}
          onChange={() => void setAll(!allOn)}
          style={HIDDEN_INPUT_STYLE}
        />
        <span className={`hud-profile-toggle__switch ${allOn ? 'hud-on' : ''}`} />
      </label>
      <div>
        {KEYS.map((k) => (
          <label key={k} className="hud-profile-toggle">
            <span>{t(`notifications.${k}`)}</span>
            <input
              type="checkbox"
              checked={prefs[k]}
              onChange={() => void toggle(k)}
              style={HIDDEN_INPUT_STYLE}
            />
            <span className={`hud-profile-toggle__switch ${prefs[k] ? 'hud-on' : ''}`} />
          </label>
        ))}
      </div>
      <div className="hud-profile-empty" style={{ padding: '16px 4px', textAlign: 'left' }}>
        {t('notifications.footer_pre')}{' '}
        <button type="button" className="hud-notif-bot-link" onClick={openBot}>
          @{botUsername}
        </button>
      </div>
    </div>
  );
}
