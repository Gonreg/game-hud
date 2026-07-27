import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HistoryScreen } from './HistoryScreen';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter, makeFailingAdapter, FAKE_TX } from '../test/fakeAdapter';

describe('HistoryScreen', () => {
  it('показывает первую страницу транзакций', async () => {
    renderWithHud(<HistoryScreen />);
    await waitFor(() => expect(screen.getByText(/5\.00/)).toBeInTheDocument());
  });

  it('запрашивает первую страницу без курсора', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<HistoryScreen />, { adapter });
    await waitFor(() => expect(adapter.getTransactions).toHaveBeenCalledWith(undefined));
  });

  it('не тянет следующую страницу, когда nextCursor пустой', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<HistoryScreen />, { adapter });
    await waitFor(() => expect(adapter.getTransactions).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 60));
    expect(adapter.getTransactions).toHaveBeenCalledTimes(1);
  });

  it('показывает пустое состояние, когда транзакций нет', async () => {
    const adapter = makeFakeAdapter({
      getTransactions: vi.fn(async () => ({ items: [], nextCursor: null })),
    });
    renderWithHud(<HistoryScreen />, { adapter });
    // В словаре history.empty — «History is empty».
    await waitFor(() => expect(screen.getByText(/history is empty/i)).toBeInTheDocument());
  });

  it('показывает ошибку, а не пустой экран', async () => {
    renderWithHud(<HistoryScreen />, { adapter: makeFailingAdapter('network down') });
    await waitFor(() => expect(screen.getByText(/network down/i)).toBeInTheDocument());
  });

  it('переводит вид операции по ключу history.kind.*', async () => {
    const adapter = makeFakeAdapter({
      getTransactions: vi.fn(async () => ({
        items: [{ ...FAKE_TX, kind: 'withdraw' }],
        nextCursor: null,
      })),
    });
    renderWithHud(<HistoryScreen />, { adapter });
    // history.kind.withdraw = «Withdrawal», сырой ключ показываться не должен.
    await waitFor(() => expect(screen.getByText(/withdrawal/i)).toBeInTheDocument());
  });
});
