import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LanguageScreen } from './LanguageScreen';
import { renderWithHud } from '../test/renderWithHud';

describe('LanguageScreen', () => {
  it('показывает все десять языков', () => {
    renderWithHud(<LanguageScreen />);
    expect(screen.getAllByRole('button')).toHaveLength(10);
  });

  it('переключает язык в i18next по клику', async () => {
    renderWithHud(<LanguageScreen />);
    await userEvent.click(screen.getByText(/Русский/i));
    expect(document.documentElement.lang).toBe('ru');
  });

  it('запоминает выбор между сессиями — тем же ключом, что и меню настроек', async () => {
    localStorage.clear();
    renderWithHud(<LanguageScreen />, { config: { languageStorageKey: 'molot.lang' } });
    await userEvent.click(screen.getByText(/Deutsch/i));
    expect(localStorage.getItem('molot.lang')).toBe('de');
  });
});
