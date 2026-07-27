import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StatsScreen } from './StatsScreen';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter, makeFailingAdapter } from '../test/fakeAdapter';

describe('StatsScreen', () => {
  it('показывает сыгранные раунды и лучший коэффициент', async () => {
    renderWithHud(<StatsScreen />);
    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());
    expect(screen.getByText(/7\.31/)).toBeInTheDocument();
  });

  it('форматирует денежные поля единым форматтером', async () => {
    renderWithHud(<StatsScreen />);
    // Со знаком: иначе регулярка поймала бы и totalWon «120.00».
    await waitFor(() => expect(screen.getByText(/\+20\.00/)).toBeInTheDocument());
  });

  it('печатает винрейт процентами, а не долей', async () => {
    renderWithHud(<StatsScreen />);
    await waitFor(() => expect(screen.getByText(/55/)).toBeInTheDocument());
    expect(screen.queryByText(/0\.55/)).not.toBeInTheDocument();
  });

  it('подписывает суммы валютой из конфига, а не хардкодом TON', async () => {
    renderWithHud(<StatsScreen />, { config: { currency: 'GRAM' } });
    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());
    expect(screen.queryByText(/TON/)).not.toBeInTheDocument();
  });

  it('переживает отсутствие перцентилей', async () => {
    const adapter = makeFakeAdapter({
      getPercentiles: vi.fn(async () => ({
        rounds: null,
        bestMult: null,
        winrate: null,
        profit: null,
        avgBet: null,
      })),
    });
    renderWithHud(<StatsScreen />, { adapter });
    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());
  });

  it('показывает ошибку загрузки', async () => {
    renderWithHud(<StatsScreen />, { adapter: makeFailingAdapter('stats down') });
    await waitFor(() => expect(screen.getByText(/stats down/i)).toBeInTheDocument());
  });
});
