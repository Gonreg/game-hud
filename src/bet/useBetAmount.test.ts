import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBetAmount } from './useBetAmount';

describe('useBetAmount', () => {
  it('стартует с минимума', () => {
    const { result } = renderHook(() => useBetAmount({ min: 0.1, max: 100, balance: 50 }));
    expect(result.current.amount).toBe(0.1);
  });

  it('шаг увеличивает и уменьшает сумму на min', () => {
    const { result } = renderHook(() => useBetAmount({ min: 0.1, max: 100, balance: 50 }));
    act(() => result.current.step(1));
    expect(result.current.amount).toBeCloseTo(0.2);
    act(() => result.current.step(-1));
    expect(result.current.amount).toBeCloseTo(0.1);
  });

  it('шаг вниз не опускает сумму ниже минимума', () => {
    const { result } = renderHook(() => useBetAmount({ min: 0.1, max: 100, balance: 50 }));
    act(() => result.current.step(-1));
    expect(result.current.amount).toBe(0.1);
  });

  it('не поднимает сумму выше баланса, даже если max больше', () => {
    const { result } = renderHook(() => useBetAmount({ min: 0.1, max: 100, balance: 2 }));
    act(() => result.current.set(50));
    expect(result.current.amount).toBe(2);
  });

  it('не поднимает сумму выше max, даже если баланс больше', () => {
    const { result } = renderHook(() => useBetAmount({ min: 0.1, max: 5, balance: 100 }));
    act(() => result.current.set(50));
    expect(result.current.amount).toBe(5);
  });

  it('удвоение упирается в потолок', () => {
    const { result } = renderHook(() => useBetAmount({ min: 0.1, max: 5, balance: 100 }));
    act(() => result.current.set(4));
    act(() => result.current.double());
    expect(result.current.amount).toBe(5);
  });

  it('max() ставит сумму на потолок', () => {
    const { result } = renderHook(() => useBetAmount({ min: 0.1, max: 100, balance: 7 }));
    act(() => result.current.max());
    expect(result.current.amount).toBe(7);
  });

  it('NaN не становится ставкой', () => {
    const { result } = renderHook(() => useBetAmount({ min: 0.1, max: 100, balance: 50 }));
    act(() => result.current.set(NaN));
    expect(result.current.amount).toBe(0.1);
  });

  it('valid === false, когда баланса не хватает даже на минимум', () => {
    const { result } = renderHook(() => useBetAmount({ min: 1, max: 100, balance: 0.5 }));
    expect(result.current.valid).toBe(false);
  });

  it('при balance: null потолком служит только max', () => {
    const { result } = renderHook(() => useBetAmount({ min: 0.1, max: 10, balance: null }));
    act(() => result.current.set(1000));
    expect(result.current.amount).toBe(10);
    expect(result.current.ceiling).toBe(10);
  });
});
