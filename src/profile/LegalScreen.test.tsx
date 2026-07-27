import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LegalScreen } from './LegalScreen';
import { renderWithHud } from '../test/renderWithHud';

afterEach(() => vi.unstubAllGlobals());

describe('LegalScreen', () => {
  it('рендерит markdown React-узлами, а не через innerHTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => '# Title\n\nПростой **жирный** текст.',
      })),
    );
    const { container } = renderWithHud(<LegalScreen doc="terms" />);
    await waitFor(() => expect(screen.getByText('Title')).toBeInTheDocument());
    expect(container.querySelector('strong')).toHaveTextContent('жирный');
  });

  it('не исполняет разметку из документа', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => 'Опасно <img src=x onerror=alert(1)>',
      })),
    );
    const { container } = renderWithHud(<LegalScreen doc="privacy" />);
    await waitFor(() => expect(screen.getByText(/Опасно/)).toBeInTheDocument());
    expect(container.querySelector('img')).toBeNull();
  });

  it('показывает ошибку, если документ не отдался', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, text: async () => '' })));
    const { container } = renderWithHud(<LegalScreen doc="offer" />);
    await waitFor(() => expect(container.querySelector('.hud-profile-error')).toBeInTheDocument());
  });
});
