import { useEffect, useState } from 'react';
import { useHudWalletBridge } from '../context/HudProvider';
import { useTonAddress, useTonConnectUI } from './tonconnectHooks';

export interface HudWalletApi {
  address: string | null;
  connect: () => Promise<void>;
  sendDeposit: (to: string, amountNano: string, comment: string) => Promise<void>;
  /** Показывать ли встроенную кнопку TonConnect. С мостом — нет: подключением
   *  занимается игра. */
  showConnectButton: boolean;
}

/** TonConnect ждёт комментарий как payload: 4 нулевых байта опкода перевода
 *  плюс текст, всё в base64. Так же кодировали и WalletScreen, и WalletSheet
 *  до переезда сюда. */
function commentPayload(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const out = new Uint8Array(4 + bytes.length);
  out.set(bytes, 4);
  let bin = '';
  for (const b of out) bin += String.fromCharCode(b);
  return btoa(bin);
}

/**
 * Единая точка доступа к кошельку для `WalletScreen` и `WalletSheet`.
 *
 * С мостом (`HudProvider` получил `wallet`) — все операции идут через него,
 * библиотека не трогает TonConnect. Без моста — как раньше, напрямую через
 * `@tonconnect/ui-react` (пять существующих игр).
 *
 * Хуки TonConnect (`useTonAddress`, `useTonConnectUI` из `./tonconnectHooks`)
 * вызываются безусловно — так требуют правила хуков. Ветвление живёт в
 * возвращаемых значениях, а не в наборе вызванных хуков.
 */
export function useHudWallet(): HudWalletApi {
  const bridge = useHudWalletBridge();
  const tonAddress = useTonAddress() || null;
  const [tonConnectUI] = useTonConnectUI();

  const [bridgeAddress, setBridgeAddress] = useState<string | null>(
    () => bridge?.getAddress() ?? null,
  );

  useEffect(() => {
    if (!bridge) return;
    setBridgeAddress(bridge.getAddress());
    return bridge.subscribe(setBridgeAddress);
  }, [bridge]);

  if (bridge) {
    return {
      address: bridgeAddress,
      connect: () => bridge.connect(),
      sendDeposit: (to, amountNano, comment) => bridge.sendDeposit(to, amountNano, comment),
      showConnectButton: false,
    };
  }

  return {
    address: tonAddress,
    connect: async () => {
      await tonConnectUI.openModal();
    },
    sendDeposit: async (to, amountNano, comment) => {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{ address: to, amount: amountNano, payload: commentPayload(comment) }],
      });
    },
    showConnectButton: true,
  };
}
