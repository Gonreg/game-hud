import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileShell } from './ProfileShell';
import { useHudStore } from '../store/hudStore';
import { renderWithHud } from '../test/renderWithHud';

vi.mock('@tonconnect/ui-react', () => ({
  useTonAddress: () => '',
  useTonConnectUI: () => [{ openModal: vi.fn(), sendTransaction: vi.fn() }],
  TonConnectButton: () => null,
}));

describe('ProfileShell', () => {
  beforeEach(() => {
    useHudStore.setState(useHudStore.getInitialState());
  });

  it('закрытый оверлей ничего не рендерит', () => {
    const { container } = renderWithHud(<ProfileShell />);
    expect(container).toBeEmptyDOMElement();
  });

  it('открытый показывает хаб', async () => {
    useHudStore.setState({ open: true, screen: 'hub' });
    renderWithHud(<ProfileShell />);
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
  });

  it('с внутреннего экрана кнопка ведёт назад на хаб, а не закрывает', async () => {
    useHudStore.setState({ open: true, screen: 'stats' });
    renderWithHud(<ProfileShell />);
    await userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(useHudStore.getState()).toMatchObject({ open: true, screen: 'hub' });
  });

  it('с хаба кнопка закрывает оверлей', async () => {
    useHudStore.setState({ open: true, screen: 'hub' });
    renderWithHud(<ProfileShell />);
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(useHudStore.getState().open).toBe(false);
  });

  it('показывает и прячет Telegram BackButton вместе с оверлеем', () => {
    const show = vi.fn();
    const hide = vi.fn();
    Object.assign(window.Telegram!.WebApp.BackButton!, {
      show,
      hide,
      onClick: vi.fn(),
      offClick: vi.fn(),
    });
    useHudStore.setState({ open: true, screen: 'hub' });
    const { unmount } = renderWithHud(<ProfileShell />);
    expect(show).toHaveBeenCalled();
    unmount();
    expect(hide).toHaveBeenCalled();
  });
});
