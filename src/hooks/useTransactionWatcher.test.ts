import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useWatcher } from '@/framework/ui/hooks/useWatcher';

import { useTransactionWatcher } from './useTransactionWatcher';

type WatcherCallback = (abortController: AbortController) => Promise<void>;

const mockTransactionsRef: { current: string[] } = { current: [] };
const mockUseCallback = jest
  .fn<(callback: WatcherCallback, dependencies: readonly unknown[]) => WatcherCallback>()
  .mockImplementation(callback => callback);

jest.mock('react', () => ({
  useCallback: (callback: WatcherCallback, dependencies: readonly unknown[]) => mockUseCallback(callback, dependencies),
  useRef: () => mockTransactionsRef,
}));

jest.mock('@/framework/ui/hooks/useWatcher', () => ({
  useWatcher: jest.fn(),
}));

const mockUseWatcher = jest.mocked(useWatcher);

describe('useTransactionWatcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransactionsRef.current = [];
  });

  it('reads the latest transactions without restarting the scheduler', async () => {
    const firstTransactions = ['first'];
    const latestTransactions = ['latest'];
    const watchFunction = jest.fn<(transactions: string[], abortController: AbortController) => Promise<void>>().mockResolvedValue();

    useTransactionWatcher({ transactions: firstTransactions, watchFunction });
    useTransactionWatcher({ transactions: latestTransactions, watchFunction });

    const watch = mockUseWatcher.mock.calls[1][0].watchFunction;
    const abortController = new AbortController();

    expect(mockUseCallback).toHaveBeenLastCalledWith(expect.any(Function), [watchFunction]);

    await watch(abortController);

    expect(watchFunction).toHaveBeenCalledWith(latestTransactions, abortController);
  });
});
