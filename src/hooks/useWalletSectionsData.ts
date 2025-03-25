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
import { REMOTE_CARDS, useExperimentalConfig } from '@/config/experimentalHooks';
import { analyticsV2 } from '@/analytics';
import useUniqueTokens from './useUniqueTokens';
import { useNftSort } from './useNFTsSortBy';
import { remoteCardsStore } from '@/state/remoteCards/remoteCards';
import { CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { AssetListType } from '@/components/asset-list/RecyclerAssetList2';

function useCachedSelector<T, P>(selector: (params: P) => T, params: P, deps: unknown[]): T {
  const cacheRef = useRef<{
    lastParams: P | null;
    lastResult: T | null;
  }>({
    lastParams: null,
    lastResult: null,
  });

  return useMemo(() => {
    const result = selector(params);

    cacheRef.current = {
      lastParams: params,
      lastResult: result,
    };

    return result;
  }, [...deps, params, selector]);
}

export interface WalletSectionsResult {
  briefSectionsData: CellTypes[];
  isEmpty: boolean;
  isWalletEthZero: boolean;
  isLoadingUserAssets: boolean;
  isLoadingBalance: boolean;
  hasNFTs: boolean;
}

export default function useWalletSectionsData({
  type,
}: {
  type?: AssetListType;
} = {}): WalletSectionsResult {
  const { nftSort } = useNftSort();
  const { accountAddress, language, network, nativeCurrency } = useAccountSettings();
  const { selectedWallet, isReadOnlyWallet } = useWallets();
  const { showcaseTokens } = useShowcaseTokens();
  const { hiddenTokens } = useHiddenTokens();
  const remoteConfig = useRemoteConfig();
  const experimentalConfig = useExperimentalConfig();
  const isWalletEthZero = useIsWalletEthZero();

  const cardIds = remoteCardsStore(state => state.getCardIdsForScreen('WALLET_SCREEN'));
  const remoteCards = useMemo(
    () => ((remoteConfig.remote_cards_enabled || experimentalConfig[REMOTE_CARDS]) && !isReadOnlyWallet ? cardIds : []),
    [cardIds, experimentalConfig[REMOTE_CARDS], isReadOnlyWallet, remoteConfig.remote_cards_enabled]
  );

  const hiddenAssets = useUserAssetsStore(state => state.hiddenAssets);
  const isLoadingUserAssets = useUserAssetsStore(state => state.getStatus().isInitialLoading);
  const sortedAssets = useUserAssetsStore(state => state.legacyUserAssets);
  const positions = positionsStore(state =>
    state.getData({
      address: accountAddress,
      currency: nativeCurrency,
    })
  );
  const claimables = claimablesStore(state =>
    state.getData({
      address: accountAddress,
      currency: nativeCurrency,
    })
  );

  const { sendableUniqueTokens, uniqueTokens, isFetchingNfts } = useUniqueTokens();

  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();

  const accountWithBalance = useMemo(() => {
    return walletsWithBalancesAndNames[selectedWallet.id]?.addresses.find(
      address => address.address.toLowerCase() === accountAddress.toLowerCase()
    );
  }, [walletsWithBalancesAndNames, selectedWallet, accountAddress]);

  const { pinnedCoinsObj: pinnedCoins } = useCoinListEditOptions();
  const { isCoinListEdited } = useCoinListEdited();

  useEffect(() => {
    if (isLoadingUserAssets || type !== 'wallet') return;

    const params = { screen: 'wallet' as const, no_icon: 0, no_price: 0, total_tokens: sortedAssets.length };
    for (const asset of sortedAssets) {
      if (!asset.icon_url) params.no_icon += 1;
      if (!asset.price?.relative_change_24h) params.no_price += 1;
    }
    analyticsV2.track(analyticsV2.event.tokenList, params);
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
      remoteCards,
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
      remoteCards,
    ]
  );

  const { briefSectionsData, isEmpty } = useCachedSelector(buildBriefWalletSectionsSelector, walletSectionsState, [
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
  ]);

  const result: WalletSectionsResult = {
    briefSectionsData,
    isEmpty,
    isWalletEthZero,
    isLoadingUserAssets,
    isLoadingBalance: !accountWithBalance?.balances,
    hasNFTs: uniqueTokens.length > 0,
  };

  return result;
}
