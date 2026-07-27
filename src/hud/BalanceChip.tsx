import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { fmtAmount } from '../format/money';
import { useHudStore } from '../store/hudStore';

/**
 * Баланс приходит пропсом, а не из адаптера: во время раунда игра гоняет его
 * через свой стор и анимирует одометр, и лишний запрос тут только мешал бы.
 */
export function BalanceChip({ balance, icon }: { balance: number | null; icon?: ReactNode }) {
  const { t } = useTranslation();
  const openWallet = useHudStore((s) => s.openWalletWithFocus);
  return (
    <button
      type="button"
      className="hud-balance-chip"
      onClick={() => openWallet('deposit')}
      aria-label={t('wallet.title')}
    >
      <span>{fmtAmount(balance)}</span>
      {icon}
    </button>
  );
}
