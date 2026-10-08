import { createBaseStore } from '@storesjs/stores';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { liveBalancesSummary, useLiveWalletBalance } from '@/hooks/useLiveWalletBalance';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { useWalletBalancesStore } from './walletBalancesStore';

vi.mock('@/state/assets/userAssetsStoreManager', async () => ({
  userAssetsStoreManager: (await import('@storesjs/stores')).createBaseStore(() => ({ currency: 'USD' })),
}));
vi.mock('@/state/wallets/walletsStore', async () => ({
  useWalletsStore: (await import('@storesjs/stores')).createBaseStore(() => ({ accountAddress: '0xAbC' })),
}));
vi.mock('@/state/assets/userAssets', async () => ({
  useUserAssetsStore: (await import('@storesjs/stores')).createBaseStore(() => ({
    address: '0xAbC',
    status: 'success',
    getTotalBalance: () => 100,
    userAssets: new Map(),
    hiddenAssetsBalance: '10',
  })),
}));
vi.mock('@/state/liveTokens/liveTokensStore', async () => ({
  useLiveTokensStore: (await import('@storesjs/stores')).createBaseStore(() => ({ tokens: {} })),
}));
vi.mock('@/features/perps/stores/derived/useHyperliquidBalance', async () => ({
  useHyperliquidBalance: (await import('@storesjs/stores')).createBaseStore(() => '30'),
}));
vi.mock('@/features/polymarket/stores/derived/usePolymarketAccountValueSummary', async () => ({
  usePolymarketAccountValueSummary: (await import('@storesjs/stores')).createBaseStore(() => ({ totalValueNative: '40' })),
}));
vi.mock('@/features/positions/stores/positionsStore', async () => ({
  usePositionsStore: (await import('@storesjs/stores')).createBaseStore(() => ({
    getBalance: () => '20',
    getData: () => null,
    getCacheEntry: () => null,
  })),
}));
vi.mock('@/state/claimables/claimables', async () => ({
  useClaimablesStore: (await import('@storesjs/stores')).createBaseStore(() => ({
    getBalance: () => '5',
    getData: () => null,
    getCacheEntry: () => null,
  })),
}));
vi.mock('@/features/currency/stores/currencyConversionStore', async () => ({
  useCurrencyConversionStore: (await import('@storesjs/stores')).createBaseStore(() => ({ getData: () => ({}) })),
}));
vi.mock('@/features/currency/utils/nativeDisplay', () => ({
  convertAmountToNativeDisplay: (amount: string, currency: string) => `${currency} ${Number(amount).toFixed(2)}`,
}));
vi.mock('@/helpers/utilities', () => ({
  add: (a: string, b: string) => String(Number(a) + Number(b)),
  subtract: (a: string, b: string) => String(Number(a) - Number(b)),
  multiply: (a: string, b: string) => String(Number(a) * Number(b)),
  greaterThan: (a: string, b: string) => Number(a) > Number(b),
}));

