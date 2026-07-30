import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfileShell } from './ProfileShell';
import { useHudStore } from '../store/hudStore';
import { renderWithHud } from '../test/renderWithHud';
import { makeFakeWallet } from '../test/fakeAdapter';

/**
 * Ровно тот же приём, что и `resolve.alias` в `vite.walletless.config.ts` (и
 * в `vite.standalone.config.ts`): подменяет './tonconnectHooks' и
 * '../wallet/tonconnectHooks' на заглушку без `@tonconnect/ui-react`.
 *
 * В отличие от остальных тестов пакета (`vi.mock('@tonconnect/ui-react', ...)`
 * — см. ProfileShell.test.tsx, ProfileHub.test.tsx и т.д.), здесь настоящий
 * пакет `@tonconnect/ui-react` не мокается, а просто не участвует в графе
 * модулей вовсе, как и в собранном `@gonreg/game-hud/walletless`. Только так
 * можно честно проверить, что профиль открывается без `<TonConnectUIProvider>`
 * в дереве: не мокая сам пакет, мы не прячем реальную причину возможного
 * TonConnectProviderNotSetError, если alias/заглушка когда-нибудь перестанут
 * покрывать все точки входа.
 */
vi.mock('../wallet/tonconnectHooks', async () => import('../wallet/tonconnectHooks.stub'));

describe('ProfileShell без TonConnect (как в сборке @gonreg/game-hud/walletless)', () => {
  it('открывает профиль без TonConnectUIProvider в дереве', async () => {
    useHudStore.setState({ ...useHudStore.getInitialState(), open: true, screen: 'hub' });
    const wallet = makeFakeWallet(null);
    renderWithHud(<ProfileShell />, { wallet });
    // 'Test' — displayName из FAKE_ME, рендерится ProfileHub'ом на хабе:
    // значит профиль открылся и не упал, хотя в дереве нет ни одного
    // TonConnectUIProvider, а useHudWallet внутри всё равно безусловно
    // зовёт useTonAddress()/useTonConnectUI() (см. комментарий в самом хуке).
    await waitFor(() => expect(screen.getByText('Test')).toBeInTheDocument());
  });
});
