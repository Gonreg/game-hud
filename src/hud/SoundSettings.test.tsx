import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SoundSettings } from './SoundSettings';
import { renderWithHud } from '../test/renderWithHud';

async function openMenu() {
  await userEvent.click(screen.getByRole('button', { expanded: false }));
  await waitFor(() => expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument());
}

describe('SoundSettings', () => {
  it('без tracks подборщик треков не рендерится', async () => {
    renderWithHud(<SoundSettings musicOn sfxOn onToggleMusic={() => {}} onToggleSfx={() => {}} />);
    await openMenu();
    expect(screen.queryByText('Calm')).not.toBeInTheDocument();
  });

  it('с tracks подборщик рендерится, а выбор трека сообщает id наверх', async () => {
    const onSelectTrack = vi.fn();
    renderWithHud(
      <SoundSettings
        musicOn
        sfxOn
        onToggleMusic={() => {}}
        onToggleSfx={() => {}}
        tracks={[
          { id: 'calm', label: 'Calm' },
          { id: 'exciting', label: 'Exciting' },
        ]}
        currentTrack="calm"
        onSelectTrack={onSelectTrack}
      />,
    );
    await openMenu();
    await userEvent.click(screen.getByText('Exciting'));
    expect(onSelectTrack).toHaveBeenCalledWith('exciting');
  });

  it('без onHowToPlay пункт «как играть» не рендерится', async () => {
    renderWithHud(<SoundSettings musicOn sfxOn onToggleMusic={() => {}} onToggleSfx={() => {}} />);
    await openMenu();
    expect(screen.queryByText(/how to play/i)).not.toBeInTheDocument();
  });

  it('с onHowToPlay пункт «как играть» рендерится и дёргает обработчик', async () => {
    const onHowToPlay = vi.fn();
    renderWithHud(
      <SoundSettings
        musicOn
        sfxOn
        onToggleMusic={() => {}}
        onToggleSfx={() => {}}
        onHowToPlay={onHowToPlay}
      />,
    );
    await openMenu();
    await userEvent.click(screen.getByText(/how to play/i));
    expect(onHowToPlay).toHaveBeenCalled();
  });

  it('Music/SFX — доступные свитчи с aria-checked, а не текст on/off', async () => {
    renderWithHud(
      <SoundSettings musicOn sfxOn={false} onToggleMusic={() => {}} onToggleSfx={() => {}} />,
    );
    await openMenu();
    expect(screen.getByRole('switch', { name: /music/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('switch', { name: /game sounds/i })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.queryByText(/^on$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^off$/i)).not.toBeInTheDocument();
  });

  it('свитч SFX управляется с клавиатуры', async () => {
    const onToggleSfx = vi.fn();
    renderWithHud(
      <SoundSettings musicOn sfxOn onToggleMusic={() => {}} onToggleSfx={onToggleSfx} />,
    );
    await openMenu();
    const sfx = screen.getByRole('switch', { name: /game sounds/i });
    sfx.focus();
    await userEvent.keyboard('[Space]');
    expect(onToggleSfx).toHaveBeenCalledOnce();
  });
});
