import { useTranslation } from 'react-i18next';
import { useHudConfig } from '../context/HudProvider';
import { useHudResource } from '../context/useHudResource';
import { fmtAmount } from '../format/money';
import { Skeleton } from '../primitives/Skeleton';
import type { Percentiles } from '../adapter/types';

interface CardProps {
  label: string;
  value: string;
  percentile?: number | null;
  color: string;
  t: ReturnType<typeof useTranslation>['t'];
}

function Card({ label, value, percentile, color, t }: CardProps) {
  let pctText: string | null = null;
  if (percentile !== null && percentile !== undefined) {
    const pct = Math.round(percentile * 100);
    pctText =
      pct >= 50 ? t('stats.better_than', { pct }) : t('stats.worse_than', { pct: 100 - pct });
  }
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
        style={{ fontSize: 11, color: '#9aa3c4', textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: `rgb(${color})` }}>{value}</div>
      {pctText && <div style={{ fontSize: 11, color: '#9aa3c4' }}>{pctText}</div>}
    </div>
  );
}

export function StatsScreen() {
  const { t } = useTranslation();
  const currency = useHudConfig().currency;
  const { data, loading, error } = useHudResource('stats', (a) => a.getStats());
  const { data: pct } = useHudResource<Percentiles>('percentiles', (a) => a.getPercentiles());

  if (error) return <div className="hud-profile-error">{error}</div>;
  if (loading) return <Skeleton rows={4} />;
  if (!data) return null;
  if (data.roundsPlayed === 0) return <div className="hud-profile-empty">{t('stats.empty')}</div>;

  const profitColor = data.netProfit >= 0 ? '45, 212, 191' : '255, 122, 89';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        padding: '8px 24px 32px',
      }}
    >
      <Card
        t={t}
        label={t('stats.rounds_played')}
        value={String(data.roundsPlayed)}
        percentile={pct?.rounds}
        color="0, 168, 232"
      />
      <Card
        t={t}
        label={t('stats.best_mult')}
        value={`${data.bestMultiplier.toFixed(2)}×`}
        percentile={pct?.bestMult}
        color="255, 211, 90"
      />
      <Card
        t={t}
        label={t('stats.winrate')}
        value={`${data.winrate.toFixed(1)}%`}
        percentile={pct?.winrate}
        color="45, 212, 191"
      />
      <Card
        t={t}
        label={t('stats.net_profit')}
        value={`${data.netProfit >= 0 ? '+' : ''}${fmtAmount(data.netProfit)} ${currency}`}
        percentile={pct?.profit}
        color={profitColor}
      />
      <Card
        t={t}
        label={t('stats.best_streak')}
        value={String(data.bestStreak)}
        percentile={null}
        color="122, 91, 181"
      />
      <Card
        t={t}
        label={t('stats.avg_bet')}
        value={`${fmtAmount(data.avgBet)} ${currency}`}
        percentile={pct?.avgBet}
        color="200, 255, 90"
      />
      <Card
        t={t}
        label={t('stats.total_wagered')}
        value={`${fmtAmount(data.totalWagered)} ${currency}`}
        percentile={null}
        color="255, 211, 90"
      />
      <Card
        t={t}
        label={t('stats.total_won')}
        value={`${fmtAmount(data.totalWon)} ${currency}`}
        percentile={null}
        color="45, 212, 191"
      />
      <Card
        t={t}
        label={t('stats.biggest_win')}
        value={`+${fmtAmount(data.biggestWin)} ${currency}`}
        percentile={null}
        color="94, 231, 155"
      />
      <Card
        t={t}
        label={t('stats.biggest_loss')}
        value={`−${fmtAmount(data.biggestLoss)} ${currency}`}
        percentile={null}
        color="255, 58, 71"
      />
      <Card
        t={t}
        label={t('stats.today_bets')}
        value={String(data.todayBets)}
        percentile={null}
        color="0, 168, 232"
      />
      <Card
        t={t}
        label={t('stats.today_profit')}
        value={`${data.todayProfit >= 0 ? '+' : '−'}${fmtAmount(Math.abs(data.todayProfit))} ${currency}`}
        percentile={null}
        color={data.todayProfit >= 0 ? '45, 212, 191' : '255, 122, 89'}
      />
    </div>
  );
}
