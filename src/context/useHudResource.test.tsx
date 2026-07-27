import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { HudProvider } from './HudProvider';
import { useHudResource } from './useHudResource';
import { makeFakeAdapter } from '../test/fakeAdapter';
import type { HudAdapter } from '../adapter/types';

function wrapper(adapter: HudAdapter) {
  return ({ children }: { children: ReactNode }) => (
    <HudProvider
      adapter={adapter}
      config={{ botUsername: 'test_bot', currency: 'GRAM', minBet: 0.1, maxBet: 100 }}
    >
      {children}
    </HudProvider>
  );
}

describe('useHudResource', () => {
  it('отдаёт loading, потом данные', async () => {
    const adapter = makeFakeAdapter();
    const { result } = renderHook(() => useHudResource('me', (a) => a.getMe()), {
      wrapper: wrapper(adapter),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.balance).toBe(12.5);
    expect(result.current.error).toBeNull();
  });

  it('кладёт текст ошибки в error и снимает loading', async () => {
    const adapter = makeFakeAdapter({
      getMe: vi.fn(async () => {
        throw new Error('boom');
      }) as never,
    });
    const { result } = renderHook(() => useHudResource('me', (a) => a.getMe()), {
      wrapper: wrapper(adapter),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
    expect(result.current.data).toBeNull();
  });

  it('reload перезапрашивает', async () => {
    const adapter = makeFakeAdapter();
    const { result } = renderHook(() => useHudResource('me', (a) => a.getMe()), {
      wrapper: wrapper(adapter),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(adapter.getMe).toHaveBeenCalledTimes(1);

    act(() => result.current.reload());
    await waitFor(() => expect(adapter.getMe).toHaveBeenCalledTimes(2));
  });

  it('не пишет состояние после размонтирования', async () => {
    let resolve: (v: unknown) => void = () => {};
    const adapter = makeFakeAdapter({
      getMe: vi.fn(
        () =>
          new Promise((r) => {
            resolve = r;
          }),
      ) as never,
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = renderHook(() => useHudResource('me', (a) => a.getMe()), {
      wrapper: wrapper(adapter),
    });
    unmount();
    await act(async () => {
      resolve({ balance: 1 });
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('перезапрашивает при смене ключа', async () => {
    const adapter = makeFakeAdapter();
    const { result, rerender } = renderHook(
      ({ w }: { w: string }) =>
        useHudResource(`lb:${w}`, (a) => a.getLeaderboard('profit', w as '7d')),
      { wrapper: wrapper(adapter), initialProps: { w: '7d' } },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(adapter.getLeaderboard).toHaveBeenCalledTimes(1);

    rerender({ w: '30d' });
    await waitFor(() => expect(adapter.getLeaderboard).toHaveBeenCalledTimes(2));
  });
});
