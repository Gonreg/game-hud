import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WalletSheet } from './WalletSheet';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter } from '../test/fakeAdapter';

vi.mock('@tonconnect/ui-react', () => ({
  useTonAddress: () => 'EQUserWallet',
  useTonConnectUI: () => [{ openModal: vi.fn(), sendTransaction: vi.fn() }],
  TonConnectButton: () => <button type="button">TonConnect</button>,
}));

describe('WalletSheet', () => {
  it('закрытый ничего не рендерит', () => {
    const { container } = renderWithHud(<WalletSheet open={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('открытый показывает форму вывода', async () => {
    renderWithHud(<WalletSheet open onClose={() => {}} />);
    expect(await screen.findByPlaceholderText(/amount/i)).toBeInTheDocument();
  });

  it('закрывается по тапу вне панели', async () => {
    const onClose = vi.fn();
    const { container } = renderWithHud(<WalletSheet open onClose={onClose} />);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.click(container.querySelector('.hud-sheet-backdrop')!);
    expect(onClose).toHaveBeenCalled();
  });

  it('закрывается по Escape', async () => {
    const onClose = vi.fn();
    renderWithHud(<WalletSheet open onClose={onClose} />);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('шлёт вывод через адаптер', async () => {
    const adapter = makeFakeAdapter();
    renderWithHud(<WalletSheet open onClose={() => {}} />, { adapter });
    const input = await screen.findByPlaceholderText(/amount/i);
    await userEvent.type(input, '2');
    await userEvent.click(screen.getByRole('button', { name: /^withdraw$/i }));
    await waitFor(() => expect(adapter.postWithdraw).toHaveBeenCalledWith(2, 'EQUserWallet'));
  });
});
