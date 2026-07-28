/**
 * Заглушка `./tonconnectHooks` для самодостаточного standalone-бандла.
 *
 * Подключается вместо реального файла через `resolve.alias` в
 * `vite.standalone.config.ts`, поэтому `@tonconnect/ui-react` не попадает в
 * граф зависимостей бандла вовсе. Это безопасно: standalone-бандл (см.
 * `src/standalone.ts`) всегда передаёт в `HudProvider` мост `HudWallet`
 * (у scratch-game свой ванильный TonConnect), а `useHudWallet` при наличии
 * моста берёт ветку с ним — значения, которые возвращают эти хуки, нигде не
 * используются. Вызываются они лишь потому, что правила хуков не допускают
 * условного вызова (см. комментарий в `useHudWallet.ts`).
 */
export function TonConnectButton(): null {
  return null;
}

export function useTonAddress(): string {
  return '';
}

export function useTonConnectUI(): [
  { openModal: () => Promise<void>; sendTransaction: (args: unknown) => Promise<void> },
  () => void,
] {
  return [
    {
      openModal: async () => {},
      sendTransaction: async () => {},
    },
    () => {},
  ];
}
