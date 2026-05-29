import { useEffect, useMemo } from 'react';

import { analytics } from '@/analytics';
import { type AssetListType } from '@/components/asset-list/RecyclerAssetList2';
import { type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { CLAIMABLES, DEFI_POSITIONS, RNBW_REWARDS } from '@/config/experimental';
import { useExperimentalConfig } from '@/config/experimentalHooks';
import { IS_TEST } from '@/env';
import { usePerpsFeatureCard } from '@/features/perps/hooks/usePerpsFeatureCard';
import { usePerpsPositionsInfo, type PerpsPositionsInfo } from '@/features/perps/stores/derived/usePerpsPositionsInfo';
import { type PerpsWalletListData } from '@/features/perps/types';
import { usePolymarketFeatureCard } from '@/features/polymarket/hooks/usePolymarketFeatureCard';
import {
  usePolymarketAccountValueSummary,
  type PolymarketAccountValueSummary,
} from '@/features/polymarket/stores/derived/usePolymarketAccountValueSummary';
import { usePolymarketPositions } from '@/features/polymarket/stores/derived/usePolymarketPositions';
import { type PolymarketPosition, type PolymarketWalletListData } from '@/features/polymarket/types';
import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { useRnbwFeatureCard } from '@/features/rnbw-rewards/hooks/useRnbwFeatureCard';
import { buildBriefWalletSectionsSelector, type WalletSectionsState } from '@/helpers/buildWalletSections';
import useHiddenTokens from '@/hooks/useHiddenTokens';
import useShowcaseTokens from '@/hooks/useShowcaseTokens';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { useNftsStore } from '@/state/nfts/nfts';
import { isDataComplete } from '@/state/nfts/utils';
import { useAccountAddress, useIsReadOnlyWallet, useSelectedWallet } from '@/state/wallets/walletsStore';
import { shallowEqual } from '@/worklets/comparisons';

import useAccountSettings from './useAccountSettings';
import useCoinListEdited from './useCoinListEdited';
import useCoinListEditOptions from './useCoinListEditOptions';
import useIsWalletEthZero from './useIsWalletEthZero';
import useWalletsWithBalancesAndNames from './useWalletsWithBalancesAndNames';

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
  const { language, network, nativeCurrency } = useAccountSettings();
  const accountAddress = useAccountAddress();
  const isReadOnlyWallet = useIsReadOnlyWallet();
  const selectedWallet = useSelectedWallet();
  const { showcaseTokens } = useShowcaseTokens();
  const { hiddenTokens } = useHiddenTokens();
  const remoteConfig = useRemoteConfig('claimables', 'discover_enabled', 'perps_enabled', 'polymarket_enabled', 'rnbw_rewards_enabled');
  const experimentalConfig = useExperimentalConfig();
  const isWalletEthZero = useIsWalletEthZero();

  const positionsEnabled = experimentalConfig[DEFI_POSITIONS] && !IS_TEST;
  const claimablesEnabled = (remoteConfig.claimables || experimentalConfig[CLAIMABLES]) && !IS_TEST;
  const discoverEnabled = remoteConfig.discover_enabled;
  const perpsEnabled = remoteConfig.perps_enabled && !IS_TEST;
  const polymarketEnabled = remoteConfig.polymarket_enabled && !IS_TEST;
  const rnbwRewardsEnabled = (remoteConfig.rnbw_rewards_enabled || experimentalConfig[RNBW_REWARDS]) && !IS_TEST;

  const hiddenAssets = useUserAssetsStore(state => state.hiddenAssets);
  const isLoadingUserAssets = useUserAssetsStore(state => state.getStatus('isInitialLoad'));
  const sortedAssets = useUserAssetsStore(state => state.legacyUserAssets);

  const positionsData = usePositionsStore(state => state.getData());
  const positions = useMemo(() => {
    if (!positionsEnabled) return null;
    return positionsData;
  }, [positionsData, positionsEnabled]);

  const claimablesData = useClaimablesStore(state => state.getData());
  const claimables = useMemo(() => {
    if (!claimablesEnabled) return null;
    return claimablesData;
  }, [claimablesData, claimablesEnabled]);

  const perpsData = usePerpsPositionsInfo(state => selectPerpsData(state, perpsEnabled), shallowEqual);

  const polymarketPositions = usePolymarketPositions(state => state.activePositions);
  const polymarketAccountValueSummary = usePolymarketAccountValueSummary();
  const polymarketData = useMemo(() => {
    return selectPolymarketData({
      positions: polymarketPositions,
      accountValueSummary: polymarketAccountValueSummary,
      enabled: polymarketEnabled,
    });
  }, [polymarketPositions, polymarketAccountValueSummary, polymarketEnabled]);

  const isShowcaseDataMigrated = useMemo(() => isDataComplete(showcaseTokens), [showcaseTokens]);
  const isHiddenDataMigrated = useMemo(() => isDataComplete(hiddenTokens), [hiddenTokens]);

  const collections = useNftsStore(state => state.getNftCollections());
  const hasMoreCollections = useNftsStore(state => state.hasNextNftCollectionPage());
  const isFetchingNfts = useNftsStore(state => state.status) === 'loading';

  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();

  const accountWithBalance = useMemo(() => {
    if (!selectedWallet) return null;
    const accountAddressLowercase = accountAddress.toLowerCase();
    return walletsWithBalancesAndNames[selectedWallet.id]?.addresses.find(
      address => address.address.toLowerCase() === accountAddressLowercase
    );
  }, [walletsWithBalancesAndNames, selectedWallet, accountAddress]);

  const { pinnedCoinsObj: pinnedCoins } = useCoinListEditOptions();
  const { isCoinListEdited } = useCoinListEdited();
  const { isDismissed: isDismissedPerpsFeatureCard } = usePerpsFeatureCard();
  const { isDismissed: isDismissedPolymarketFeatureCard } = usePolymarketFeatureCard();
  const { isDismissed: isDismissedRnbwFeatureCard } = useRnbwFeatureCard();

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
      collections,
      discoverEnabled,
      isFetchingNfts,
      experimentalConfig,
      positions,
      claimables,
      perpsData,
      polymarketData,
      rnbwRewardsEnabled,
      hasMoreCollections,
      isShowcaseDataMigrated,
      isHiddenDataMigrated,
      isDismissedPerpsFeatureCard,
      isDismissedPolymarketFeatureCard,
      isDismissedRnbwFeatureCard,
    };

    const { briefSectionsData, isEmpty } = buildBriefWalletSectionsSelector(sections);
    const hasNFTs = (collections?.size ?? 0) > 0;

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
    collections,
    discoverEnabled,
    isFetchingNfts,
    experimentalConfig,
    positions,
    claimables,
    perpsData,
    polymarketData,
    rnbwRewardsEnabled,
    hasMoreCollections,
    isShowcaseDataMigrated,
    isHiddenDataMigrated,
    isDismissedPerpsFeatureCard,
    isDismissedPolymarketFeatureCard,
    isDismissedRnbwFeatureCard,
  ]);
}

function selectPerpsData(state: PerpsPositionsInfo, perpsEnabled: boolean): PerpsWalletListData {
  return {
    balance: state.balance,
    hasBalance: state.hasBalance,
    hasPositions: state.hasPositions,
    positions: state.positions,
    value: state.value,
    enabled: perpsEnabled,
  };
}

function selectPolymarketData({
  positions,
  accountValueSummary,
  enabled,
}: {
  positions: PolymarketPosition[];
  accountValueSummary: PolymarketAccountValueSummary;
  enabled: boolean;
}): PolymarketWalletListData {
  return {
    balance: accountValueSummary.balance,
    hasBalance: accountValueSummary.hasBalance,
    hasPositions: positions.length > 0,
    positions: positions,
    value: accountValueSummary.totalValueNative,
    enabled: enabled,
  };
}
