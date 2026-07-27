import type { ReactNode } from 'react';
import { BalanceChip } from './BalanceChip';
import { ProfileAvatarButton } from './ProfileAvatarButton';
import { SettingsButton } from './SettingsButton';

/**
 * Удобная сборка для игр, которым подходит раскладка «баланс слева, аватар и
 * шестерёнка справа». fatman расставляет элементы абсолютным позиционированием
 * и этот компонент не использует — поэтому части экспортируются отдельно.
 */
export function TopBar({
  balance,
  logo,
  balanceIcon,
  onHowToPlay,
}: {
  balance: number | null;
  logo?: ReactNode;
  balanceIcon?: ReactNode;
  onHowToPlay: () => void;
}) {
  return (
    <div className="hud-topbar">
      {logo}
      <BalanceChip balance={balance} icon={balanceIcon} />
      <div className="hud-user">
        <ProfileAvatarButton />
        <SettingsButton onHowToPlay={onHowToPlay} />
      </div>
    </div>
  );
}
