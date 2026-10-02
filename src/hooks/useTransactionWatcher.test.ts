import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useWatcher } from '@/framework/ui/hooks/useWatcher';

import { useTransactionWatcher } from './useTransactionWatcher';

type WatcherCallback = (abortController: AbortController) => Promise<void>;

const mockTransactionsRef: { current: string[] } = { current: [] };
let mockMemoizedCallback: { callback: WatcherCallback; dependencies: readonly unknown[] } | undefined;

function mockUseCallback(callback: WatcherCallback, dependencies: readonly unknown[]): WatcherCallback {
  const memoizedCallback = mockMemoizedCallback;
  if (
    memoizedCallback &&
    dependencies.length === memoizedCallback.dependencies.length &&
    dependencies.every((dependency, index) => Object.is(dependency, memoizedCallback.dependencies[index]))
  ) {
    return memoizedCallback.callback;
  }

  mockMemoizedCallback = { callback, dependencies };
  return callback;
}

vi.mock('react', () => ({
  useCallback: (callback: WatcherCallback, dependencies: readonly unknown[]) => mockUseCallback(callback, dependencies),
  useRef: () => mockTransactionsRef,
}));

vi.mock('@/framework/ui/hooks/useWatcher', () => ({
  useWatcher: vi.fn(),
}));

const mockUseWatcher = vi.mocked(useWatcher);

describe('useTransactionWatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMemoizedCallback = undefined;
    mockTransactionsRef.current = [];
  });

  it('keeps the scheduler callback stable while reading the latest transactions', async () => {
    const firstTransactions = ['first'];
    const latestTransactions = ['latest'];
    const watchFunction = vi.fn<(transactions: string[], abortController: AbortController) => Promise<void>>().mockResolvedValue();

    useTransactionWatcher({ transactions: firstTransactions, watchFunction });
    const firstWatch = mockUseWatcher.mock.calls[0][0].watchFunction;

    useTransactionWatcher({ transactions: latestTransactions, watchFunction });
    const latestWatch = mockUseWatcher.mock.calls[1][0].watchFunction;
    const abortController = new AbortController();

    expect(latestWatch).toBe(firstWatch);

    await firstWatch(abortController);

    expect(watchFunction).toHaveBeenCalledWith(latestTransactions, abortController);
  });
});
