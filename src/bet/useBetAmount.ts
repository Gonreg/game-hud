import { useCallback, useMemo, useState } from 'react';

export interface BetLimits {
  min: number;
  max: number;
  /** null, пока баланс не загрузился — тогда потолком служит только max. */
  balance: number | null;
}

export interface BetAmount {
  amount: number;
  valid: boolean;
  ceiling: number;
  set: (v: number) => void;
  step: (dir: 1 | -1) => void;
  double: () => void;
  max: () => void;
}

/** Потолок ставки: меньшее из лимита и баланса; пока баланса нет — только лимит. */
export function betCeiling(max: number, balance: number | null): number {
  return balance == null ? max : Math.min(max, balance);
}

/**
 * Единственная реализация клампа суммы. Ею пользуются и хук, и управляемый
 * BetAmountInput — иначе правила разъедутся между двумя копиями.
 */
export function clampBet(v: number, min: number, ceiling: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.min(Math.max(v, min), Math.max(ceiling, min));
}

/**
 * Сумма ставки с клампом. Живёт в библиотеке, потому что во всех играх правила
 * одни: шаг равен минимальной ставке, потолок — минимум из max и баланса,
 * а NaN и переполнение не должны доезжать до игровой кнопки.
 */
export function useBetAmount(limits: BetLimits): BetAmount {
  const ceiling = useMemo(() => betCeiling(limits.max, limits.balance), [limits.max, limits.balance]);
  const clamp = useCallback((v: number) => clampBet(v, limits.min, ceiling), [limits.min, ceiling]);
  const [amount, setAmount] = useState(() => clamp(limits.min));

  const set = useCallback((v: number) => setAmount(clamp(v)), [clamp]);
  const step = useCallback(
    (dir: 1 | -1) => setAmount((cur) => clamp(cur + dir * limits.min)),
    [clamp, limits.min],
  );
  const double = useCallback(() => setAmount((cur) => clamp(cur * 2)), [clamp]);
  const max = useCallback(() => setAmount(clamp(ceiling)), [clamp, ceiling]);

  return {
    amount,
    ceiling,
    valid: ceiling >= limits.min && amount >= limits.min && amount <= ceiling,
    set,
    step,
    double,
    max,
  };
}
