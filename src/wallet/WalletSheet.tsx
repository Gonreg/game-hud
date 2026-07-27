import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { useHudAdapter } from '../context/HudProvider';
import { useHudConfig } from '../context/HudProvider';
import { useHudResource } from '../context/useHudResource';
import { fmtAmount } from '../format/money';
import { BottomSheet } from '../primitives/BottomSheet';
import { IconClose, IconTon } from '../primitives/icons';

const NANO_PER_TON = 1_000_000_000n;

function commentPayload(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const out = new Uint8Array(4 + bytes.length);
  out.set(bytes, 4);
  let bin = '';
  for (const b of out) bin += String.fromCharCode(b);
  return btoa(bin);
}

/**
 * Боттом-шит кошелька (F/components/WalletSheet.tsx), открываемый прямо из
 * HUD игры поверх раунда. `open`/`onClose` — пропсы: у fatman это uiStore,
 * который в библиотеку не переезжает, открытием шита управляет игра.
 *
 * Содержимое вынесено в WalletSheetBody: BottomSheet возвращает null, пока
 * `open` не true, и React в этом случае не рендерит переданных детей вовсе —
 * значит компонент-тело со своими хуками (в первую очередь useHudResource
 * → getMe) не монтируется и не дёргает адаптер, пока шит закрыт.
 */
export function WalletSheet({
  open,
  onClose,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  /**
   * Живой баланс от игры. Во время раунда игра гоняет его через свой стор по
   * WebSocket, а REST-снимок из getMe отстаёт. Не передан — берём из getMe.
   */
  balance?: number | null;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="hud-wallet-sheet-title">
      <WalletSheetBody onClose={onClose} balance={balance} />
    </BottomSheet>
  );
}

/**
 * Как и у fatman: без клиентского лимита по балансу (решает сервер) и без
 * показа адреса депозита (уходит прямо в TonConnect) — этого нет ни в
 * fatman, ни в matreshka, и мы это уже вычистили из WalletScreen.
 */
function WalletSheetBody({ onClose, balance }: { onClose: () => void; balance?: number | null }) {
  const { t } = useTranslation();
  const adapter = useHudAdapter();
  const currency = useHudConfig().currency;
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const me = useHudResource('me', (a) => a.getMe());
  const hasWalletLink = typeof adapter.postWalletLink === 'function';
  // Бэк умеет привязку (есть postWalletLink) — значит он и решает, куда выводить,
  // и до привязки вывод бессмысленно отправлять. Бэк без привязки (matreshka)
  // выводит на адрес, который мы передаём из TonConnect, — там гейт по адресу.
  const canWithdraw = hasWalletLink ? Boolean(me.data?.walletAddress) : Boolean(address);

  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('1');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function deposit() {
    if (!address) {
      await tonConnectUI.openModal();
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
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          { address: d.address, amount: nano.toString(), payload: commentPayload(d.comment) },
        ],
      });
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
      setMsg(m.includes('wallet_not_verified') ? t('wallet.need_deposit_first') : t('wallet.error_prefix', { message: m }));
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    if (!address) {
      await tonConnectUI.openModal();
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
    } catch (e) {
      setMsg(t('wallet.error_prefix', { message: (e as Error).message }));
    } finally {
      setBusy(false);
    }
  }

  const linkedAddress = me.data?.walletAddress;
  const shortLinked = linkedAddress ? `${linkedAddress.slice(0, 4)}…${linkedAddress.slice(-4)}` : null;

  return (
    <>
      <div className="hud-sheet__head">
        <div className="hud-sheet__title hud-ton-info-title" id="hud-wallet-sheet-title">
          <IconTon width={20} height={20} />
          <span>{t('wallet.title')}</span>
        </div>
        <button type="button" className="hud-sheet__close" onClick={onClose} aria-label={t('common.close')}>
          <IconClose />
        </button>
      </div>

      <div className="hud-wallet-sheet-balance">
        <div className="hud-wallet-sheet-balance__label">{t('wallet.balance_label')}</div>
        <div className="hud-wallet-sheet-balance__value">
          {fmtAmount(balance ?? me.data?.balance ?? null)} <span>{currency}</span>
        </div>
      </div>

      <div className="hud-wallet-sheet-link">
        {shortLinked ? (
          <div className="hud-wallet-sheet-linked">
            <span className="hud-wallet-sheet-linked__dot" />
            <span className="hud-wallet-sheet-linked__label">{t('wallet.linked_label')}</span>
            <span className="hud-wallet-sheet-linked__addr">{shortLinked}</span>
          </div>
        ) : (
          <div className="hud-wallet-sheet-link__row">
            <TonConnectButton />
            {hasWalletLink && address && (
              <button
                type="button"
                className="hud-wallet-sheet-link-btn"
                onClick={() => void linkWallet()}
                disabled={busy}
              >
                {t('wallet.link')}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="hud-wallet-sheet-tabs">
        <button
          type="button"
          className={'hud-wallet-sheet-tab' + (tab === 'deposit' ? ' hud-is-active' : '')}
          onClick={() => setTab('deposit')}
        >
          {t('wallet.deposit')}
        </button>
        <button
          type="button"
          className={'hud-wallet-sheet-tab' + (tab === 'withdraw' ? ' hud-is-active' : '')}
          onClick={() => setTab('withdraw')}
        >
          {t('wallet.withdraw')}
        </button>
      </div>

      {tab === 'deposit' ? (
        <div className="hud-wallet-sheet-form">
          <div className="hud-wallet-sheet-input">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <span>{currency}</span>
          </div>
          <button
            type="button"
            className="hud-ton-info-cta"
            onClick={() => void deposit()}
            disabled={busy}
          >
            {busy ? '…' : t('wallet.deposit_btn', { amount })}
          </button>
          <p className="hud-wallet-sheet-hint">{t('wallet.deposit_info')}</p>
        </div>
      ) : (
        <div className="hud-wallet-sheet-form">
          <div className="hud-wallet-sheet-input">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0.1"
              placeholder={t('wallet.withdraw_placeholder')}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
            <span>{currency}</span>
          </div>
          <button
            type="button"
            className="hud-ton-info-cta hud-wallet-sheet-withdraw-cta"
            onClick={() => void withdraw()}
            disabled={busy || !canWithdraw}
          >
            {t('wallet.withdraw_btn')}
          </button>
          <p className="hud-wallet-sheet-hint">
            {canWithdraw ? t('wallet.withdraw_hint') : t('wallet.need_link')}
          </p>
        </div>
      )}

      {msg && <div className="hud-wallet-sheet-msg">{msg}</div>}
    </>
  );
}
