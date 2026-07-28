import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { HudProvider } from '../context/HudProvider';
import { useHudWallet } from './useHudWallet';
import { makeFakeAdapter, makeFakeWallet } from '../test/fakeAdapter';
import type { HudWallet } from '../adapter/types';

vi.mock('@tonconnect/ui-react', () => ({
  useTonAddress: () => 'EQTonConnectWallet',
  useTonConnectUI: () => [{ openModal: vi.fn(), sendTransaction: vi.fn() }],
  TonConnectButton: () => null,
}));

function wrapper(wallet?: HudWallet) {
  const adapter = makeFakeAdapter();
  return ({ children }: { children: ReactNode }) => (
    <HudProvider
      adapter={adapter}
      config={{ botUsername: 'test_bot', currency: 'GRAM', minBet: 0.1, maxBet: 100 }}
      wallet={wallet}
    >
      {children}
    </HudProvider>
  );
}

describe('useHudWallet', () => {
  it('без моста берёт адрес из TonConnect и показывает встроенную кнопку', () => {
    const { result } = renderHook(() => useHudWallet(), { wrapper: wrapper() });
    expect(result.current.address).toBe('EQTonConnectWallet');
    expect(result.current.showConnectButton).toBe(true);
  });

  it('с мостом адрес берётся из него, а не из TonConnect', () => {
    const bridge = makeFakeWallet('EQBridgeWallet');
    const { result } = renderHook(() => useHudWallet(), { wrapper: wrapper(bridge) });
    expect(result.current.address).toBe('EQBridgeWallet');
    expect(result.current.showConnectButton).toBe(false);
  });

  it('connect() с мостом вызывает bridge.connect(), а не TonConnect', async () => {
    const bridge = makeFakeWallet(null);
    const { result } = renderHook(() => useHudWallet(), { wrapper: wrapper(bridge) });
    await act(async () => {
      await result.current.connect();
    });
    expect(bridge.connect).toHaveBeenCalledTimes(1);
  });

  it('sendDeposit() с мостом вызывает bridge.sendDeposit с адресом, суммой и комментарием как есть', async () => {
    const bridge = makeFakeWallet('EQBridgeWallet');
    const { result } = renderHook(() => useHudWallet(), { wrapper: wrapper(bridge) });
    await act(async () => {
      await result.current.sendDeposit('EQDepositAddress', '1000000000', 'u1');
    });
    expect(bridge.sendDeposit).toHaveBeenCalledWith('EQDepositAddress', '1000000000', 'u1');
  });

  it('смена адреса через subscribe перерисовывает', () => {
    const bridge = makeFakeWallet(null);
    const { result } = renderHook(() => useHudWallet(), { wrapper: wrapper(bridge) });
    expect(result.current.address).toBeNull();

    act(() => {
      bridge.emitAddress('EQNewlyConnected');
    });
    expect(result.current.address).toBe('EQNewlyConnected');
  });

  it('отписка вызывается при размонтировании', () => {
    const bridge = makeFakeWallet('EQBridgeWallet');
    const { unmount } = renderHook(() => useHudWallet(), { wrapper: wrapper(bridge) });
    expect(bridge.unsubscribe).not.toHaveBeenCalled();
    unmount();
    expect(bridge.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
