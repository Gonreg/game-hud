import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { fmtAmount } from '../format/money';
import { betCeiling, clampBet } from './useBetAmount';

const PRESETS = [0.1, 0.5, 1, 5];

/**
 * Управляемый ввод суммы: значение и коллбэк приходят снаружи, потому что
 * ставку игра держит в своём сторе и валидирует по фазе раунда. Игровую CTA
 * («Поставить», «Забрать») рисует игра — механики у всех разные.
 */
export function BetAmountInput({
  value,
  onChange,
  min,
  max,
  balance,
  icon,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  balance: number | null;
  icon?: ReactNode;
}) {
  const { t } = useTranslation();
  const ceiling = betCeiling(max, balance);
  const emit = (v: number) => onChange(clampBet(v, min, ceiling));

  return (
    <div className="hud-bet-row">
      <div className="hud-bet-stepper">
        <button type="button" className="hud-bet-step" aria-label="−" onClick={() => emit(value - min)}>
          −
        </button>
        <span className="hud-bet-value">
          {fmtAmount(value)}
          {icon}
        </span>
        <button type="button" className="hud-bet-step" aria-label="+" onClick={() => emit(value + min)}>
          +
        </button>
      </div>
      <div className="hud-bet-presets">
        {PRESETS.map((p) => (
          <button key={p} type="button" className="hud-bet-chip" onClick={() => emit(p)}>
            {p}
          </button>
        ))}
        <button type="button" className="hud-bet-chip" onClick={() => emit(value * 2)}>
          ×2
        </button>
        <button type="button" className="hud-bet-chip" onClick={() => emit(ceiling)}>
          {t('common.max', 'MAX')}
        </button>
      </div>
    </div>
  );
}
