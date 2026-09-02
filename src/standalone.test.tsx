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

describe('standalone GameHud.mountTopBar', () => {
  let barContainer: HTMLDivElement;

  beforeEach(() => {
    barContainer = document.createElement('div');
    document.body.appendChild(barContainer);
  });

  afterEach(() => {
    act(() => {
      GameHud.unmountTopBar();
    });
    barContainer.remove();
  });

  it('без mount() бросает — шапке нужны адаптер и i18n кабинета', () => {
    expect(() => GameHud.mountTopBar(barContainer)).toThrow();
  });

  // Ради этого всё и делается: у игр со сборщиком баланс и аватар ставит сама
  // игра, а у scratch-game своего React нет — шапку целиком отдаёт библиотека,
  // и выглядеть она обязана так же, как у остальных пяти.
  it('после mount() рисует баланс и аватар', async () => {
    act(() => {
      GameHud.mount(container, { adapter: makeFakeAdapter(), config: CONFIG, wallet: makeFakeWallet() });
      GameHud.setBalance(12.5);
      GameHud.mountTopBar(barContainer);
    });
    await waitFor(() => expect(barContainer.querySelector('.hud-balance-chip')).toBeInTheDocument());
    expect(barContainer.querySelector('.hud-profile-avatar-chip')).toBeInTheDocument();
    expect(barContainer).toHaveTextContent('12.50');
  });

  it('баланс реактивен: setBalance() перерисовывает чип', async () => {
    act(() => {
      GameHud.mount(container, { adapter: makeFakeAdapter(), config: CONFIG, wallet: makeFakeWallet() });
      GameHud.mountTopBar(barContainer);
      GameHud.setBalance(1);
    });
    await waitFor(() => expect(barContainer).toHaveTextContent('1.00'));
    act(() => {
      GameHud.setBalance(777.25);
    });
    await waitFor(() => expect(barContainer).toHaveTextContent('777.25'));
  });

  it('тап по аватару открывает кабинет, тап по балансу — кошелёк', async () => {
    act(() => {
      GameHud.mount(container, { adapter: makeFakeAdapter(), config: CONFIG, wallet: makeFakeWallet() });
      GameHud.mountTopBar(barContainer);
    });
    await userEvent.click(barContainer.querySelector('.hud-profile-avatar-chip')!);
    await waitFor(() => expect(screen.getByText('Profile')).toBeInTheDocument());

    act(() => {
      GameHud.close();
    });
    await userEvent.click(barContainer.querySelector('.hud-balance-chip')!);
    await waitFor(() => expect(screen.getByText('Wallet')).toBeInTheDocument());
  });

  it('unmountTopBar() очищает узел', () => {
    act(() => {
      GameHud.mount(container, { adapter: makeFakeAdapter(), config: CONFIG, wallet: makeFakeWallet() });
      GameHud.mountTopBar(barContainer);
    });
    expect(barContainer.querySelector('.hud-balance-chip')).toBeInTheDocument();
    act(() => {
      GameHud.unmountTopBar();
    });
    expect(barContainer.innerHTML).toBe('');
  });
});

// Позиционирование ВСЕГО худа (баланс, аватар, шестерёнка) в CSS завязано на
// --hud-safe-*: `top: calc(max(var(--hud-safe-top), 78px) + 16px)`. Если
// переменная не выставлена, calc целиком невалиден и элемент уезжает в угол —
// ровно это и было у scratch-game, единственной игры без своего React, где
// вызвать useTelegramSafeArea() некому.
describe('standalone mount() выставляет safe-area переменные', () => {
  it('после mount() --hud-safe-* заданы на <html>', async () => {
    act(() => {
      GameHud.mount(container, { adapter: makeFakeAdapter(), config: CONFIG, wallet: makeFakeWallet() });
    });
    await waitFor(() => {
      for (const side of ['top', 'right', 'bottom', 'left']) {
        expect(document.documentElement.style.getPropertyValue(`--hud-safe-${side}`)).not.toBe('');
      }
    });
  });
});

