import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHudAdapter } from '../context/HudProvider';
import { useHudResource } from '../context/useHudResource';
import { useHudStore } from '../store/hudStore';
import { formatWhen } from '../format/datetime';
import { fmtAmount } from '../format/money';
import { InfoPopover } from '../primitives/InfoPopover';
import { Skeleton } from '../primitives/Skeleton';
import { TonConnectButton } from '../wallet/tonconnectHooks';
import { useHudWallet } from '../wallet/useHudWallet';
import type { Withdrawal } from '../adapter/types';

const NANO_PER_TON = 1_000_000_000n;

export function WalletScreen() {
  const { t, i18n } = useTranslation();
  const adapter = useHudAdapter();
  const wallet = useHudWallet();
  const address = wallet.address;
  const me = useHudResource('me', (a) => a.getMe());
  const hasWithdrawalsList = typeof adapter.getWithdrawals === 'function';
  const withdrawals = useHudResource<Withdrawal[]>('withdrawals', (a) =>
    a.getWithdrawals ? a.getWithdrawals() : Promise.resolve([]),
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [amount, setAmount] = useState('1');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const depositRef = useRef<HTMLDivElement>(null);
  const withdrawRef = useRef<HTMLDivElement>(null);
  const focus = useHudStore((s) => s.walletFocus);
  const clearFocus = useHudStore((s) => s.clearWalletFocus);

  useEffect(() => {
    if (!focus) return;
    const ref = focus === 'deposit' ? depositRef : withdrawRef;
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    clearFocus();
  }, [focus, clearFocus]);

  const hasWalletLink = typeof adapter.postWalletLink === 'function';
  // Бэк умеет привязку (есть postWalletLink) — значит он и решает, куда выводить,
  // и до привязки вывод бессмысленно отправлять. Бэк без привязки (matreshka)
  // выводит на адрес, который мы передаём из TonConnect, — там гейт по адресу.
  const canWithdraw = hasWalletLink ? Boolean(me.data?.walletAddress) : Boolean(address);

  async function deposit() {
    if (!address) {
      await wallet.connect();
      return;
    }
    const ton = Number(amount);
    if (!Number.isFinite(ton) || ton <= 0) {
      setMsg(t('wallet.amount_invalid'));
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const d = await adapter.getDeposit();
      const nano = BigInt(Math.round(ton * Number(NANO_PER_TON)));
      await wallet.sendDeposit(d.address, nano.toString(), d.comment);
      setMsg(t('wallet.deposit_sent'));
    } catch (e) {
      setMsg(t('wallet.error_prefix', { message: (e as Error).message }));
    } finally {
      setBusy(false);
    }
  }

  async function linkWallet() {
    if (!address || !adapter.postWalletLink) return;
    setBusy(true);
    setMsg(null);
    try {
      await adapter.postWalletLink(address);
      setMsg(t('wallet.linked_ok'));
      me.reload();
    } catch (e) {
      const m = (e as Error).message;
      if (m.includes('wallet_not_verified')) {
        setMsg(t('wallet.need_deposit_first'));
      } else {
        setMsg(t('wallet.error_prefix', { message: m }));
      }
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    if (!address) {
      await wallet.connect();
      return;
    }
    const ton = Number(withdrawAmount);
    if (!Number.isFinite(ton) || ton <= 0) {
      setMsg(t('wallet.amount_invalid'));
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await adapter.postWithdraw(ton, address || null);
      setMsg(t('wallet.withdraw_created', { id: r.id.slice(0, 8), status: r.status }));
      setWithdrawAmount('');
      me.reload();
      withdrawals.reload();
    } catch (e) {
      setMsg(t('wallet.error_prefix', { message: (e as Error).message }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hud-profile-section">
      <div className="hud-profile-promos">
        <div className="hud-profile-promo">
          <div className="hud-profile-promo__title">{t('wallet.promo_title')}</div>
          <div className="hud-profile-promo__sub">{t('wallet.bonus_note')}</div>
        </div>
      </div>

      <div className="hud-profile-card">
        <div className="hud-profile-card__label">
          {t('wallet.tonconnect')}
          <InfoPopover text={t('wallet.tonconnect_info')} />
        </div>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
          {wallet.showConnectButton ? (
            <TonConnectButton />
          ) : (
            <button
              type="button"
              className="hud-profile-btn"
              onClick={() => void wallet.connect()}
            >
              {t('wallet.connect')}
            </button>
          )}
        </div>
        {hasWalletLink && address && !me.data?.walletAddress && (
          <button
            type="button"
            className="hud-profile-btn"
            style={{ marginTop: 10 }}
            onClick={() => void linkWallet()}
            disabled={busy}
          >
            {t('wallet.link')}
          </button>
        )}
      </div>

      {me.data?.walletAddress && (
        <div className="hud-profile-card">
          <div className="hud-profile-card__label">{t('wallet.linked_label')}</div>
          <div className="hud-profile-card__value">{me.data.walletAddress}</div>
        </div>
      )}

      <div className="hud-profile-card" ref={depositRef}>
        <div className="hud-profile-card__label">
          {t('wallet.deposit')}
          <InfoPopover text={t('wallet.deposit_info')} />
        </div>
        <input
          type="number"
          step="0.1"
          min="0.1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          type="button"
          className="hud-profile-btn hud-profile-btn--primary"
          style={{ marginTop: 10 }}
          onClick={() => void deposit()}
          disabled={busy}
        >
          {busy ? '…' : t('wallet.deposit_btn', { amount })}
        </button>
      </div>

      <div className="hud-profile-card" ref={withdrawRef}>
        <div className="hud-profile-card__label">
          {t('wallet.withdraw')}
          <InfoPopover text={t('wallet.withdraw_info')} />
        </div>
        <input
          type="number"
          step="0.1"
          min="0.1"
          placeholder={t('wallet.withdraw_placeholder')}
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
        />
        <div style={{ fontSize: 11, color: '#9aa3c4', marginTop: 6 }}>
          {canWithdraw ? t('wallet.withdraw_hint') : t('wallet.need_link')}
        </div>
        <button
          type="button"
          className="hud-profile-btn"
          style={{ marginTop: 10 }}
          onClick={() => void withdraw()}
          disabled={busy || !canWithdraw}
        >
          {t('wallet.withdraw_btn')}
        </button>
      </div>

      {hasWithdrawalsList && (
        <div className="hud-profile-card hud-wallet-withdrawals">
          {withdrawals.loading ? (
            <Skeleton rows={2} />
          ) : (
            withdrawals.data?.map((w) => {
              // Только дата, без времени — так этот список выглядел в fatman.
              const when = formatWhen(w.createdAt, i18n.language || 'en', 'date');
              return (
                <div key={w.id} className="hud-wallet-withdrawals__row">
                  <span>{fmtAmount(w.amount)}</span>
                  <span className="hud-profile-list__hint">{w.status}</span>
                  {when && <span className="hud-profile-list__hint">{when}</span>}
                </div>
              );
            })
          )}
        </div>
      )}

      {msg && (
        <div className="hud-profile-empty" style={{ padding: '12px 16px', textAlign: 'left' }}>
          {msg}
        </div>
      )}
    </div>
  );
}
