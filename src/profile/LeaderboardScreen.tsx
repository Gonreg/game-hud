import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHudConfig } from '../context/HudProvider';
import { useHudResource } from '../context/useHudResource';
import { fmtAmount } from '../format/money';
import type { LeaderboardEntry, LeaderboardMode, LeaderboardWindow } from '../adapter/types';

const MODES: LeaderboardMode[] = ['profit', 'multiplier', 'turnover', 'loss'];
const WINDOWS: LeaderboardWindow[] = ['1d', '3d', '7d', '14d', '30d', 'all'];

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function displayName(e: LeaderboardEntry, idLabel: string): string {
  return e.name || (e.username ? `@${e.username}` : `${idLabel} ${e.userId.slice(-4)}`);
}

function valueFor(e: LeaderboardEntry, mode: LeaderboardMode, currency: string): string {
  if (mode === 'multiplier') return `${e.bestMultiplier.toFixed(2)}×`;
  if (mode === 'turnover') return `${fmtAmount(e.turnover)} ${currency}`;
  if (mode === 'loss') return `-${fmtAmount(e.loss)} ${currency}`;
  const sign = e.profit >= 0 ? '+' : '';
  return `${sign}${fmtAmount(e.profit)} ${currency}`;
}

/** #ffd35a, #c8cce0, #ff7a59 переехали в классы темы (hud-lb-value--*); два
 *  оставшихся цвета (нейтральный «нет убытка» и «профит в плюсе») в теме не
 *  заведены, остаются инлайном — как и в fatman. */
function valueClassName(e: LeaderboardEntry, mode: LeaderboardMode): string | undefined {
  if (mode === 'multiplier') return 'hud-lb-value--mult';
  if (mode === 'turnover') return 'hud-lb-value--turnover';
  if (mode === 'loss') return e.loss > 0 ? 'hud-lb-value--loss' : undefined;
  return e.profit < 0 ? 'hud-lb-value--loss' : undefined;
}

function valueColor(e: LeaderboardEntry, mode: LeaderboardMode): string | undefined {
  if (mode === 'multiplier' || mode === 'turnover') return undefined;
  if (mode === 'loss') return e.loss > 0 ? undefined : '#9aa3c4';
  return e.profit >= 0 ? '#2dd4bf' : undefined;
}

export function LeaderboardScreen() {
  const { t } = useTranslation();
  const currency = useHudConfig().currency;
  const [mode, setMode] = useState<LeaderboardMode>('profit');
  const [win, setWin] = useState<LeaderboardWindow>('7d');
  const { data, loading, error } = useHudResource(`lb:${mode}:${win}`, (a) =>
    a.getLeaderboard(mode, win),
  );
  const referrals = useHudResource('referrals', (a) => a.getReferrals());
  const hasReferrals = (referrals.data?.invitedCount ?? 0) > 0;

  return (
    <div className="hud-profile-section">
      <div className="hud-profile-card">
        <div className="hud-profile-card__row">
          <label className="hud-profile-select">
            <span className="hud-profile-select__label">{t('leaderboard.mode_label')}</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as LeaderboardMode)}>
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {t(`leaderboard.mode_${m}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="hud-profile-select">
            <span className="hud-profile-select__label">{t('leaderboard.window_label')}</span>
            <select value={win} onChange={(e) => setWin(e.target.value as LeaderboardWindow)}>
              {WINDOWS.map((w) => (
                <option key={w} value={w}>
                  {t(`leaderboard.window_${w}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && <div className="hud-profile-empty">{error}</div>}
      {loading && !data && <div className="hud-profile-empty">{t('common.loading')}</div>}

      {data && data.top.length === 0 && (
        <div className="hud-profile-empty">{t('leaderboard.empty')}</div>
      )}

      {data && data.top.length > 0 && (
        <div className="hud-profile-list">
          {data.top.map((e) => {
            const isMe = data.me?.userId === e.userId;
            const classes = [
              'hud-profile-list__row',
              isMe ? 'hud-profile-list__row--me' : '',
              isMe && hasReferrals ? 'hud-profile-list__row--me-referred' : '',
              e.isFriend && !isMe ? 'hud-profile-list__row--friend' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <div key={e.userId} className={classes} style={{ cursor: 'default' }}>
                <span className="hud-profile-list__icon" style={{ fontSize: 16 }}>
                  {MEDAL[e.rank] ?? `#${e.rank}`}
                </span>
                <div className="hud-profile-list__label">
                  <div>
                    {displayName(e, t('common.id'))}
                    {isMe ? ` · ${t('common.you')}` : ''}
                  </div>
                  <div className="hud-profile-hub__sub">
                    {t('leaderboard.rounds_count', { count: e.rounds })}
                  </div>
                </div>
                <div
                  className={['hud-profile-list__hint', valueClassName(e, mode)]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ color: valueColor(e, mode), fontWeight: 600 }}
                >
                  {valueFor(e, mode, currency)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data?.me && data.me.rank > 100 && (
        <div className="hud-profile-card">
          <div className="hud-profile-card__label">{t('leaderboard.your_place')}</div>
          <div className="hud-profile-list__row" style={{ cursor: 'default', padding: '8px 0' }}>
            <span className="hud-profile-list__icon">#{data.me.rank}</span>
            <div className="hud-profile-list__label">
              <div>{displayName(data.me, t('common.id'))}</div>
              <div className="hud-profile-hub__sub">
                {t('leaderboard.rounds_count', { count: data.me.rounds })}
              </div>
            </div>
            <div
              className={['hud-profile-list__hint', valueClassName(data.me, mode)]
                .filter(Boolean)
                .join(' ')}
              style={{ color: valueColor(data.me, mode), fontWeight: 600 }}
            >
              {valueFor(data.me, mode, currency)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
