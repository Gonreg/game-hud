import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { BalanceChip } from './BalanceChip';
import { ProfileAvatarButton } from './ProfileAvatarButton';
import { SettingsButton } from './SettingsButton';
import { useHudStore } from '../store/hudStore';
import { renderWithHud } from '../test/renderWithHud';

describe('верхний HUD', () => {
  beforeEach(() => {
    useHudStore.setState(useHudStore.getInitialState());
  });

  it('баланс-пилюля печатает переданное значение единым форматтером', () => {
    renderWithHud(<BalanceChip balance={7} />);
    expect(screen.getByText('7.00')).toBeInTheDocument();
  });

  it('тап по пилюле открывает кошелёк с фокусом на пополнении', async () => {
    renderWithHud(<BalanceChip balance={7} />);
    await userEvent.click(screen.getByRole('button'));
    expect(useHudStore.getState()).toMatchObject({
      open: true,
      screen: 'wallet',
      walletFocus: 'deposit',
    });
  });

  it('тап по аватару открывает кабинет', async () => {
    renderWithHud(<ProfileAvatarButton />);
    await userEvent.click(screen.getByRole('button'));
    expect(useHudStore.getState()).toMatchObject({ open: true, screen: 'hub' });
  });

  it('носит классы позиционирования fatman, а не раскладки TopBar', () => {
    // Ровно эта ошибка уже приводила к тому, что пилюля и аватар
    // отрисовывались за игровой сценой и были не видны.
    const { container } = renderWithHud(<BalanceChip balance={7} />);
    expect(container.querySelector('.hud-balance-chip')).toBeInTheDocument();
  });

  it('аватар носит класс позиционирования fatman, а не раскладки TopBar', () => {
    // Та же ошибка: класс matreshka не позиционируется абсолютно, и кнопка
    // профиля отрисовывалась за игровой сценой и была не видна.
    const { container } = renderWithHud(<ProfileAvatarButton />);
    expect(container.querySelector('.hud-profile-avatar-chip')).toBeInTheDocument();
  });

  it('шестерёнка раскрывает меню', async () => {
    renderWithHud(<SettingsButton onHowToPlay={() => {}} />);
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    await waitFor(() =>
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument(),
    );
  });

  it('клик вне меню его закрывает', async () => {
    renderWithHud(
      <div>
        <SettingsButton onHowToPlay={() => {}} />
        <button type="button">снаружи</button>
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    await waitFor(() =>
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByText('снаружи'));
    await waitFor(() =>
      expect(screen.queryByRole('button', { expanded: true })).not.toBeInTheDocument(),
    );
  });

  it('пункт «как играть» дёргает переданный обработчик и закрывает меню', async () => {
    let called = false;
    renderWithHud(
      <SettingsButton
        onHowToPlay={() => {
          called = true;
        }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    await userEvent.click(await screen.findByText(/how to play/i));
    expect(called).toBe(true);
    expect(screen.queryByRole('button', { expanded: true })).not.toBeInTheDocument();
  });
});
