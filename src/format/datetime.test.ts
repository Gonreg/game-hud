import { describe, expect, it } from 'vitest';
import { formatWhen } from './datetime';

describe('formatWhen', () => {
  it('возвращает null, когда даты нет', () => {
    expect(formatWhen(undefined, 'en')).toBeNull();
    expect(formatWhen('', 'en')).toBeNull();
  });

  it('возвращает null на неразбираемой строке, а не «Invalid Date»', () => {
    expect(formatWhen('мусор', 'en')).toBeNull();
  });

  it('форматирует валидную дату под локаль', () => {
    const result = formatWhen('2026-07-20T09:00:00.000Z', 'en');
    expect(result).not.toBeNull();
    expect(result).not.toMatch(/Invalid Date/);
  });
});
