import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LeaderboardScreen } from './LeaderboardScreen';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter, makeFailingAdapter, FAKE_LEADERBOARD } from '../test/fakeAdapter';

describe('LeaderboardScreen', () => {
  it('грузит profit / 7d по умолчанию', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<LeaderboardScreen />, { adapter });
    await waitFor(() => expect(adapter.getLeaderboard).toHaveBeenCalledWith('profit', '7d'));
  });

  it('перезапрашивает при смене метрики', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<LeaderboardScreen />, { adapter });
    await waitFor(() => expect(screen.getByText('Top')).toBeInTheDocument());
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'multiplier');
    await waitFor(() => expect(adapter.getLeaderboard).toHaveBeenCalledWith('multiplier', '7d'));
  });

  it('перезапрашивает при смене окна', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<LeaderboardScreen />, { adapter });
    await waitFor(() => expect(screen.getByText('Top')).toBeInTheDocument());
    await userEvent.selectOptions(screen.getAllByRole('combobox')[1], '30d');
    await waitFor(() => expect(adapter.getLeaderboard).toHaveBeenCalledWith('profit', '30d'));
  });

  it('показывает строку «я», когда сервер её вернул', async () => {
    const adapter = makeFakeAdapter({
      getLeaderboard: vi.fn(async () => ({
        ...FAKE_LEADERBOARD,
        // Ранг больше 100: отдельная карточка «твоё место» рисуется только
        // для тех, кто не попал в топ-100.
        me: { ...FAKE_LEADERBOARD.top[0], rank: 142, name: 'Me', userId: 'u1' },
      })),
    });
    renderWithHud(<LeaderboardScreen />, { adapter });
    await waitFor(() => expect(screen.getByText('Me')).toBeInTheDocument());
  });

  it('не рисует отдельную карточку «моё место», когда ранг попадает в топ-100', async () => {
    const adapter = makeFakeAdapter({
      getLeaderboard: vi.fn(async () => ({
        ...FAKE_LEADERBOARD,
        me: { ...FAKE_LEADERBOARD.top[0], rank: 50, name: 'Me', userId: 'u1' },
      })),
    });
    renderWithHud(<LeaderboardScreen />, { adapter });
    await waitFor(() => expect(screen.getByText('Top')).toBeInTheDocument());
    expect(screen.queryByText('Me')).not.toBeInTheDocument();
  });

  it('подписывает оборот валютой из конфига, а не хардкодом TON', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<LeaderboardScreen />, { adapter, config: { currency: 'GRAM' } });
    await waitFor(() => expect(screen.getByText('Top')).toBeInTheDocument());
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], 'turnover');
    await waitFor(() => expect(screen.getByText(/GRAM/)).toBeInTheDocument());
  });

  it('показывает ошибку загрузки', async () => {
    renderWithHud(<LeaderboardScreen />, { adapter: makeFailingAdapter('lb down') });
    await waitFor(() => expect(screen.getByText(/lb down/i)).toBeInTheDocument());
  });
});
