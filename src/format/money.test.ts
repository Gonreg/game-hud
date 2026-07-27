import { describe, expect, it, vi } from 'vitest';
import { fmtAmount } from './money';

describe('fmtAmount', () => {
  it('печатает два знака после запятой', () => {
    expect(fmtAmount(1.5)).toBe('1.50');
    expect(fmtAmount(0)).toBe('0.00');
    expect(fmtAmount(1234.567)).toBe('1234.57');
  });

  it('считает null и undefined нулём, а не падает', () => {
    expect(fmtAmount(null)).toBe('0.00');
    expect(fmtAmount(undefined)).toBe('0.00');
  });

  it('не превращает NaN и Infinity в мусор на экране', () => {
    // Предупреждение здесь ожидаемо — глушим, чтобы вывод тестов оставался чистым.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(fmtAmount(Number.NaN)).toBe('0.00');
    expect(fmtAmount(Number.POSITIVE_INFINITY)).toBe('0.00');
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('не показывает минус нуль на почти нулевых суммах', () => {
    expect(fmtAmount(-0.001)).toBe('0.00');
  });

  it('печатает отрицательные суммы со знаком', () => {
    expect(fmtAmount(-3.2)).toBe('-3.20');
  });

  it('ругается в dev на NaN — это всегда сломанный адаптер', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fmtAmount(Number.NaN);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('молчит на null и undefined — так выглядит незагруженный me', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fmtAmount(null);
    fmtAmount(undefined);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
