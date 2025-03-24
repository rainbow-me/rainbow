import { useEffect, useMemo, useRef } from 'react';
import useAccountSettings from './useAccountSettings';
import useCoinListEditOptions from './useCoinListEditOptions';
import useCoinListEdited from './useCoinListEdited';
import useHiddenTokens from './useHiddenTokens';
import useIsWalletEthZero from './useIsWalletEthZero';
import useShowcaseTokens from './useShowcaseTokens';
import useWallets from './useWallets';
import { buildBriefWalletSectionsSelector, WalletSectionsState } from '@/helpers/buildWalletSections';
import useWalletsWithBalancesAndNames from './useWalletsWithBalancesAndNames';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useRemoteConfig } from '@/model/remoteConfig';
import { positionsStore } from '@/resources/defi/PositionsQuery';
import { claimablesStore } from '@/resources/addys/claimables/query';
import { useExperimentalConfig } from '@/config/experimentalHooks';
import { analyticsV2 } from '@/analytics';
import useUniqueTokens from './useUniqueTokens';
import { useNftSort } from './useNFTsSortBy';
import { ENABLE_WALLETSCREEN_PERFORMANCE_LOGS } from 'react-native-dotenv';

const ENABLE_PERF_LOGGING = ENABLE_WALLETSCREEN_PERFORMANCE_LOGS === '1';

function logPerf(label: string, time: number) {
  if (ENABLE_PERF_LOGGING) {
    console.log(`⏱️ [PERF] ${label}: ${time.toFixed(4)}ms`);
  }
}

function usePerfHook<T>(useHook: () => T, label: string) {
  const startTime = ENABLE_PERF_LOGGING ? performance.now() : 0;
  const result = useHook();

  if (ENABLE_PERF_LOGGING) {
    const endTime = performance.now();
    logPerf(label, endTime - startTime);
  }

  return result;
}

function useCachedSelector<T, P>(selector: (params: P) => T, params: P, deps: unknown[], label: string): T {
  const cacheRef = useRef<{
    lastParams: P | null;
    lastResult: T | null;
  }>({
    lastParams: null,
    lastResult: null,
  });

  return useMemo(() => {
    const start = ENABLE_PERF_LOGGING ? performance.now() : 0;

    const result = selector(params);

    cacheRef.current = {
      lastParams: params,
      lastResult: result,
    };

    if (ENABLE_PERF_LOGGING) {
      const end = performance.now();
      logPerf(`${label}-computation`, end - start);
    }

    return result;
  }, [...deps, label, params, selector]);
}

export interface WalletSectionsResult {
  briefSectionsData: any[];
  isEmpty: boolean;
  isWalletEthZero: boolean;
  isLoadingUserAssets: boolean;
  isLoadingBalance: boolean;
  hasNFTs?: boolean;
}

