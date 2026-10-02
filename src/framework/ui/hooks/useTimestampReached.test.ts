import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTimestampReached } from './useTimestampReached';

const mockUseEffect = vi.fn<(effect: () => void | (() => void)) => void>();
let mockState: boolean | undefined;

vi.mock('react', async () => ({
  ...((await vi.importActual<typeof import('react')>('react')) as object),
  useEffect: (effect: () => void | (() => void)) => mockUseEffect(effect),
  useState: (initialValue: () => boolean) => {
    mockState ??= initialValue();
    return [mockState, (next: boolean) => void (mockState = next)] as const;
  },
}));

describe('useTimestampReached', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));
    mockState = undefined;
    mockUseEffect.mockImplementation(effect => {
      cleanup?.();
      cleanup = effect() ?? undefined;
    });
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('reports a future timestamp as reached only once it passes', () => {
    const timestamp = Date.now() + 5_000;

    expect(useTimestampReached(timestamp)).toBe(false);

    vi.advanceTimersByTime(4_999);
    expect(useTimestampReached(timestamp)).toBe(false);

    vi.advanceTimersByTime(1);
    expect(useTimestampReached(timestamp)).toBe(true);
  });

  it('reports a timestamp already in the past as reached without arming a timer', () => {
    expect(useTimestampReached(Date.now() - 1)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('resets and clears its timer when the timestamp is removed', () => {
    expect(useTimestampReached(Date.now() + 1_000)).toBe(false);
    expect(vi.getTimerCount()).toBe(1);

    expect(useTimestampReached(null)).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears its previous timer when a future timestamp changes', () => {
    const initialTimestamp = Date.now() + 1_000;
    const updatedTimestamp = Date.now() + 5_000;

    expect(useTimestampReached(initialTimestamp)).toBe(false);
    expect(vi.getTimerCount()).toBe(1);

    expect(useTimestampReached(updatedTimestamp)).toBe(false);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(1_000);
    expect(useTimestampReached(updatedTimestamp)).toBe(false);

    vi.advanceTimersByTime(4_000);
    expect(useTimestampReached(updatedTimestamp)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
