import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { HudProvider } from './HudProvider';
import { useHudResource } from './useHudResource';
import { makeFakeAdapter, FAKE_LEADERBOARD } from '../test/fakeAdapter';
import type {
  HudAdapter,
  Leaderboard,
  LeaderboardMode,
  LeaderboardWindow,
} from '../adapter/types';

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

  it('переживает синхронный бросок в фетчере, а не роняет дерево', async () => {
    // Адаптер вправе проверить предусловие до сети и бросить синхронно —
    // именно так делает адаптер fatman, когда токена ещё нет. Раньше такое
    // исключение улетало мимо .catch() и размонтировало всё приложение.
    const adapter = makeFakeAdapter({
      getMe: (() => {
        throw new Error('not_authenticated');
      }) as never,
    });
    const { result } = renderHook(() => useHudResource('me', (a) => a.getMe()), {
      wrapper: wrapper(adapter),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('not_authenticated');
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

  // Этот тест — про гонку, и он единственный, который реально проверяет отмену.
  // Проверка «не пишет состояние после размонтирования» через spy на console.error
  // бесполезна: React 18 убрал предупреждение об обновлении размонтированного
  // компонента, поэтому такой тест проходит и со полностью снятой отменой.
  // А вот перетирание свежих данных поздним ответом — наблюдаемо.
  it('поздний ответ на устаревший ключ не перетирает свежие данные', async () => {
    let resolveSlow: (v: Leaderboard) => void = () => {};
    let calls = 0;
    const adapter = makeFakeAdapter({
      getLeaderboard: vi.fn((_mode: LeaderboardMode, win: LeaderboardWindow) => {
        calls += 1;
        // Первый запрос висит, второй отвечает сразу — так возникает гонка.
        if (calls === 1) {
          return new Promise<Leaderboard>((r) => {
            resolveSlow = r;
          });
        }
        return Promise.resolve({ ...FAKE_LEADERBOARD, window: win });
      }) as never,
    });

    const { result, rerender } = renderHook(
      ({ w }: { w: LeaderboardWindow }) =>
        useHudResource(`lb:${w}`, (a) => a.getLeaderboard('profit', w)),
      { wrapper: wrapper(adapter), initialProps: { w: '7d' as LeaderboardWindow } },
    );

    rerender({ w: '30d' as LeaderboardWindow });
    await waitFor(() => expect(result.current.data?.window).toBe('30d'));

    await act(async () => {
      resolveSlow({ ...FAKE_LEADERBOARD, window: '7d' });
    });

    expect(result.current.data?.window).toBe('30d');
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
