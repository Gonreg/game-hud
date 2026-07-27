import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameHistoryScreen } from './GameHistoryScreen';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter, FAKE_ROUND } from '../test/fakeAdapter';

describe('GameHistoryScreen', () => {
  it('показывает раунд с суммой и коэффициентом', async () => {
    const adapter = makeFakeAdapter({ getGameHistory: vi.fn(async () => [FAKE_ROUND]) });
    renderWithHud(<GameHistoryScreen />, { adapter });
    // net = payout(10) - bet(2) = 8.
    await waitFor(() => expect(screen.getByText(/8\.00/)).toBeInTheDocument());
    expect(screen.getByText(/5\.00×/)).toBeInTheDocument();
  });

  it('переводит статус через history.status.*, сырое значение не показывается', async () => {
    const adapter = makeFakeAdapter({
      getGameHistory: vi.fn(async () => [{ ...FAKE_ROUND, status: 'empty_won' }]),
    });
    renderWithHud(<GameHistoryScreen />, { adapter });
    // history.status.empty_won = «Guessed right» — не совпадает с сырым ключом.
    await waitFor(() => expect(screen.getByText(/guessed right/i)).toBeInTheDocument());
    expect(screen.queryByText('empty_won')).not.toBeInTheDocument();
  });

  it('показывает пустое состояние, когда раундов нет', async () => {
    const adapter = makeFakeAdapter({ getGameHistory: vi.fn(async () => []) });
    renderWithHud(<GameHistoryScreen />, { adapter });
    await waitFor(() => expect(screen.getByText(/history is empty/i)).toBeInTheDocument());
  });

  it('показывает ошибку загрузки', async () => {
    const adapter = makeFakeAdapter({
      getGameHistory: vi.fn(async () => {
        throw new Error('no rounds');
      }),
    });
    renderWithHud(<GameHistoryScreen />, { adapter });
    await waitFor(() => expect(screen.getByText(/no rounds/i)).toBeInTheDocument());
  });

  it('показывает скелетон, пока данные едут', () => {
    const adapter = makeFakeAdapter({
      getGameHistory: vi.fn(() => new Promise(() => {})) as never,
    });
    renderWithHud(<GameHistoryScreen />, { adapter });
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('не рисует дату, когда бэк её не отдал', async () => {
    // У basketball запрос истории не выбирает временную метку вовсе.
    // Показать «Invalid Date» в каждой строке было бы хуже, чем не показать.
    const adapter = makeFakeAdapter({
      getGameHistory: vi.fn(async () => [{ ...FAKE_ROUND, createdAt: undefined }]),
    });
    const { container } = renderWithHud(<GameHistoryScreen />, { adapter });
    // net = payout(10) - bet(2) = 8.
    await waitFor(() => expect(screen.getByText(/8\.00/)).toBeInTheDocument());
    expect(container.textContent).not.toMatch(/Invalid Date/);
  });

  it('не рисует дату, когда она неразбираемая', async () => {
    const adapter = makeFakeAdapter({
      getGameHistory: vi.fn(async () => [{ ...FAKE_ROUND, createdAt: 'мусор' }]),
    });
    const { container } = renderWithHud(<GameHistoryScreen />, { adapter });
    // net = payout(10) - bet(2) = 8.
    await waitFor(() => expect(screen.getByText(/8\.00/)).toBeInTheDocument());
    expect(container.textContent).not.toMatch(/Invalid Date/);
  });
});