describe('cached wallet balances', () => {
  let unsubscribe: () => void;

  beforeEach(async () => {
    vi.useFakeTimers();
    userAssetsStoreManager.setState({ currency: 'USD' });
    useWalletBalancesStore.setState({ balances: {} });
    useWalletsStore.setState({ accountAddress: '0xAbC' });
    useUserAssetsStore.setState({
      address: '0xAbC',
      status: 'success',
      getTotalBalance: () => 100,
      hiddenAssetsBalance: '10',
    });
    usePositionsStore.setState({ getData: () => null });
    // The same subscription used by useListen, without mounting the wallet switcher.
    unsubscribe = liveBalancesSummary.subscribe(
      state => state,
      snapshot => useWalletBalancesStore.getState().cacheBalance(snapshot),
      { fireImmediately: true }
    );
    await vi.advanceTimersByTimeAsync(250);
  });

  afterEach(async () => {
    unsubscribe();
    await vi.runOnlyPendingTimersAsync();
    vi.useRealTimers();
  });

  it('caches assets, DeFi, claimables, perps and Polymarket, subtracting hidden assets once', async () => {
    expect(useLiveWalletBalance.getState()).toBe('USD 195.00');
    expect(useWalletBalancesStore.getState().balances['0xabc']).toEqual({
      totalBalanceAmount: '195',
      totalBalanceDisplay: 'USD 195.00',
      balanceMinusHiddenDisplay: 'USD 185.00',
    });
    useUserAssetsStore.setState({ getTotalBalance: () => 110 });
    await vi.advanceTimersByTimeAsync(250);
    expect(useWalletBalancesStore.getState().balances['0xabc']?.balanceMinusHiddenDisplay).toBe('USD 195.00');
  });

  it('keeps the old wallet snapshot and waits for the selected wallet to load', async () => {
    useWalletsStore.setState({ accountAddress: '0xDef' });
    await vi.advanceTimersByTimeAsync(250);
    expect(useWalletBalancesStore.getState().balances['0xdef']).toBeUndefined();
    useUserAssetsStore.setState({ address: '0xDef', status: 'loading', getTotalBalance: () => 0 });
    await vi.advanceTimersByTimeAsync(250);
    expect(useWalletBalancesStore.getState().balances['0xdef']).toBeUndefined();
    useUserAssetsStore.setState({ status: 'success', getTotalBalance: () => 50 });
    await vi.advanceTimersByTimeAsync(250);
    expect(useWalletBalancesStore.getState().balances['0xdef']?.totalBalanceAmount).toBe('145');
    expect(useWalletBalancesStore.getState().balances['0xabc']?.totalBalanceAmount).toBe('195');
  });

  it('isolates currencies, rejects delayed snapshots, and rehydrates the previous currency', async () => {
    const usdSnapshot = liveBalancesSummary.getState();
    useUserAssetsStore.setState({ status: 'loading' });
    userAssetsStoreManager.setState({ currency: 'EUR' });
    useWalletBalancesStore.setState({ balances: {} });
    await vi.advanceTimersByTimeAsync(250);
    expect(useWalletBalancesStore.getState().balances).toEqual({});
    useWalletBalancesStore.getState().cacheBalance(usdSnapshot);
    expect(useWalletBalancesStore.getState().balances).toEqual({});
    useUserAssetsStore.setState({ status: 'success', getTotalBalance: () => 80 });
    await vi.advanceTimersByTimeAsync(250);
    expect(useWalletBalancesStore.getState().balances['0xabc']?.totalBalanceDisplay).toBe('EUR 175.00');
    userAssetsStoreManager.setState({ currency: 'USD' });
    expect(useWalletBalancesStore.getState().balances['0xabc']?.totalBalanceDisplay).toBe('USD 195.00');
  });

  it('does not overwrite the cache with previous-wallet query data', async () => {
    usePositionsStore.setState({
      getData: () => ({}) as NonNullable<ReturnType<ReturnType<typeof usePositionsStore.getState>['getData']>>,
    });
    useUserAssetsStore.setState({ getTotalBalance: () => 999 });
    await vi.advanceTimersByTimeAsync(250);
    expect(liveBalancesSummary.getState().cachedBalance).toBeNull();
    expect(useWalletBalancesStore.getState().balances['0xabc']?.totalBalanceAmount).toBe('195');
  });

  it('distinguishes a known zero balance from an unvisited wallet and preserves it during loading', () => {
    const snapshot = {
      ...liveBalancesSummary.getState(),
      cachedBalance: { totalBalanceAmount: '0', totalBalanceDisplay: 'USD 0.00', balanceMinusHiddenDisplay: 'USD 0.00' },
    };
    useWalletBalancesStore.getState().cacheBalance(snapshot);
    useWalletBalancesStore.getState().cacheBalance({ ...snapshot, cachedBalance: null });
    expect(useWalletBalancesStore.getState().balances['0xabc']?.totalBalanceDisplay).toBe('USD 0.00');
    expect(useWalletBalancesStore.getState().balances['0xdef']).toBeUndefined();
  });

  it('persists snapshots across store recreation and skips identical writes', () => {
    const listener = vi.fn();
    const stop = useWalletBalancesStore.subscribe(listener);
    useWalletBalancesStore.getState().cacheBalance(liveBalancesSummary.getState());
    expect(listener).not.toHaveBeenCalled();
    stop();
    const restored = createBaseStore(() => ({ balances: {} }), { storageKey: 'walletBalances_USD' });
    expect(restored.getState().balances).toEqual(useWalletBalancesStore.getState().balances);
  });
});
