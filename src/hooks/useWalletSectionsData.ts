import { useEffect, useMemo } from 'react';
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

export default function useWalletSectionsData({
  type,
}: {
  type?: string;
} = {}) {
  const { nftSort } = useNftSort();
  const { accountAddress, language, network, nativeCurrency } = useAccountSettings();
  const { selectedWallet, isReadOnlyWallet } = useWallets();
  const isLoadingUserAssets = useUserAssetsStore(state => state.getStatus().isInitialLoading);
  const sortedAssets = useUserAssetsStore(state => state.legacyUserAssets);
  const isWalletEthZero = useIsWalletEthZero();
  const { showcaseTokens } = useShowcaseTokens();
  const { hiddenTokens } = useHiddenTokens();
  const remoteConfig = useRemoteConfig();
  const experimentalConfig = useExperimentalConfig();

  const positions = positionsStore(state => state.getData());
  const claimables = claimablesStore(state => state.getData());

  const { sendableUniqueTokens, uniqueTokens, isFetchingNfts } = useUniqueTokens();

  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();

  const accountWithBalance = walletsWithBalancesAndNames[selectedWallet.id]?.addresses.find(
    address => address.address.toLowerCase() === accountAddress.toLowerCase()
  );

  const hiddenAssets = useUserAssetsStore(state => state.hiddenAssets);

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

  const walletSections = useMemo(() => {
    const accountInfo: WalletSectionsState = {
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
    };

    const { briefSectionsData, isEmpty } = buildBriefWalletSectionsSelector(accountInfo);
    const hasNFTs = uniqueTokens.length > 0;

    return {
      hasNFTs,
      isEmpty,
      isLoadingBalance: !accountWithBalance?.balances,
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
  ]);

  return walletSections;
}