export default function useWalletSectionsData({
  type,
}: {
  type?: string;
} = {}): WalletSectionsResult {
  const hookStart = ENABLE_PERF_LOGGING ? performance.now() : 0;

  const { nftSort } = usePerfHook(useNftSort, 'useNftSort');
  const { accountAddress, language, network, nativeCurrency } = usePerfHook(useAccountSettings, 'useAccountSettings');
  const { selectedWallet, isReadOnlyWallet } = usePerfHook(useWallets, 'useWallets');
  const { showcaseTokens } = usePerfHook(useShowcaseTokens, 'useShowcaseTokens');
  const { hiddenTokens } = usePerfHook(useHiddenTokens, 'useHiddenTokens');
  const remoteConfig = usePerfHook(useRemoteConfig, 'useRemoteConfig');
  const experimentalConfig = usePerfHook(useExperimentalConfig, 'useExperimentalConfig');
  const isWalletEthZero = usePerfHook(useIsWalletEthZero, 'useIsWalletEthZero');

  const hiddenAssets = useUserAssetsStore(state => state.hiddenAssets);
  const isLoadingUserAssets = useUserAssetsStore(state => state.getStatus().isInitialLoading);
  const sortedAssets = useUserAssetsStore(state => state.legacyUserAssets);
  const positions = positionsStore(state => state.getData());
  const claimables = claimablesStore(state => state.getData());

  const { sendableUniqueTokens, uniqueTokens, isFetchingNfts } = usePerfHook(useUniqueTokens, 'useUniqueTokens');

  const walletsWithBalancesAndNames = usePerfHook(useWalletsWithBalancesAndNames, 'useWalletsWithBalancesAndNames');

  const accountWithBalance = useMemo(() => {
    return walletsWithBalancesAndNames[selectedWallet.id]?.addresses.find(
      address => address.address.toLowerCase() === accountAddress.toLowerCase()
    );
  }, [walletsWithBalancesAndNames, selectedWallet, accountAddress]);

  const { pinnedCoinsObj: pinnedCoins } = usePerfHook(useCoinListEditOptions, 'useCoinListEditOptions');
  const { isCoinListEdited } = usePerfHook(useCoinListEdited, 'useCoinListEdited');

  useEffect(() => {
    if (isLoadingUserAssets || type !== 'wallet') return;

    const effectStart = performance.now();

    const params = { screen: 'wallet' as const, no_icon: 0, no_price: 0, total_tokens: sortedAssets.length };
    for (const asset of sortedAssets) {
      if (!asset.icon_url) params.no_icon += 1;
      if (!asset.price?.relative_change_24h) params.no_price += 1;
    }
    analyticsV2.track(analyticsV2.event.tokenList, params);

    if (ENABLE_PERF_LOGGING) {
      const effectEnd = performance.now();
      logPerf('analytics-effect', effectEnd - effectStart);
    }
  }, [isLoadingUserAssets, sortedAssets, type]);

  const walletSectionsState: WalletSectionsState = useMemo(
    () => ({
      hiddenAssets,
      isCoinListEdited,
      isLoadingUserAssets,
      language,
      nativeCurrency,
      network,
      pinnedCoins,
      sendableUniqueTokens,
      sortedAssets,
      accountBalanceDisplay: accountWithBalance?.balancesMinusHiddenBalances,
      isLoadingBalance: !accountWithBalance?.balancesMinusHiddenBalances,
      isWalletEthZero,
      hiddenTokens,
      isReadOnlyWallet,
      listType: type,
      showcaseTokens,
      uniqueTokens,
      isFetchingNfts,
      remoteConfig,
      experimentalConfig,
      positions,
      claimables,
      nftSort,
    }),
    [
      hiddenAssets,
      isCoinListEdited,
      isLoadingUserAssets,
      language,
      nativeCurrency,
      network,
      pinnedCoins,
      sendableUniqueTokens,
      sortedAssets,
      accountWithBalance?.balancesMinusHiddenBalances,
      isWalletEthZero,
      hiddenTokens,
      isReadOnlyWallet,
      type,
      showcaseTokens,
      uniqueTokens,
      isFetchingNfts,
      remoteConfig,
      experimentalConfig,
      positions,
      claimables,
      nftSort,
    ]
  );

  const { briefSectionsData, isEmpty } = useCachedSelector(
    buildBriefWalletSectionsSelector,
    walletSectionsState,
    [
      hiddenAssets,
      isCoinListEdited,
      isLoadingUserAssets,
      language,
      nativeCurrency,
      network,
      pinnedCoins,
      sendableUniqueTokens,
      sortedAssets,
      accountWithBalance?.balancesMinusHiddenBalances,
      accountWithBalance?.balances,
      isWalletEthZero,
      hiddenTokens,
      isReadOnlyWallet,
      type,
      showcaseTokens,
      uniqueTokens,
      isFetchingNfts,
      remoteConfig,
      experimentalConfig,
      positions,
      claimables,
      nftSort,
    ],
    'walletSections'
  );

  // Add the missing properties needed by WalletScreen
  const result: WalletSectionsResult = {
    briefSectionsData,
    isEmpty,
    isWalletEthZero,
    isLoadingUserAssets,
    isLoadingBalance: !accountWithBalance?.balances,
    hasNFTs: uniqueTokens.length > 0,
  };

  if (ENABLE_PERF_LOGGING) {
    const hookEnd = performance.now();
    logPerf('useWalletSectionsData-total', hookEnd - hookStart);
  }

  return result;
}

/**
 * Performance Improvement Suggestions:
 *
 * 1. Consider splitting the large WalletSectionsState into smaller, focused pieces
 *    - Separate token data from NFT data
 *    - Create independent hooks for positions and claimables
 *
 * 2. Implement data fetching optimizations:
 *    - Use SWR or React Query's stale-while-revalidate pattern
 *    - Implement incremental loading (load essential data first, then secondary data)
 *    - Consider using virtualization for long lists
 *
 * 3. Memoization improvements:
 *    - Move expensive computations to web workers if possible
 *    - Use structural sharing to reduce rebuilding large objects
 *    - Cache selector results with a TTL (Time To Live)
 *
 * 4. Reduce re-renders:
 *    - Implement useCallback for event handlers
 *    - Use React.memo for pure components
 *    - Consider using Context selectors for more granular updates
 *
 * 5. Lazy loading:
 *    - Defer loading of claimables and positions until after main assets are displayed
 *    - Use Suspense boundaries to progressively enhance the UI
 */
