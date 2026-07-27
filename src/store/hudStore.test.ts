import { beforeEach, describe, expect, it } from 'vitest';
import { useHudStore } from './hudStore';

describe('useHudStore', () => {
  beforeEach(() => {
    // Форму начального состояния берём из самого стора, а не переписываем руками:
    // иначе новое поле в HudState придётся не забыть добавить и здесь, а забыв —
    // получить не упавший тест, а молча текущее между it-блоками состояние.
    useHudStore.setState(useHudStore.getInitialState());
  });

  it('стартует закрытым на хабе', () => {
    const s = useHudStore.getState();
    expect(s.open).toBe(false);
    expect(s.screen).toBe('hub');
  });

  it('openProfile открывает хаб', () => {
    useHudStore.getState().openProfile();
    expect(useHudStore.getState()).toMatchObject({ open: true, screen: 'hub' });
  });

  it('openWalletWithFocus раскрывает оверлей, а не только меняет экран', () => {
    // Баг fatman: там open оставался false, и тап по баланс-пилюле не открывал ничего.
    useHudStore.getState().openWalletWithFocus('deposit');
    expect(useHudStore.getState()).toMatchObject({
      open: true,
      screen: 'wallet',
      walletFocus: 'deposit',
    });
  });

  it('clearWalletFocus гасит фокус, не закрывая экран', () => {
    useHudStore.getState().openWalletWithFocus('withdraw');
    useHudStore.getState().clearWalletFocus();
    expect(useHudStore.getState()).toMatchObject({ screen: 'wallet', walletFocus: null });
  });

  it('openHistory открывает историю из закрытого состояния', () => {
    useHudStore.getState().openHistory();
    expect(useHudStore.getState()).toMatchObject({ open: true, screen: 'history' });
  });

  it('openHelpWithTheme открывает саппорт с выбранной темой', () => {
    useHudStore.getState().openHelpWithTheme('finance');
    expect(useHudStore.getState()).toMatchObject({
      open: true,
      screen: 'help',
      helpTheme: 'finance',
    });
  });

  it('setScreen ходит внутри уже открытого кабинета, не открывая его сам', () => {
    useHudStore.getState().setScreen('stats');
    expect(useHudStore.getState()).toMatchObject({ open: false, screen: 'stats' });
  });

  it('clearHelpTheme гасит тему, не закрывая экран', () => {
    useHudStore.getState().openHelpWithTheme('bug');
    useHudStore.getState().clearHelpTheme();
    expect(useHudStore.getState()).toMatchObject({ screen: 'help', helpTheme: null });
  });

  it('close закрывает оверлей', () => {
    useHudStore.getState().openProfile();
    useHudStore.getState().close();
    expect(useHudStore.getState().open).toBe(false);
  });
});
