import { useTranslation } from 'react-i18next';
import { useHudResource } from '../context/useHudResource';
import { fmtAmount } from '../format/money';
import { Skeleton } from '../primitives/Skeleton';
import { IconBall, IconX } from '../primitives/icons';

/**
 * Дата раунда есть не у всех бэков (см. `GameRound.createdAt`), а пустая или
 * мусорная строка дала бы `new Date(...).toLocaleString()` === «Invalid Date».
 * Рисуем дату только когда она есть и действительно разбирается.
 */
function formatWhen(raw: string | undefined, locale: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString(locale);
}

/**
 * История сыгранных раундов — альтернатива гроссбуху (`HistoryScreen`) для игр
 * вроде matreshka, у которых нет эндпоинта проводок. `ProfileShell` выбирает
 * между экранами по тому, какой метод адаптера реализован.
 */
export function GameHistoryScreen() {
  const { t, i18n } = useTranslation();
  const { data, loading, error } = useHudResource('gameHistory', (a) => a.getGameHistory!(24));
  const locale = i18n.language || 'en';

  if (loading) return <Skeleton rows={4} />;
  if (error) return <div className="hud-profile-error">{error}</div>;
  if (!data || data.length === 0) return <div className="hud-profile-empty">{t('history.empty')}</div>;

  return (
    <div className="hud-profile-list">
      {data.map((r) => {
        const net = r.payout - r.bet;
        const win = net > 0;
        const statusLabel = t(`history.status.${r.status}`, { defaultValue: r.status });
        const when = formatWhen(r.createdAt, locale);
        return (
          <div className="hud-profile-list__row" style={{ cursor: 'default' }} key={r.id}>
            <span className="hud-profile-list__icon">{win ? <IconBall /> : <IconX />}</span>
            <div className="hud-profile-list__label">
              <div>
                {statusLabel} · {r.coef.toFixed(2)}×
              </div>
              {when && <div className="hud-profile-hub__sub">{when}</div>}
            </div>
            <div
              className="hud-profile-list__hint"
              style={{ color: net > 0 ? '#2dd4bf' : net < 0 ? '#ff7a59' : undefined, fontWeight: 600 }}
            >
              {net > 0 ? '+' : ''}
              {fmtAmount(net)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
