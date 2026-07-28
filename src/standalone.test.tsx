import { act } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as GameHud from './standalone';
import { useHudStore } from './store/hudStore';
import { makeFakeAdapter, FAKE_ME } from './test/fakeAdapter';
import type { HudConfig, HudWallet } from './adapter/types';

// vitest выполняет тест против исходников напрямую, а не через собранный
// standalone.js — там `./tonconnectHooks` подменяется на заглушку через
// vite.standalone.config.ts (resolve.alias), а тут этого нет, и useHudWallet
// зовёт настоящие хуки @tonconnect/ui-react безусловно (см. её комментарий).
// Мокаем ровно как в useHudWallet.test.tsx / WalletSheet.test.tsx — иначе
// без <TonConnectUIProvider> в дереве они бросают TonConnectProviderNotSetError,
// даже когда мост есть и их возвращаемое значение всё равно не используется.
vi.mock('@tonconnect/ui-react', () => ({
  useTonAddress: () => '',
  useTonConnectUI: () => [{ openModal: vi.fn(), sendTransaction: vi.fn() }],
  TonConnectButton: () => null,
}));

/**
 * Тесты чистой логики standalone-бандла (mount/unmount, императивные обёртки,
 * реактивный баланс). Реальный ли IIFE-бандл работает как игровой тег
 * `<script>` — вопрос отдельной, ручной проверки в браузере (см. отчёт и
 * demo/standalone.html), это здесь не воспроизвести.
 */

const CONFIG: HudConfig = { botUsername: 'demo_bot', currency: 'GRAM', minBet: 0.1, maxBet: 100 };

function makeFakeWallet(address: string | null = null): HudWallet {
  return {
    getAddress: () => address,
    connect: async () => {},
    sendDeposit: async () => {},
    subscribe: () => () => {},
  };
}

let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => {
    GameHud.unmount();
  });
  container.remove();
  useHudStore.setState(useHudStore.getInitialState());
});

describe('standalone GameHud.mount', () => {
  it('монтирует кабинет закрытым, а openProfile() открывает хаб', async () => {
    act(() => {
      GameHud.mount(container, { adapter: makeFakeAdapter(), config: CONFIG, wallet: makeFakeWallet() });
    });
    expect(container.querySelector('.hud-profile-overlay')).not.toBeInTheDocument();

    act(() => {
      GameHud.openProfile();
    });
    await waitFor(() => expect(screen.getByText('Profile')).toBeInTheDocument());
  });

  it('openWallet() открывает боттом-шит кошелька, close() закрывает всё', async () => {
    act(() => {
      GameHud.mount(container, { adapter: makeFakeAdapter(), config: CONFIG, wallet: makeFakeWallet() });
      GameHud.openProfile();
      GameHud.openWallet();
    });
    await waitFor(() => expect(container.querySelector('.hud-sheet')).toBeInTheDocument());
    expect(container.querySelector('.hud-profile-overlay')).toBeInTheDocument();

    act(() => {
      GameHud.close();
    });
    await waitFor(() => {
      expect(container.querySelector('.hud-sheet')).not.toBeInTheDocument();
      expect(container.querySelector('.hud-profile-overlay')).not.toBeInTheDocument();
    });
  });

  it('setBalance() отражается в открытом боттом-шите кошелька', async () => {
    act(() => {
      GameHud.mount(container, { adapter: makeFakeAdapter(), config: CONFIG, wallet: makeFakeWallet() });
      GameHud.openWallet();
    });
    await waitFor(() => expect(container.querySelector('.hud-sheet')).toBeInTheDocument());
    // Пока setBalance ничего не передал — берём снимок из getMe(), как в
    // остальных пяти играх.
    await waitFor(() => expect(screen.getByText(FAKE_ME.balance.toFixed(2))).toBeInTheDocument());

    act(() => {
      GameHud.setBalance(999.5);
    });
    await waitFor(() => expect(screen.getByText('999.50')).toBeInTheDocument());
  });

  it('unmount() размонтирует дерево из переданного узла', () => {
    act(() => {
      GameHud.mount(container, { adapter: makeFakeAdapter(), config: CONFIG, wallet: makeFakeWallet() });
      GameHud.openProfile();
    });
    expect(container.querySelector('.hud-profile-overlay')).toBeInTheDocument();

    act(() => {
      GameHud.unmount();
    });
    expect(container.innerHTML).toBe('');
  });

  it('сливает игровые словари с библиотечными и подставляет игровой ключ', async () => {
    act(() => {
      GameHud.mount(container, {
        adapter: makeFakeAdapter(),
        config: CONFIG,
        wallet: makeFakeWallet(),
        language: 'en',
        locales: { en: { profile: { title: 'My Cabinet' } } },
      });
      GameHud.openProfile();
    });
    // Игровой ключ profile.title победил библиотечный ('Profile').
    await waitFor(() => expect(screen.getByText('My Cabinet')).toBeInTheDocument());
    // А ключи, которых игра не переопределяла, остались библиотечными.
    await waitFor(() => expect(screen.getByText('Wallet')).toBeInTheDocument());
  });

  it('mount() без wallet-адреса не трогает TonConnect — открывает кошелёк без ошибок', async () => {
    act(() => {
      GameHud.mount(container, { adapter: makeFakeAdapter(), config: CONFIG, wallet: makeFakeWallet() });
      GameHud.openWallet();
    });
    await waitFor(() => expect(screen.getByText('Connect wallet')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Connect wallet'));
  });
});
