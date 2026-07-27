import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReferralsScreen } from './ReferralsScreen';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeAdapter, makeFailingAdapter } from '../test/fakeAdapter';

describe('ReferralsScreen', () => {
  it('показывает счётчик приглашённых и заработок', async () => {
    renderWithHud(<ReferralsScreen />);
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    expect(screen.getByText('1.25')).toBeInTheDocument();
  });

  it('показывает выданную сервером ссылку, а не собранную на клиенте', async () => {
    renderWithHud(<ReferralsScreen />);
    await waitFor(() =>
      expect(screen.getByText(/t\.me\/test_bot\?start=ABC123/)).toBeInTheDocument(),
    );
  });

  it('копирует ссылку в буфер по кнопке', async () => {
    const writeText = vi.fn(async () => {});
    Object.assign(navigator, { clipboard: { writeText } });
    renderWithHud(<ReferralsScreen />);
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    // Кнопка подписана ключом common.copy — «Copy», а не referrals.copy.
    await userEvent.click(screen.getByRole('button', { name: /^copy$/i }));
    expect(writeText).toHaveBeenCalledWith('https://t.me/test_bot?start=ABC123');
  });

  it('показывает список приглашённых', async () => {
    renderWithHud(<ReferralsScreen />);
    await waitFor(() => expect(screen.getByText('Ann')).toBeInTheDocument());
  });

  it('показывает ошибку загрузки', async () => {
    renderWithHud(<ReferralsScreen />, { adapter: makeFailingAdapter('no refs') });
    await waitFor(() => expect(screen.getByText(/no refs/i)).toBeInTheDocument());
  });

  it('показывает скелетон, пока данные едут', () => {
    const adapter = makeFakeAdapter({
      getReferrals: vi.fn(() => new Promise(() => {})) as never,
    });
    renderWithHud(<ReferralsScreen />, { adapter });
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });
});
