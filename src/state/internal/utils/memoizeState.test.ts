import { describe, expect, it, vi } from 'vitest';

import { memoizeState } from './memoizeState';

describe('memoizeState', () => {
  it('computes lazily and reuses the result across unrelated state changes', () => {
    let state = { items: [1], unrelated: 0 };
    const get = vi.fn(() => state);
    const compute = vi.fn((state: { items: number[] }) => [...state.items]);
    const read = memoizeState(get, 'items', compute);

    expect(get).not.toHaveBeenCalled();
    expect(compute).not.toHaveBeenCalled();

    state = { items: [2], unrelated: 0 };
    const result = read();

    expect(result).toEqual([2]);
    expect(read()).toBe(result);

    state = { ...state, unrelated: 1 };

    expect(read()).toBe(result);
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('recomputes when either selected reference changes', () => {
    let state = { left: [1], right: [2] };
    const compute = vi.fn((state: { left: number[]; right: number[] }) => [...state.left, ...state.right]);
    const read = memoizeState(() => state, 'left', 'right', compute);
    const first = read();

    state = { ...state, left: [1] };
    const second = read();

    expect(second).toEqual([1, 2]);
    expect(second).not.toBe(first);
    expect(read()).toBe(second);
    expect(compute).toHaveBeenCalledTimes(2);

    state = { ...state, right: [3] };
    const third = read();

    expect(third).toEqual([1, 3]);
    expect(read()).toBe(third);
    expect(compute).toHaveBeenCalledTimes(3);
  });

  it('caches undefined until a dependency changes', () => {
    let state = { value: 1 };
    const compute = vi.fn(() => undefined);
    const read = memoizeState(() => state, 'value', compute);

    expect(read()).toBeUndefined();
    expect(read()).toBeUndefined();
    expect(compute).toHaveBeenCalledTimes(1);

    state = { value: 2 };

    expect(read()).toBeUndefined();
    expect(read()).toBeUndefined();
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('compares dependencies using Object.is', () => {
    let state = { value: NaN };
    const compute = vi.fn((state: { value: number }) => state.value);
    const read = memoizeState(() => state, 'value', compute);

    expect(read()).toBeNaN();
    expect(read()).toBeNaN();
    expect(compute).toHaveBeenCalledTimes(1);

    state = { value: 0 };
    expect(read()).toBe(0);

    state = { value: -0 };
    expect(read()).toBe(-0);
    expect(compute).toHaveBeenCalledTimes(3);
  });
});