describe('standalone GameHud.mountSoundSettings', () => {
  let settingsContainer: HTMLDivElement;

  beforeEach(() => {
    settingsContainer = document.createElement('div');
    document.body.appendChild(settingsContainer);
  });

  afterEach(() => {
    act(() => {
      GameHud.unmountSoundSettings();
    });
    settingsContainer.remove();
  });

  it('без mount() бросает — меню не может жить без i18n-инстанса кабинета', () => {
    expect(() =>
      GameHud.mountSoundSettings(settingsContainer, {
        musicOn: true,
        sfxOn: true,
        onToggleMusic: vi.fn(),
        onToggleSfx: vi.fn(),
      }),
    ).toThrow();
  });

  it('после mount() рендерит шестерёнку, а по клику — Music/SFX/треки/How to play/Language', async () => {
    act(() => {
      GameHud.mount(container, { adapter: makeFakeAdapter(), config: CONFIG, wallet: makeFakeWallet() });
    });
    const onHowToPlay = vi.fn();
    const onToggleMusic = vi.fn();
    const onToggleSfx = vi.fn();
    const onSelectTrack = vi.fn();
    act(() => {
      GameHud.mountSoundSettings(settingsContainer, {
        onHowToPlay,
        musicOn: true,
        sfxOn: false,
        onToggleMusic,
        onToggleSfx,
        tracks: [{ id: 'calm', label: 'Спокойная' }, { id: 'exciting', label: 'Азартная' }],
        currentTrack: 'exciting',
        onSelectTrack,
      });
    });
    expect(screen.queryByText('How to play')).not.toBeInTheDocument();
    await userEvent.click(settingsContainer.querySelector('.hud-fm-gear')!);

    await waitFor(() => expect(screen.getByText('How to play')).toBeInTheDocument());
    expect(screen.getByText('Music')).toBeInTheDocument();
    expect(screen.getByText('Game sounds')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('Спокойная')).toBeInTheDocument();
    expect(screen.getByText('Азартная')).toBeInTheDocument();

    await userEvent.click(screen.getByText('How to play'));
    expect(onHowToPlay).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByText('Music'));
    expect(onToggleMusic).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByText('Game sounds'));
    expect(onToggleSfx).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByText('Спокойная'));
    expect(onSelectTrack).toHaveBeenCalledWith('calm');
  });

  it('делит i18n-инстанс с кабинетом — смена языка в кабинете видна и в меню', async () => {
    act(() => {
      GameHud.mount(container, { adapter: makeFakeAdapter(), config: CONFIG, wallet: makeFakeWallet(), language: 'en' });
      GameHud.mountSoundSettings(settingsContainer, {
        musicOn: true,
        sfxOn: true,
        onToggleMusic: vi.fn(),
        onToggleSfx: vi.fn(),
      });
    });
    await userEvent.click(settingsContainer.querySelector('.hud-fm-gear')!);
    await waitFor(() => expect(screen.getByText('Language')).toBeInTheDocument());

    act(() => {
      GameHud.setLanguage('ru');
    });
    await waitFor(() => expect(screen.getByText('Язык')).toBeInTheDocument());
  });

  it('повторный mountSoundSettings() на том же узле обновляет пропы, не закрывая уже открытое меню', async () => {
    act(() => {
      GameHud.mount(container, { adapter: makeFakeAdapter(), config: CONFIG, wallet: makeFakeWallet() });
      GameHud.mountSoundSettings(settingsContainer, {
        musicOn: true,
        sfxOn: true,
        onToggleMusic: vi.fn(),
        onToggleSfx: vi.fn(),
      });
    });
    await userEvent.click(settingsContainer.querySelector('.hud-fm-gear')!);
    await waitFor(() => expect(screen.getByText('Music')).toBeInTheDocument());

    // Второй вызов (как после тумблера SFX хостом-игрой) — тот же узел, новые
    // пропы. Хост зовёт mountSoundSettings на каждое изменение состояния
    // (у mountSoundSettings нет колбэка вроде onChange, обновление — только
    // так), поэтому пересоздание root на каждый вызов схлопывало бы открытое
    // меню — регрессия, которую этот тест и защищает.
    act(() => {
      GameHud.mountSoundSettings(settingsContainer, {
        musicOn: true,
        sfxOn: false,
        onToggleMusic: vi.fn(),
        onToggleSfx: vi.fn(),
      });
    });

    expect(screen.getByText('Music')).toBeInTheDocument();
    expect(screen.getByText('Game sounds')).toBeInTheDocument();
    var sfxRow = screen.getByText('Game sounds').closest('.hud-fm-smitem')!;
    expect(sfxRow).toHaveAttribute('aria-checked', 'false');
  });

  it('unmountSoundSettings() размонтирует дерево из переданного узла', () => {
    act(() => {
      GameHud.mount(container, { adapter: makeFakeAdapter(), config: CONFIG, wallet: makeFakeWallet() });
      GameHud.mountSoundSettings(settingsContainer, {
        musicOn: true,
        sfxOn: true,
        onToggleMusic: vi.fn(),
        onToggleSfx: vi.fn(),
      });
    });
    expect(settingsContainer.querySelector('.hud-fm-gear')).toBeInTheDocument();

    act(() => {
      GameHud.unmountSoundSettings();
    });
    expect(settingsContainer.querySelector('.hud-fm-gear')).not.toBeInTheDocument();
  });
});
