import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useHudAdapter, useHudConfig } from '../context/HudProvider';
import { useHudStore } from '../store/hudStore';
import type { SupportTheme } from '../adapter/types';

const MAX_TEXT = 5000;
const MIN_TEXT = 5;
const MAX_FILES = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_PREFIX = ['image/', 'video/'];
const ALLOWED_EXACT = ['application/pdf'];

function isAllowed(mime: string): boolean {
  return ALLOWED_EXACT.includes(mime) || ALLOWED_PREFIX.some((p) => mime.startsWith(p));
}

export function HelpScreen() {
  const { t } = useTranslation();
  const adapter = useHudAdapter();
  const { botUsername } = useHudConfig();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const helpTheme = useHudStore((s) => s.helpTheme);
  const clearHelpTheme = useHudStore((s) => s.clearHelpTheme);
  const [theme, setTheme] = useState<SupportTheme>(helpTheme ?? 'other');
  const inputRef = useRef<HTMLInputElement>(null);

  // Тема, с которой открыли экран (например, CTA «увеличить доход» из
  // рефералки подставляет 'partner') — одноразовое поле стора, гасим в
  // useEffect при монтировании, а не в обработчике отправки: так очистка
  // привязана к жизненному циклу экрана (см. комментарий в hudStore.ts).
  useEffect(() => {
    if (helpTheme) {
      setTheme(helpTheme);
      clearHelpTheme();
    }
  }, [helpTheme, clearHelpTheme]);

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (picked.length === 0) return;
    const next = [...files];
    for (const f of picked) {
      if (next.length >= MAX_FILES) {
        setMsg({ kind: 'err', text: t('support.too_many_files') });
        break;
      }
      if (f.size > MAX_BYTES) {
        setMsg({ kind: 'err', text: t('support.file_too_big', { name: f.name }) });
        continue;
      }
      if (!isAllowed(f.type)) {
        setMsg({ kind: 'err', text: t('support.bad_type', { type: f.type || '?' }) });
        continue;
      }
      next.push(f);
    }
    setFiles(next);
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const trimmed = text.trim();
  const canSend = trimmed.length >= MIN_TEXT && trimmed.length <= MAX_TEXT && !sending;

  const submit = async () => {
    if (!canSend) return;
    setSending(true);
    setMsg(null);
    try {
      const r = await adapter.postSupport(trimmed, theme, files);
      const filesFragment = r.filesCount ? t('support.ok_files', { count: r.filesCount }) : '';
      setMsg({
        kind: 'ok',
        text: t('support.ok', { id: r.ticketId, files: filesFragment }),
      });
      setText('');
      setFiles([]);
    } catch (e) {
      setMsg({ kind: 'err', text: t('support.error_prefix', { message: (e as Error).message }) });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="hud-profile-section">
      <div className="hud-profile-card">
        <div className="hud-profile-empty" style={{ padding: '4px 4px 12px', textAlign: 'left' }}>
          {t('support.contact_hint', { bot: botUsername })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {(['finance', 'game', 'account', 'bug', 'partner', 'other'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setTheme(opt)}
              className={`hud-profile-chip${theme === opt ? ' hud-profile-chip--active' : ''}`}
            >
              {t(`support.theme_${opt}`)}
            </button>
          ))}
        </div>
        <div className="hud-profile-card__label" style={{ marginTop: 14, marginBottom: 8 }}>
          {t('support.describe')}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
          placeholder={t('support.placeholder')}
          rows={5}
          style={{
            width: '100%',
            background: '#1a1f33',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: 10,
            fontSize: 14,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ fontSize: 11, color: '#9aa3c4', marginTop: 4, textAlign: 'right' }}>
          {text.length}/{MAX_TEXT}
        </div>

        <div className="hud-profile-card__label" style={{ marginTop: 10 }}>
          {t('support.attachments')}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginTop: 6,
          }}
        >
          {files.map((f, idx) => (
            <FilePreview key={`${f.name}-${idx}`} file={f} onRemove={() => removeFile(idx)} />
          ))}
          {files.length < MAX_FILES && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 10,
                border: '2px dashed rgba(255, 211, 90, 0.4)',
                background: 'transparent',
                color: '#ffd35a',
                fontSize: 24,
                cursor: 'pointer',
              }}
              aria-label="+"
            >
              +
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,video/*"
          style={{ display: 'none' }}
          onChange={onPick}
        />
        <div style={{ fontSize: 11, color: '#9aa3c4', marginTop: 6 }}>
          {t('support.attachments_hint')}
        </div>

        <button
          type="button"
          className="hud-profile-btn hud-profile-btn--primary"
          style={{ marginTop: 12 }}
          onClick={() => void submit()}
          disabled={!canSend}
        >
          {sending ? t('support.sending') : t('support.send')}
        </button>

        {msg && (
          <div
            style={{
              marginTop: 10,
              padding: '10px 12px',
              borderRadius: 10,
              fontSize: 13,
              background:
                msg.kind === 'ok' ? 'rgba(45, 212, 191, 0.12)' : 'rgba(255, 122, 89, 0.12)',
              color: msg.kind === 'ok' ? '#2dd4bf' : '#ff7a59',
            }}
          >
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const url = isImage || isVideo ? URL.createObjectURL(file) : null;
  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '1 / 1',
        borderRadius: 10,
        background: '#1a1f33',
        overflow: 'hidden',
      }}
    >
      {isImage && url && (
        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {isVideo && url && (
        <video src={url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {!isImage && !isVideo && (
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            width: '100%',
            height: '100%',
            color: '#9aa3c4',
            fontSize: 11,
            padding: 4,
            textAlign: 'center',
          }}
        >
          PDF
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="×"
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: 12,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
