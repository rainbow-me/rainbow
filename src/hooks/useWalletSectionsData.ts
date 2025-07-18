import { useEffect, useMemo } from 'react';
import useAccountSettings from './useAccountSettings';
import useCoinListEditOptions from './useCoinListEditOptions';
import useCoinListEdited from './useCoinListEdited';
import useHiddenTokens from './useHiddenTokens';
import useIsWalletEthZero from './useIsWalletEthZero';
import useShowcaseTokens from './useShowcaseTokens';
import { buildBriefWalletSectionsSelector, WalletSectionsState } from '@/helpers/buildWalletSections';
import useWalletsWithBalancesAndNames from './useWalletsWithBalancesAndNames';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useRemoteConfig } from '@/model/remoteConfig';
import { usePositionsStore } from '@/state/positions/positions';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { CLAIMABLES, DEFI_POSITIONS, REMOTE_CARDS, useExperimentalConfig } from '@/config/experimentalHooks';
import { analytics } from '@/analytics';
import { useNftSort } from './useNFTsSortBy';
import { remoteCardsStore } from '@/state/remoteCards/remoteCards';
import { CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { AssetListType } from '@/components/asset-list/RecyclerAssetList2';
import { IS_TEST } from '@/env';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountAddress, useIsReadOnlyWallet, useSelectedWallet } from '../state/wallets/walletsStore';

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
  const { nftSort, nftSortDirection } = useNftSort();
  const { language, network, nativeCurrency } = useAccountSettings();
  const accountAddress = useAccountAddress();
  const isReadOnlyWallet = useIsReadOnlyWallet();
  const selectedWallet = useSelectedWallet();
  const { showcaseTokens } = useShowcaseTokens();
  const { hiddenTokens } = useHiddenTokens();
  const remoteConfig = useRemoteConfig('claimables', 'remote_cards_enabled');
  const experimentalConfig = useExperimentalConfig();
  const isWalletEthZero = useIsWalletEthZero();

  const remoteCardsEnabled = (remoteConfig.remote_cards_enabled || experimentalConfig[REMOTE_CARDS]) && !isReadOnlyWallet;
  const positionsEnabled = experimentalConfig[DEFI_POSITIONS] && !IS_TEST;
  const claimablesEnabled = (remoteConfig.claimables || experimentalConfig[CLAIMABLES]) && !IS_TEST;

  const cardIds = remoteCardsStore(state => state.getCardIdsForScreen('WALLET_SCREEN'));
  const remoteCards = useMemo(() => (remoteCardsEnabled ? cardIds : []), [cardIds, remoteCardsEnabled]);

  const hiddenAssets = useUserAssetsStore(state => state.hiddenAssets);
  const isLoadingUserAssets = useUserAssetsStore(state => state.getStatus().isInitialLoading);
  const sortedAssets = useUserAssetsStore(state => state.legacyUserAssets);
  const positionsData = usePositionsStore(state =>
    state.getData({
      address: accountAddress,
      currency: nativeCurrency,
    })
  );

  const positions = useMemo(() => {
    if (!positionsEnabled) return null;
    return positionsData;
  }, [positionsData, positionsEnabled]);

  const claimablesData = useClaimablesStore(state =>
    state.getData({
      address: accountAddress,
      currency: nativeCurrency,
    })
  );

  const claimables = useMemo(() => {
    if (!claimablesEnabled) return null;
    return claimablesData;
  }, [claimablesData, claimablesEnabled]);

  const {
    data: { nfts: uniqueTokens },
    isLoading: isFetchingNfts,
  } = useLegacyNFTs({
    address: accountAddress,
    sortBy: nftSort,
    sortDirection: nftSortDirection,
    config: {
      enabled: !!accountAddress,
    },
  });

  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();

  const accountWithBalance = useMemo(() => {
    if (!selectedWallet) return null;
    return walletsWithBalancesAndNames[selectedWallet.id]?.addresses.find(
      account => account.address.toLowerCase() === accountAddress.toLowerCase()
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
    analytics.track(analytics.event.tokenList, params);
  }, [isLoadingUserAssets, sortedAssets, type]);

  return useMemo(() => {
    const sections: WalletSectionsState = {
      hiddenAssets,
      isCoinListEdited,
      isLoadingUserAssets,
      language,
      nativeCurrency,
      network,
      pinnedCoins,
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
      experimentalConfig,
      positions,
      claimables,
      nftSort,
      remoteCards,
    };

    const { briefSectionsData, isEmpty } = buildBriefWalletSectionsSelector(sections);
    const hasNFTs = uniqueTokens.length > 0;

    return {
      hasNFTs,
      isEmpty,
      isLoadingBalance: !accountWithBalance?.balancesMinusHiddenBalances,
      isLoadingUserAssets,
      isWalletEthZero,
      briefSectionsData,
    };
  }, [
    hiddenAssets,
    isCoinListEdited,
    isLoadingUserAssets,
    language,
    nativeCurrency,
    network,
    pinnedCoins,
    sortedAssets,
    accountWithBalance?.balancesMinusHiddenBalances,
    isWalletEthZero,
    hiddenTokens,
    isReadOnlyWallet,
    type,
    showcaseTokens,
    uniqueTokens,
    isFetchingNfts,
    experimentalConfig,
    positions,
    claimables,
    nftSort,
    remoteCards,
  ]);
}
