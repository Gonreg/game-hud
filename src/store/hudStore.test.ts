import { beforeEach, describe, expect, it } from 'vitest';
import { useHudStore } from './hudStore';

describe('useHudStore', () => {
  beforeEach(() => {
    useHudStore.setState({ open: false, screen: 'hub', walletFocus: null, helpTheme: null });
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

  it('close закрывает оверлей', () => {
    useHudStore.getState().openProfile();
    useHudStore.getState().close();
    expect(useHudStore.getState().open).toBe(false);
  });
});
