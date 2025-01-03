import { useEffect, useMemo } from 'react';
import useAccountSettings from './useAccountSettings';
import useCoinListEditOptions from './useCoinListEditOptions';
import useCoinListEdited from './useCoinListEdited';
import useHiddenTokens from './useHiddenTokens';
import useIsWalletEthZero from './useIsWalletEthZero';
import { useNftSort } from './useNFTsSortBy';
import useSendableUniqueTokens from './useSendableUniqueTokens';
import useShowcaseTokens from './useShowcaseTokens';
import useWallets from './useWallets';
import { buildBriefWalletSectionsSelector } from '@/helpers/buildWalletSections';
import { useLegacyNFTs } from '@/resources/nfts';
import useWalletsWithBalancesAndNames from './useWalletsWithBalancesAndNames';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useRemoteConfig } from '@/model/remoteConfig';
import { usePositions } from '@/resources/defi/PositionsQuery';
import { useClaimables } from '@/resources/addys/claimables/query';
import { useExperimentalConfig } from '@/config/experimentalHooks';
import { analyticsV2 } from '@/analytics';
import { Claimable } from '@/resources/addys/claimables/types';
import { throttle } from 'lodash';
import { usePoints } from '@/resources/points';
import { convertAmountAndPriceToNativeDisplay, convertRawAmountToBalance } from '@/helpers/utilities';
import { useNativeAsset } from '@/utils/ethereumUtils';
import { ChainId } from '@/state/backendNetworks/types';

// user properties analytics for claimables that executes at max once every 2 min
const throttledClaimablesAnalytics = throttle(
  (claimables: Claimable[]) => {
    let totalUSDValue = 0;
    const claimablesUSDValues: {
      [key: string]: number;
    } = {};

    claimables.forEach(claimable => {
      const attribute = `claimable-${claimable.analyticsId}-USDValue`;
      totalUSDValue += claimable.value.usd;

      if (claimablesUSDValues[attribute] !== undefined) {
        claimablesUSDValues[attribute] += claimable.value.usd;
      } else {
        claimablesUSDValues[attribute] = claimable.value.usd;
      }
    });

    analyticsV2.identify({ claimablesAmount: claimables.length, claimablesUSDValue: totalUSDValue, ...claimablesUSDValues });
  },
  2 * 60 * 1000,
  { trailing: false }
);

export default function useWalletSectionsData({
  type,
}: {
  type?: string;
} = {}) {
  const { accountAddress, language, network, nativeCurrency } = useAccountSettings();
  const { selectedWallet, isReadOnlyWallet } = useWallets();
  const isLoadingUserAssets = useUserAssetsStore(state => state.isLoadingUserAssets);
  const sortedAssets = useUserAssetsStore(state => state.legacyUserAssets);
  const isWalletEthZero = useIsWalletEthZero();

  const { nftSort, nftSortDirection } = useNftSort();

  const { sendableUniqueTokens } = useSendableUniqueTokens();
  const {
    data: { nfts: allUniqueTokens },
    isLoading: isFetchingNfts,
  } = useLegacyNFTs({
    address: accountAddress,
    sortBy: nftSort,
    sortDirection: nftSortDirection,
  });
  const { data: positions } = usePositions({ address: accountAddress, currency: nativeCurrency });
  const { data: claimables } = useClaimables({ address: accountAddress, currency: nativeCurrency });
  const { data: points } = usePoints({
    walletAddress: accountAddress,
  });

  const claimableETHRewardsRawAmount = points?.points?.user?.rewards?.claimable;

  const eth = useNativeAsset({ chainId: ChainId.mainnet });

  const claimableETHRewardsNativeAmount = useMemo(() => {
    if (!eth) return undefined;

    const claimableETH = convertRawAmountToBalance(claimableETHRewardsRawAmount || '0', {
      decimals: 18,
      symbol: 'ETH',
    });
    const { amount } = convertAmountAndPriceToNativeDisplay(claimableETH.amount, eth?.price?.value || 0, nativeCurrency);

    return amount;
  }, [claimableETHRewardsRawAmount, eth, nativeCurrency]);

  // claimables analytics
  useEffect(() => {
    if (claimables?.length) {
      throttledClaimablesAnalytics(claimables);
    }
    return () => {
      throttledClaimablesAnalytics.cancel();
    };
  }, [claimables]);

  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();

  const accountWithBalance = walletsWithBalancesAndNames[selectedWallet.id]?.addresses.find(
    address => address.address.toLowerCase() === accountAddress.toLowerCase()
  );

  const { showcaseTokens } = useShowcaseTokens();
  const { hiddenTokens } = useHiddenTokens();

  const remoteConfig = useRemoteConfig();
  const experimentalConfig = useExperimentalConfig();

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
    const accountInfo = {
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
      // @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
      ...isWalletEthZero,
      hiddenTokens,
      isReadOnlyWallet,
      listType: type,
      showcaseTokens,
      uniqueTokens: allUniqueTokens,
      isFetchingNfts,
      nftSort,
      remoteConfig,
      experimentalConfig,
      positions,
      claimables,
      claimableETHRewardsNativeAmount,
    };

    const { briefSectionsData, isEmpty } = buildBriefWalletSectionsSelector(accountInfo);
    const hasNFTs = allUniqueTokens.length > 0;

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
    allUniqueTokens,
    isFetchingNfts,
    nftSort,
    remoteConfig,
    experimentalConfig,
    positions,
    claimables,
    claimableETHRewardsNativeAmount,
  ]);
  return walletSections;
}
