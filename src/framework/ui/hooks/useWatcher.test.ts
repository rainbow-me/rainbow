import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { logger } from '@/logger';

import { useWatcher } from './useWatcher';

const mockUseEffect = vi.fn<(effect: () => void | (() => void)) => void>();

vi.mock('react', () => ({
  useEffect: (effect: () => void | (() => void)) => mockUseEffect(effect),
}));

vi.mock('@/logger', () => ({
  logger: {
    error: vi.fn(),
  },
  RainbowError: class RainbowError extends Error {},
}));

describe('useWatcher', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockUseEffect.mockImplementation((effect: () => void | (() => void)) => {
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

  it('backs off a failure streak, logs it once, and resets after success', async () => {
    const watchFunction = vi
      .fn<(abortController: AbortController) => Promise<void>>()
      .mockRejectedValueOnce(new Error('rate limited'))
      .mockRejectedValueOnce(new Error('still rate limited'))
      .mockResolvedValue(undefined);

    useWatcher({ interval: 1_000, watchFunction });
    await flushPromises();

    expect(watchFunction).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1_999);
    expect(watchFunction).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(watchFunction).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(3_000);
    expect(watchFunction).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(watchFunction).toHaveBeenCalledTimes(4);
  });

  it('does not schedule another run until the current run finishes', async () => {
    const firstRun = createDeferred<void>();
    const watchFunction = vi.fn(() => firstRun.promise);

    useWatcher({ interval: 1_000, watchFunction });
    await flushPromises();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(watchFunction).toHaveBeenCalledTimes(1);

    firstRun.resolve();
    await flushPromises();
    await vi.advanceTimersByTimeAsync(999);
    expect(watchFunction).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(watchFunction).toHaveBeenCalledTimes(2);
  });

  it('aborts and clears scheduled work when disabled', async () => {
    const watchFunction = vi.fn<(abortController: AbortController) => Promise<void>>().mockResolvedValue();

    useWatcher({ interval: 1_000, watchFunction });
    await flushPromises();

    const abortController = watchFunction.mock.calls[0][0];
    expect(vi.getTimerCount()).toBe(1);

    useWatcher({ enabled: false, interval: 1_000, watchFunction });

    expect(abortController.signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(watchFunction).toHaveBeenCalledTimes(1);
  });
});

function createDeferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  const promise = new Promise<T>(res => {
    resolve = res;
  });

  return { promise, resolve };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
