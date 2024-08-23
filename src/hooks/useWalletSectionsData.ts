import { useMemo } from 'react';
import useAccountSettings from './useAccountSettings';
import useCoinListEditOptions from './useCoinListEditOptions';
import useCoinListEdited from './useCoinListEdited';
import useHiddenTokens from './useHiddenTokens';
import useIsWalletEthZero from './useIsWalletEthZero';
import useSendableUniqueTokens from './useSendableUniqueTokens';
import useShowcaseTokens from './useShowcaseTokens';
import useWallets from './useWallets';
import { buildBriefWalletSectionsSelector } from '@/helpers/buildWalletSections';
import { useLegacyNFTs } from '@/resources/nfts';
import useNftSort from './useNFTsSortBy';
import useWalletsWithBalancesAndNames from './useWalletsWithBalancesAndNames';
import { useUserAssetsStore } from '@/state/assets/userAssets';

export default function useWalletSectionsData({
  type,
}: {
  type?: string;
} = {}) {
  const { accountAddress, language, network, nativeCurrency } = useAccountSettings();
  const { selectedWallet, isReadOnlyWallet } = useWallets();
  const { isLoadingUserAssets, sortedAssets } = useUserAssetsStore(accountAddress, state => ({
    sortedAssets: state.legacyUserAssets,
    isLoadingUserAssets: state.isLoadingUserAssets,
  }));
  const isWalletEthZero = useIsWalletEthZero();

  const { nftSort } = useNftSort();

  const { sendableUniqueTokens } = useSendableUniqueTokens();
  const {
    data: { nfts: allUniqueTokens },
    isLoading: isFetchingNfts,
  } = useLegacyNFTs({
    address: accountAddress,
    sortBy: nftSort,
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
