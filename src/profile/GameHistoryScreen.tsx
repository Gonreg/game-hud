import { useTranslation } from 'react-i18next';
import { useHudConfig } from '../context/HudProvider';
import { useHudResource } from '../context/useHudResource';
import { formatWhen } from '../format/datetime';
import { exactSign, fmtAmount, subExact } from '../format/money';
import { Skeleton } from '../primitives/Skeleton';
import { IconBall, IconX } from '../primitives/icons';

/**
 * История сыгранных раундов — альтернатива гроссбуху (`HistoryScreen`) для игр
 * вроде matreshka, у которых нет эндпоинта проводок. `ProfileShell` выбирает
 * между экранами по тому, какой метод адаптера реализован.
 */
export function GameHistoryScreen() {
  const { t, i18n } = useTranslation();
  const { scale } = useHudConfig();
  const { data, loading, error } = useHudResource('gameHistory', (a) => a.getGameHistory!(24));
  const locale = i18n.language || 'en';

  if (loading) return <Skeleton rows={4} />;
  if (error) return <div className="hud-profile-error">{error}</div>;
  if (!data || data.length === 0) return <div className="hud-profile-empty">{t('history.empty')}</div>;

  return (
    <div className="hud-profile-list">
      {data.map((r) => {
        const net = r.payout - r.bet;
        // Единственная арифметика над деньгами в кабинете. В double она врёт
        // при scale > 9: ставка и выплата по ~1 ETH, разные на пару wei,
        // вычитаются в ноль или в погрешность, и выигрыш рисуется проигрышем.
        // Поэтому при обеих точных строках и сумма, и её знак — из bigint.
        const netStr = subExact(r.payoutStr, r.betStr);
        const sign = netStr != null ? exactSign(netStr) : Math.sign(net);
        const win = sign > 0;
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
              style={{ color: sign > 0 ? '#2dd4bf' : sign < 0 ? '#ff7a59' : undefined, fontWeight: 600 }}
            >
              {sign > 0 ? '+' : ''}
              {fmtAmount(net, { exact: netStr, scale })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
