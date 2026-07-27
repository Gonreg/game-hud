import { useEffect, useState, type ReactNode } from 'react';

type LegalDoc = 'terms' | 'privacy' | 'offer';

const FILES: Record<LegalDoc, string> = {
  terms: '/legal/terms.md',
  privacy: '/legal/privacy.md',
  offer: '/legal/offer.md',
};

// Инлайновая разметка: **жирный** и `код`. Документ — свой доверенный
// статический файл, но React-узлы всё равно собираем сами, а не через
// dangerouslySetInnerHTML (см. обоснование в шапке задачи — единственный
// экран, где канон matreshka, а не fatman, ради безопасности).
function inline(text: string, key: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`(.+?)`/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] != null) nodes.push(<strong key={`${key}-b${i}`}>{m[1]}</strong>);
    else nodes.push(<code key={`${key}-c${i}`}>{m[2]}</code>);
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// Блочная разметка: заголовки #/##, списки `- `, абзацы через пустую строку.
function renderMarkdown(md: string): ReactNode[] {
  const out: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flushPara = () => {
    if (!para.length) return;
    const k = `p${out.length}`;
    out.push(<p key={k}>{inline(para.join(' '), k)}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list.length) return;
    const k = `ul${out.length}`;
    out.push(
      <ul key={k}>
        {list.map((li, j) => (
          <li key={`${k}-${j}`}>{inline(li, `${k}-${j}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  for (const raw of md.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    if (/^##\s+/.test(line)) {
      flushPara();
      flushList();
      const k = `h2${out.length}`;
      out.push(<h2 key={k}>{inline(line.replace(/^##\s+/, ''), k)}</h2>);
    } else if (/^#\s+/.test(line)) {
      flushPara();
      flushList();
      const k = `h1${out.length}`;
      out.push(<h1 key={k}>{inline(line.replace(/^#\s+/, ''), k)}</h1>);
    } else if (/^-\s+/.test(line)) {
      flushPara();
      list.push(line.replace(/^-\s+/, ''));
    } else if (line === '') {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return out;
}

export function LegalScreen({ doc }: { doc: LegalDoc }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Документ — статический .md из public/ каждой игры, а не из адаптера:
  // это не бэкенд-данные, useHudResource тут не подходит (её fetcher ходит
  // через HudAdapter, а не по произвольному относительному пути).
  useEffect(() => {
    let alive = true;
    setText(null);
    setError(null);
    fetch(FILES[doc])
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      })
      .then((tx) => {
        if (alive) setText(tx);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      alive = false;
    };
  }, [doc]);

  if (error) return <div className="hud-profile-error">{error}</div>;

  return (
    <div className="hud-legal-screen">
      <div className="hud-legal-screen__doc">{text !== null ? renderMarkdown(text) : null}</div>
    </div>
  );
}
