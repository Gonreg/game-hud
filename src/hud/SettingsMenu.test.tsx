import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsMenu } from './SettingsMenu';
import { renderWithHud } from '../test/renderWithHud';

describe('SettingsMenu', () => {
  it('строки Music/SFX — доступные свитчи, а не текст on/off', () => {
    renderWithHud(
      <SettingsMenu
        onHowToPlay={() => {}}
        musicOn
        sfxOn={false}
        onToggleMusic={() => {}}
        onToggleSfx={() => {}}
      />,
    );
    const music = screen.getByRole('switch', { name: /music/i });
    const sfx = screen.getByRole('switch', { name: /game sounds/i });
    expect(music).toHaveAttribute('aria-checked', 'true');
    expect(sfx).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByText(/^on$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^off$/i)).not.toBeInTheDocument();
  });

  it('клик по свитчу переключает музыку', async () => {
    const onToggleMusic = vi.fn();
    renderWithHud(
      <SettingsMenu
        onHowToPlay={() => {}}
        musicOn
        onToggleMusic={onToggleMusic}
        onToggleSfx={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole('switch', { name: /music/i }));
    expect(onToggleMusic).toHaveBeenCalledOnce();
  });

  it('свитч управляется с клавиатуры (нативная кнопка — Enter/Space)', async () => {
    const onToggleSfx = vi.fn();
    renderWithHud(
      <SettingsMenu
        onHowToPlay={() => {}}
        sfxOn
        onToggleMusic={() => {}}
        onToggleSfx={onToggleSfx}
      />,
    );
    const sfx = screen.getByRole('switch', { name: /game sounds/i });
    sfx.focus();
    await userEvent.keyboard('[Space]');
    expect(onToggleSfx).toHaveBeenCalledOnce();
  });

  it('без onToggleMusic/onToggleSfx строки свитчей не рендерятся', () => {
    renderWithHud(<SettingsMenu onHowToPlay={() => {}} />);
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});
