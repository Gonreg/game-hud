import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileHub } from './ProfileHub';
import { useHudStore } from '../store/hudStore';
import { renderWithHud } from '../test/renderWithHud';
import { makeFailingAdapter } from '../test/fakeAdapter';

vi.mock('@tonconnect/ui-react', () => ({
  useTonAddress: () => '',
  useTonConnectUI: () => [{ openModal: vi.fn(), sendTransaction: vi.fn() }],
  TonConnectButton: () => null,
}));

describe('ProfileHub', () => {
  beforeEach(() => {
    useHudStore.setState({ ...useHudStore.getInitialState(), open: true, screen: 'hub' });
  });

  it('показывает имя и три баланса через единый форматтер', async () => {
    renderWithHud(<ProfileHub />);
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    expect(screen.getByText('12.50')).toBeInTheDocument();
    expect(screen.getByText('3.00')).toBeInTheDocument();
    expect(screen.getByText('1.25')).toBeInTheDocument();
  });

  it('пункт меню уводит на нужный экран', async () => {
    renderWithHud(<ProfileHub />);
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
    await userEvent.click(screen.getByText(/stats/i));
    expect(useHudStore.getState().screen).toBe('stats');
  });

  it('без подключённого кошелька строка кошелька говорит «не подключён»', async () => {
    renderWithHud(<ProfileHub />);
    await waitFor(() => expect(screen.getByText(/not connected/i)).toBeInTheDocument());
  });

  it('переживает падение адаптера и не роняет экран', async () => {
    renderWithHud(<ProfileHub />, { adapter: makeFailingAdapter() });
    await waitFor(() => expect(screen.getAllByText('0.00').length).toBeGreaterThan(0));
  });
});
