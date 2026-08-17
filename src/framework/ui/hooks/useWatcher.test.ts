import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { logger } from '@/logger';

import { useWatcher } from './useWatcher';

const mockUseEffect = jest.fn<(effect: () => void | (() => void)) => void>();

jest.mock('react', () => ({
  useEffect: (effect: () => void | (() => void)) => mockUseEffect(effect),
}));

jest.mock('@/logger', () => ({
  logger: {
    error: jest.fn(),
  },
  RainbowError: class RainbowError extends Error {},
}));

describe('useWatcher', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUseEffect.mockImplementation((effect: () => void | (() => void)) => {
      cleanup?.();
      cleanup = effect() ?? undefined;
    });
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('backs off a failure streak, logs it once, and resets after success', async () => {
    const watchFunction = jest
      .fn<(abortController: AbortController) => Promise<void>>()
      .mockRejectedValueOnce(new Error('rate limited'))
      .mockRejectedValueOnce(new Error('still rate limited'))
      .mockResolvedValue(undefined);

    useWatcher({ interval: 1_000, watchFunction });
    await flushPromises();

    expect(watchFunction).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1_999);
    expect(watchFunction).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(watchFunction).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(3_000);
    expect(watchFunction).toHaveBeenCalledTimes(3);

    await jest.advanceTimersByTimeAsync(1_000);
    expect(watchFunction).toHaveBeenCalledTimes(4);
  });

  it('does not schedule another run until the current run finishes', async () => {
    const firstRun = createDeferred<void>();
    const watchFunction = jest.fn(() => firstRun.promise);

    useWatcher({ interval: 1_000, watchFunction });
    await flushPromises();

    await jest.advanceTimersByTimeAsync(60_000);
    expect(watchFunction).toHaveBeenCalledTimes(1);

    firstRun.resolve();
    await flushPromises();
    await jest.advanceTimersByTimeAsync(999);
    expect(watchFunction).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(watchFunction).toHaveBeenCalledTimes(2);
  });

  it('aborts and clears scheduled work when disabled', async () => {
    const watchFunction = jest.fn<(abortController: AbortController) => Promise<void>>().mockResolvedValue();

    useWatcher({ interval: 1_000, watchFunction });
    await flushPromises();

    const abortController = watchFunction.mock.calls[0][0];
    expect(jest.getTimerCount()).toBe(1);

    useWatcher({ enabled: false, interval: 1_000, watchFunction });

    expect(abortController.signal.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);

    await jest.advanceTimersByTimeAsync(1_000);
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
