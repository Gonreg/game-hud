import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguagePicker } from './LanguagePicker';
import { SettingsButton } from './SettingsButton';
import { SoundSettings } from './SoundSettings';
import { renderWithHud } from '../test/renderWithHud';

/** Раскрыть список языков: в свёрнутом виде видна только строка «Language». */
async function expand() {
  await userEvent.click(screen.getByRole('button', { name: /language/i }));
}

describe('LanguagePicker', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('lang');
  });

  it('свёрнутый показывает текущий язык, а список языков скрыт', () => {
    renderWithHud(<LanguagePicker />);
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.queryByText('Русский')).not.toBeInTheDocument();
  });

  it('раскрывает все десять языков, названия — на самих языках', async () => {
    renderWithHud(<LanguagePicker />);
    await expand();
    for (const label of [
      'Русский',
      'Español',
      'Deutsch',
      'Français',
      'हिन्दी',
      'اردو',
      'বাংলা',
      'සිංහල',
      'नेपाली',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('помечает текущий язык выбранным', async () => {
    renderWithHud(<LanguagePicker />);
    await expand();
    expect(screen.getByRole('button', { name: /English/, pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Русский/, pressed: false })).toBeInTheDocument();
  });

  it('переключает язык сразу: lang и dir документа', async () => {
    renderWithHud(<LanguagePicker />);
    await expand();
    await userEvent.click(screen.getByText('Русский'));
    await waitFor(() => expect(document.documentElement.lang).toBe('ru'));
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('для языка справа налево ставит dir=rtl', async () => {
    renderWithHud(<LanguagePicker />);
    await expand();
    await userEvent.click(screen.getByText('اردو'));
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
  });

  it('запоминает выбор между сессиями в ключе i18next-детектора', async () => {
    renderWithHud(<LanguagePicker />);
    await expand();
    await userEvent.click(screen.getByText('Deutsch'));
    expect(localStorage.getItem('i18nextLng')).toBe('de');
  });

  it('пишет выбор в ключ игры, если он задан в конфиге', async () => {
    renderWithHud(<LanguagePicker />, { config: { languageStorageKey: 'molot.lang' } });
    await expand();
    await userEvent.click(screen.getByText('Deutsch'));
    expect(localStorage.getItem('molot.lang')).toBe('de');
    expect(localStorage.getItem('i18nextLng')).toBeNull();
  });

  it('после переключения список остаётся открытым, а отметка переезжает', async () => {
    renderWithHud(<LanguagePicker />);
    await expand();
    await userEvent.click(screen.getByText('Русский'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Русский/, pressed: true })).toBeInTheDocument(),
    );
  });

  it('живёт последним пунктом меню шестерёнки', async () => {
    renderWithHud(<SettingsButton onHowToPlay={() => {}} />);
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    const how = await screen.findByText(/how to play/i);
    const items = Array.from(
      how.closest('.hud-fm-setmenu')?.querySelectorAll('.hud-fm-smitem') ?? [],
    );
    expect(items.at(-1)?.textContent).toMatch(/language/i);
  });

  it('живёт последним пунктом меню плавающей шестерёнки звука', async () => {
    renderWithHud(<SoundSettings musicOn sfxOn onToggleMusic={() => {}} onToggleSfx={() => {}} />);
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    const row = await screen.findByText('Language');
    const items = Array.from(
      row.closest('.hud-fm-setmenu')?.querySelectorAll('.hud-fm-smitem') ?? [],
    );
    expect(items.at(-1)?.textContent).toMatch(/language/i);
  });
});
