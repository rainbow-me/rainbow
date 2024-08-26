import { buildBriefWalletSectionsSelector } from '@/helpers/buildWalletSections';
import { useSortedUserAssets } from '@/resources/assets/useSortedUserAssets';
import { useLegacyNFTs } from '@/resources/nfts';
import { useMemo } from 'react';
import useAccountSettings from './useAccountSettings';
import useCoinListEditOptions from './useCoinListEditOptions';
import useCoinListEdited from './useCoinListEdited';
import useHiddenTokens from './useHiddenTokens';
import useIsWalletEthZero from './useIsWalletEthZero';
import { useNftSort } from './useNFTsSortBy';
import useSendableUniqueTokens from './useSendableUniqueTokens';
import useShowcaseTokens from './useShowcaseTokens';
import useWallets from './useWallets';
import useWalletsWithBalancesAndNames from './useWalletsWithBalancesAndNames';

export default function useWalletSectionsData({
  type,
}: {
  type?: string;
} = {}) {
  const { selectedWallet, isReadOnlyWallet } = useWallets();
  const { isLoading: isLoadingUserAssets, data: sortedAssets = [] } = useSortedUserAssets();
  const isWalletEthZero = useIsWalletEthZero();

  const { nftSort, nftSortDirection } = useNftSort();

  const { accountAddress, language, network, nativeCurrency } = useAccountSettings();
  const { sendableUniqueTokens } = useSendableUniqueTokens();
  const {
    data: { nfts: allUniqueTokens },
    isLoading: isFetchingNfts,
  } = useLegacyNFTs({
    address: accountAddress,
    sortBy: nftSort,
    sortDirection: nftSortDirection,
  });

  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();

  const accountWithBalance = walletsWithBalancesAndNames[selectedWallet.id]?.addresses.find(
    address => address.address.toLowerCase() === accountAddress.toLowerCase()
  );

  const { showcaseTokens } = useShowcaseTokens();
  const { hiddenTokens } = useHiddenTokens();

  const { hiddenCoinsObj: hiddenCoins, pinnedCoinsObj: pinnedCoins } = useCoinListEditOptions();

  const { isCoinListEdited } = useCoinListEdited();

  const walletSections = useMemo(() => {
    const accountInfo = {
      hiddenCoins,
      isCoinListEdited,
      isLoadingUserAssets,
      language,
      nativeCurrency,
      network,
      pinnedCoins,
      sendableUniqueTokens,
      sortedAssets,
      accountBalanceDisplay: accountWithBalance?.balances?.totalBalanceDisplay,
      isLoadingBalance: !accountWithBalance?.balances,
      // @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
      ...isWalletEthZero,
      hiddenTokens,
      isReadOnlyWallet,
      listType: type,
      showcaseTokens,
      uniqueTokens: allUniqueTokens,
      isFetchingNfts,
      nftSort,
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
    hiddenCoins,
    isCoinListEdited,
    isLoadingUserAssets,
    language,
    nativeCurrency,
    network,
    pinnedCoins,
    sendableUniqueTokens,
    sortedAssets,
    accountWithBalance,
    isWalletEthZero,
    hiddenTokens,
    isReadOnlyWallet,
    type,
    showcaseTokens,
    allUniqueTokens,
    isFetchingNfts,
    nftSort,
  ]);
  return walletSections;
}
