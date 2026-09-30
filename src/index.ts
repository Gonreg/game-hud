export { HudProvider, useHudAdapter, useHudConfig } from './context/HudProvider';
export { useHudResource, type HudResource } from './context/useHudResource';
export { useHudStore, type HudScreen } from './store/hudStore';
export { useTelegramSafeArea } from './theme/useTelegramSafeArea';
export { fmtAmount, type AmountOptions } from './format/money';

export { ProfileShell } from './profile/ProfileShell';
export { WalletSheet } from './wallet/WalletSheet';

export { TopBar } from './hud/TopBar';
export { BalanceChip } from './hud/BalanceChip';
export { ProfileAvatarButton } from './hud/ProfileAvatarButton';
export { SettingsButton } from './hud/SettingsButton';
export { SettingsMenu } from './hud/SettingsMenu';
export { SoundSettings } from './hud/SoundSettings';
// Выбор языка отдельным экспортом — игре со своим меню настроек (а не
// библиотечным SettingsMenu/SoundSettings) есть куда его поставить.
export { LanguagePicker } from './hud/LanguagePicker';

export { BetAmountInput } from './bet/BetAmountInput';
export {
  useBetAmount,
  betCeiling,
  clampBet,
  type BetAmount,
  type BetLimits,
} from './bet/useBetAmount';

// Бонусы (1.5.0): кнопка с объёмным подарком, шит «Бонусы» и промо-карусель
// кабинета. Шит и карусель уже смонтированы в ProfileShell/ProfileHub; игра
// ставит только кнопку. Всё молчит у бэка без getBonuses.
export { BonusButton } from './bonus/BonusButton';
export { BonusSheet } from './bonus/BonusSheet';
export { PromoCarousel } from './bonus/PromoCarousel';
export { GiftIcon3D } from './bonus/GiftIcon3D';

export { BottomSheet } from './primitives/BottomSheet';
export { InfoPopover } from './primitives/InfoPopover';
export { Skeleton } from './primitives/Skeleton';
export * from './primitives/icons';

export type * from './adapter/types';
