import { describe, expect, it } from 'vitest';
import { hudLocales, SUPPORTED_LANGUAGES } from './index';

function flatKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flatKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

const HUD_NAMESPACES = [
  'common',
  'profile',
  'wallet',
  'history',
  'stats',
  'leaderboard',
  'referrals',
  'notifications',
  'language',
  'support',
];

describe('словари библиотеки', () => {
  it('есть на всех десяти языках', () => {
    expect(Object.keys(hudLocales).sort()).toEqual([...SUPPORTED_LANGUAGES].sort());
  });

  it('содержат только неймспейсы библиотеки, без игровых', () => {
    for (const [lang, dict] of Object.entries(hudLocales)) {
      const extra = Object.keys(dict).filter((k) => !HUD_NAMESPACES.includes(k));
      expect(extra, `лишние неймспейсы в ${lang}`).toEqual([]);
    }
  });

  it('каждый язык покрывает все ключи английского', () => {
    const base = flatKeys(hudLocales.en);
    for (const [lang, dict] of Object.entries(hudLocales)) {
      const has = new Set(flatKeys(dict));
      const missing = base.filter((k) => !has.has(k));
      expect(missing, `не переведено в ${lang}`).toEqual([]);
    }
  });

  it('не тащит ключей, которых нет в английском', () => {
    // Односторонней проверки выше недостаточно: fatman для восьми языков хранит
    // ключи старой, немигрированной схемы уведомлений (notifications.deposits,
    // .withdrawals, .referrals, .big_wins), которых в en и ru уже нет. Без этого
    // теста они молча уехали бы в npm-пакет как мёртвый груз.
    const base = new Set(flatKeys(hudLocales.en));
    for (const [lang, dict] of Object.entries(hudLocales)) {
      const extra = flatKeys(dict).filter((k) => !base.has(k));
      expect(extra, `лишние ключи в ${lang}`).toEqual([]);
    }
  });

  it('ключ profile.title на месте — по нему провайдер проверяет подмешивание', () => {
    expect(hudLocales.en.profile).toHaveProperty('title');
  });
});
